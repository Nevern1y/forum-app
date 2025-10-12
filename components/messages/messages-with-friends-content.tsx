"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2, Users, UserCheck, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getConversations } from "@/lib/api/messages"
import {
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "@/lib/api/friends"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { OnlineIndicator } from "@/components/presence/online-indicator"

interface MessagesWithFriendsContentProps {
  userId: string
}

export function MessagesWithFriendsContent({ userId }: MessagesWithFriendsContentProps) {
  const [activeTab, setActiveTab] = useState("messages")
  const [conversations, setConversations] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [incoming, setIncoming] = useState<any[]>([])
  const [outgoing, setOutgoing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    console.log("[MessagesWithFriends] Loading data for user:", userId)
    setLoading(true)
    try {
      const [conversationsData, friendsData, incomingData, outgoingData] = await Promise.all([
        getConversations(userId),
        getFriends(userId),
        getIncomingRequests(userId),
        getOutgoingRequests(userId),
      ])

      console.log("[MessagesWithFriends] Loaded data:", {
        conversations: conversationsData.length,
        friends: friendsData.length,
        incoming: incomingData.length,
        outgoing: outgoingData.length,
      })

      setConversations(conversationsData)
      setFriends(friendsData)
      setIncoming(incomingData)
      setOutgoing(outgoingData)
    } catch (error) {
      console.error("[MessagesWithFriends] Error loading data:", error)
      toast.error("Ошибка загрузки данных")
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId)
    try {
      await acceptFriendRequest(friendshipId)
      toast.success("Запрос принят!")
      await loadData()
    } catch (error) {
      console.error("Error accepting request:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при принятии запроса"
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(friendshipId: string) {
    setActionLoading(friendshipId)
    try {
      await rejectFriendRequest(friendshipId)
      toast.success("Запрос отклонен")
      await loadData()
    } catch (error) {
      console.error("Error rejecting request:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при отклонении запроса"
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemove(friendshipId: string, isFriend: boolean = false) {
    setActionLoading(friendshipId)
    try {
      await removeFriend(friendshipId)
      toast.success(isFriend ? "Удалено из друзей" : "Запрос отменен")
      await loadData()
    } catch (error) {
      console.error("Error removing friend:", error)
      const errorMessage = error instanceof Error ? error.message : "Ошибка при удалении"
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  const totalRequests = incoming.length + outgoing.length

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>Сообщения</span>
          {conversations.length > 0 && (
            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="friends" className="gap-2">
          <Users className="h-4 w-4" />
          <span>Друзья</span>
          {(friends.length > 0 || totalRequests > 0) && (
            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {friends.length}
              {totalRequests > 0 && ` • ${totalRequests}`}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Messages Tab */}
      <TabsContent value="messages" className="space-y-3">
        {conversations.length === 0 ? (
          <Card className="p-12 text-center bg-card dark:bg-[#181818]">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Начните общение с друзьями через личные сообщения
            </p>
            <Button onClick={() => setActiveTab("friends")} variant="outline">
              Перейти к друзьям →
            </Button>
          </Card>
        ) : (
          conversations.map((conversation) => {
            const otherUser =
              conversation.user1_id === userId ? conversation.user2 : conversation.user1

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
          })
        )}
      </TabsContent>

      {/* Friends Tab */}
      <TabsContent value="friends" className="space-y-6">
        {/* Incoming Requests */}
        {incoming.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              Входящие запросы ({incoming.length})
            </h3>
            <div className="space-y-3">
              {incoming.map((request) => {
                const requester = request.requester
                return (
                  <Card key={request.id} className="p-4 bg-card dark:bg-[#181818]">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${requester.username}`}>
                        <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-gray-400 dark:hover:ring-gray-600 transition-all">
                          <AvatarImage src={requester.avatar_url || undefined} />
                          <AvatarFallback>
                            {requester.display_name?.[0]?.toUpperCase() ||
                              requester.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${requester.username}`}>
                          <h3 className="font-semibold hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate">
                            {requester.display_name || requester.username}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">
                          @{requester.username}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white"
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Принять
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Outgoing Requests */}
        {outgoing.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              Исходящие запросы ({outgoing.length})
            </h3>
            <div className="space-y-3">
              {outgoing.map((request) => {
                const friend = request.friend
                return (
                  <Card key={request.id} className="p-4 bg-card dark:bg-[#181818]">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${friend.username}`}>
                        <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-gray-400 dark:hover:ring-gray-600 transition-all">
                          <AvatarImage src={friend.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.display_name?.[0]?.toUpperCase() ||
                              friend.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${friend.username}`}>
                          <h3 className="font-semibold hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate">
                            {friend.display_name || friend.username}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Отправлено{" "}
                          {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Отменить"
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Мои друзья ({friends.length})
          </h3>
          {friends.length === 0 && incoming.length === 0 && outgoing.length === 0 ? (
            <Card className="p-12 text-center bg-card dark:bg-[#181818]">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Нет друзей</h3>
              <p className="text-sm text-muted-foreground">
                Добавляйте пользователей в друзья через их профиль
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {friends.map((friendship) => {
                const friend = friendship.friend
                return (
                  <Card key={friendship.id} className="p-4 bg-card dark:bg-[#181818]">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${friend.username}`}>
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-gray-400 dark:hover:ring-gray-600 transition-all">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback>
                              {friend.display_name?.[0]?.toUpperCase() ||
                                friend.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <OnlineIndicator userId={friend.id} className="absolute -bottom-1 -right-1" />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${friend.username}`}>
                          <h3 className="font-semibold hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate">
                            {friend.display_name || friend.username}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/messages/${friend.username}`}>Написать</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
