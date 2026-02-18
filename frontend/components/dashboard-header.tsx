"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  userName: string
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SH</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">Student Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Welcome,</span>
              <span className="font-medium text-foreground">{userName}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirect: true, callbackUrl: "/auth/signin" })}
              className="border-border"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3">
            <div className="px-2 py-2 text-sm">
              <span className="text-muted-foreground">Welcome, </span>
              <span className="font-medium text-foreground">{userName}</span>
            </div>
            <Button
              variant="outline"
              className="w-full border-border bg-transparent"
              onClick={() => signOut({ redirect: true, callbackUrl: "/auth/signin" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
