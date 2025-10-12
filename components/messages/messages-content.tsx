"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getConversations } from "@/lib/api/messages"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { OnlineIndicator } from "@/components/presence/online-indicator"

interface MessagesContentProps {
  userId: string
}

export function MessagesContent({ userId }: MessagesContentProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [userId])

  async function loadConversations() {
    setLoading(true)
    try {
      const data = await getConversations(userId)
      setConversations(data)
    } catch (error) {
      console.error("Error loading conversations:", error)
      toast.error("Ошибка загрузки сообщений")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-12 text-center bg-card dark:bg-[#181818]">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Начните общение с друзьями через личные сообщения
        </p>
        <Link
          href="/friends"
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
        >
          Перейти к друзьям →
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        // Определяем собеседника
        const otherUser =
          conversation.user1_id === userId ? conversation.user2 : conversation.user1

        // Определяем непрочитанные для текущего пользователя
        const unreadCount =
          conversation.user1_id === userId
            ? conversation.unread_count_user1
            : conversation.unread_count_user2

        return (
          <Link key={conversation.id} href={`/messages/${otherUser.username}`}>
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-card dark:bg-[#181818]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-background">
                    <AvatarImage src={otherUser.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {otherUser.display_name?.[0]?.toUpperCase() ||
                        otherUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineIndicator userId={otherUser.id} className="absolute -bottom-1 -right-1" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {otherUser.display_name || otherUser.username}
                    </h3>
                    {unreadCount > 0 && (
                      <Badge variant="default" className="h-5 px-2 text-xs bg-gray-700 dark:bg-gray-600 text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message_preview || "Начните беседу..."}
                  </p>

                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
