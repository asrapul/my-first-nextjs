/**
 * Generate gambar menggunakan Pollinations AI
 * API gratis tanpa memerlukan API key
 * @param prompt - Deskripsi gambar yang ingin dibuat
 * @returns URL atau Base64 string dari gambar yang di-generate
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    console.log('Generating image with Pollinations AI, prompt:', prompt)

    // Encode prompt for URL
    const encodedPrompt = encodeURIComponent(prompt)
    
    // Pollinations AI URL - returns image directly
    // Format: https://image.pollinations.ai/prompt/{prompt}
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`
    
    // Fetch the image and convert to base64
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.status}`)
    }
    
    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    
    // Get content type from response
    const contentType = response.headers.get('content-type') || 'image/png'
    
    // Return as data URL
    return `data:${contentType};base64,${base64}`
    
  } catch (error) {
    console.error('Image generation error:', error)
    throw error
  }
}
