import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_HEADLINE, SITE_NAME, SITE_URL } from './lib/site'

export const alt = `${SITE_NAME} | ${SITE_HEADLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Imagem de prévia usada ao compartilhar o site (LinkedIn, WhatsApp, etc.).
// Sem dados dinâmicos, então é gerada uma vez no build.
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), 'public/images/logo.svg'))
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#111827',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(34, 211, 238, 0.18), transparent 45%)',
          color: '#f3f4f6',
        }}
      >
        <img src={logoSrc} width={110} height={97} alt="" />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 34, color: '#22d3ee' }}>
            Olá, meu nome é
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, marginTop: 8 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 44, color: '#9ca3af', marginTop: 12 }}>
            {SITE_HEADLINE}
          </div>
        </div>

        <div style={{ fontSize: 28, color: '#6b7280' }}>
          {SITE_URL.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    size,
  )
}
