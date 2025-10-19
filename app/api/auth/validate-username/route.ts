import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    // Basic validation
    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long" },
        { status: 400 }
      )
    }

    if (username.length > 30) {
      return NextResponse.json(
        { error: "Username must be no more than 30 characters long" },
        { status: 400 }
      )
    }

    // Check for valid characters (alphanumeric, underscore, dash)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and dashes" },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking username availability:", error)
      // Don't expose internal database errors
      return NextResponse.json(
        { error: "Не удалось проверить доступность имени пользователя" },
        { status: 500 }
      )
    }

    if (data) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Username validation error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при проверке имени пользователя" },
      { status: 500 }
    )
  }
}