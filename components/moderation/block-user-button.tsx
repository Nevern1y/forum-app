"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Ban, UserX, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BlockUserButtonProps {
  userId: string
  username: string
  isBlocked?: boolean
}

export function BlockUserButton({ userId, username, isBlocked = false }: BlockUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggleBlock = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Необходима авторизация")
        return
      }

      if (isBlocked) {
        // Unblock user
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", userId)

        if (error) throw error

        toast.success(`Пользователь @${username} разблокирован`)
      } else {
        // Block user
        const { error } = await supabase
          .from("blocked_users")
          .insert({
            blocker_id: user.id,
            blocked_id: userId,
          })

        if (error) throw error

        toast.success(`Пользователь @${username} заблокирован`, {
          description: "Вы больше не будете видеть его посты и комментарии"
        })
      }

      router.refresh()
    } catch (error) {
      console.error("Error toggling block:", error)
      toast.error(`Ошибка при ${isBlocked ? "разблокировке" : "блокировке"} пользователя`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={isBlocked ? "outline" : "destructive"} size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isBlocked ? (
            <UserX className="h-4 w-4 mr-2" />
          ) : (
            <Ban className="h-4 w-4 mr-2" />
          )}
          {isBlocked ? "Разблокировать" : "Заблокировать"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? "Разблокировать" : "Заблокировать"} пользователя @{username}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked ? (
              <>Вы снова будете видеть посты и комментарии этого пользователя.</>
            ) : (
              <>
                Вы больше не будете видеть посты, комментарии и другой контент от @{username}.
                Пользователь не будет уведомлен о блокировке.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggleBlock} className={!isBlocked ? "bg-destructive hover:bg-destructive/90" : ""}>
            {isBlocked ? "Разблокировать" : "Заблокировать"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
