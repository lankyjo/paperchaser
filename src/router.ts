import { createRoute, createRootRoute, createRouter } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { ClientsPage } from './components/clients/ClientsPage'
import { DocumentRoute } from './routes/DocumentRoute'
import { IndexPage } from './routes/index'

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

const routeTree = rootRoute.addChildren([indexRoute, documentRoute, clientsRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
