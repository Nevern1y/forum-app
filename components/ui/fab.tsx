"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FabProps {
  href: string
  label?: string
  className?: string
}

export function Fab({ href, label = "Создать", className }: FabProps) {
  return (
    <Link href={href}>
      <Button
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50",
          "sm:h-auto sm:w-auto sm:px-6 sm:rounded-lg",
          "group",
          className
        )}
      >
        <Plus className="h-6 w-6 sm:mr-2" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sr-only sm:not-sr-only">{label}</span>
      </Button>
    </Link>
  )
}
