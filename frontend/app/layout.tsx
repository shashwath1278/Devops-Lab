import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClientSessionProvider } from "@/components/session-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Student Hub - Document Management & AI Assistant",
  description: "A modern platform for students to manage documents and collaborate with AI",
  generator: "elio.app",

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {/* <CHANGE> Wrap with SessionProvider for NextAuth */}
        <ClientSessionProvider>
          {children}
          <Analytics />
        </ClientSessionProvider>
      </body>
    </html>
  )
}
