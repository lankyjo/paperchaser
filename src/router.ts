import { createRoute, createRootRoute, createRouter } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { IndexPage } from './routes/index'

/** Code-based routes — the spike needs one route; no file-based codegen plugin. */
const rootRoute = createRootRoute({
  component: RootComponent,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })
