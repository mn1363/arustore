import React from 'react'
import Link from 'next/link'
import { AruLogo3D } from '@/components/ui/AruLogo3D'
import AtmosphericBackdrop from '@/components/layout/AtmosphericBackdrop'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-8 isolate">
      <AtmosphericBackdrop />
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <AruLogo3D className="w-8 h-8" />
          <span className="text-lg font-bold text-[#f4f4f6]">آرو استور</span>
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl secondary-3d-btn text-xs font-medium text-[#d4d6dc]"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">{children}</div>
    </div>
  )
}
