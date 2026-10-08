import { WelcomeScreen } from '../first-run/WelcomeScreen'
import { useFirstRun } from '../first-run/useFirstRun'
import { CommandCenter } from './CommandCenter'

// Home: the dark welcome on a fresh install, otherwise the command center.
export function HomePage() {
  const firstRun = useFirstRun()
  if (firstRun.needed === null) return null
  if (firstRun.needed) return <WelcomeScreen onFinish={(company) => void firstRun.finish(company)} onRestored={firstRun.restored} />
  return <CommandCenter />
}
