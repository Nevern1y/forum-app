"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserCheck, UserPlus, Clock, Loader2, Users, Inbox, Send } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
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

interface FriendsContentProps {
  userId: string
}

export function FriendsContent({ userId }: FriendsContentProps) {
  const [activeTab, setActiveTab] = useState("friends")
  const [friends, setFriends] = useState<any[]>([])
  const [incoming, setIncoming] = useState<any[]>([])
  const [outgoing, setOutgoing] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        getFriends(userId),
        getIncomingRequests(userId),
        getOutgoingRequests(userId),
      ])

      setFriends(friendsData)
      setIncoming(incomingData)
      setOutgoing(outgoingData)
    } catch (error) {
      console.error("Error loading friends data:", error)
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
      toast.error("Ошибка при принятии запроса")
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
      toast.error("Ошибка при отклонении запроса")
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
      toast.error("Ошибка при удалении")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="friends" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Друзья</span>
          {friends.length > 0 && (
            <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {friends.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="incoming" className="gap-2">
          <Inbox className="h-4 w-4" />
          <span className="hidden sm:inline">Входящие</span>
          {incoming.length > 0 && (
            <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {incoming.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing" className="gap-2">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Исходящие</span>
          {outgoing.length > 0 && (
            <span className="ml-1 text-xs bg-muted-foreground/30 px-2 py-0.5 rounded-full">
              {outgoing.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Friends Tab */}
      <TabsContent value="friends" className="space-y-3">
        {friends.length === 0 ? (
          <Card className="p-12 text-center dark:bg-[#181818]">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Нет друзей</h3>
            <p className="text-sm text-muted-foreground">
              Добавляйте пользователей в друзья, чтобы общаться с ними
            </p>
          </Card>
        ) : (
          friends.map((friendship) => {
            const friend = friendship.friend
            return (
              <Card
                key={friendship.id}
                className="p-4 hover:shadow-md transition-all dark:bg-[#181818]"
              >
                <div className="flex items-center gap-4">
                  <Link href={`/profile/${friend.username}`}>
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-primary/50 transition-all">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>
                          {friend.display_name?.[0]?.toUpperCase() || friend.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineIndicator userId={friend.id} className="absolute -bottom-1 -right-1" />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${friend.username}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors truncate">
                        {friend.display_name || friend.username}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Друзья с{" "}
                      {formatDistanceToNow(new Date(friendship.accepted_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/messages/${friend.username}`}>Написать</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(friendship.id, true)}
                      disabled={actionLoading === friendship.id}
                    >
                      {actionLoading === friendship.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Удалить"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </TabsContent>

      {/* Incoming Requests Tab */}
      <TabsContent value="incoming" className="space-y-3">
        {incoming.length === 0 ? (
          <Card className="p-12 text-center dark:bg-[#181818]">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Нет запросов</h3>
            <p className="text-sm text-muted-foreground">
              Входящие запросы в друзья появятся здесь
            </p>
          </Card>
        ) : (
          incoming.map((request) => {
            const requester = request.requester
            return (
              <Card
                key={request.id}
                className="p-4 hover:shadow-md transition-all dark:bg-[#181818]"
              >
                <div className="flex items-center gap-4">
                  <Link href={`/profile/${requester.username}`}>
                    <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-primary/50 transition-all">
                      <AvatarImage src={requester.avatar_url || undefined} />
                      <AvatarFallback>
                        {requester.display_name?.[0]?.toUpperCase() ||
                          requester.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${requester.username}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors truncate">
                        {requester.display_name || requester.username}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">@{requester.username}</p>
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
          })
        )}
      </TabsContent>

      {/* Outgoing Requests Tab */}
      <TabsContent value="outgoing" className="space-y-3">
        {outgoing.length === 0 ? (
          <Card className="p-12 text-center dark:bg-[#181818]">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Send className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Нет исходящих запросов</h3>
            <p className="text-sm text-muted-foreground">
              Отправленные запросы появятся здесь
            </p>
          </Card>
        ) : (
          outgoing.map((request) => {
            const friend = request.friend
            return (
              <Card
                key={request.id}
                className="p-4 hover:shadow-md transition-all dark:bg-[#181818]"
              >
                <div className="flex items-center gap-4">
                  <Link href={`/profile/${friend.username}`}>
                    <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-primary/50 transition-all">
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {friend.display_name?.[0]?.toUpperCase() || friend.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${friend.username}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors truncate">
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
          })
        )}
      </TabsContent>
    </Tabs>
  )
}
