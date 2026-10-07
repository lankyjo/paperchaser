import { createContext, useContext } from 'react'
import type { SharedData } from '../../project/sharedData'

// Project-shared values for the open document; undefined outside a project (fixtures, previews).
export const ProjectDataContext = createContext<SharedData | undefined>(undefined)

export const useProjectData = () => useContext(ProjectDataContext)
