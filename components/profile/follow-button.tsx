"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toggleFollow } from "@/lib/api/subscriptions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
  username: string
  className?: string
}

export function FollowButton({
  userId,
  initialIsFollowing,
  username,
  className = ""
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggleFollow = async () => {
    setIsLoading(true)

    try {
      const result = await toggleFollow(userId)

      setIsFollowing(result.following)

      if (result.action === 'followed') {
        toast.success(`Вы подписались на @${username}`, {
          description: "Посты этого пользователя появятся в вашей ленте"
        })
      } else {
        toast.info(`Вы отписались от @${username}`)
      }

      // Refresh to update counts
      router.refresh()
    } catch (error) {
      console.error('[FollowButton] Error:', error)
      toast.error("Ошибка", {
        description: error instanceof Error ? error.message : "Не удалось выполнить действие"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      size="default"
      className={`gap-2 font-semibold transition-all duration-200 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Загрузка...</span>
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          <span>Отписаться</span>
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          <span>Подписаться</span>
        </>
      )}
    </Button>
  )
}
