import { createRoute, createRootRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { IndexPage } from './routes/index'

// Every page but the projects home loads on first visit, keeping the start-up bundle small.
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
  component: lazyRouteComponent(() => import('./routes/DocumentRoute'), 'DocumentRoute'),
})

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: lazyRouteComponent(() => import('./components/clients/ClientsPage'), 'ClientsPage'),
})

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects/$projectId',
  component: lazyRouteComponent(() => import('./routes/ProjectRoute'), 'ProjectRoute'),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('./components/settings/SettingsPage'), 'SettingsPage'),
})

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: lazyRouteComponent(() => import('./components/catalog/CatalogPage'), 'CatalogPage'),
})

const routeTree = rootRoute.addChildren([indexRoute, documentRoute, clientsRoute, projectRoute, settingsRoute, catalogRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
