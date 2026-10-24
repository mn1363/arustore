import type { Metadata } from 'next'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/vazirmatn/900.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '../styles/globals.css'
import ToastContainer from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'آرو استور | تولیدکننده ظروف پذیرایی آلومینیومی لوکس و سه‌بعدی',
  description:
    'مرجع تخصصی ساخت و عرضه مستقیم لوازم پذیرایی آلومینیومی مدرن: شیرینی‌خوری طبقاتی، میوه‌خوری پایه‌دار، سینی، آجیل‌خوری و سرویس چای‌خوری رنگ‌ثابت با نمایش زنده سه‌بعدی ۳۶۰ درجه.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="bg-obsidian-950 text-slate-50 antialiased selection:bg-amber-400 selection:text-slate-950 spatial-grid-bg relative">
        {/* Warm Champagne Gold & Brushed Silver Gallery Lighting */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-48 -right-32 w-[580px] h-[580px] rounded-full bg-amber-500/10 blur-[140px]" />
          <div className="absolute top-1/3 -left-48 w-[520px] h-[520px] rounded-full bg-slate-300/8 blur-[145px]" />
          <div className="absolute -bottom-64 right-1/4 w-[620px] h-[420px] rounded-full bg-yellow-600/8 blur-[155px]" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  )
}
