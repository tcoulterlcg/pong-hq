import './globals.css'
import './theme.css'
import PongGalaxy from '../components/PongGalaxy'
import MobileNav from '../components/MobileNav'

// Fonts match Command Center (LCG brand): Chakra Petch for everything, Michroma for titles.
// Self-hosted from /public/fonts, declared at the top of theme.css.

export const metadata = {
  title: 'Office Ping Pong Stats',
  description: 'The LCG office ping-pong rankings — live from the match ledger',
  appleWebApp: { capable: true, title: 'Pong HQ', statusBarStyle: 'black-translucent' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PongGalaxy />
        {children}
        <MobileNav />
      </body>
    </html>
  )
}
