import { useParams } from '@tanstack/react-router'
import { ProjectPage } from '../components/project/ProjectPage'

export function ProjectRoute() {
  const { projectId } = useParams({ from: '/_app/projects/$projectId' })
  return <ProjectPage key={projectId} projectId={projectId} />
}
