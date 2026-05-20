"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { BookOpen, Sparkles } from "lucide-react"

interface AuthShellProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1a3d36] px-12 py-14 text-[#f4f1ea]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(244,241,234,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(196,92,62,0.2) 0%, transparent 40%)",
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f1ea]/10 ring-1 ring-[#f4f1ea]/20">
              <BookOpen className="h-5 w-5 text-[#f4f1ea]" strokeWidth={1.75} />
            </span>
            <span className="font-serif text-2xl font-semibold tracking-tight">Student Hub</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <p className="font-serif text-4xl font-medium leading-[1.15] tracking-tight text-[#f4f1ea]">
            Your notes, organized. Your study time, smarter.
          </p>
          <p className="text-[15px] leading-relaxed text-[#f4f1ea]/75">
            Upload course materials, browse a shared library, and get AI help grounded in the
            files you actually uploaded.
          </p>
          <ul className="space-y-3 text-sm text-[#f4f1ea]/80">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#e8a87c]" />
              Flashcards & quizzes from your PDFs
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#e8a87c]" />
              Study assistant tied to your library
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-[#f4f1ea]/50">DevOps Lab · Student Platform</p>
      </aside>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="font-serif text-xl font-semibold">Student Hub</span>
        </div>
        <div className="mx-auto w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
