import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { createClient } from "@/lib/supabase/server"
import { NavigationSidebar } from "@/components/layout/navigation-sidebar"
import { MobileNavigation } from "@/components/layout/mobile-navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { PresenceProvider } from "@/components/presence/presence-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Оптимизация загрузки шрифта
  preload: true,
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "Форум - Современная платформа для общения",
  description: "Обменивайтесь идеями и создавайте сообщество",
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Форум',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1f1f' }
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let username: string | undefined

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    username = profile?.username
  }

  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {user && (
            <>
              <PresenceProvider />
              <NavigationSidebar username={username} />
              <MobileNavigation username={username} />
            </>
          )}
          <div className={user ? "md:ml-20 pb-16 md:pb-0" : ""}>
            {children}
          </div>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
