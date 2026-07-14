// Editors of the ladder — the only sign-in profiles this site needs.
// Viewing is public; recording matches requires signing in as one of these.
export const EDITOR_PROFILES = [
  { id: 'tcoulter', name: 'Trevor Coulter', initials: 'TC' },
  { id: 'sshustari', name: 'Shay Shustari', initials: 'SS' },
  { id: 'mhimmelman', name: 'Mark Himmelman', initials: 'MH' },
]
export const byId = (id) => EDITOR_PROFILES.find((u) => u.id === id) || null
