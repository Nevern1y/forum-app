"use client"

import { useRealtime } from "./use-realtime"

interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: "pending" | "accepted" | "rejected" | "blocked"
  created_at: string
  accepted_at: string | null
}

interface UseFriendsRealtimeOptions {
  userId: string
  onNewRequest?: (request: Friendship) => void
  onAcceptedRequest?: (request: Friendship) => void
  onRejectedRequest?: (request: Friendship) => void
  onFriendsChange?: () => void
}

/**
 * Хук для подписки на изменения заявок в друзья в realtime
 */
export function useFriendsRealtime({
  userId,
  onNewRequest,
  onAcceptedRequest,
  onRejectedRequest,
  onFriendsChange,
}: UseFriendsRealtimeOptions) {
  useRealtime<Friendship>({
    table: "friendships",
    filter: `or(user_id.eq.${userId},friend_id.eq.${userId})`,
    onInsert: (request) => {
      // Новая заявка только если я - получатель (friend_id)
      if (request.friend_id === userId) {
        onNewRequest?.(request)
        onFriendsChange?.()
      }
    },
    onUpdate: ({ new: request }) => {
      if (request.status === "accepted") {
        onAcceptedRequest?.(request)
        onFriendsChange?.()
      } else if (request.status === "rejected") {
        onRejectedRequest?.(request)
        onFriendsChange?.()
      }
    },
  })
}
