// Lets phones and Chrome install the site as an app, with the LCG icon and the site's one name.
export default function manifest() {
  return {
    name: 'LCG Ping Pong',
    short_name: 'LCG Ping Pong',
    description: 'The LCG office ping-pong rankings',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
