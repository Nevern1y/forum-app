"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Smile } from "lucide-react"

const EMOJI_REACTIONS = [
  { emoji: "👍", label: "Like", value: "thumbs_up" },
  { emoji: "❤️", label: "Love", value: "heart" },
  { emoji: "🎉", label: "Celebrate", value: "party" },
  { emoji: "😂", label: "Funny", value: "laugh" },
  { emoji: "🤔", label: "Thinking", value: "thinking" },
  { emoji: "😮", label: "Wow", value: "wow" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "🙏", label: "Thanks", value: "pray" },
  { emoji: "🔥", label: "Fire", value: "fire" },
  { emoji: "💯", label: "Perfect", value: "hundred" },
  { emoji: "👀", label: "Eyes", value: "eyes" },
  { emoji: "🚀", label: "Rocket", value: "rocket" },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  currentReaction?: string | null
}

export function EmojiPicker({ onSelect, currentReaction }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    onSelect(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`h-8 px-2 sm:px-3 transition-colors ${
            currentReaction ? "text-primary bg-primary/10" : ""
          }`}
        >
          <Smile className="h-4 w-4 mr-1" />
          <span className="text-xs hidden sm:inline">Реакция</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {EMOJI_REACTIONS.map((reaction) => (
            <button
              key={reaction.value}
              onClick={() => handleSelect(reaction.value)}
              className={`p-2 text-2xl rounded-md hover:bg-accent transition-colors ${
                currentReaction === reaction.value ? "bg-primary/10 ring-2 ring-primary" : ""
              }`}
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface EmojiReaction {
  emoji: string
  count: number
  hasReacted: boolean
}

interface EmojiReactionsDisplayProps {
  reactions: Record<string, { count: number; userReacted: boolean }>
  onReactionClick: (emoji: string) => void
}

export function EmojiReactionsDisplay({ reactions, onReactionClick }: EmojiReactionsDisplayProps) {
  const emojiMap = Object.fromEntries(
    EMOJI_REACTIONS.map(r => [r.value, r.emoji])
  )

  const sortedReactions = Object.entries(reactions)
    .filter(([_, data]) => data.count > 0)
    .sort(([_, a], [__, b]) => b.count - a.count)

  if (sortedReactions.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sortedReactions.map(([reactionType, data]) => (
        <Button
          key={reactionType}
          variant="outline"
          size="sm"
          onClick={() => onReactionClick(reactionType)}
          className={`h-7 px-2 gap-1 transition-all ${
            data.userReacted
              ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
              : "hover:bg-accent"
          }`}
        >
          <span className="text-base">{emojiMap[reactionType] || "❓"}</span>
          <span className="text-xs font-medium tabular-nums">{data.count}</span>
        </Button>
      ))}
    </div>
  )
}
