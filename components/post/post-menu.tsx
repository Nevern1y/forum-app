"use client"

import { useState } from "react"
import { MoreVertical, Share2, Flag, Edit, Trash2, Copy, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PostMenuProps {
  postId: string
  authorId: string
  currentUserId?: string
  postTitle: string
}

export function PostMenu({ postId, authorId, currentUserId, postTitle }: PostMenuProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const isAuthor = currentUserId === authorId

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${postId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Ссылка скопирована")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          url: url
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот пост?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)

    if (error) {
      toast.error("Ошибка при удалении поста")
    } else {
      toast.success("Пост удален")
      router.push("/feed")
      router.refresh()
    }
  }

  const handleReport = () => {
    toast.info("Функция жалобы будет доступна скоро")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Меню</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Скопировано!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Копировать ссылку
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Поделиться
        </DropdownMenuItem>

        {isAuthor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/post/${postId}/edit`)}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </>
        )}

        {!isAuthor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleReport}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Flag className="h-4 w-4 mr-2" />
              Пожаловаться
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
