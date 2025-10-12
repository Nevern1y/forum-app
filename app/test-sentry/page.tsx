'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestSentryPage() {
  return (
    <div className="container mx-auto py-20 max-w-2xl">
      <Card className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Тест Sentry Мониторинга</h1>
        
        <p className="text-muted-foreground">
          Нажмите на кнопку ниже, чтобы создать тестовую ошибку. 
          Она автоматически отправится в Sentry Dashboard.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => {
              throw new Error("🎉 Sentry Test - всё работает отлично!")
            }}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            Создать тестовую ошибку
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            После клика проверьте{" "}
            <a 
              href="https://sentry.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Sentry Dashboard → Issues
            </a>
            <br />
            Ошибка появится через 10-30 секунд
          </p>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-3">Или протестируйте в консоли:</h3>
          <code className="block p-4 bg-muted rounded-lg text-sm">
            {`// Откройте консоль браузера (F12) и введите:`}
            <br />
            {`throw new Error("Sentry Console Test")`}
          </code>
        </div>

        <div className="pt-6 border-t space-y-2">
          <h3 className="font-semibold">✅ Что отслеживается автоматически:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>JavaScript ошибки</li>
            <li>Необработанные исключения</li>
            <li>Performance метрики</li>
            <li>Session Replay (действия пользователя)</li>
            <li>API ошибки</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
