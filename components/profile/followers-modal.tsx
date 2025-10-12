"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  reputation: number
}

interface FollowersModalProps {
  userId: string
  count: number
  type: "followers" | "following"
  trigger?: React.ReactNode
}

export function FollowersModal({ userId, count, type, trigger }: FollowersModalProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      if (type === "followers") {
        // Get followers
        const { data } = await supabase
          .from("subscriptions")
          .select("profiles!subscriptions_follower_id_fkey(id, username, display_name, avatar_url, reputation)")
          .eq("following_id", userId)

        setUsers(data?.map((d: any) => d.profiles).filter(Boolean) || [])
      } else {
        // Get following
        const { data } = await supabase
          .from("subscriptions")
          .select("profiles!subscriptions_following_id_fkey(id, username, display_name, avatar_url, reputation)")
          .eq("follower_id", userId)

        setUsers(data?.map((d: any) => d.profiles).filter(Boolean) || [])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="hover:bg-accent">
            <div className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground">
                {type === "followers" ? "Подписчиков" : "Подписок"}
              </p>
            </div>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === "followers" ? "Подписчики" : "Подписки"} ({count})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "followers" ? "Пока нет подписчиков" : "Пока нет подписок"}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold group-hover:underline truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.reputation}</p>
                    <p className="text-xs text-muted-foreground">репутация</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
