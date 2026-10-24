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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'atelier-corners relative z-10 w-full max-w-4xl bg-[#141210] border border-[#ece6dc]/20 overflow-hidden shadow-2xl',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ece6dc]/14">
            <h3 className="font-editorial text-2xl font-bold text-[#f7f4ee]">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 border border-[#ece6dc]/16 hover:border-[#c59b5f] text-[#b9b0a2] hover:text-[#f7f4ee] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3.5 end-3.5 z-30 p-2 bg-[#0e0d0b]/90 border border-[#ece6dc]/18 hover:border-[#c59b5f] text-[#d6cfc4] hover:text-[#f7f4ee] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
