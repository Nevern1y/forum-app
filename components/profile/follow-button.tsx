"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { toggleFollow } from "@/lib/api/subscriptions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  profileId: string
  isFollowing: boolean
  className?: string
}

export function FollowButton({
  profileId,
  isFollowing: initialIsFollowing,
  className = ""
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggleFollow = async () => {
    setIsLoading(true)

    try {
      const result = await toggleFollow(profileId)

      setIsFollowing(result.following)

      if (result.action === 'followed') {
        toast.success("Подписка оформлена!", {
          description: "Посты этого пользователя появятся в вашей ленте"
        })
      } else {
        toast.info("Вы отписались")
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
      size="sm"
      className={`h-10 px-6 rounded-full gap-2 font-medium shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
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
