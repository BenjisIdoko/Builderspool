import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Builders Pool',
    short_name: 'Builders Pool',
    description: 'Construction materials, sourced and delivered.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fafbfc',
    theme_color: '#2954e5',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Catalog', url: '/catalog' },
      { name: 'Cart', url: '/cart' },
      { name: 'Account', url: '/account' },
    ],
  };
}
