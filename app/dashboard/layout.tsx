"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
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
import { LogOut, User, Loader2, Bell, Ticket } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image";
import logo from "@/public/logo.png"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

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
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#059669]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b glass backdrop-blur-xl">
        <div className="container mx-auto px-4">
          {/* Top row with logo and user menu */}
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="group">
                  <div className="flex items-center group-hover:scale-105 transition-transform ">
                      <Image src="/Zefast-logo.png" width={100} height={100} alt="logo" className="rounded-lg h-20 w-auto"/>
                      <h1 className="text-2xl font-bold gradient-text">ZEFAST</h1>
                  </div>

              </Link>
            </div>

            {/* Theme toggle and User menu */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                className="h-12 w-12 rounded-xl relative"
                asChild
              >
                <Link href="/dashboard/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                className="h-12 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-primary/40 text-white shadow-lg hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-105 border-2 border-yellow-500/20 font-semibold flex items-center gap-2"
                asChild
              >
                <Link href="/dashboard/coupon" className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  <span className="hidden sm:inline">Coupons</span>
                </Link>
              </Button>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent/40 text-primary-foreground font-bold text-lg">{userInitials}</AvatarFallback>
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
      <main className="flex-1 container mx-auto px-4 py-8 relative z-20">{children}</main>

        <footer className="w-full bg-background relative z-10 py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        Développé par{" "}
                        <Link
                            href="https://wa.me/22947030588"
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
    </div>
  )
}
