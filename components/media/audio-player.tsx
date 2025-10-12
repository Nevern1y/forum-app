"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Gauge } from "lucide-react"

interface AudioPlayerProps {
  url: string
  className?: string
}

const PLAYBACK_RATES = [1, 1.5, 2]

export function AudioPlayer({ url, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length
    const newRate = PLAYBACK_RATES[nextIndex]
    audioRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return

    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const percentage = x / bounds.width
    audioRef.current.currentTime = percentage * duration
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className={`p-3 ${className}`}>
      <audio ref={audioRef} src={url} />
      
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayback}
          className="h-9 w-9 p-0 rounded-full hover:bg-primary hover:text-primary-foreground"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 space-y-1">
          <div
            onClick={handleSeek}
            className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer group relative"
          >
            <div
              className="h-full bg-primary transition-all group-hover:bg-primary/80 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {isPlaying && (
                <div className="absolute inset-0 shimmer" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={cyclePlaybackRate}
          className="h-8 min-w-[48px] px-2 text-xs font-medium hover:bg-primary/10"
          title="Скорость воспроизведения"
        >
          {playbackRate}x
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className="h-8 w-8 p-0"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}
