"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE"

interface UseRealtimeOptions<T = any> {
  table: string
  event?: RealtimeEvent | "*"
  filter?: string
  onInsert?: (payload: T) => void
  onUpdate?: (payload: { old: T; new: T }) => void
  onDelete?: (payload: T) => void
  onChange?: (payload: any) => void
}

/**
 * Универсальный хук для подписки на realtime изменения
 */
export function useRealtime<T = any>({
  table,
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Создаем уникальное имя канала
    const channelName = `realtime:${table}:${Date.now()}`
    const channel = supabase.channel(channelName)

    // Настраиваем слушатель
    let subscription = channel.on(
      "postgres_changes",
      {
        event: event,
        schema: "public",
        table: table,
        filter: filter,
      },
      (payload) => {
        console.log(`[Realtime ${table}]`, payload)

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

    // Подписываемся с обработкой ошибок
    subscription.subscribe((status, err) => {
      console.log(`[Realtime ${table}] Status:`, status)
      
      if (status === "SUBSCRIBED") {
        console.log(`✅ [Realtime ${table}] Successfully subscribed`)
      } else if (status === "CHANNEL_ERROR") {
        console.error(`❌ [Realtime ${table}] Channel error:`, err)
        console.error(`Check if realtime is enabled for ${table} in Supabase Dashboard`)
      } else if (status === "TIMED_OUT") {
        console.error(`⏱️ [Realtime ${table}] Connection timed out`)
      } else if (status === "CLOSED") {
        console.warn(`🔌 [Realtime ${table}] Connection closed`)
        // Автоматическое переподключение через 5 секунд
        if (channelRef.current) {
          setTimeout(() => {
            console.log(`🔄 [Realtime ${table}] Attempting to reconnect...`)
            channelRef.current?.subscribe()
          }, 5000)
        }
      }
    })

    channelRef.current = channel

    // Отписываемся при размонтировании
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, filter])

  return channelRef.current
}
