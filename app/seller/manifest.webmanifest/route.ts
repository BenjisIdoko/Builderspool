// Seller-console web app manifest: installing from /seller opens the seller
// portal itself (scope + start_url) rather than the buyer storefront.
export function GET() {
  return Response.json(
    {
      name: 'Builders Pool Seller',
      short_name: 'BP Seller',
      description: 'Builders Pool seller console — bids, orders and payouts.',
      id: '/seller',
      start_url: '/seller',
      scope: '/seller',
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
        { name: 'My bids', url: '/seller/bids' },
        { name: 'Orders', url: '/seller/orders' },
        { name: 'Payouts', url: '/seller/payouts' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
}
