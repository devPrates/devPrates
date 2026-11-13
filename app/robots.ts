import type { MetadataRoute } from 'next'
import { SITE_URL } from './lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Área restrita e telas de acesso ficam fora dos buscadores.
      disallow: ['/api/', '/dashboard', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
