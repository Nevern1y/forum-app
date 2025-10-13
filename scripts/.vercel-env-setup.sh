#!/bin/bash
# Скрипт для быстрой настройки переменных окружения в Vercel
# Использование: bash .vercel-env-setup.sh

echo "Setting up Vercel environment variables..."

# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Вставьте: https://teftcesgqqwhqhdiornh.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Вставьте ваш ANON KEY

# Sentry
vercel env add NEXT_PUBLIC_SENTRY_DSN production preview development
# Вставьте ваш Sentry DSN

vercel env add SENTRY_ORG production preview development
# Вставьте: whity

vercel env add SENTRY_PROJECT production preview development
# Вставьте: javascript-nextjs

echo "Done! Now redeploy your project."
