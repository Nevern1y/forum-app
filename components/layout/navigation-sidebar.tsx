"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Heart, User, MoreHorizontal, Palette, Settings, Bookmark, Flag, LogOut, List, MessageCircle, Users } from "lucide-react"
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

interface NavigationSidebarProps {
  username?: string
}

export function NavigationSidebar({ username }: NavigationSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const navItems = [
    { href: "/feed", icon: Home, label: "Главная" },
    { href: "/following", icon: Users, label: "Подписки" },
    { href: "/search", icon: Search, label: "Поиск" },
    { href: "/liked-posts", icon: Heart, label: "Понравившееся" },
    { href: `/profile/${username}`, icon: User, label: "Профиль" },
  ]

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 bg-background z-40">
      <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={item.label}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          )
        })}
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
            <Link href="/feed?sort=following" className="cursor-pointer flex items-center">
              <List className="h-4 w-4 mr-3" />
              Ленты
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/bookmarks" className="cursor-pointer flex items-center">
              <Bookmark className="h-4 w-4 mr-3" />
              Сохраненное
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/liked-posts" className="cursor-pointer flex items-center">
              <Heart className="h-4 w-4 mr-3" />
              Вы поставили нравится
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
