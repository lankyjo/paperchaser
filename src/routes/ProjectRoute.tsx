import { useParams } from '@tanstack/react-router'
import { ProjectPage } from '../components/project/ProjectPage'

export function ProjectRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId' })
  return <ProjectPage key={projectId} projectId={projectId} />
}
