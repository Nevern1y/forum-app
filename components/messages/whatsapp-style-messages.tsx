"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Loader2, Search, Users, ArrowLeft, Eye } from "lucide-react"
import { toast } from "sonner"
import { getConversations } from "@/lib/api/messages"
import { getFriends } from "@/lib/api/friends"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { OnlineIndicator } from "@/components/presence/online-indicator"
import { ChatWindow } from "./chat-window"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface WhatsAppStyleMessagesProps {
  userId: string
  currentUser: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function WhatsAppStyleMessages({ userId, currentUser }: WhatsAppStyleMessagesProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()

    // Real-time обновление списка чатов
    const supabase = createClient()
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [conversationsData, friendsData] = await Promise.all([
        getConversations(userId),
        getFriends(userId),
      ])

      setConversations(conversationsData)
      setFriends(friendsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Ошибка загрузки данных")
    } finally {
      setLoading(false)
    }
  }

  // Объединяем чаты и друзей без чатов
  const allChats = [
    ...conversations.map((conv: any) => ({
      type: "conversation",
      id: conv.id,
      user: conv.other_user,
      lastMessage: conv.last_message?.content || conv.last_message_preview || null,
      lastMessageAt: conv.last_message_at,
      unreadCount: conv.unread_count,
      lastMessageData: conv.last_message || null,
    })),
    ...friends
      .filter((friend: any) => !conversations.some((c: any) => c.other_user?.id === friend.friend?.id))
      .map((friend: any) => ({
        type: "friend",
        id: friend.friend?.id,
        user: friend.friend,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
      })),
  ].sort((a, b) => {
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })

  const filteredChats = allChats.filter((chat) => {
    if (!searchQuery) return true
    const username = chat.user?.username?.toLowerCase() || ""
    const displayName = chat.user?.display_name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return username.includes(query) || displayName.includes(query)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-background dark:bg-[#181818] rounded-xl overflow-hidden border border-border dark:border-[#252525] shadow-sm">
      {/* Sidebar - список чатов */}
      <div className={cn(
        "w-full md:w-80 border-r border-border dark:border-[#252525] flex flex-col bg-card dark:bg-[#1a1a1a]",
        selectedChat && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-[#252525] bg-card dark:bg-[#1a1a1a]">
          <h2 className="text-xl font-semibold mb-3 text-foreground dark:text-white">Сообщения</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="pl-9 bg-muted dark:bg-[#202020] border-border dark:border-[#2a2a2a] text-foreground dark:text-white placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-14 h-14 rounded-full bg-muted dark:bg-[#252525] flex items-center justify-center mb-3">
                <MessageCircle className="h-7 w-7 text-muted-foreground dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-foreground dark:text-white mb-1">
                {searchQuery ? "Ничего не найдено" : "Нет чатов"}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground dark:text-gray-500">
                  Добавьте друзей чтобы начать общение
                </p>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={`${chat.type}-${chat.id}`}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-3 flex items-center gap-3 hover:bg-muted dark:hover:bg-[#202020] transition-colors border-b border-border dark:border-[#252525]",
                  selectedChat?.user?.id === chat.user?.id && "bg-muted/50 dark:bg-[#222222]"
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-1 ring-border dark:ring-[#2a2a2a]">
                    <AvatarImage src={chat.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-muted dark:bg-[#252525] text-foreground dark:text-white text-sm font-medium">
                      {chat.user?.display_name?.[0]?.toUpperCase() || chat.user?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <OnlineIndicator userId={chat.user?.id} className="absolute -bottom-0.5 -right-0.5" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-[15px] truncate text-foreground dark:text-white">
                      {chat.user?.display_name || chat.user?.username}
                    </span>
                    {chat.lastMessageAt && (
                      <span className="text-xs text-muted-foreground dark:text-gray-500 ml-2 shrink-0">
                        {formatDistanceToNow(new Date(chat.lastMessageAt), {
                          addSuffix: false,
                          locale: ru,
                        })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Превью сообщения или статистика поста */}
                    {chat.lastMessageData?.shared_post_id && chat.lastMessageData?.shared_post ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-500">
                        <span className="truncate">📄 {chat.lastMessageData.shared_post.title}</span>
                        {chat.lastMessageData.shared_post.views > 0 && (
                          <span className="shrink-0 flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {chat.lastMessageData.shared_post.views}
                          </span>
                        )}
                      </div>
                    ) : chat.lastMessageData ? (
                      <p className="text-sm text-muted-foreground dark:text-gray-500 truncate">
                        {chat.lastMessageData.content || 
                         (chat.lastMessageData.audio_url ? "🎤 Голосовое сообщение" : 
                          (chat.lastMessageData.media_urls?.length > 0 ? "📷 Изображение" : 
                           "Начните беседу"))}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground dark:text-gray-500 truncate">
                        {chat.lastMessage || "Начните беседу"}
                      </p>
                    )}
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 h-5 min-w-5 rounded-full bg-gray-700 dark:bg-gray-600 text-white">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedChat && "hidden md:flex"
      )}>
        {selectedChat && selectedChat.user ? (
          <ChatWindow
              currentUserId={userId}
              otherUser={{
                id: selectedChat.user.id,
                username: selectedChat.user.username,
                display_name: selectedChat.user.display_name,
                avatar_url: selectedChat.user.avatar_url,
              }}
              embedded={true}
              onClose={() => setSelectedChat(null)}
            />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center bg-background dark:bg-[#181818]">
            <div className="w-16 h-16 rounded-full bg-muted dark:bg-[#252525] flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Выберите чат</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-500 max-w-sm">
              Выберите беседу из списка
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
