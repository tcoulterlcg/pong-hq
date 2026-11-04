// Row of trophy icons next to a player's name. Hover (or long-press) shows the
// trophy name and what it took.
export default function Badges({ items, size = 'sm' }) {
  if (!items?.length) return null
  return (
    <span className={`badges ${size}`}>
      {items.map((b) => (
        <span key={b.name} className={`badge${b.cold ? ' cold' : ''}`} title={`${b.name} · ${b.note}`} aria-label={`${b.name}: ${b.note}`}>
          {b.icon}
        </span>
      ))}
    </span>
  )
}
