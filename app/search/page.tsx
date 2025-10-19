"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchBarAdvanced } from "@/components/search/search-bar-advanced"
import { searchPosts, getSearchHistory, type SearchResult } from "@/lib/api/search"
import { PostCard } from "@/components/feed/post-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
  ArrowRight,
  FileText,
  Users,
  Hash,
  Calendar,
  Star,
  MessageSquare,
  Eye,
  ThumbsUp,
  SlidersHorizontal
} from "lucide-react"
import Link from "next/link"
import type { Post } from "@/lib/types"

const trendingSearches = [
  "JavaScript",
  "React", 
  "Next.js",
  "TypeScript",
  "Tailwind CSS"
]

const popularTags = [
  "JavaScript",
  "React",
  "Next.js",
  "TypeScript",
  "CSS",
  "Node.js",
  "Python",
  "Database"
]

export default function SearchPageV3() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'recent' | 'popular'>('relevance')
  const [activeTab, setActiveTab] = useState('posts')
  const [history, setHistory] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

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

  const hasQuery = query.trim().length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-3xl">
              <SearchBarAdvanced
                defaultValue={query}
                onSearch={setQuery}
                placeholder="Поиск постов, пользователей, тегов..."
                autoFocus={false}
              />
            </div>
            
            {hasQuery && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Фильтры</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    router.push('/search')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {!hasQuery ? (
          /* Landing State */
          <div className="space-y-12 max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center space-y-4 py-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-4">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Full-Text Search Engine</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Найдите всё что нужно
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Мгновенный поиск по всему контенту форума с умным ранжированием
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <FileText className="h-8 w-8 text-blue-500 mb-3" />
                <div className="text-2xl font-bold">{results.length}+</div>
                <div className="text-sm text-muted-foreground">Постов</div>
              </div>
              <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <Users className="h-8 w-8 text-green-500 mb-3" />
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm text-muted-foreground">Пользователей</div>
              </div>
              <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <Hash className="h-8 w-8 text-purple-500 mb-3" />
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-muted-foreground">Тегов</div>
              </div>
              <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <TrendingUp className="h-8 w-8 text-orange-500 mb-3" />
                <div className="text-2xl font-bold">10x</div>
                <div className="text-sm text-muted-foreground">Быстрее</div>
              </div>
            </div>

            {/* Trending */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Популярные запросы</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(term)}
                    className="group px-4 py-2 bg-muted hover:bg-primary/10 border hover:border-primary/50 rounded-lg transition-all flex items-center gap-2"
                  >
                    <span className="font-medium">{term}</span>
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Hash className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Популярные теги</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSearch(`#${tag}`)}
                    className="px-3 py-1.5 text-sm bg-muted hover:bg-accent border rounded-md transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Недавние поиски</h2>
                </div>
                <div className="space-y-2">
                  {history.slice(0, 5).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(term)}
                      className="group w-full p-3 bg-card border hover:border-primary/50 rounded-lg transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
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
          /* Search Results */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            {showFilters && (
              <aside className="lg:col-span-1 space-y-6">
                <div className="sticky top-24">
                  <div className="p-4 border rounded-lg bg-card space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Фильтры
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setSortBy('relevance')}>
                        Сбросить
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Сортировка</label>
                      <div className="space-y-1">
                        <Button
                          variant={sortBy === 'relevance' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSortBy('relevance')}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          По релевантности
                        </Button>
                        <Button
                          variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSortBy('recent')}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Сначала новые
                        </Button>
                        <Button
                          variant={sortBy === 'popular' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSortBy('popular')}
                        >
                          <Flame className="h-4 w-4 mr-2" />
                          Популярные
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Быстрые фильтры</label>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          С ответами
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          Без ответов
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                          Популярные
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <main className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="posts" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Посты
                      {results.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{results.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="users" className="gap-2">
                      <Users className="h-4 w-4" />
                      Пользователи
                    </TabsTrigger>
                    <TabsTrigger value="tags" className="gap-2">
                      <Hash className="h-4 w-4" />
                      Теги
                    </TabsTrigger>
                  </TabsList>

                  {!showFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(true)}
                      className="gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Фильтры
                    </Button>
                  )}
                </div>

                <TabsContent value="posts" className="space-y-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-center">
                        <p className="font-medium">Ищем...</p>
                        <p className="text-sm text-muted-foreground">Full-Text Search работает</p>
                      </div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
                        <p className="text-muted-foreground">
                          Попробуйте изменить запрос или фильтры
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQuery('')
                          router.push('/search')
                        }}
                      >
                        Начать заново
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <Search className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          Найдено <strong>{results.length}</strong> {results.length === 1 ? 'результат' : 'результатов'} для <strong>"{query}"</strong>
                        </span>
                      </div>

                      <div className="space-y-4">
                        {transformedPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>

                      {results.length >= 20 && (
                        <div className="text-center py-4">
                          <Button variant="outline" disabled>
                            Загрузить ещё
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Поиск пользователей скоро...</p>
                  </div>
                </TabsContent>

                <TabsContent value="tags" className="space-y-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Поиск по тегам скоро...</p>
                  </div>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
