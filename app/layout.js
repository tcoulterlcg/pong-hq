import './globals.css'
import './theme.css'
import './theme-mobile.css'
import './theme-fonts.css'
import { Inter, Michroma, Chakra_Petch } from 'next/font/google'
import PongGalaxy from '../components/PongGalaxy'
import MobileNav from '../components/MobileNav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-brand' })
const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-chakra' })

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
    <html lang="en" className={`${inter.variable} ${michroma.variable} ${chakra.variable}`}>
      <body>
        <PongGalaxy />
        {children}
        <MobileNav />
      </body>
    </html>
  )
}
