"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Lock, Eye, Users, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

interface PrivacySettingsProps {
  userId: string
  initialSettings?: {
    profile_visibility: "public" | "followers_only" | "private"
    show_activity: boolean
    show_followers: boolean
    allow_messages: boolean
    show_email: boolean
  }
}

export function PrivacySettings({ userId, initialSettings }: PrivacySettingsProps) {
  const [settings, setSettings] = useState(
    initialSettings || {
      profile_visibility: "public" as const,
      show_activity: true,
      show_followers: true,
      allow_messages: true,
      show_email: false,
    }
  )
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          profile_visibility: settings.profile_visibility,
          show_activity: settings.show_activity,
          show_followers: settings.show_followers,
          allow_messages: settings.allow_messages,
          show_email: settings.show_email,
        })
        .eq("id", userId)

      if (error) throw error

      toast.success("Настройки приватности обновлены")
      router.refresh()
    } catch (error) {
      console.error("Error saving privacy settings:", error)
      toast.error("Ошибка при сохранении настроек")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>Настройки приватности</CardTitle>
        </div>
        <CardDescription>Управляйте видимостью вашего профиля и активности</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Видимость профиля
          </Label>
          <div className="space-y-2 ml-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={settings.profile_visibility === "public"}
                onChange={(e) =>
                  setSettings({ ...settings, profile_visibility: e.target.value as any })
                }
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium">Публичный</p>
                <p className="text-sm text-muted-foreground">Все могут видеть ваш профиль</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="followers_only"
                checked={settings.profile_visibility === "followers_only"}
                onChange={(e) =>
                  setSettings({ ...settings, profile_visibility: e.target.value as any })
                }
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium">Только подписчики</p>
                <p className="text-sm text-muted-foreground">Только подписчики видят полный профиль</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={settings.profile_visibility === "private"}
                onChange={(e) =>
                  setSettings({ ...settings, profile_visibility: e.target.value as any })
                }
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium">Приватный</p>
                <p className="text-sm text-muted-foreground">Только вы видите свой профиль</p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          {/* Show Activity */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Показывать активность
              </Label>
              <p className="text-sm text-muted-foreground">
                Другие пользователи могут видеть ваши посты и комментарии
              </p>
            </div>
            <Switch
              checked={settings.show_activity}
              onCheckedChange={(checked) => setSettings({ ...settings, show_activity: checked })}
            />
          </div>

          {/* Show Followers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Показывать подписчиков и подписки
              </Label>
              <p className="text-sm text-muted-foreground">Другие видят ваших подписчиков</p>
            </div>
            <Switch
              checked={settings.show_followers}
              onCheckedChange={(checked) => setSettings({ ...settings, show_followers: checked })}
            />
          </div>

          {/* Allow Messages */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Разрешить личные сообщения</Label>
              <p className="text-sm text-muted-foreground">Другие могут отправлять вам сообщения</p>
            </div>
            <Switch
              checked={settings.allow_messages}
              onCheckedChange={(checked) => setSettings({ ...settings, allow_messages: checked })}
            />
          </div>

          {/* Show Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Показывать email</Label>
              <p className="text-sm text-muted-foreground">Email виден в вашем профиле</p>
            </div>
            <Switch
              checked={settings.show_email}
              onCheckedChange={(checked) => setSettings({ ...settings, show_email: checked })}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
