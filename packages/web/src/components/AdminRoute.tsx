import { Navigate, useLocation } from 'react-router-dom'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const userStr = localStorage.getItem('user')
  const location = useLocation()

  if (!userStr) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  try {
    const user = JSON.parse(userStr)
    const adminRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "FINANCE"]
    if (!adminRoles.includes(user.role)) {
      return <Navigate to="/dashboard" state={{ from: location }} replace />
    }
  } catch {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
