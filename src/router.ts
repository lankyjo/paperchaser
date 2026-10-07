import { createRoute, createRootRoute, createRouter } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { CatalogPage } from './components/catalog/CatalogPage'
import { ClientsPage } from './components/clients/ClientsPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { DocumentRoute } from './routes/DocumentRoute'
import { IndexPage } from './routes/index'
import { ProjectRoute } from './routes/ProjectRoute'

const rootRoute = createRootRoute({
  component: RootComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

const documentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents/$documentId',
  component: DocumentRoute,
})

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: ClientsPage,
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: ProjectRoute,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: CatalogPage,
})

const routeTree = rootRoute.addChildren([indexRoute, documentRoute, clientsRoute, projectRoute, settingsRoute, catalogRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
