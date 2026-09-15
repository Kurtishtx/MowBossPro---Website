import { MetadataRoute } from 'next';

/* Points crawlers at the sitemap. Without this the sitemap exists but is never announced,
   so every page has to be discovered by following links instead of being handed the list. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: 'https://mowbosspro.com/sitemap.xml',
  };
}
