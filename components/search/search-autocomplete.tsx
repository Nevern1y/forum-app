"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchAutocompleteProps {
  initialQuery?: string
  searchType: string
  onSearch?: (query: string) => void
}

export function SearchAutocomplete({ initialQuery = "", searchType, onSearch }: SearchAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      try {
        if (searchType === "posts") {
          const { data } = await supabase
            .from("posts")
            .select("id, title")
            .or(`title.ilike.%${query}%`)
            .limit(5)
          setSuggestions(data || [])
        } else if (searchType === "users") {
          const { data } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(5)
          setSuggestions(data || [])
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query, searchType])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      handleSuggestionClick(suggestions[selectedIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    if (searchType === "posts") {
      router.push(`/post/${suggestion.id}`)
    } else if (searchType === "users") {
      router.push(`/profile/${suggestion.username}`)
    }
    setShowSuggestions(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    if (onSearch) {
      onSearch(query)
    }
    router.push(`/search?q=${encodeURIComponent(query)}&type=${searchType}`)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={searchType === "posts" ? "Поиск постов..." : "Поиск пользователей..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 p-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  index === selectedIndex
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {searchType === "posts" ? (
                  <div className="truncate">
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted" />
                    <div>
                      <div className="font-medium">
                        {suggestion.display_name || suggestion.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        @{suggestion.username}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
