"use client"

import { useState, useEffect } from "react"
import { settingsApi } from "@/lib/api-client"
import {Settings} from "@/lib/types";

export function useSettings() {
  const [referralBonus, setReferralBonus] = useState<boolean>(false)
    const [settings, setSettings] = useState<Settings>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
          setSettings(settings)
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

  return { referralBonus, settings, isLoading }
}

