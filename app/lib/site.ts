import type { Metadata } from 'next'

// Ordem: URL definida manualmente > domínio de produção da Vercel
// (variável de sistema, acompanha um domínio próprio) > fallback fixo.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://devprates.vercel.app')

export const SITE_NAME = 'Gabriel Prates'
export const SITE_HEADLINE = 'Programador e Analista de Dados'
export const SITE_DESCRIPTION =
  'Portfólio de Gabriel Prates, programador e analista de dados em Naviraí – MS. Projetos, experiências e tecnologias com que trabalho.'

// Imagem gerada por app/opengraph-image.tsx.
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} | ${SITE_HEADLINE}`,
}

// O Next substitui o objeto openGraph inteiro quando uma página define o seu
// (inclusive a imagem herdada), então as páginas espalham esta base.
export const baseOpenGraph: NonNullable<Metadata['openGraph']> = {
  type: 'website',
  locale: 'pt_BR',
  siteName: SITE_NAME,
  images: [DEFAULT_OG_IMAGE],
}
