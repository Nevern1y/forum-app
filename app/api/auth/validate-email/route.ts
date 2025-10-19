import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if email is already registered
    const supabase = await createClient()
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error checking email availability:", error)
      // Don't expose internal auth system errors
      return NextResponse.json(
        { error: "Не удалось проверить доступность email" },
        { status: 500 }
      )
    }

    // Check if email exists in users
    const emailExists = data.users.some(user => user.email === email)

    if (emailExists) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Email validation error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при проверке email" },
      { status: 500 }
    )
  }
}