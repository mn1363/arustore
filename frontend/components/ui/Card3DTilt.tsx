'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Card3DTiltProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  maxTilt?: number
}

export default function Card3DTilt({
  children,
  className,
  glowColor = 'rgba(34, 211, 238, 0.25)',
  maxTilt = 9,
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height

    const rotateY = (relX - 0.5) * maxTilt * 2
    const rotateX = (0.5 - relY) * maxTilt * 2

    setTransform(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`
    )
    setGlare({ x: relX * 100, y: relY * 100, opacity: 1 })
  }

  const handleMouseLeave = () => {
    setTransform('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)')
    setGlare((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: glare.opacity ? 'transform 90ms ease-out' : 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={cn('relative preserve-3d will-change-transform', className)}
    >
      {/* Dynamic Specular Spotlight Glare */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(420px circle at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 65%)`,
        }}
      />
      {children}
    </div>
  )
}
