"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"

interface AudioPlayerCompactProps {
  url: string
  className?: string
}

const PLAYBACK_RATES = [1, 1.5, 2]

export function AudioPlayerCompact({ url, className }: AudioPlayerCompactProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleError = (e: Event) => {
      console.error("Audio playback error:", e)
      console.error("Audio URL:", url)
      console.error("Audio element:", audio)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [url])

  const togglePlayback = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!audioRef.current) return
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length
    const newRate = PLAYBACK_RATES[nextIndex]
    audioRef.current.playbackRate = newRate
    setPlaybackRate(newRate)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
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
    <div className={`flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-[#202020] border border-gray-200 dark:border-[#2a2a2a] ${className}`}>
      <audio ref={audioRef} src={url} />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => togglePlayback(e)}
        className="h-8 w-8 p-0 rounded-full shrink-0 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div 
          onClick={handleSeek}
          className="flex-1 h-1.5 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden cursor-pointer group relative"
        >
          <div
            className="h-full bg-gray-600 dark:bg-gray-500 transition-all duration-200 group-hover:bg-gray-700 dark:group-hover:bg-gray-400 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {isPlaying && (
              <div className="absolute inset-0 shimmer opacity-60" />
            )}
          </div>
        </div>
        
        <span className="text-xs text-gray-500 dark:text-gray-500 tabular-nums shrink-0 min-w-[32px]">
          {formatTime(duration)}
        </span>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={cyclePlaybackRate}
        className="h-6 min-w-[36px] px-1.5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white shrink-0"
        title="Скорость"
      >
        {playbackRate}x
      </Button>

      <Volume2 className="h-4 w-4 text-gray-500 dark:text-gray-500 shrink-0" />
    </div>
  )
}
