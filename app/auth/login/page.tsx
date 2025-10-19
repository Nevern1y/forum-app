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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const router = useRouter()

  const validateEmail = useCallback(async (emailValue: string) => {
    if (!emailValue) {
      setFieldErrors(prev => ({ ...prev, email: "Email is required" }))
      return false
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailValue)) {
      setFieldErrors(prev => ({ ...prev, email: "Invalid email format" }))
      return false
    }

    setFieldErrors(prev => ({ ...prev, email: "" }))
    return true
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    // Validate email format
    if (!validateEmail(email)) {
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/feed")
      router.refresh()
    } catch (error: unknown) {
      let errorMessage = "Произошла ошибка при входе. Попробуйте еще раз."

      if (error instanceof Error) {
        // Map specific Supabase auth errors to user-friendly messages
        switch (error.message) {
          case "Invalid login credentials":
            errorMessage = "Неверный email или пароль"
            break
          case "Email not confirmed":
            errorMessage = "Пожалуйста, подтвердите ваш email перед входом"
            break
          case "Too many requests":
            errorMessage = "Слишком много попыток. Попробуйте позже"
            break
          default:
            // Log the actual error for debugging but don't expose it to user
            console.error("Login error:", error.message)
            errorMessage = "Произошла ошибка при входе. Попробуйте еще раз."
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
            <CardTitle className="text-2xl">Вход</CardTitle>
            <CardDescription>Введите email и пароль для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => validateEmail(e.target.value)}
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
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Нет аккаунта?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4">
                  Зарегистрироваться
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
