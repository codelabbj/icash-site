"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MessageCircle, Send } from "lucide-react"
import { useSettings } from "@/lib/hooks/use-settings"
import Link from "next/link"

export function FloatingSocialButton() {
  const { settings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)

  const whatsappUrl = settings?.whatsapp_phone
    ? `https://wa.me/${settings.whatsapp_phone}`
    : "https://wa.me/"

  const telegramUrl = settings?.telegram
    ? `https://t.me/${settings.telegram}`
    : "https://t.me/"

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end" side="top">
          <div className="space-y-2">
            <Link
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">WhatsApp</span>
              </Button>
            </Link>
            <Link
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <Send className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Telegram</span>
              </Button>
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
