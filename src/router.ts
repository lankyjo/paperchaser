import { createRoute, createRootRoute, createRouter, lazyRouteComponent, redirect } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { IndexPage } from './routes/index'
import { hasOpenedApp, markAppOpened } from './lib/appVisit'

// Every page but the projects home loads on first visit, keeping the start-up bundle small.
const rootRoute = createRootRoute()

const LandingPage = lazyRouteComponent(() => import('./components/landing/LandingPage'), 'LandingPage')

// The landing page greets new visitors; anyone who has used the app goes straight to it.
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (hasOpenedApp()) throw redirect({ to: '/app', replace: true })
  },
  component: LandingPage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: LandingPage,
})

// Every app page shares the app chrome and marks the browser as a returning user.
const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  beforeLoad: markAppOpened,
  component: RootComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/app',
  component: IndexPage,
})

const documentRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/documents/$documentId',
  component: lazyRouteComponent(() => import('./routes/DocumentRoute'), 'DocumentRoute'),
})

const clientsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/clients',
  component: lazyRouteComponent(() => import('./components/clients/ClientsPage'), 'ClientsPage'),
})

const projectRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/projects/$projectId',
  component: lazyRouteComponent(() => import('./routes/ProjectRoute'), 'ProjectRoute'),
})

const settingsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('./components/settings/SettingsPage'), 'SettingsPage'),
})

const catalogRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/services',
  component: lazyRouteComponent(() => import('./components/catalog/CatalogPage'), 'CatalogPage'),
})

const routeTree = rootRoute.addChildren([
  landingRoute,
  aboutRoute,
  appShellRoute.addChildren([indexRoute, documentRoute, clientsRoute, projectRoute, settingsRoute, catalogRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
