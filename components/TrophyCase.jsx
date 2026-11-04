import { TROPHY_COUNT } from '../lib/badges.mjs'

// Every trophy, grouped. Earned ones glow; the rest show what it takes.
export default function TrophyCase({ groups, earned }) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Trophy Case</span>
        <span className="head-meta">{earned} of {TROPHY_COUNT} earned</span>
      </div>
      <div className="pad trophy-groups">
        {groups.map((g) => (
          <div key={g.id} className="trophy-group">
            <div className="tc-cat">{g.label}</div>
            <div className="trophy-row">
              {g.tiers.map((t) => (
                <div key={t.name} className={`trophy${t.earned ? ' earned' : ''}${g.id === 'cold' ? ' cold' : ''}`} title={t.earned ? 'Earned' : 'Not earned yet'}>
                  <span className="trophy-icon" aria-hidden="true">{t.icon}</span>
                  <span className="trophy-name">{t.name}</span>
                  <span className="trophy-note">{t.note}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
