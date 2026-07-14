// Ladder player id -> LCG team-page identity (full name + title, per
// lcgadvisors.com/team). Portraits live in public/players/<id>.png.
// Unconfirmed full names/titles are null until Trevor confirms them.
export const ROSTER = {
  trevor: { fullName: 'Trevor Coulter', title: 'Senior Associate' },
  shay: { fullName: 'Shay Shushtari', title: 'Analyst' },
  mark: { fullName: 'Mark Himelman', title: 'Director' },
  pablo: { fullName: 'Pablo Penaherrera', title: 'Senior Vice President' },
  dave: { fullName: 'David Gray', title: 'Senior Associate' },
  jz: { fullName: 'Jon Zatorski', title: 'Vice President' },
  jack: { fullName: 'Jack McCall', title: 'Senior Associate' },
  chase: { fullName: 'Chase Sampson', title: 'Senior Associate' },
  ally: { fullName: 'Allyson Cook', title: 'Senior Associate' },
  cedric: { fullName: 'Cedric Lafleur', title: 'Associate' },
  sarah: { fullName: 'Sarah A. Moore', title: 'Associate Vice President' },
  brent: { fullName: 'Brent Killam', title: 'Associate' },
  elijah: { fullName: 'Elijah', title: 'Extern' },
  dillon: { fullName: 'Dillon', title: null },
  caleb: { fullName: 'Caleb', title: null },
}

export const rosterFor = (id) => ROSTER[id] || { fullName: null, title: null }
