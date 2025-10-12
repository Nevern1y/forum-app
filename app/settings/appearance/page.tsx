import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AppearancePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Внешний вид</h1>
          <p className="text-muted-foreground mt-2">
            Настройте внешний вид приложения под ваши предпочтения
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Тема оформления</CardTitle>
            <CardDescription>
              Выберите тему, которая вам больше нравится
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Переключение темы</p>
              <p className="text-sm text-muted-foreground">
                Светлая, темная или системная тема
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
