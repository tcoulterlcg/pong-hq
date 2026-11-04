import Link from 'next/link'
import LcgLogo from './LcgLogo'

// Shared page header: LCG logo + site name, the page title, an optional
// one-line description, and action buttons on the right.
export default function PageHead({ title, accent, sub, children }) {
  return (
    <div className="head">
      <div>
        <Link href="/" className="brand-row" aria-label="LCG Ping Pong home">
          <LcgLogo height={28} />
          <span className="brand-chip">Ping Pong</span>
        </Link>
        <h1>{title} {accent && <span className="accent">{accent}</span>}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  )
}
