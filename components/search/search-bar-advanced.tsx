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
          className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ isolation: 'isolate' }}
        >
          {/* History */}
          {showHistory && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2 mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Недавние поиски</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-7 text-xs px-2 hover:bg-destructive/10 hover:text-destructive rounded-md"
                >
                  Очистить
                </Button>
              </div>
              <div className="space-y-0.5 px-2">
                {history.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 group",
                      selectedIndex === index 
                        ? "bg-primary/10 text-foreground" 
                        : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm flex-1 truncate font-medium">{item}</span>
                    <Search className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {showHistory && showSuggestions && (
            <div className="border-t border-border/50 my-1" />
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <div className="py-2">
              {query.length >= 2 && (
                <div className="flex items-center gap-2 px-4 py-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    {loading ? "Загрузка..." : "Предложения"}
                  </span>
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {suggestions.map((item, index) => {
                  const absoluteIndex = history.length + index
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item.suggestion)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 group",
                        selectedIndex === absoluteIndex 
                          ? "bg-primary/10 text-foreground" 
                          : "hover:bg-accent/50 text-foreground"
                      )}
                    >
                      <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-muted transition-colors">
                        {getIcon(item.type)}
                      </div>
                      <span className="text-sm flex-1 truncate font-medium">{item.suggestion}</span>
                      {item.count > 0 && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md tabular-nums">
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
