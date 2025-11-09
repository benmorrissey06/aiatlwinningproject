import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import CreateFlashRequest from '@/pages/CreateFlashRequest'
import { SmartPingMatchesPage } from '@/pages/SmartPingMatchesPage'
import { ListingsSearchPage } from '@/pages/ListingsSearchPage'
import { MessagesChatPage } from '@/pages/MessagesChatPage'
import { UserProfilePage } from '@/pages/UserProfilePage'
import { SafetyTrustCenterPage } from '@/pages/SafetyTrustCenterPage'
import { AdminModerationPage } from '@/pages/AdminModerationPage'
import { LoginPage } from '@/pages/LoginPage'

const appRoutes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/request/create',
        element: (
          <ProtectedRoute>
            <CreateFlashRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: '/smart-ping',
        element: (
          <ProtectedRoute>
            <SmartPingMatchesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/listings',
        element: (
          <ProtectedRoute>
            <ListingsSearchPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/messages',
        element: (
          <ProtectedRoute>
            <MessagesChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/safety',
        element: <SafetyTrustCenterPage />,
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute>
            <AdminModerationPage />
          </ProtectedRoute>
        ),
      },
      // Footer routes
      {
        path: '/terms',
        element: (
          <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="prose dark:prose-invert">
              <p className="text-muted-foreground">
                By using Flash Request, you agree to our terms of service. 
                Please read carefully before using our platform.
              </p>
              <h2 className="text-2xl font-semibold mt-8 mb-4">User Responsibilities</h2>
              <p className="text-muted-foreground">
                Users are responsible for their actions and interactions on the platform. 
                We encourage safe, respectful exchanges and reserve the right to suspend 
                accounts that violate our community guidelines.
              </p>
            </div>
          </div>
        ),
      },
      {
        path: '/prohibited-items',
        element: (
          <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Prohibited Items</h1>
            <div className="prose dark:prose-invert">
              <p className="text-muted-foreground mb-6">
                The following items are prohibited from being listed or exchanged on Flash Request:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Alcohol and tobacco products</li>
                <li>Illegal substances or drugs</li>
                <li>Weapons or firearms</li>
                <li>Stolen or counterfeit items</li>
                <li>Hazardous materials</li>
                <li>Live animals</li>
                <li>Prescription medications (without proper authorization)</li>
                <li>Adult content or explicit materials</li>
              </ul>
              <p className="text-muted-foreground mt-6">
                Violations may result in account suspension or termination.
              </p>
            </div>
          </div>
        ),
      },
      {
        path: '/privacy',
        element: <div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Privacy Page</h1></div>,
      },
      {
        path: '/report',
        element: <div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Report Issue Page</h1></div>,
      },
    ],
  },
]

function collectPaths(routes: RouteObject[]): string[] {
  return routes.flatMap((route) => {
    const current = route.path ? [route.path] : []
    const childPaths = route.children ? collectPaths(route.children) : []
    return [...current, ...childPaths]
  })
}

const allPaths = collectPaths(appRoutes)
const hasMessagesThreadRoute = allPaths.some((path) => path.startsWith('/messages/') || path === '/messages/:threadId')

if (typeof window !== 'undefined') {
  ;(window as Window & { __FLASH_HAS_MESSAGES_THREAD_ROUTE__?: boolean }).__FLASH_HAS_MESSAGES_THREAD_ROUTE__ = hasMessagesThreadRoute
}

export const router = createBrowserRouter(appRoutes)

