"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Image as ImageIcon, Mic, Loader2, ExternalLink, Eye } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/lib/api/messages"
import { createClient } from "@/lib/supabase/client"
import { areFriends } from "@/lib/api/friends"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ImageUploader } from "@/components/media/image-uploader"
import { VoiceRecorder } from "@/components/media/voice-recorder"
import { OnlineIndicator } from "@/components/presence/online-indicator"
import { TypingIndicator, useTypingIndicator } from "./typing-indicator"
import { AudioPlayerCompact } from "@/components/media/audio-player-compact"

// Функция для удаления markdown синтаксиса
function stripMarkdown(text: string): string {
  return text
    // Убираем заголовки
    .replace(/^#{1,6}\s+/gm, '')
    // Убираем жирный текст
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // Убираем курсив
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Убираем зачеркнутый текст
    .replace(/~~([^~]+)~~/g, '$1')
    // Убираем код
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    // Убираем ссылки, оставляем только текст
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Убираем изображения
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // Убираем списки
    .replace(/^[\*\-\+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Убираем цитаты
    .replace(/^>\s+/gm, '')
    // Убираем горизонтальные линии
    .replace(/^[\-\*\_]{3,}$/gm, '')
    // Убираем лишние пробелы и переносы
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface ChatWindowProps {
  currentUserId: string
  otherUser: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  embedded?: boolean // Если true, не показывать кнопку "Назад" и использовать другой layout
  onClose?: () => void // Callback для закрытия (используется на мобильных)
}

export function ChatWindow({ currentUserId, otherUser, embedded = false, onClose }: ChatWindowProps) {
  const router = useRouter()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { broadcastTyping } = useTypingIndicator(conversationId, currentUserId)

  useEffect(() => {
    initChat()
  }, [currentUserId, otherUser.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time подписка на новые сообщения
  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Загружаем полные данные сообщения с профилем отправителя
          const { data: fullMessage } = await supabase
            .from("direct_messages")
            .select(`
              *,
              sender:sender_id (id, username, display_name, avatar_url),
              shared_post:shared_post_id (
                id, 
                title, 
                content,
                views
              )
            `)
            .eq("id", newMessage.id)
            .single()

          if (fullMessage) {
            // Добавляем новое сообщение БЕЗ перезагрузки всех
            setMessages(prev => [...prev, fullMessage])

            // Автоматически пометить как прочитанное если это не наше сообщение
            if (newMessage.receiver_id === currentUserId) {
              await markMessagesAsRead(conversationId, currentUserId)
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as any
          
          // Обновляем сообщение в списке
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id 
                ? { ...msg, ...updatedMessage } 
                : msg
            )
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const deletedMessage = payload.old as any
          
          // Удаляем сообщение из списка
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  async function initChat() {
    setLoading(true)
    try {
      // Проверка дружбы
      const friendStatus = await areFriends(currentUserId, otherUser.id)
      setIsFriend(friendStatus)

      if (!friendStatus) {
        toast.error("Вы можете писать только друзьям")
        router.push("/friends")
        return
      }

      // Получить или создать беседу
      const convId = await getOrCreateConversation(currentUserId, otherUser.id)
      setConversationId(convId)

      // Загрузить сообщения
      const msgs = await getMessages(convId)
      setMessages(msgs)

      // Пометить как прочитанные
      await markMessagesAsRead(convId, currentUserId)
    } catch (error) {
      console.error("Error initializing chat:", error)
      toast.error("Ошибка загрузки чата")
    } finally {
      setLoading(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function handleSend() {
    if (!conversationId) return
    if (!content.trim() && mediaUrls.length === 0 && !audioUrl) {
      toast.error("Сообщение не может быть пустым")
      return
    }

    setSending(true)
    try {
      await sendMessage(conversationId, otherUser.id, content.trim(), mediaUrls, audioUrl || undefined)

      // Очистить форму
      setContent("")
      setMediaUrls([])
      setAudioUrl(null)
      setShowImageUploader(false)
      setShowVoiceRecorder(false)

      // Перезагрузить сообщения
      const msgs = await getMessages(conversationId)
      setMessages(msgs)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Ошибка отправки сообщения")
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    )
  }

  if (!isFriend) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-col w-full bg-background dark:bg-[#181818]",
      embedded ? "h-full" : "h-full"
    )}>
      {/* Header */}
      <div className="px-4 py-3 bg-card dark:bg-[#1a1a1a] border-b border-border dark:border-[#252525]">
        <div className="flex items-center justify-between gap-3">
          {(!embedded || (embedded && onClose)) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (embedded && onClose) {
                  onClose()
                } else {
                  router.push("/messages")
                }
              }}
              className={cn("shrink-0", embedded && onClose && "md:hidden")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9 ring-1 ring-border dark:ring-[#2a2a2a]">
                <AvatarImage src={otherUser.avatar_url || undefined} />
                <AvatarFallback className="bg-muted dark:bg-[#252525] text-foreground dark:text-white text-sm font-medium">
                  {otherUser.display_name?.[0]?.toUpperCase() || otherUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <OnlineIndicator userId={otherUser.id} className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-[15px] truncate hover:underline text-foreground dark:text-white">
                {otherUser.display_name || otherUser.username}
              </h2>
              <p className="text-xs text-muted-foreground dark:text-gray-500 truncate">@{otherUser.username}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-background dark:bg-[#181818]">
        <TypingIndicator
          conversationId={conversationId || ""}
          currentUserId={currentUserId}
          otherUserName={otherUser.display_name || otherUser.username}
          className="px-4"
        />
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-muted dark:bg-[#252525] flex items-center justify-center mb-3">
              <Send className="h-7 w-7 text-muted-foreground dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-foreground dark:text-white mb-1">Начните беседу</p>
            <p className="text-xs text-muted-foreground dark:text-gray-500">
              Отправьте первое сообщение
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId
              
              // Определяем, нужно ли показывать время для этого сообщения
              const shouldShowTime = (() => {
                const messageDate = new Date(message.created_at)
                const now = new Date()
                const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60))
                
                // Если меньше часа, не показываем
                if (diffInMinutes < 60) return false
                
                // Показываем время, если это последнее сообщение или между этим и следующим прошло больше часа
                if (index === messages.length - 1) return true
                
                const nextMessage = messages[index + 1]
                const nextMessageDate = new Date(nextMessage.created_at)
                const diffBetweenMessages = Math.floor((nextMessageDate.getTime() - messageDate.getTime()) / (1000 * 60))
                
                return diffBetweenMessages >= 60
              })()
              
              return (
                <div
                  key={message.id}
                  className={cn("flex gap-2 items-start", isOwn && "flex-row-reverse")}
                >
                  <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border dark:ring-[#2a2a2a] mt-0.5">
                    <AvatarImage src={message.sender.avatar_url || undefined} />
                    <AvatarFallback className="text-[11px] bg-muted dark:bg-[#252525] text-foreground dark:text-white font-medium">
                      {message.sender.display_name?.[0]?.toUpperCase() ||
                        message.sender.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn("flex flex-col gap-1 max-w-[70%] md:max-w-[60%]", isOwn && "items-end")}>
                    {/* Media Images */}
                    {message.media_urls && message.media_urls.length > 0 && (
                      <div className={cn(
                        "grid gap-1 w-full overflow-hidden rounded-lg border border-border dark:border-[#2a2a2a]", 
                        message.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"
                      )}>
                        {message.media_urls.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt=""
                            className="max-h-60 w-full object-cover cursor-pointer"
                          />
                        ))}
                      </div>
                    )}

                    {/* Audio */}
                    {message.audio_url && (
                      <div className="w-64">
                        <AudioPlayerCompact url={message.audio_url} />
                      </div>
                    )}

                    {/* Text/Shared Post Bubble */}
                    {(message.content || message.shared_post_id) && (
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 w-fit",
                          isOwn
                            ? "bg-gray-200 text-gray-900 dark:bg-[#2a2a2a] dark:text-white"
                            : "bg-gray-50 text-gray-900 dark:bg-[#202020] dark:text-white border border-gray-200 dark:border-[#2a2a2a]"
                        )}
                      >
                        {/* Shared Post */}
                        {message.shared_post_id && message.shared_post && (
                          <Link
                            href={`/post/${message.shared_post_id}`}
                            className="block mb-2 p-3.5 rounded-xl border bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors duration-200 group"
                          >
                            <div className="flex items-start gap-3">
                              {/* Иконка */}
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {/* Бейдж */}
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
                                    📄 Пост
                                  </span>
                                </div>
                                
                                {/* Заголовок */}
                                <h4 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 text-gray-900 dark:text-white">
                                  {message.shared_post.title}
                                </h4>
                                
                                {/* Превью контента */}
                                {message.shared_post.content && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                    {stripMarkdown(message.shared_post.content).substring(0, 150)}
                                    {stripMarkdown(message.shared_post.content).length > 150 && "..."}
                                  </p>
                                )}
                                
                                {/* Мини-статистика */}
                                {message.shared_post.views > 0 && (
                                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      <span>{message.shared_post.views}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        )}

                        {/* Text Content */}
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                    )}

                    {shouldShowTime && (
                      <span className="text-[11px] text-muted-foreground dark:text-gray-500">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-card dark:bg-[#1a1a1a] border-t border-border dark:border-[#252525]">
        {/* Media Preview */}
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {mediaUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg border border-border dark:border-[#2a2a2a]" />
                <button
                  type="button"
                  onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Audio Preview */}
        {audioUrl && (
          <div className="mb-3 bg-gray-50 dark:bg-[#202020] rounded-lg flex items-center gap-3 border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            <AudioPlayerCompact url={audioUrl} />
            <button
              type="button"
              onClick={() => setAudioUrl(null)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Удалить
            </button>
          </div>
        )}

        {/* Media Uploaders */}
        {showImageUploader && (
          <div className="mb-3">
            <ImageUploader
              onUpload={(urls) => {
                setMediaUrls([...mediaUrls, ...urls])
                setShowImageUploader(false)
              }}
            />
          </div>
        )}

        {showVoiceRecorder && (
          <div className="mb-3">
            <VoiceRecorder
              onUpload={(url) => {
                setAudioUrl(url)
                setShowVoiceRecorder(false)
              }}
            />
          </div>
        )}

        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowImageUploader(!showImageUploader)}
            disabled={sending}
            className="h-9 w-9 shrink-0"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            disabled={sending}
            className="h-9 w-9 shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              broadcastTyping()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение..."
            rows={1}
            disabled={sending}
            style={{
              outline: 'none',
              boxShadow: 'none',
              border: 'none',
            }}
            className="flex-1 resize-none bg-gray-50 dark:bg-[#2a2a2a] rounded-2xl px-4 py-2.5 min-h-[40px] max-h-[120px] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white text-[15px] focus:bg-gray-100 dark:focus:bg-[#333333] transition-colors"
          />

          <Button 
            onClick={handleSend} 
            disabled={sending || (!content.trim() && mediaUrls.length === 0 && !audioUrl)} 
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
