"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { RealtimePayload } from "@/lib/types"

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

interface UseRealtimeOptions<T = unknown> {
  table: string
  event?: RealtimeEvent | "*"
  filter?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
  onChange?: (payload: RealtimePayload<T>) => void
}

/**
 * Универсальный хук для подписки на realtime изменения
 */
export function useRealtime<T = unknown>({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const baseDelay = 1000 // 1 second

  const attemptReconnect = (channel: RealtimeChannel) => {
    if (retryCountRef.current >= maxRetries) {
      console.error(`❌ [Realtime ${table}] Max retry attempts (${maxRetries}) reached. Giving up.`)
      return
    }

    retryCountRef.current++
    // Exponential backoff with jitter: baseDelay * 2^(attempt-1) + random jitter
    const delay = baseDelay * Math.pow(2, retryCountRef.current - 1) + Math.random() * 1000

    console.log(`🔄 [Realtime ${table}] Attempting to reconnect in ${Math.round(delay)}ms (attempt ${retryCountRef.current}/${maxRetries})`)

    setTimeout(() => {
      if (channelRef.current) {
        channel.subscribe()
      }
    }, delay)
  }

  useEffect(() => {
    const supabase = createClient()

    // Создаем уникальное имя канала
    const channelName = `realtime:${table}:${Date.now()}`
    const channel = supabase.channel(channelName)

    // Настраиваем слушатель с правильной конфигурацией
    // Используем правильный формат для Supabase Realtime
    const changeConfig = {
      event,
      schema: "public",
      table: table,
      ...(filter && { filter }),
    }
    
    let subscription = channel.on(
      "postgres_changes",
      changeConfig,
      (payload: RealtimePayload<T>) => {
        console.log(`[Realtime ${table}] Change received:`, payload.eventType)

        // Вызываем соответствующий обработчик
        switch (payload.eventType) {
          case "INSERT":
            onInsert?.(payload.new as T)
            onChange?.(payload)
            break
          case "UPDATE":
            onUpdate?.({ old: payload.old as T, new: payload.new as T })
            onChange?.(payload)
            break
          case "DELETE":
            onDelete?.(payload.old as T)
            onChange?.(payload)
            break
        }
      }
    )

    // Подписываемся с обработкой ошибок и повторными попытками
    subscription.subscribe((status, err) => {
      console.log(`[Realtime ${table}] Status:`, status)

      if (status === "SUBSCRIBED") {
        console.log(`✅ [Realtime ${table}] Successfully subscribed`)
        retryCountRef.current = 0 // Reset retry count on successful connection
      } else if (status === "CHANNEL_ERROR") {
        console.error(`❌ [Realtime ${table}] Channel error:`, err)
        console.error(`Check if realtime is enabled for ${table} in Supabase Dashboard`)
        attemptReconnect(channel)
      } else if (status === "TIMED_OUT") {
        console.error(`⏱️ [Realtime ${table}] Connection timed out`)
        attemptReconnect(channel)
      } else if (status === "CLOSED") {
        console.warn(`🔌 [Realtime ${table}] Connection closed`)
        attemptReconnect(channel)
      }
    })

    channelRef.current = channel

    // Отписываемся при размонтировании
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      retryCountRef.current = 0
    }
  }, [table, event, filter])

  return channelRef.current
}
