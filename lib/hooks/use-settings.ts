"use client"

import { useState, useEffect } from "react"
import { settingsApi } from "@/lib/api-client"

export function useSettings() {
  const [referralBonus, setReferralBonus] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonus(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonus(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { referralBonus, isLoading }
}

