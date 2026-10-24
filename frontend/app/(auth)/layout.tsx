import React from 'react'
import Link from 'next/link'
import { AruLogo3D } from '@/components/ui/AruLogo3D'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <AruLogo3D className="w-9 h-9 group-hover:scale-110 transition-transform" />
          <span className="font-black text-lg text-white">آرو استور | AruStore</span>
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl glass-pill text-xs font-semibold text-cyan-300 hover:text-white"
        >
          بازگشت به فروشگاه سه‌بعدی
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">{children}</div>
    </div>
  )
}
