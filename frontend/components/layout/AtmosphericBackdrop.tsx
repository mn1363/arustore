import React from 'react'

/**
 * Level 0 Atmospheric Background:
 * Creates a quiet, deep nocturnal fantasy sanctuary using GPU-friendly radial
 * luminescence, blurred celestial arches, and subtle perspective depth.
 * Automatically simplified on mobile and static under prefers-reduced-motion.
 */
export default function AtmosphericBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Base nocturnal obsidian-indigo abyss */}
      <div className="absolute inset-0 bg-[#08090f]" />

      {/* Distant celestial champagne & moonlit aether vaults */}
      <div
        className="absolute -top-44 left-1/2 -translate-x-1/2 w-[920px] h-[520px] rounded-full opacity-55 blur-3xl animate-pulse-aura"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(126, 166, 224, 0.14) 0%, rgba(223, 192, 142, 0.08) 42%, transparent 72%)',
        }}
      />

      <div
        className="hidden md:block absolute top-[28%] -start-48 w-[540px] h-[540px] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(223, 192, 142, 0.1) 0%, transparent 70%)',
        }}
      />

      <div
        className="hidden md:block absolute bottom-[-12rem] -end-40 w-[620px] h-[620px] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(88, 130, 196, 0.12) 0%, transparent 70%)',
        }}
      />

      {/* Blurred fantasy sanctuary arches in the far distance (desktop/tablet) */}
      <svg
        className="hidden sm:block absolute top-14 left-1/2 -translate-x-1/2 w-[1180px] h-[540px] opacity-[0.07]"
        viewBox="0 0 1200 540"
        fill="none"
      >
        <path
          d="M180 540V270C180 110 368 24 600 24C832 24 1020 110 1020 270V540"
          stroke="url(#sanctuaryArch)"
          strokeWidth="1.5"
        />
        <path
          d="M290 540V295C290 165 428 92 600 92C772 92 910 165 910 295V540"
          stroke="url(#sanctuaryArch)"
          strokeWidth="1"
          strokeDasharray="6 10"
        />
        <circle
          cx="600"
          cy="92"
          r="26"
          stroke="#dfc08e"
          strokeOpacity="0.6"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="sanctuaryArch" x1="600" y1="20" x2="600" y2="540" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dfc08e" />
            <stop offset="0.55" stopColor="#7ea6e0" stopOpacity="0.5" />
            <stop offset="1" stopColor="#08090f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Quiet floating luminous motes (strictly limited to 5, hidden on mobile) */}
      <div className="hidden lg:block">
        <span className="absolute top-[18%] left-[16%] w-1.5 h-1.5 rounded-full bg-[#dfc08e]/40 shadow-[0_0_12px_#dfc08e] animate-float-slow" />
        <span
          className="absolute top-[34%] right-[14%] w-1 h-1 rounded-full bg-[#9ec0f0]/45 shadow-[0_0_10px_#9ec0f0] animate-float-slow"
          style={{ animationDelay: '1.8s' }}
        />
        <span
          className="absolute top-[64%] left-[10%] w-1 h-1 rounded-full bg-[#dfc08e]/35 shadow-[0_0_10px_#dfc08e] animate-float-slow"
          style={{ animationDelay: '3.2s' }}
        />
        <span
          className="absolute top-[74%] right-[22%] w-1.5 h-1.5 rounded-full bg-[#dfc08e]/30 shadow-[0_0_12px_#dfc08e] animate-float-slow"
          style={{ animationDelay: '2.4s' }}
        />
      </div>

      {/* Subtle vignette preserving high text contrast across the center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 52%, rgba(5, 6, 11, 0.55) 100%)',
        }}
      />
    </div>
  )
}
