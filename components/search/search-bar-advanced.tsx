"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Clock, Hash, User, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getSearchSuggestions, getSearchHistory, saveSearchHistory, clearSearchHistory } from "@/lib/api/search"
import type { SearchSuggestion } from "@/lib/api/search"
import { cn } from "@/lib/utils"

interface SearchBarAdvancedProps {
  defaultValue?: string
  onSearch?: (query: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchBarAdvanced({
  defaultValue = "",
  onSearch,
  placeholder = "Поиск постов, тегов, пользователей...",
  autoFocus = false,
  className = ""
}: SearchBarAdvancedProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Load history on mount
  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const results = await getSearchSuggestions(query, 5)
        setSuggestions(results)
      } catch (error) {
        console.error("[SearchBar] Error fetching suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    saveSearchHistory(searchQuery)
    setHistory(getSearchHistory())
    setShowDropdown(false)

    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allItems = [...history, ...suggestions.map(s => s.suggestion)]

    if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && allItems[selectedIndex]) {
        handleSearch(allItems[selectedIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < allItems.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setHistory([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'tag':
        return <Hash className="h-4 w-4 text-blue-500" />
      case 'username':
        return <User className="h-4 w-4 text-green-500" />
      case 'post_title':
        return <TrendingUp className="h-4 w-4 text-orange-500" />
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />
    }
  }

  const showHistory = showDropdown && query.length === 0 && history.length > 0
  const showSuggestions = showDropdown && query.length >= 2 && suggestions.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      {/* Input */}
      <div className="relative group/input">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover/input:text-primary/70 transition-colors duration-300 pointer-events-none z-10" />
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10 h-11 text-[15px] border border-border hover:border-primary/30 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10 transition-all duration-300"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showHistory || showSuggestions) && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200"
        >
          {/* History */}
          {showHistory && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">Недавние поиски</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-6 text-xs px-2 hover:text-destructive"
                >
                  Очистить
                </Button>
              </div>
              <div>
                {history.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors",
                      selectedIndex === index && "bg-accent"
                    )}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <div>
              {query.length >= 2 && (
                <div className="px-4 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">
                    {loading ? "Загрузка..." : "Предложения"}
                  </span>
                </div>
              )}
              <div>
                {suggestions.map((item, index) => {
                  const absoluteIndex = history.length + index
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item.suggestion)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors group",
                        selectedIndex === absoluteIndex && "bg-accent"
                      )}
                    >
                      {getIcon(item.type)}
                      <span className="text-sm flex-1 truncate">{item.suggestion}</span>
                      {item.count > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                          {item.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
