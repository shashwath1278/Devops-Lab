"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, BookOpen } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  userName: string
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-[4.25rem] items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-[1.02]">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="hidden sm:block">
              <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
                Student Hub
              </span>
              <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Study workspace
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <div className="rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm">
              <span className="text-muted-foreground">Signed in as </span>
              <span className="font-medium text-foreground">{userName}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="rounded-lg border-border"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 hover:bg-secondary md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-3 border-t border-border py-4 md:hidden">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{userName}</span>
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
