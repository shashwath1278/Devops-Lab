import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Source_Serif_4 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClientSessionProvider } from "@/components/session-provider"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Student Hub — Notes, Library & AI Study",
  description: "Upload course materials, share a document library, and study with AI tools.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${sourceSerif.variable} font-sans antialiased`}>
        <ClientSessionProvider>
          {children}
          <Analytics />
        </ClientSessionProvider>
      </body>
    </html>
  )
}
