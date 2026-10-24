import React from 'react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-[#f2f2f0]">
          آرو استور
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-[#d4d6dc]"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">{children}</div>
    </div>
  )
}
