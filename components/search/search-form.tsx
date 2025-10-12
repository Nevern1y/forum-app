"use client"

import type React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchAutocomplete } from "./search-autocomplete"

interface SearchFormProps {
  initialQuery: string
  initialType: string
}

export function SearchForm({ initialQuery, initialType }: SearchFormProps) {
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState(initialType)
  const router = useRouter()

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  return (
    <div className="space-y-5">
      <SearchAutocomplete
        initialQuery={initialQuery}
        searchType={searchType}
        onSearch={handleSearch}
      />

      <Tabs value={searchType} onValueChange={setSearchType} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger 
            value="posts" 
            className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            📝 Посты
          </TabsTrigger>
          <TabsTrigger 
            value="comments" 
            className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            💬 Комментарии
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="rounded-lg font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            👤 Пользователи
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
