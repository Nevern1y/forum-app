"use client"

import { useEffect } from "react"
import { broadcastPresence } from "@/lib/api/presence"

export function PresenceProvider() {
  useEffect(() => {
    let cleanup: (() => void) | null = null

    async function init() {
      cleanup = await broadcastPresence()
    }

    init()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return null
}
