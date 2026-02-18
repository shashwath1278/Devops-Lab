"use client"

import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import DashboardHeader from "@/components/dashboard-header"
import UploadComponent from "@/components/upload-component"
import DocumentList from "@/components/document-list"
import ChatComponent from "@/components/chat-component"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return null
  }

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <main className="min-h-screen">
      <DashboardHeader userName={session.user?.name || "Student"} />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Upload Widget */}
          <div className="lg:col-span-1 space-y-6">
            <UploadComponent userId={session.user?.id || ""} />
          </div>

          {/* Right Column: Document Library */}
          <div className="lg:col-span-2">
            <DocumentList />
          </div>
        </motion.div>
      </div>

      <ChatComponent />
    </main>
  )
}
