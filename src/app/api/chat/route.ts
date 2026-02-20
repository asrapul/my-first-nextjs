import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { functionTools } from '@/lib/function-tools'
import { executeFunctionCall } from '@/lib/execute-function'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Helper: Format document with line numbers for AI
function formatDocumentForAI(content: string): string {
  const lines = content.split('\n')
  return lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContent, file } = await request.json()
    
    // CRITICAL: Always give AI the current document state with line numbers
    const documentWithLines = formatDocumentForAI(documentContent)
    
    const systemPrompt = `You are a helpful AI assistant for a document editor.

**CURRENT DOCUMENT (${documentContent.split('\n').length} lines):**
\`\`\`
${documentWithLines}
\`\`\`

**CRITICAL INSTRUCTIONS:**
1. **Action over Words:** Do NOT describe what you are going to do. JUST DO IT using the provided tools.
2. **Text Extraction (OCR):** If the user uploads an image containing text, you MUST extract that text and insert it into the document using \`append_to_document\` or \`insert_at_line\`. Do not just summarize the image.
3. **Line Numbers:** Always use the line numbers provided in the "CURRENT DOCUMENT" block above. They are the source of truth.
4. **Tool Usage:** 
   - To change text: Use \`update_doc_by_line\` or \`update_doc_by_replace\`.
   - To add text: Use \`insert_at_line\` or \`append_to_document\`.
   - To delete: Use \`delete_lines\`.
   - **NEVER** output code blocks of JSON or Python. Call the function directly.

**Example:**
User: "Change line 1 to Hello World"
You: [Calls update_doc_by_line(start_line=1, end_line=1, new_content="Hello World")]
`

    // Prepare content parts for Gemini
    const userMessage = messages[messages.length - 1]
    const contentParts: any[] = []
    
    // Add file if present (multimodal support)
    if (file) {
      const base64Data = file.data.split(',')[1]
      const mimeType = file.type
      
      contentParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      })
    }
    
    // Add text message
    contentParts.push({ text: userMessage.content })

    // First call with function tools
    // @ts-ignore
    let response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...messages.slice(-11, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: contentParts
        }
      ],
      tools: functionTools
    } as any)
    
    // Check if AI wants to call a function (Native Tool Call)
    let functionCall = response.functionCalls?.[0]
    
    // FALLBACK: Check if AI outputted code-like function call in text (Common with smaller models)
    if (!functionCall && response.text) {
        const text = response.text.trim()
        
        // Regex to match function calls like: function_name("arg1") or [calls function_name(key="value")]
        // matches: word(anything) OR [calls word(anything)]
        const jsonLikeMatch = text.match(/(?:\[calls\s+)?(\w+)\s*\(([\s\S]*?)\)(?:\])?/)
        
        if (jsonLikeMatch) {
            let name = jsonLikeMatch[1]
            let argsString = jsonLikeMatch[2]
            
            // Try to parse arguments
            try {
                let args: any = {}
                
                // Case 1: JSON Object function({ ... })
                if (argsString.trim().startsWith('{') && argsString.trim().endsWith('}')) {
                    args = JSON.parse(argsString)
                } 
                // Case 2: Specific handling for text-based text updates (e.g. append_to_document("..."))
                else {
                     // Check for multiple append_to_document calls (common hallucination)
                     // e.g. append_to_document("Line 1")\nappend_to_document("Line 2")
                     const multipleAppends = text.matchAll(/append_to_document\s*\(\s*"([\s\S]*?)"\s*\)/g)
                     const appendMatches = Array.from(multipleAppends)
                     
                     if (appendMatches.length > 1) {
                         // Merge all content
                         const combinedText = appendMatches.map(m => {
                            return m[1]
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\')
                         }).join('\n')
                         
                         name = 'append_to_document'
                         args = { content: combinedText }
                     } 
                     // Handle update_doc_by_line with kwargs or positional
                     else if (name === 'update_doc_by_line') {
                        const startLineMatch = argsString.match(/start_line\s*=\s*(\d+)/) || argsString.match(/^(\d+),/)
                        const endLineMatch = argsString.match(/end_line\s*=\s*(\d+)/) || argsString.match(/,\s*(\d+),/)
                        // Match content in quotes, handling potential escaped quotes
                        const contentMatch = argsString.match(/new_content\s*=\s*(["'])([\s\S]*?)\1/) || argsString.match(/,\s*(["'])([\s\S]*?)\1$/)

                        if (startLineMatch && endLineMatch && contentMatch) {
                            args = {
                                start_line: parseInt(startLineMatch[1]),
                                end_line: parseInt(endLineMatch[1]),
                                new_content: contentMatch[2]
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\')
                            }
                        }
                     }
                     // Handle delete_lines with kwargs
                     else if (name === 'delete_lines') {
                        const startLineMatch = argsString.match(/start_line\s*=\s*(\d+)/)
                        const endLineMatch = argsString.match(/end_line\s*=\s*(\d+)/)
                        
                        if (startLineMatch && endLineMatch) {
                            args = {
                                start_line: parseInt(startLineMatch[1]),
                                end_line: parseInt(endLineMatch[1])
                            }
                        }
                     }
                     // Handle insert_at_line with kwargs
                     else if (name === 'insert_at_line') {
                        const lineMatch = argsString.match(/line_number\s*=\s*(\d+)/)
                        const contentMatch = argsString.match(/content\s*=\s*(["'])([\s\S]*?)\1/)
                        
                        if (lineMatch && contentMatch) {
                            args = {
                                line_number: parseInt(lineMatch[1]),
                                content: contentMatch[2]
                                    .replace(/\\n/g, '\n')
                                    .replace(/\\"/g, '"')
                                    .replace(/\\\\/g, '\\')
                            }
                        }
                     }

                     // Single call parsing (fallback for simple positional args)
                     // ... (existing logic for simple positional args could go here or be merged, 
                     // but the regex updates above handle the kwargs cases the user is hitting)
                     
                     // Keep existing fallback for basic string args if the above didn't match
                     if (Object.keys(args).length === 0 && (name === 'append_to_document' || name === 'insert_at_line' || name === 'replace_line')) {
                         // Naive string unescaping if it's just a single string arg wrapped in quotes
                         // For replace_line: 1, "content"
                         const firstQuote = argsString.indexOf('"')
                         const lastQuote = argsString.lastIndexOf('"')
                         
                         if (firstQuote !== -1 && lastQuote > firstQuote) {
                             // Extract the content inside quotes
                             let contentStr = argsString.substring(firstQuote + 1, lastQuote)
                             
                             // Handle basic unescaping of newlines/quotes usually done by JSON stringify
                             contentStr = contentStr
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\')

                             if (name === 'append_to_document') {
                                 args = { content: contentStr }
                             } else if (name === 'insert_at_line') {
                                 // 1, "content"
                                 const parts = argsString.substring(0, firstQuote).split(',')
                                 const lineNumber = parseInt(parts[0].trim())
                                 if (!isNaN(lineNumber)) {
                                     args = { line_number: lineNumber, content: contentStr }
                                 }
                             } else if (name === 'replace_line') {
                                 // 1, "content"
                                 const parts = argsString.substring(0, firstQuote).split(',')
                                 const lineNumber = parseInt(parts[0].trim())
                                 if (!isNaN(lineNumber)) {
                                     // Map "replace_line" to the actual function "update_doc_by_line"
                                     name = 'update_doc_by_line'
                                     args = { 
                                         start_line: lineNumber, 
                                         end_line: lineNumber, 
                                         new_content: contentStr 
                                     }
                                 }
                             }
                         }
                     }
                }

                if (Object.keys(args).length > 0) {
                     functionCall = { name, args }
                     console.log('Parsed text-based function call:', name)
                }
            } catch (e) {
                console.warn('Failed to parse text-based function call:', e)
            }
        }
    }

    if (functionCall) {
      console.log('Function call:', functionCall.name, functionCall.args)
      
      // Execute the function
      const executionResult = executeFunctionCall(
        functionCall.name!,
        functionCall.args,
        (documentContent || '') as string
      )
      
      if (!executionResult.success) {
        return NextResponse.json({
          message: {
            role: 'assistant',
            content: `❌ Error: ${executionResult.error}`,
            functionCall: {
              name: functionCall.name!,
              args: functionCall.args,
              result: executionResult
            }
          }
        })
      }
      
      // CRITICAL: Format the NEW document state for AI
      const newDocumentWithLines = formatDocumentForAI(executionResult.newContent!)
      
      // Send result back to AI with UPDATED document state
      const finalSystemPrompt = `You are a helpful AI assistant for a document editor.

**UPDATED DOCUMENT (${executionResult.newContent!.split('\n').length} lines):**
\`\`\`
${newDocumentWithLines}
\`\`\`

The document has been updated successfully. Confirm the change to the user.`

      // @ts-ignore
      response = await genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            // History (limited to last 10 messages to save tokens)
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...messages.slice(-11, -1).map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
            })),
            { role: 'user', parts: contentParts },
            // Function call exchange (Polymorphic: Handle native vs parsed)
            { role: 'model', parts: [{ functionCall: functionCall }] }, 
            { 
                role: 'function', 
                parts: [{ 
                    functionResponse: {
                        name: functionCall.name,
                        response: {
                           result: executionResult,
                           updated_document_preview: newDocumentWithLines
                        }
                    } 
                }] 
            },
            { role: 'user', parts: [{ text: finalSystemPrompt }] }
        ]
      } as any)
      
      return NextResponse.json({
        message: {
          role: 'assistant',
          content: response.text || '✅ Document updated!',
          functionCall: {
            name: functionCall.name!,
            args: functionCall.args,
            result: executionResult
          }
        },
        newDocumentContent: executionResult.newContent  // Send back to frontend
      })
    }
    
    // No function call, just normal chat response
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: response.text || 'No response'
      }
    })
  } catch (error: any) {
    console.error('API error:', error)
    
    // Extract status code (Gemini sometimes uses 'status' or 'code')
    const status = error.status || error.code || 500
    const statusCode = (typeof status === 'number' && status >= 100 && status < 600) ? status : 500
    
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: statusCode }
    )
  }
}