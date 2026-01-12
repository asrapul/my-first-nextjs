import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Andi Asyraful - Web Developer Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 50%, #67e8f9 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Andi Asyraful
          </div>
          <div
            style={{
              fontSize: 36,
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            Web Developer & Software Engineer
          </div>
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginTop: '24px',
            }}
          >
            {['Next.js', 'React', 'Flutter', 'TypeScript'].map((tech) => (
              <div
                key={tech}
                style={{
                  fontSize: 24,
                  padding: '8px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
