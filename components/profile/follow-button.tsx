"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  profileId: string
  isFollowing: boolean
}

export function FollowButton({ profileId, isFollowing: initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleFollow = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      if (isFollowing) {
        await supabase.from("subscriptions").delete().eq("follower_id", user.id).eq("following_id", profileId)
        setIsFollowing(false)
      } else {
        await supabase.from("subscriptions").insert({
          follower_id: user.id,
          following_id: profileId,
        })
        setIsFollowing(true)
      }
      router.refresh()
    } catch (error) {
      console.error("[v0] Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleFollow} 
      disabled={isLoading} 
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="h-9 min-w-[120px] font-semibold"
    >
      {isLoading ? "..." : isFollowing ? "Подписан" : "Подписаться"}
    </Button>
  )
}
