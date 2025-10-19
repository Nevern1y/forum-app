"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SearchBarAdvanced } from "@/components/search/search-bar-advanced"
import { searchPosts, type SearchResult } from "@/lib/api/search"
import { PostCard } from "@/components/feed/post-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  FileText, 
  Tag, 
  Calendar,
  SlidersHorizontal,
  Loader2,
  TrendingUp
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Post } from "@/lib/types"

export default function SearchPageV2() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance')
  const [selectedTag, setSelectedTag] = useState<string | undefined>()

  useEffect(() => {
    if (query) {
      handleSearch(query)
    }
  }, [query, sortBy, selectedTag])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const data = await searchPosts({
        query: searchQuery,
        tag: selectedTag,
        sortBy,
        pageSize: 20,
        pageOffset: 0
      })
      setResults(data)
    } catch (error) {
      console.error('[Search] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Transform SearchResult to Post format
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
    post_tags: result.tags.map(tag => ({
      tags: { name: tag }
    })),
    user_reaction: null
  }))

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Поиск</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Найдите посты, людей и обсуждения
              </p>
            </div>
            
            {/* Filters Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Фильтры</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Фильтры поиска</SheetTitle>
                  <SheetDescription>
                    Уточните результаты поиска
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Sort by */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Сортировка</label>
                    <div className="space-y-2">
                      {[
                        { value: 'relevance', label: 'По релевантности', icon: TrendingUp },
                        { value: 'recent', label: 'Сначала новые', icon: Calendar },
                        { value: 'popular', label: 'Популярные', icon: TrendingUp }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value as typeof sortBy)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            sortBy === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <option.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedTag && (
                    <div>
                      <label className="text-sm font-medium">Активный тег</label>
                      <div className="mt-2">
                        <Badge 
                          variant="secondary" 
                          className="gap-2 cursor-pointer"
                          onClick={() => setSelectedTag(undefined)}
                        >
                          <Tag className="h-3 w-3" />
                          {selectedTag}
                          <span className="ml-1">×</span>
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search Bar */}
          <SearchBarAdvanced
            defaultValue={query}
            onSearch={setQuery}
            autoFocus
          />
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Поиск...</p>
              </div>
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ничего не найдено</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Попробуйте изменить запрос или убрать фильтры
                </p>
              </div>
            </div>
          ) : query && results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Найдено: <span className="font-medium text-foreground">{results.length}</span> {results.length === 1 ? 'результат' : 'результатов'}
                </p>
                {selectedTag && (
                  <Badge variant="secondary" className="gap-2">
                    <Tag className="h-3 w-3" />
                    {selectedTag}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {transformedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {results.length >= 20 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Пагинация скоро появится...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Начните поиск</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Введите запрос чтобы найти посты, темы и пользователей
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
