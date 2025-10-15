"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, MapPin, Link as LinkIcon, Loader2, Camera } from "lucide-react"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location?: string | null
  website?: string | null
}

interface ProfileEditFormProps {
  profile: Profile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [location, setLocation] = useState(profile.location || "")
  const [website, setWebsite] = useState(profile.website || "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимальный размер: 2MB")
      return
    }

    setIsUploadingAvatar(true)
    const supabase = createClient()

    try {
      // Upload avatar
      const fileExt = file.name.split(".").pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      toast.success("Аватар загружен")
    } catch (error) {
      console.error("Avatar upload error:", error)
      toast.error("Ошибка при загрузке аватара")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          location: location,
          website: website,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id)

      if (error) throw error

      toast.success("Профиль успешно обновлен!")
      router.refresh()
      setTimeout(() => {
        router.push(`/profile/${profile.username}`)
      }, 1000)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Произошла ошибка"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Редактировать профиль</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div className="relative group">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background ring-2 ring-primary/10">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl sm:text-4xl">
                  {displayName?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground text-center px-2">
              Нажмите на аватар, чтобы изменить (макс. 2MB)
            </p>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input id="username" value={profile.username} disabled className="bg-muted" />
            <p className="text-sm text-muted-foreground">Имя пользователя нельзя изменить</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Отображаемое имя</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите отображаемое имя"
              maxLength={50}
            />
            <p className="text-sm text-muted-foreground">{displayName.length}/50</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
              rows={4}
              maxLength={300}
            />
            <p className="text-sm text-muted-foreground">{bio.length}/300</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Местоположение
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Город, Страна"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Веб-сайт
            </Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isLoading || isUploadingAvatar} className="sm:min-w-[200px]">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/profile/${profile.username}`)}
              disabled={isLoading}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
