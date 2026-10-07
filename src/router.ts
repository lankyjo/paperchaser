import { createRoute, createRootRoute, createRouter } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
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

const routeTree = rootRoute.addChildren([indexRoute, documentRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
