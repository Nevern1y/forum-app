"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from "@supabase/supabase-js"
import type { RealtimePayload } from "@/lib/types"

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface UseRealtimeOptions<T = unknown> {
  table: string
  event?: RealtimeEvent
  filter?: string | undefined  // Может быть undefined для отключения
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSubscribedRef = useRef(false)
  
  // Умная конфигурация повторных попыток
  const maxRetries = 10 // Больше попыток
  const baseDelay = 2000 // Начинаем с 2 секунд
  const maxDelay = 30000 // Максимум 30 секунд между попытками

  const attemptReconnect = (channel: RealtimeChannel, reason: string) => {
    // Очищаем предыдущий таймаут если есть
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Не пытаемся реконнектиться если уже подключены
    if (isSubscribedRef.current) {
      return
    }

    if (retryCountRef.current >= maxRetries) {
      // Просто логируем без ошибки, не засоряем консоль
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Realtime ${table}] Stopped reconnecting after ${maxRetries} attempts`)
      }
      return
    }

    retryCountRef.current++
    
    // Exponential backoff с cap на максимальную задержку
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(1.5, retryCountRef.current - 1),
      maxDelay
    )
    
    // Добавляем jitter чтобы избежать thundering herd
    const jitter = Math.random() * 1000
    const delay = exponentialDelay + jitter

    // Логируем только в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime ${table}] Reconnecting in ${Math.round(delay / 1000)}s (${retryCountRef.current}/${maxRetries}) - ${reason}`)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && !isSubscribedRef.current) {
        channel.subscribe()
      }
    }, delay)
  }

  useEffect(() => {
    // Если filter === undefined, не подписываемся (disabled)
    if (filter === undefined) {
      return
    }

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
          // Логируем только в dev режиме
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Realtime ${table}] ${payload.eventType}`)
          }

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
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true
          retryCountRef.current = 0
          
          // Очищаем таймаут реконнекта
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
          
          // Логируем успех только в dev или при первом подключении
          if (process.env.NODE_ENV === 'development' || retryCountRef.current === 0) {
            console.log(`✅ [Realtime ${table}] Connected`)
          }
        } else if (status === "CHANNEL_ERROR") {
          isSubscribedRef.current = false
          
          const errorMessage = err?.message || ''
          
          // Детектируем специфичную проблему "mismatch"
          if (errorMessage.includes('mismatch between server and client bindings')) {
            // Это известная проблема - replica_identity='full' вместо 'default'
            // Логируем ОДИН раз с понятной инструкцией
            if (retryCountRef.current === 0) {
              console.error(
                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `❌ REALTIME ERROR: Table "${table}" is misconfigured\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `PROBLEM: replica_identity is set to 'full' instead of 'default'\n\n` +
                `FIX: Run this SQL in Supabase SQL Editor:\n\n` +
                `  ALTER TABLE ${table} REPLICA IDENTITY DEFAULT;\n\n` +
                `Then restart: npm run dev\n\n` +
                `For all tables, run: FIX_ALL_REPLICA_IDENTITY.sql\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
              )
            }
            // НЕ пытаемся реконнектиться - это не поможет
            return
          }
          
          // Для других ошибок логируем и пытаемся реконнектиться
          if (retryCountRef.current === 0 || process.env.NODE_ENV === 'development') {
            console.error(`❌ [Realtime ${table}] Error:`, errorMessage)
          }
          
          attemptReconnect(channel, 'channel_error')
        } else if (status === "TIMED_OUT") {
          isSubscribedRef.current = false
          
          // Timeout - частая ситуация, не засоряем консоль
          if (process.env.NODE_ENV === 'development' && retryCountRef.current === 0) {
            console.warn(`⏱️ [Realtime ${table}] Timeout, reconnecting...`)
          }
          
          attemptReconnect(channel, 'timeout')
        } else if (status === "CLOSED") {
          isSubscribedRef.current = false
          
          // Connection closed - нормальная ситуация при unmount
          if (process.env.NODE_ENV === 'development' && retryCountRef.current === 0) {
            console.log(`[Realtime ${table}] Disconnected`)
          }
          
          // Реконнектимся только если это не unmount
          if (channelRef.current) {
            attemptReconnect(channel, 'closed')
          }
        }
      })

    channelRef.current = channel

    // Отписываемся при размонтировании
    return () => {
      // Очищаем таймаут реконнекта
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Отписываемся от канала
      if (channelRef.current) {
        isSubscribedRef.current = false
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      retryCountRef.current = 0
    }
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange])

  return channelRef.current
}
