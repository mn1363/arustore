'use client'

import { useStore } from '@/lib/store/useStore'

export function useAuth() {
  const user = useStore((s) => s.user)
  const loginDemoUser = useStore((s) => s.loginDemoUser)
  const logoutUser = useStore((s) => s.logoutUser)

  return {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user?.is_admin),
    loginDemoUser,
    logoutUser,
  }
}

export default useAuth
