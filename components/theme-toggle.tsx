"use client"

import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled className="h-12 w-12 rounded-xl" />
  }

  const themes = [
    { value: "light", label: "Светлая", icon: Sun },
    { value: "dark", label: "Темная", icon: Moon },
    { value: "system", label: "Системная", icon: Monitor },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-xl hover:bg-accent transition-all duration-200 relative group"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Выбрать тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 p-2">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-200 hover:bg-accent"
          >
            <div className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200 ${
              theme === t.value 
                ? "bg-primary/10 text-primary" 
                : "bg-muted/50 text-muted-foreground"
            }`}>
              <t.icon className="h-4 w-4" />
            </div>
            <span className={`flex-1 font-medium text-sm ${
              theme === t.value ? "text-foreground" : "text-muted-foreground"
            }`}>
              {t.label}
            </span>
            {theme === t.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
