import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Decision Helper",
  description: "Make better decisions using structured analysis",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <Navbar />
        <div className="pt-14">{children}</div>
      </body>
    </html>
  )
}
