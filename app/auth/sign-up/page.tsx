"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const validateField = useCallback(async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/auth/validate-${field}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error(`[Validation] API returned non-JSON response for ${field}`)
        // Validation endpoint doesn't exist, skip validation
        setFieldErrors(prev => ({ ...prev, [field]: "" }))
        return true
      }

      const data = await response.json()

      if (!response.ok) {
        setFieldErrors(prev => ({ ...prev, [field]: data.error || "Validation failed" }))
        return false
      }

      setFieldErrors(prev => ({ ...prev, [field]: "" }))
      return true
    } catch (error) {
      console.error(`Error validating ${field}:`, error)
      // Skip validation on error (API might not exist)
      setFieldErrors(prev => ({ ...prev, [field]: "" }))
      return true
    }
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    // Client-side validation
    if (password !== repeatPassword) {
      setError("Пароли не совпадают")
      setIsLoading(false)
      return
    }

    // Server-side validation
    const [usernameValid, emailValid] = await Promise.all([
      validateField("username", username),
      validateField("email", email),
    ])

    if (!usernameValid || !emailValid) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      })
      if (error) throw error

      router.push("/feed")
      router.refresh()
    } catch (error: unknown) {
      let errorMessage = "Произошла ошибка при регистрации. Попробуйте еще раз."

      if (error instanceof Error) {
        // Map specific Supabase auth errors to user-friendly messages
        switch (error.message) {
          case "User already registered":
            errorMessage = "Пользователь с таким email уже зарегистрирован"
            break
          case "Password should be at least 6 characters":
            errorMessage = "Пароль должен содержать минимум 6 символов"
            break
          case "Unable to validate email address: invalid format":
            errorMessage = "Неверный формат email"
            break
          case "Signup is disabled":
            errorMessage = "Регистрация временно недоступна"
            break
          default:
            // Log the actual error for debugging but don't expose it to user
            console.error("Sign-up error:", error.message)
            errorMessage = "Произошла ошибка при регистрации. Попробуйте еще раз."
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Регистрация</CardTitle>
            <CardDescription>Создайте новый аккаунт</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={(e) => validateField("username", e.target.value)}
                  />
                  {fieldErrors.username && (
                    <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{fieldErrors.username}</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => validateField("email", e.target.value)}
                  />
                  {fieldErrors.email && (
                    <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{fieldErrors.email}</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Повторите пароль</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Уже есть аккаунт?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Войти
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
