"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, Search } from "lucide-react"
import { toast } from "sonner"
import { getFriends } from "@/lib/api/friends"
import { getOrCreateConversation, sendMessage } from "@/lib/api/messages"
import { createClient } from "@/lib/supabase/client"

interface SharePostModalProps {
  postId: string
  postTitle: string
  onClose: () => void
}

export function SharePostModal({ postId, postTitle, onClose }: SharePostModalProps) {
  const [friends, setFriends] = useState<any[]>([])
  const [filteredFriends, setFilteredFriends] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    loadFriends()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = friends.filter((f) => {
        const friend = f.friend
        const name = friend.display_name || friend.username
        return name.toLowerCase().includes(searchQuery.toLowerCase())
      })
      setFilteredFriends(filtered)
    } else {
      setFilteredFriends(friends)
    }
  }, [searchQuery, friends])

  async function loadFriends() {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Необходима авторизация")
        onClose()
        return
      }

      const data = await getFriends(user.id)
      setFriends(data)
      setFilteredFriends(data)
    } catch (error) {
      console.error("Error loading friends:", error)
      toast.error("Ошибка загрузки друзей")
    } finally {
      setLoading(false)
    }
  }

  async function handleShare(friendId: string, friendUsername: string) {
    setSending(friendId)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Необходима авторизация")

      // Получить или создать беседу
      const conversationId = await getOrCreateConversation(user.id, friendId)

      // Отправить сообщение с ссылкой на пост
      await sendMessage(
        conversationId,
        friendId,
        "",
        undefined,
        undefined,
        postId
      )

      toast.success("Пост отправлен!")
      onClose()
    } catch (error) {
      console.error("Error sharing post:", error)
      toast.error("Ошибка при отправке")
    } finally {
      setSending(null)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dark:bg-[#181818]" aria-describedby="share-description">
        <DialogHeader>
          <DialogTitle>Поделиться постом</DialogTitle>
          <DialogDescription id="share-description">
            Выберите друга для отправки
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск друзей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Friends List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {friends.length === 0 ? "Нет друзей" : "Ничего не найдено"}
            </div>
          ) : (
            filteredFriends.map((friendship) => {
              const friend = friendship.friend
              return (
                <div
                  key={friendship.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback>
                      {friend.display_name?.[0]?.toUpperCase() || friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {friend.display_name || friend.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleShare(friend.id, friend.username)}
                    disabled={sending !== null}
                  >
                    {sending === friend.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Отправить
                      </>
                    )}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
