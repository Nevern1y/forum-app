"use client"

import { useState, useEffect, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  id?: string
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  id
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<Array<{ username: string; display_name: string | null }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const match = textBeforeCursor.match(/@(\w*)$/)

    if (match) {
      const query = match[1]
      setMentionQuery(query)
      
      if (query.length >= 1) {
        searchUsers(query)
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }, [value])

  const searchUsers = async (query: string) => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name")
      .ilike("username", `${query}%`)
      .limit(5)

    if (data && data.length > 0) {
      setSuggestions(data)
      setShowSuggestions(true)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  const insertMention = (username: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const textAfterCursor = value.substring(cursorPos)
    
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    const newText = 
      textBeforeCursor.substring(0, lastAtIndex) + 
      `@${username} ` + 
      textAfterCursor

    onChange(newText)
    setShowSuggestions(false)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = lastAtIndex + username.length + 2
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault()
      insertMention(suggestions[selectedIndex].username)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-1 p-2 shadow-lg max-w-xs w-full">
          <div className="space-y-1">
            {suggestions.map((user, index) => (
              <button
                key={user.username}
                onClick={() => insertMention(user.username)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  index === selectedIndex
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <div className="font-medium">@{user.username}</div>
                {user.display_name && (
                  <div className="text-xs opacity-80">{user.display_name}</div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Используйте ↑↓ для навигации, Enter для выбора
          </div>
        </Card>
      )}
    </div>
  )
}
