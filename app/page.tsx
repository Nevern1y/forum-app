import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sparkles, Users, MessageSquare, TrendingUp, Zap, Shield } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/feed")
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Живое общение",
      description: "Участвуйте в обсуждениях и делитесь своим опытом"
    },
    {
      icon: Users,
      title: "Сообщество",
      description: "Находите единомышленников и новых друзей"
    },
    {
      icon: TrendingUp,
      title: "Репутация",
      description: "Набирайте репутацию и получайте значки достижений"
    },
    {
      icon: Zap,
      title: "Быстрый ответ",
      description: "Мгновенные уведомления и отклики"
    },
    {
      icon: Shield,
      title: "Безопасность",
      description: "Защита данных и приватность"
    },
    {
      icon: Sparkles,
      title: "Современный UI",
      description: "Красивый и удобный интерфейс"
    }
  ]

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-5">
          <h1 className="text-[56px] sm:text-[64px] md:text-[72px] font-bold tracking-tight leading-none">
            Обсуждайте то,<br />что вас интересует
          </h1>
          
          <p className="text-lg text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
            Присоединяйтесь к сообществу и делитесь мыслями
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3 pt-2">
          <Button 
            asChild 
            size="lg" 
            className="h-11 px-8 rounded-full font-semibold text-[15px] hover:bg-foreground/90 transition-colors"
          >
            <Link href="/auth/sign-up">Создать аккаунт</Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="h-11 px-8 rounded-full font-semibold text-[15px] border-border hover:bg-muted/50"
          >
            <Link href="/auth/login">Войти</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-20 max-w-2xl mx-auto">
          {features.slice(0, 3).map((feature) => (
            <div key={feature.title} className="space-y-2.5 text-center">
              <div className="flex justify-center mb-1">
                <div className="p-2.5 rounded-full bg-foreground/5">
                  <feature.icon className="h-5 w-5 text-foreground/60" />
                </div>
              </div>
              <h3 className="font-semibold text-[15px]">{feature.title}</h3>
              <p className="text-[14px] text-muted-foreground/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
