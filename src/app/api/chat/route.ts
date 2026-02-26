import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { functionTools } from '@/lib/function-tools'
import { executeFunctionCall } from '@/lib/execute-function'

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FileAttachment {
  data: string
  type: string
  name: string
}

interface ContentPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

// Helper: Format document with line numbers for AI
function formatDocumentForAI(content: string): string {
  const lines = content.split('\n')
  return lines.map((line, i) => `${i + 1}. ${line}`).join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContent, file } = await request.json() as {
      messages: ChatMessage[]
      documentContent: string
      file?: FileAttachment
    }
    
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
    const contentParts: ContentPart[] = []
    
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
    let response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...messages.slice(-11, -1).map((m: ChatMessage) => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: contentParts
        }
      ],
      config: {
        tools: functionTools
      }
    })
    
    // Check if AI wants to call a function (Native Tool Call)
    let functionCall = response.functionCalls?.[0]
    
    // FALLBACK: Check if AI outputted code-like function call in text (Common with smaller models)
    if (!functionCall && response.text) {
        const text = response.text.trim()
        
        // Regex to match function calls like: function_name("arg1") or [calls function_name(key="value")]
        const jsonLikeMatch = text.match(/(?:\[calls\s+)?(\w+)\s*\(([\s\S]*?)\)(?:\])?/)
        
        if (jsonLikeMatch) {
            let name = jsonLikeMatch[1]
            const argsString = jsonLikeMatch[2]
            
            // Try to parse arguments
            try {
                let args: Record<string, unknown> = {}
                
                // Case 1: JSON Object function({ ... })
                if (argsString.trim().startsWith('{') && argsString.trim().endsWith('}')) {
                    args = JSON.parse(argsString) as Record<string, unknown>
                } 
                // Case 2: Specific handling for text-based text updates
                else {
                     // Check for multiple append_to_document calls (common hallucination)
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

                     // Keep existing fallback for basic string args if the above didn't match
                     if (Object.keys(args).length === 0 && (name === 'append_to_document' || name === 'insert_at_line' || name === 'replace_line')) {
                         const firstQuote = argsString.indexOf('"')
                         const lastQuote = argsString.lastIndexOf('"')
                         
                         if (firstQuote !== -1 && lastQuote > firstQuote) {
                             let contentStr = argsString.substring(firstQuote + 1, lastQuote)
                             
                             contentStr = contentStr
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\')

                             if (name === 'append_to_document') {
                                 args = { content: contentStr }
                             } else if (name === 'insert_at_line') {
                                 const parts = argsString.substring(0, firstQuote).split(',')
                                 const lineNumber = parseInt(parts[0].trim())
                                 if (!isNaN(lineNumber)) {
                                     args = { line_number: lineNumber, content: contentStr }
                                 }
                             } else if (name === 'replace_line') {
                                 const parts = argsString.substring(0, firstQuote).split(',')
                                 const lineNumber = parseInt(parts[0].trim())
                                 if (!isNaN(lineNumber)) {
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
        functionCall.args as Record<string, unknown>,
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

      response = await genai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            // History (limited to last 10 messages to save tokens)
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...messages.slice(-11, -1).map((m: ChatMessage) => ({
              role: m.role === 'user' ? 'user' as const : 'model' as const,
              parts: [{ text: m.content }]
            })),
            { role: 'user', parts: contentParts },
            // Function call exchange
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
      })
      
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
  } catch (error: unknown) {
    console.error('API error:', error)
    
    // Extract status code safely
    const statusObj = error as { status?: number; code?: number; message?: string }
    const status = statusObj.status || statusObj.code || 500
    const statusCode = (typeof status === 'number' && status >= 100 && status < 600) ? status : 500
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to process request', details: errorMessage },
      { status: statusCode }
    )
  }
}