import React from 'react'

export default function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-panel rounded-3xl p-4 space-y-4 animate-pulse border border-white/5"
        >
          <div className="aspect-[4/3.4] rounded-2xl bg-white/5" />
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
          <div className="h-9 w-full rounded-xl bg-white/10" />
        </div>
      ))}
    </div>
  )
}
