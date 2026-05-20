"use client"

import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import DashboardHeader from "@/components/dashboard-header"
import UploadComponent from "@/components/upload-component"
import DocumentList from "@/components/document-list"
import ChatComponent from "@/components/chat-component"
import { Library, Upload } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader userName={session.user?.name || "Student"} />

      <section className="border-b border-border/60 bg-card/40">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Your study desk
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload notes, browse the shared library, and use AI tools on the files you&apos;ve added.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Upload className="h-4 w-4 text-accent" />
              Add material
            </div>
            <UploadComponent token={(session as { token?: string }).token} />
          </div>

          <div className="xl:col-span-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Library className="h-4 w-4 text-primary" />
              Library
            </div>
            <DocumentList />
          </div>
        </div>
      </main>

      <ChatComponent />
    </div>
  )
}
