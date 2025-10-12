"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

interface TrendsPanelProps {
  popularTags?: Array<{
    id: string
    name: string
  }>
  topUsers?: Array<{
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    reputation: number
  }>
  trends?: Array<{
    id: string
    title: string
    count: number
  }>
}

export function TrendsPanel({ popularTags = [], topUsers = [], trends = [] }: TrendsPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="absolute right-4 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Тренды и статистика"
        >
          <TrendingUp className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Тренды и статистика</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Тренды недели</h3>
            <div className="space-y-2">
              {trends.length > 0 ? (
                trends.map((trend) => (
                  <div key={trend.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{trend.title}</p>
                      <p className="text-sm text-muted-foreground">{trend.count} упоминаний</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Пока нет трендов</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Популярные теги</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.length > 0 ? (
                popularTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="cursor-pointer hover:bg-secondary/70 transition-colors">
                    #{tag.name}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4">Пока нет тегов</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Топ пользователей</h3>
            <div className="space-y-3">
              {topUsers.length > 0 ? (
                topUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.reputation} репутации</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Пока нет пользователей</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
