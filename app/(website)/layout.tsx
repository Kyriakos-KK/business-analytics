import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '../globals.css'
import Background from '@/components/Background'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollTopButton from '@/components/ScrollTopButton'
import FadeObserver from '@/components/FadeObserver'

export const metadata: Metadata = {
  title: 'Business Analytics | AI & Data Intelligence',
  description: 'Business Analytics – AI, Data & Business Intelligence Platform',
  icons: { icon: '/images/businessanalyticsicon.png' },
}

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="el">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Background />
        <Navbar />
        <div className="spacer" aria-hidden="true" />
        {children}
        <Footer />
        <ScrollTopButton />
        <FadeObserver />
      </body>
    </html>
  )
}
