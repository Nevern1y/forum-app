"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreatePostModal } from "./create-post-modal"

interface QuickPostCreateProps {
  userAvatar?: string | null
  username?: string
  displayName?: string | null
}

export function QuickPostCreate({ userAvatar, username, displayName }: QuickPostCreateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const initials = displayName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase() || "U"

  return (
    <>
      <div className="bg-gradient-to-r from-background via-background to-muted/10 border-b border-border/50 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Avatar className="relative h-11 w-11 ring-2 ring-border/30 group-hover:ring-primary/40 transition-all">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 text-left px-5 py-3 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 text-muted-foreground/70 hover:text-muted-foreground border border-border/30 hover:border-border/50 hover:shadow-sm group"
          >
            <span className="group-hover:translate-x-0.5 inline-block transition-transform">
              Что нового? ✨
            </span>
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground hover:shadow-lg transition-all duration-200 hover:from-primary/90 hover:to-primary relative overflow-hidden group"
          >
            <span className="relative z-10">Опубликовать</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </button>
        </div>
      </div>

      <CreatePostModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
