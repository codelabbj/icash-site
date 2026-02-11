"use client"

import { Button } from "@/components/ui/button"
import { Download, Smartphone } from "lucide-react"
import Link from "next/link"

interface MobileAppDownloadProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function MobileAppDownload({
  variant = "default",
  size = "default",
  className = "",
  showText = true
}: MobileAppDownloadProps) {
  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={`gap-2 h-10 sm:h-11 ${className}`}
    >
      <Link
        href="https://icash-mobile-app.vercel.app/releases/app-v1.0.0.apk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 w-full justify-center"
      >
        <Smartphone className="h-4 w-4" />
        {showText && (
          <>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Télécharger l'app</span>
            <span className="sm:hidden">App</span>
          </>
        )}
      </Link>
    </Button>
  )
}
