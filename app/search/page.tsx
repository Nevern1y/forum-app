"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchBarAdvanced } from "@/components/search/search-bar-advanced"
import { searchPosts, getSearchHistory, type SearchResult } from "@/lib/api/search"
import { PostCard } from "@/components/feed/post-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  TrendingUp, 
  Clock,
  Sparkles,
  Filter,
  Loader2,
  Flame,
  Tag,
  X,
  ArrowRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import type { Post } from "@/lib/types"

const trendingSearches = [
  "JavaScript",
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS"
]

const categories = [
  { icon: Flame, label: "Популярное", color: "text-orange-500", bgColor: "bg-orange-500/10 hover:bg-orange-500/20" },
  { icon: TrendingUp, label: "Trending", color: "text-blue-500", bgColor: "bg-blue-500/10 hover:bg-blue-500/20" },
  { icon: Sparkles, label: "Новое", color: "text-purple-500", bgColor: "bg-purple-500/10 hover:bg-purple-500/20" },
  { icon: Tag, label: "По тегам", color: "text-green-500", bgColor: "bg-green-500/10 hover:bg-green-500/20" },
]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance')
  const [history, setHistory] = useState<string[]>([])
  const [showResults, setShowResults] = useState(!!initialQuery)

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

  useEffect(() => {
    if (query) {
      handleSearch(query)
      setShowResults(true)
    } else {
      setShowResults(false)
      setResults([])
    }
  }, [query, sortBy])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const data = await searchPosts({
        query: searchQuery,
        sortBy,
        pageSize: 20,
      })
      setResults(data)
    } catch (error) {
      console.error('[Search] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  // Transform to Post format
  const transformedPosts: Post[] = results.map(result => ({
    id: result.id,
    title: result.title,
    content: result.content,
    author_id: result.author_id,
    views: result.views,
    likes: result.likes,
    dislikes: result.dislikes,
    comment_count: result.comment_count,
    is_pinned: false,
    media_urls: null,
    audio_url: null,
    created_at: result.created_at,
    updated_at: result.created_at,
    profiles: {
      id: result.author_id,
      username: result.author_username,
      display_name: result.author_display_name,
      avatar_url: result.author_avatar_url,
      reputation: 0,
      created_at: "",
      updated_at: ""
    },
    post_tags: result.tags.map(tag => ({ tags: { name: tag } })),
    user_reaction: null
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-8 pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Full-Text Search</span>
          </div>
          
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Найдите что угодно
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Мгновенный поиск по постам, пользователям и темам с умными подсказками
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBarAdvanced
              defaultValue={query}
              onSearch={setQuery}
              placeholder="Поиск постов, тегов, пользователей..."
              className="shadow-xl"
            />
          </div>

          {/* Sort & Filter */}
          {showResults && (
            <div className="flex items-center justify-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {sortBy === 'relevance' && 'По релевантности'}
                    {sortBy === 'recent' && 'Сначала новые'}
                    {sortBy === 'popular' && 'Популярные'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuLabel>Сортировка</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    По релевантности
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    <Clock className="h-4 w-4 mr-2" />
                    Сначала новые
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('popular')}>
                    <Flame className="h-4 w-4 mr-2" />
                    Популярные
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    router.push('/search')
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Очистить
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {!showResults ? (
          <div className="space-y-12 max-w-4xl mx-auto">
            {/* Categories */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Категории
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className={`group p-6 rounded-2xl border border-border ${category.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                  >
                    <category.icon className={`h-8 w-8 ${category.color} mb-3`} />
                    <p className="font-medium">{category.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Searches */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Популярные запросы
              </h2>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(term)}
                    className="group px-4 py-2 bg-muted hover:bg-primary/10 border border-border hover:border-primary/50 rounded-full transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="font-medium">{term}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {history.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Недавние поиски
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {history.slice(0, 6).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(term)}
                      className="group p-4 bg-card border border-border hover:border-primary/50 rounded-xl transition-all duration-200 flex items-center justify-between hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{term}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Ищем...</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
                  <p className="text-muted-foreground">
                    Попробуйте изменить запрос или использовать другие фильтры
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm font-medium">
                      {results.length} {results.length === 1 ? 'результат' : 'результатов'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      для запроса "<span className="font-medium text-foreground">{query}</span>"
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {transformedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
