'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function AruLogo3D({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="aruBrushedAlu" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5F3EE" />
            <stop offset="0.52" stopColor="#BFC4CA" />
            <stop offset="1" stopColor="#7C828A" />
          </linearGradient>
          <linearGradient id="aruSatinBronze" x1="16" y1="12" x2="48" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E5C899" />
            <stop offset="0.55" stopColor="#C59B5F" />
            <stop offset="1" stopColor="#7D5A2B" />
          </linearGradient>
        </defs>
        {/* Outer Engraved Octagonal / Arch Seal */}
        <path
          d="M32 4C46 4 56 14 56 28V58H8V28C8 14 18 4 32 4Z"
          stroke="url(#aruSatinBronze)"
          strokeWidth="1.75"
          fill="rgba(23,21,18,0.85)"
        />
        {/* Lathe-Turned Pedestal Bowl Silhouette */}
        <path
          d="M16 26H48C46.5 35.5 40.5 40.5 32 40.5C23.5 40.5 17.5 35.5 16 26Z"
          fill="url(#aruBrushedAlu)"
        />
        {/* Satin Bronze Rim & Stem */}
        <rect x="14" y="23.5" width="36" height="2.4" fill="url(#aruSatinBronze)" />
        <rect x="30.2" y="40.5" width="3.6" height="9.5" fill="url(#aruSatinBronze)" />
        <path d="M22 52.5L32 49.5L42 52.5H22Z" fill="url(#aruBrushedAlu)" />
        {/* Crown Finial */}
        <path d="M32 13L35.2 18.5L32 21.5L28.8 18.5L32 13Z" fill="url(#aruSatinBronze)" />
      </svg>
    </div>
  )
}
