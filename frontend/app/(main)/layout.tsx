import React from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/layout/CartDrawer'
import QuickView3DModal from '@/components/product/QuickView3DModal'
import AtmosphericBackdrop from '@/components/layout/AtmosphericBackdrop'

export default function MainStoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col isolate">
      <AtmosphericBackdrop />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <QuickView3DModal />
    </div>
  )
}
