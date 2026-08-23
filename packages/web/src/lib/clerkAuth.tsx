import { useAuth as useAppAuth } from './auth'
import { useEffect, useCallback } from 'react'
import { api } from './api'

declare global {
  interface Window {
    Clerk?: {
      user?: any
      session?: any
      isSignedIn?: boolean
      openSignIn?: () => void
      openSignUp?: () => void
      signOut?: () => Promise<void>
      loaded?: boolean
    }
  }
}

export function useClerkSync() {
  const { user, updateUser, logout } = useAppAuth()

  const syncWithBackend = useCallback(async () => {
    try {
      const clerk = window.Clerk
      if (!clerk || !clerk.isSignedIn || !clerk.session) return

      const token = await clerk.session.getToken()
      if (!token) return

      const response = await api.post('/auth/clerk', { token })
      const res = response.data
      if (res.success && res.data) {
        const { accessToken, refreshToken, user: apiUser } = res.data
        localStorage.setItem('token', accessToken)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

        const clerkUser = clerk.user
        const u = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.fullName || apiUser.email,
          phone: apiUser.phone,
          role: apiUser.role,
          activeRole: apiUser.activeRole || apiUser.role,
          isVerified: apiUser.emailVerified || apiUser.mobileVerified,
          avatarUrl: apiUser.avatarUrl || clerkUser?.imageUrl,
        }
        localStorage.setItem('user', JSON.stringify(u))
        updateUser(u)
      }
    } catch (err) {
      console.error('Clerk backend sync error:', err)
    }
  }, [updateUser])

  useEffect(() => {
    const clerk = window.Clerk
    if (!clerk) return

    if (clerk.isSignedIn && clerk.user && !user) {
      syncWithBackend()
    }

    const handleSessionChanged = () => {
      if (window.Clerk?.isSignedIn && window.Clerk?.user) {
        syncWithBackend()
      } else if (!window.Clerk?.isSignedIn && user) {
        logout()
      }
    }

    window.addEventListener('clerk:sessionChanged', handleSessionChanged)
    return () => window.removeEventListener('clerk:sessionChanged', handleSessionChanged)
  }, [user, syncWithBackend, logout])

  const handleSignOut = async () => {
    try {
      await window.Clerk?.signOut?.()
    } catch {
      // ignore
    }
    logout()
  }

  return { syncWithBackend, signOut: handleSignOut }
}
