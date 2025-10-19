"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Mic, Square, Trash2, Loader2, Play, Pause } from "lucide-react"
import { toast } from "sonner"

interface VoiceRecorderProps {
  onUpload: (url: string) => void
  existingAudio?: string
  bucket?: string
  onCancel?: () => void
}

export function VoiceRecorder({ onUpload, existingAudio, bucket = "post-images", onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudio || null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Проверка поддержки API при монтировании
    if (typeof window !== 'undefined') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      setIsSupported(supported && isSecure)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl && !existingAudio) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl, existingAudio])

  const startRecording = async () => {
    try {
      // Проверка поддержки API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Ваш браузер не поддерживает запись аудио", {
          description: "Попробуйте использовать современный браузер (Chrome, Firefox, Safari) или убедитесь что сайт открыт по HTTPS"
        })
        return
      }

      // Проверка безопасного контекста (HTTPS или localhost)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        toast.error("Запись аудио доступна только по HTTPS", {
          description: "Для записи голосовых сообщений необходимо безопасное соединение"
        })
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      toast.success("Запись началась")
    } catch (error: any) {
      console.error("Recording error:", error)
      
      // Детальные сообщения об ошибках
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error("Доступ к микрофону запрещен", {
          description: "Разрешите доступ к микрофону в настройках браузера"
        })
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error("Микрофон не найден", {
          description: "Подключите микрофон к устройству"
        })
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error("Микрофон уже используется", {
          description: "Закройте другие приложения, использующие микрофон"
        })
      } else {
        toast.error("Не удалось получить доступ к микрофону", {
          description: error.message || "Попробуйте перезагрузить страницу"
        })
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      toast.success("Запись остановлена")
    }
  }

  const uploadAudio = async () => {
    if (!audioBlob) return

    setUploading(true)
    const supabase = createClient()

    try {
      // Get current user for file path
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Необходима авторизация")

      const fileName = `voice-${Date.now()}.webm`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, audioBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "audio/webm"
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      console.log("Audio uploaded successfully:", publicUrl)
      onUpload(publicUrl)
      toast.success("Голосовое сообщение загружено")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Ошибка при загрузке аудио")
    } finally {
      setUploading(false)
    }
  }

  const deleteRecording = () => {
    if (audioUrl && !existingAudio) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioBlob(null)
    setDuration(0)
    toast.success("Запись удалена")
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Голосовое сообщение</span>
          </div>
          {isRecording && (
            <span className="text-sm text-destructive animate-pulse">
              ● {formatTime(duration)}
            </span>
          )}
        </div>

        {!audioUrl ? (
          <div className="space-y-2">
            {!isSupported && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                ⚠️ Запись аудио недоступна. Используйте HTTPS или современный браузер.
              </div>
            )}
            <div className="flex gap-2">
              {!isRecording ? (
                <>
                  <Button 
                    type="button" 
                    onClick={startRecording} 
                    className="flex-1"
                    disabled={!isSupported}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Начать запись
                  </Button>
                  {onCancel && (
                    <Button type="button" onClick={onCancel} variant="ghost">
                      Отмена
                    </Button>
                  )}
                </>
              ) : (
                <Button type="button" onClick={stopRecording} variant="destructive" className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Остановить
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={togglePlayback} variant="outline">
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-0 transition-all" />
              </div>
              
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex gap-2">
              {!existingAudio && audioBlob && (
                <Button type="button" onClick={uploadAudio} disabled={uploading} className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    "Использовать запись"
                  )}
                </Button>
              )}
              <Button type="button" onClick={deleteRecording} variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
