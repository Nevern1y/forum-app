"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Heart, User, Users, MessageCircle, Palette, Sun, Moon, Monitor, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileNavigationProps {
  username?: string
}

export function MobileNavigation({ username }: MobileNavigationProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: "/feed", icon: Home, label: "Главная" },
    { href: "/search", icon: Search, label: "Поиск" },
    { href: "/messages", icon: MessageCircle, label: "Сообщения" },
    { href: `/profile/${username}`, icon: User, label: "Профиль" },
  ]

  const themes = [
    { value: "light", label: "Светлая", icon: Sun },
    { value: "dark", label: "Темная", icon: Moon },
    { value: "system", label: "Системная", icon: Monitor },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all rounded-lg active:scale-95",
                isActive 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground active:bg-accent/50"
              )}
            >
              <item.icon className="h-7 w-7" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all rounded-lg text-muted-foreground active:bg-accent/50 active:scale-95"
            >
              {mounted ? (
                <>
                  <Sun className="h-7 w-7 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={2} />
                  <Moon className="absolute h-7 w-7 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={2} />
                </>
              ) : (
                <Palette className="h-7 w-7" strokeWidth={2} />
              )}
              <span className="text-[10px] sm:text-xs font-medium">Тема</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48 p-2 mb-2 mr-2">
            {themes.map((t) => (
              <DropdownMenuItem
                key={t.value}
                onClick={() => setTheme(t.value)}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-accent active:scale-95"
              >
                <div className={`flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200 ${
                  theme === t.value 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted/50 text-muted-foreground"
                }`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <span className={`flex-1 font-medium text-base ${
                  theme === t.value ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {t.label}
                </span>
                {theme === t.value && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
