import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = !!localStorage.getItem('accessToken') && !!localStorage.getItem('userId')

  if (!isAuthenticated) {
    // Show a toast message explaining why they're being redirected
    toast.error('Authentication required', {
      description: 'Please log in to access this page.',
    })
    
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

