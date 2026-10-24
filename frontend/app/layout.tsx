import type { Metadata } from 'next'
import 'next-persian-fonts/css/arad-fd.css'
import 'next-persian-fonts/css/estedad-fd.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '../styles/globals.css'
import ToastContainer from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'آرو استور | تولیدی ظروف پذیرایی آلومینیومی',
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
      <body className="bg-[#11100e] text-[#f3efe8] antialiased selection:bg-[#c59b5f] selection:text-[#11100e] foundry-grain relative">
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>
        <ToastContainer />
      </body>
    </html>
  )
}
