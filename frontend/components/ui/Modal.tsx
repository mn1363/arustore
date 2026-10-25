'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-[#05060b]/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-4xl rounded-3xl glass-panel border border-white/[0.12] overflow-hidden shadow-depth-hero animate-modal-enter',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <h3 className="text-lg font-bold text-[#f4f4f6]">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl hover:bg-white/[0.06] text-[#979fb2] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 end-3.5 z-30 p-2 rounded-full glass-pill text-[#d4d6dc] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
