"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Loader2, Bell, Ticket, Moon, Sun } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileAppDownload } from "@/components/mobile-app-download"
import { FloatingSocialButton } from "@/components/floating-social-button"
import Image from "next/image";

export default function DashboardV2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#FF6B35]/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF8C42]/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b glass backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Top row with logo and user menu */}
          <div className="flex h-16 sm:h-20 items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className="group">
                  <div className="flex items-center group-hover:scale-105 transition-transform">
                      <Image src="/icash-logo.png" width={100} height={100} alt="logo" className="rounded-lg h-16 sm:h-20 w-auto"/>
                      <h1 className="hidden sm:block text-xl sm:text-2xl font-bold gradient-text ml-2 sm:ml-3">iCASH</h1>
                  </div>
              </Link>
            </div>

            {/* Theme toggle and User menu */}
            <div className="flex items-center gap-1 sm:gap-3">
              <ThemeToggle className="hidden sm:flex" />
              <Button
                variant="ghost"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl relative hidden sm:flex"
                asChild
              >
                <Link href="/dashboard/notifications">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button
                className="h-10 px-2 sm:h-12 sm:px-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#2563EB] text-white shadow-lg hover:shadow-xl hover:shadow-[#FF6B35]/40 transition-all duration-300 hover:scale-105 border-2 border-[#FF6B35]/20 font-semibold flex items-center gap-1 sm:gap-2"
                asChild
              >
                <Link href="/dashboard/coupon" className="flex items-center gap-1 sm:gap-2">
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Coupons</span>
                </Link>
              </Button>
              <MobileAppDownload
                variant="outline"
                className="h-10 px-2 sm:h-12 sm:px-4 rounded-xl border-2 hover:bg-primary/10 transition-all duration-300 hover:scale-105"
              />
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent/40 text-primary-foreground font-bold text-sm sm:text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 sm:w-56 glass" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Mobile-only items */}
                <div className="sm:hidden">
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/dashboard/notifications" className="flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleThemeToggle} className="rounded-lg cursor-pointer">
                    {mounted && (
                      <>
                        {resolvedTheme === "dark" ? (
                          <Sun className="mr-2 h-4 w-4" />
                        ) : (
                          <Moon className="mr-2 h-4 w-4" />
                        )}
                        <span>Mode {resolvedTheme === "dark" ? "clair" : "sombre"}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-20">{children}</main>

        <footer className="w-full bg-background relative z-10 py-4 sm:py-6">
            <div className="container mx-auto px-3 sm:px-6">
                <div className="flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Développé par{" "}
                        <Link
                            href="https://codelab.bj/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline transition-all duration-300"
                        >
                            Code Lab
                        </Link>
                    </p>
                </div>
            </div>
          </footer>

          {/* Floating Social Button */}
          <FloatingSocialButton />
    </div>
  )
}

