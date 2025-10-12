"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck, UserX, Loader2, Clock } from "lucide-react"
import { toast } from "sonner"
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  type Friendship,
} from "@/lib/api/friends"
import { createClient } from "@/lib/supabase/client"

interface FriendRequestButtonProps {
  userId: string
  className?: string
}

export function FriendRequestButton({ userId, className }: FriendRequestButtonProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friendship, setFriendship] = useState<Friendship | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadFriendshipStatus()
  }, [userId])

  async function loadFriendshipStatus() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setCurrentUserId(user.id)

      // Не показываем кнопку для самого себя
      if (user.id === userId) {
        setLoading(false)
        return
      }

      const status = await getFriendshipStatus(user.id, userId)
      setFriendship(status)
    } catch (error) {
      console.error("Error loading friendship status:", error)
      toast.error("Ошибка загрузки")
    } finally {
      setLoading(false)
    }
  }

  async function handleSendRequest() {
    if (!currentUserId) {
      toast.error("Необходима авторизация")
      return
    }

    setActionLoading(true)
    try {
      await sendFriendRequest(userId)
      toast.success("Запрос отправлен!")
      await loadFriendshipStatus()
    } catch (error) {
      console.error("Error sending friend request:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при отправке запроса"
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAcceptRequest() {
    if (!friendship) return

    setActionLoading(true)
    try {
      await acceptFriendRequest(friendship.id)
      toast.success("Запрос принят!")
      await loadFriendshipStatus()
    } catch (error) {
      console.error("Error accepting request:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при принятии запроса"
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemove() {
    if (!friendship) return

    setActionLoading(true)
    try {
      await removeFriend(friendship.id)
      toast.success(friendship.status === "accepted" ? "Удалено из друзей" : "Запрос отменен")
      await loadFriendshipStatus()
    } catch (error) {
      console.error("Error removing friend:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при удалении"
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Не показываем ничего пока загружается
  if (loading) {
    return null
  }

  // Не показываем для самого себя
  if (!currentUserId || currentUserId === userId) {
    return null
  }

  // Если нет дружбы - показываем кнопку "Добавить"
  if (!friendship) {
    return (
      <Button
        onClick={handleSendRequest}
        disabled={actionLoading}
        className={className}
        size="sm"
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Добавить в друзья
          </>
        )}
      </Button>
    )
  }

  // Если мы получили запрос (friend_id = currentUserId) и статус pending
  if (friendship.friend_id === currentUserId && friendship.status === "pending") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={handleAcceptRequest}
          disabled={actionLoading}
          className={className}
          size="sm"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Принять
            </>
          )}
        </Button>
        <Button
          onClick={handleRemove}
          disabled={actionLoading}
          variant="outline"
          size="sm"
        >
          <UserX className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Если мы отправили запрос (user_id = currentUserId) и статус pending
  if (friendship.user_id === currentUserId && friendship.status === "pending") {
    return (
      <Button
        onClick={handleRemove}
        disabled={actionLoading}
        variant="outline"
        className={className}
        size="sm"
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Clock className="h-4 w-4 mr-2" />
            Отменить запрос
          </>
        )}
      </Button>
    )
  }

  // Если друзья (accepted)
  if (friendship.status === "accepted") {
    return (
      <Button
        onClick={handleRemove}
        disabled={actionLoading}
        variant="outline"
        className={className}
        size="sm"
      >
        {actionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserCheck className="h-4 w-4 mr-2" />
            В друзьях
          </>
        )}
      </Button>
    )
  }

  return null
}
