"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, User, Users, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavigationProps {
  username?: string
}

export function MobileNavigation({ username }: MobileNavigationProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/feed", icon: Home, label: "Главная" },
    { href: "/search", icon: Search, label: "Поиск" },
    { href: "/messages", icon: MessageCircle, label: "Сообщения" },
    { href: `/profile/${username}`, icon: User, label: "Профиль" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground active:bg-accent"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
