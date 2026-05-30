// frontend/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import ThemeProvider from '@/components/layout/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Decision Helper — Make Better Choices',
  description: 'Structured, math-backed decision making using AHP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 transition-colors duration-200`}>
        <ThemeProvider>
          <Navbar />
          <div className="pt-14">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}