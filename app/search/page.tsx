"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchBarAdvanced } from "@/components/search/search-bar-advanced"
import { searchPosts, type SearchResult } from "@/lib/api/search"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Loader2,
  ThumbsUp,
  MessageSquare,
  Eye,
  SortAsc
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const trendingTags = [
  "JavaScript", "React", "TypeScript", "CSS", "Next.js", "Python"
]

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance')

  useEffect(() => {
    if (query) {
      handleSearch(query)
    } else {
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

  const hasQuery = query.trim().length > 0

  return (
    <div className="min-h-screen bg-background">
      {!hasQuery ? (
        /* Landing - Google-style centered search */
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-full max-w-2xl space-y-8">
            {/* Logo / Title */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-primary">
                <Search className="h-10 w-10" />
                <h1 className="text-5xl font-bold">Поиск</h1>
              </div>
              <p className="text-muted-foreground">
                Найдите всё что нужно на форуме
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <SearchBarAdvanced
                defaultValue={query}
                onSearch={setQuery}
                placeholder="Поиск постов, пользователей, тегов..."
                autoFocus={true}
              />
            </div>

            {/* Trending Tags */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Популярные темы
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleQuickSearch(tag)}
                    className="px-4 py-2 text-sm bg-muted hover:bg-accent border rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Results Page */
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* Header with Search */}
          <div className="mb-6 space-y-4">
            <SearchBarAdvanced
              defaultValue={query}
              onSearch={setQuery}
              placeholder="Поиск..."
              autoFocus={false}
            />

            {/* Quick Filters Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Сортировка:
                </span>
              </div>
              
              <Button
                variant={sortBy === 'relevance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('relevance')}
                className="whitespace-nowrap"
              >
                Релевантность
              </Button>
              
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
                className="whitespace-nowrap"
              >
                Новые
              </Button>
              
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('popular')}
                className="whitespace-nowrap"
              >
                Популярные
              </Button>
            </div>
          </div>

          {/* Results Info */}
          {!loading && results.length > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              Найдено {results.length} {results.length === 1 ? 'результат' : 'результатов'}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Поиск...</p>
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">Ничего не найдено</h3>
              <p className="text-sm text-muted-foreground">
                Попробуйте другой запрос
              </p>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result) => (
                <Link 
                  key={result.id} 
                  href={`/post/${result.id}`}
                  className="block group"
                >
                  <article className="p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
                    {/* Author Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={result.author_avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {result.author_username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {result.author_display_name || result.author_username}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(result.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
                      {result.title}
                    </h2>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {result.content}
                    </p>

                    {/* Tags */}
                    {result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {result.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {result.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {result.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {result.comment_count}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
