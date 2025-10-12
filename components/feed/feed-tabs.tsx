"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Clock, TrendingUp, MessageCircle } from "lucide-react"

interface FeedTabsProps {
  currentSort: string
}

export function FeedTabs({ currentSort }: FeedTabsProps) {
  const router = useRouter()

  const handleTabChange = (value: string) => {
    router.push(`/feed?sort=${value}`)
  }

  return (
    <Tabs value={currentSort} onValueChange={handleTabChange}>
      <TabsList className="w-full sm:w-auto grid grid-cols-3">
        <TabsTrigger value="new" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Новые</span>
        </TabsTrigger>
        <TabsTrigger value="popular" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>Популярные</span>
        </TabsTrigger>
        <TabsTrigger value="discussed" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>Обсуждаемые</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
