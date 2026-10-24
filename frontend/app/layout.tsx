import type { Metadata } from 'next'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/700.css'
import '@fontsource/vazirmatn/900.css'
import '@fontsource/markazi-text/400.css'
import '@fontsource/markazi-text/600.css'
import '@fontsource/markazi-text/700.css'
import '@fontsource/cormorant-garamond/400.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '../styles/globals.css'
import ToastContainer from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'آرو استور — کارگاه فلزتراشی و تالار ظروف پذیرایی آلومینیومی',
  description:
    'طراحی، ریخته‌گری و تراش ظروف پذیرایی آلومینیوم خالص با پوشش آنودایز کوره‌ای و بررسی سه‌بعدی ۳۶۰ درجه در تالار آرو استور.',
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
