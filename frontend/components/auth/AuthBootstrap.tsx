'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store/useStore'

export default function AuthBootstrap() {
  const bootstrapAuth = useStore((s) => s.bootstrapAuth)

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      void bootstrapAuth()
      return
    }
    const unsub = useStore.persist.onFinishHydration(() => {
      void bootstrapAuth()
    })
    return () => {
      unsub()
    }
  }, [bootstrapAuth])

  return null
}
