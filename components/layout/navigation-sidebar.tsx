"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, User, MoreHorizontal, Settings, Bookmark, Flag, LogOut, List, MessageCircle, Users, Heart, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Badge } from "@/components/ui/badge"
import { getUnreadCount } from "@/lib/api/messages"
import { useMessagesRealtime } from "@/hooks/use-messages-realtime"

interface NavigationSidebarProps {
  username?: string
}

export function NavigationSidebar({ username }: NavigationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!userId) return
    loadUnreadMessagesCount()
  }, [userId])

  // Realtime подписка на сообщения
  useMessagesRealtime({
    userId: userId || undefined,
    enabled: !!userId,
    onNewMessage: () => {
      setUnreadMessagesCount((prev) => prev + 1)
    },
    onMessagesChange: () => {
      if (userId) loadUnreadMessagesCount()
    },
  })

  async function loadUser() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }
  }

  async function loadUnreadMessagesCount() {
    if (!userId) return
    try {
      const count = await getUnreadCount(userId)
      setUnreadMessagesCount(count)
    } catch (error) {
      console.error("Error loading unread messages count:", error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems = [
    { href: "/feed", icon: Home, label: "Главная" },
    { href: "/messages", icon: MessageCircle, label: "Сообщения" },
    { href: "/search", icon: Search, label: "Поиск" },
    { href: `/profile/${username}`, icon: User, label: "Профиль" },
  ]
  
  const forYouItems = [
    { href: "/following", icon: Users, label: "Подписки", description: "Посты от ваших подписок" },
    { href: "/liked-posts", icon: Heart, label: "Понравившееся", description: "Посты которым вы поставили лайк" },
    { href: "/bookmarks", icon: Bookmark, label: "Сохраненное", description: "Закладки для чтения потом" },
    { href: "/feed?sort=following", icon: List, label: "Ленты", description: "Различные варианты лент" },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-background z-40">
      <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isMessages = item.href === "/messages"
          const hasBadge = isMessages && unreadMessagesCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={item.label}
            >
              <item.icon className="h-6 w-6" />
              {hasBadge && (
                <>
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse border-2 border-background"
                  >
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </Badge>
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                </>
              )}
            </Link>
          )
        })}
        
        {/* Для вас - Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative group",
                (pathname === "/following" || pathname === "/liked-posts" || pathname === "/bookmarks")
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title="Для вас"
            >
              <Sparkles className="h-6 w-6" />
              {(pathname === "/following" || pathname === "/liked-posts" || pathname === "/bookmarks") && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-72 ml-2">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Для вас
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Персонализированные разделы</p>
            </div>
            
            {forYouItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link 
                  href={item.href} 
                  className={cn(
                    "cursor-pointer flex items-start gap-3 py-3",
                    pathname === item.href && "bg-accent"
                  )}
                >
                  <item.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="flex flex-col items-center gap-3">
        <NotificationBell />
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-12 h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Меню"
            >
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-64 ml-2">

          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="cursor-pointer flex items-center">
              <Settings className="h-4 w-4 mr-3" />
              Настройки
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/report-issue" className="cursor-pointer flex items-center">
              <Flag className="h-4 w-4 mr-3" />
              Сообщить о проблеме
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-3" />
            Выйти из аккаунта
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
