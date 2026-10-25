'use client'

import { useStore } from '@/lib/store/useStore'

export function useAuth() {
  const user = useStore((s) => s.user)
  const authStatus = useStore((s) => s.authStatus)
  const loginUser = useStore((s) => s.loginUser)
  const registerUser = useStore((s) => s.registerUser)
  const logoutUser = useStore((s) => s.logoutUser)
  const bootstrapAuth = useStore((s) => s.bootstrapAuth)
  const verifyAdminAccess = useStore((s) => s.verifyAdminAccess)

  return {
    user,
    authStatus,
    isLoading: authStatus === 'idle' || authStatus === 'loading',
    isAuthenticated: authStatus === 'authenticated' && Boolean(user),
    isAdmin: authStatus === 'authenticated' && Boolean(user?.is_admin),
    loginUser,
    registerUser,
    logoutUser,
    bootstrapAuth,
    verifyAdminAccess,
  }
}

export default useAuth
