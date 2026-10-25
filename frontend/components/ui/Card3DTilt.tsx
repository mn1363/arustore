'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Card3DTiltProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  maxTilt?: number
}

/**
 * Dimensional Level-2 Tilt Wrapper:
 * Applies subtle perspective rotation & specular spotlight on desktop fine pointers,
 * while automatically disabling tilt on touch devices and prefers-reduced-motion.
 */
export default function Card3DTilt({
  children,
  className,
  glowColor = 'rgba(223, 192, 142, 0.14)',
  maxTilt = 5,
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [interactive, setInteractive] = useState(false)
  const [transform, setTransform] = useState(
    'perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)'
  )
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 })

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setInteractive(canHover && !reducedMotion)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height

    const rotateY = (relX - 0.5) * maxTilt * 2
    const rotateX = (0.5 - relY) * maxTilt * 2

    setTransform(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -4px, 0)`
    )
    setGlare({ x: relX * 100, y: relY * 100, opacity: 1 })
  }

  const handleMouseLeave = () => {
    if (!interactive) return
    setTransform('perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)')
    setGlare((prev) => ({ ...prev, opacity: 0 }))
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        interactive
          ? {
              transform,
              transition: glare.opacity
                ? 'transform 110ms ease-out'
                : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
            }
          : undefined
      }
      className={cn('relative preserve-3d', className)}
    >
      {interactive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(360px circle at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 68%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}
