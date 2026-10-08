import { Link } from '@tanstack/react-router'
import { Info, Package, Settings, ShieldCheck, Users } from 'lucide-react'
import { HOME_COPY } from '../../strings/home'
import { useBackup } from '../settings/useBackup'
import { HomeRow } from './HomeRow'
import { HomeSection } from './HomeSection'

// Clients, saved services, settings, a backup download and the about page.
export function WorkspaceSection() {
  const { backup } = useBackup()
  return (
    <HomeSection title={HOME_COPY.workspace}>
      <HomeRow icon={<Users />} title={<Link to="/clients">Clients</Link>} />
      <HomeRow icon={<Package />} title={<Link to="/services">Services</Link>} />
      <HomeRow icon={<Settings />} title={<Link to="/settings">Settings</Link>} />
      <HomeRow icon={<ShieldCheck />} title={<button type="button" onClick={() => void backup()}>Download a backup</button>} sub="Your data lives only in this browser" />
      <HomeRow icon={<Info />} title={<Link to="/about">About Paperchaser</Link>} />
    </HomeSection>
  )
}
