import type { MetadataRoute } from 'next'
import { SITE_URL } from './lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /dashboard já fica bloqueado para quando a área logada existir.
      disallow: ['/api/', '/dashboard'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
