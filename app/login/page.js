import LoginForm from '../../components/LoginForm'
import { getPlayers } from '../../lib/pingpong.mjs'

export const metadata = { title: 'Sign in — Table Tennis HQ' }
export const dynamic = 'force-dynamic'

export default async function Login() {
  const players = await getPlayers()
  return <LoginForm profiles={players.filter((p) => p.can_submit).map((p) => ({ id: p.id, name: p.name }))} />
}
