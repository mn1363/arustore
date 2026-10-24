import React from 'react'
import { cn } from '@/lib/utils'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full border-2 border-cyan-400/25 border-t-cyan-400 animate-spin',
        className
      )}
    />
  )
}
