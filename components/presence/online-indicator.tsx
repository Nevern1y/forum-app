"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { subscribeToOnlineUsers } from "@/lib/api/presence"

interface OnlineIndicatorProps {
  userId: string
  className?: string
  showText?: boolean
}

export function OnlineIndicator({ userId, className, showText = false }: OnlineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers((onlineUserIds) => {
      setIsOnline(onlineUserIds.includes(userId))
    })

    return unsubscribe
  }, [userId])

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#181818]",
          isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
        )}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? "В сети" : "Не в сети"}
        </span>
      )}
    </div>
  )
}
