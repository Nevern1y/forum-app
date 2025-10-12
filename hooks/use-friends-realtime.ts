"use client"

import { useRealtime } from "./use-realtime"

interface FriendRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
}

interface UseFriendsRealtimeOptions {
  userId: string
  onNewRequest?: (request: FriendRequest) => void
  onAcceptedRequest?: (request: FriendRequest) => void
  onRejectedRequest?: (request: FriendRequest) => void
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
  useRealtime<FriendRequest>({
    table: "friend_requests",
    filter: `or(requester_id.eq.${userId},receiver_id.eq.${userId})`,
    onInsert: (request) => {
      // Новая заявка только если я - получатель
      if (request.receiver_id === userId) {
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
