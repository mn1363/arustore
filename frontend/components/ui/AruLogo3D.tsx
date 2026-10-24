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
        className="w-full h-full drop-shadow-[0_0_16px_rgba(245,158,11,0.45)]"
      >
        <defs>
          <linearGradient id="aluSilverTop" x1="10" y1="6" x2="54" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#CBD5E1" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="aluSilverSide" x1="8" y1="20" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94A3B8" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="aluGoldSide" x1="56" y1="18" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#92400E" />
          </linearGradient>
        </defs>
        {/* Sculpted Pedestal Chalice / Metallic Prism Emblem */}
        <polygon points="32,5 56,19 32,31 8,19" fill="url(#aluSilverTop)" />
        <polygon points="8,19 32,31 32,45 14,34" fill="url(#aluSilverSide)" />
        <polygon points="56,19 50,34 32,45 32,31" fill="url(#aluGoldSide)" />
        {/* Pedestal Foot */}
        <polygon points="32,44 46,54 32,60 18,54" fill="url(#aluGoldSide)" />
        {/* Inner Champagne Crown Finial */}
        <circle cx="32" cy="18" r="5" fill="#FDE68A" />
      </svg>
    </div>
  )
}
