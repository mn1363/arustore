'use client'

import React from 'react'
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

export default function ToastContainer() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 end-5 z-[80] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl glass-panel p-3.5 flex items-start gap-3 animate-modal-enter"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#dfc08e] flex-shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-[#7ea6e0] flex-shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-[#f4f4f6]">{toast.title}</div>
            {toast.description && (
              <div className="text-xs text-[#979fb2] mt-0.5 truncate">{toast.description}</div>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-[#8e93a0] hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
