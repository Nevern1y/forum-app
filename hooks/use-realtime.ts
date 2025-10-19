"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from "@supabase/supabase-js"

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE"
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}

interface UseRealtimeOptions<T = unknown> {
  table: string
  event?: RealtimeEvent
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
  const baseDelay = 1000

  const attemptReconnect = (channel: RealtimeChannel) => {
    if (retryCountRef.current >= maxRetries) {
      console.error(`❌ [Realtime ${table}] Max retry attempts (${maxRetries}) reached. Giving up.`)
      return
    }

    retryCountRef.current++
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
    const channelName = `${table}:${Date.now()}`
    const channel = supabase.channel(channelName)

    // Правильная конфигурация для Supabase Realtime v2
    const config: {
      event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT["postgres_changes"]
      schema: string
      table: string
      filter?: string
    } = {
      event: event as any,
      schema: "public",
      table: table,
    }

    // Добавляем фильтр только если он указан
    if (filter) {
      config.filter = filter
    }

    // Подписываемся на изменения
    channel
      .on(
        "postgres_changes" as any,
        config as any,
        (payload: any) => {
          console.log(`[Realtime ${table}] Change received:`, payload.eventType)

          // Вызываем соответствующий обработчик
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new as T)
              onChange?.(payload as RealtimePayload<T>)
              break
            case "UPDATE":
              onUpdate?.({ old: payload.old as T, new: payload.new as T })
              onChange?.(payload as RealtimePayload<T>)
              break
            case "DELETE":
              onDelete?.(payload.old as T)
              onChange?.(payload as RealtimePayload<T>)
              break
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[Realtime ${table}] Status:`, status)

        if (status === "SUBSCRIBED") {
          console.log(`✅ [Realtime ${table}] Successfully subscribed`)
          retryCountRef.current = 0
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
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange])

  return channelRef.current
}
