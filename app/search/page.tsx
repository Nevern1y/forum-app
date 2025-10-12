import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SearchForm } from "@/components/search/search-form"
import { SearchResults } from "@/components/search/search-results"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const query = params.q || ""
  const searchType = params.type || "posts"

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-background dark:bg-background">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header with gradient accent */}
          <div className="text-center space-y-3 pt-6 pb-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-2xl dark:opacity-0" />
              <h1 className="relative text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text dark:from-foreground dark:to-foreground">
                Поиск
              </h1>
            </div>
            <p className="text-muted-foreground/80 text-[15px] max-w-md mx-auto leading-relaxed">
              Найдите посты, комментарии и пользователей по всему форуму
            </p>
          </div>

          {/* Search Form Card */}
          <div className="bg-card/50 dark:bg-[#181818] backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <SearchForm initialQuery={query} initialType={searchType} />
          </div>

          {/* Results */}
          {query && (
            <div className="animate-fade-in">
              <SearchResults query={query} searchType={searchType} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
