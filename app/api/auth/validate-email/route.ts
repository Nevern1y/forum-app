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

    // Check if email is already registered (via public profiles table)
    const supabase = await createClient()
    
    // Note: We can't reliably check email uniqueness without admin access
    // Supabase will validate this during sign up, so we just do basic format check
    // and let the sign up process handle duplicate detection
    
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Email validation error:", error)
    return NextResponse.json(
      { error: "Произошла ошибка при проверке email" },
      { status: 500 }
    )
  }
}