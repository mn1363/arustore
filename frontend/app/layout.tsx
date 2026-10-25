import type { Metadata } from 'next'
import 'next-persian-fonts/css/shabnam-fd.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '../styles/globals.css'
import ToastContainer from '@/components/ui/Toast'
import AuthBootstrap from '@/components/auth/AuthBootstrap'

export const metadata: Metadata = {
  title: 'آرو استور | ظروف پذیرایی آلومینیومی',
  description:
    'تولید و فروش مستقیم ظروف پذیرایی آلومینیوم خالص رنگ‌ثابت با نمایش سه‌بعدی ۳۶۰ درجه.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="bg-[#08090f] text-[#f4f4f6] antialiased selection:bg-[#dfc08e] selection:text-[#08090f]">
        <AuthBootstrap />
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  )
}
