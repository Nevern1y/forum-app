# Self-Hosting Guide - Хостинг на своем компьютере

## 🎯 Что вам нужно

### Вариант 1: Self-hosted Supabase (ПРОЩЕ ВСЕГО) ⭐

**Что это:**
Supabase можно развернуть на своем компьютере бесплатно! Это open-source проект.

**Преимущества:**
- ✅ Весь код остается таким же (минимум изменений!)
- ✅ Бесплатно
- ✅ Полный контроль
- ✅ Auth + Storage + Database в одном

**Недостатки:**
- ⚠️ Нужно ~4GB RAM
- ⚠️ Нужен статичный IP или Cloudflare Tunnel

#### Установка (15 минут):

```bash
# 1. Клонировать Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# 2. Скопировать конфиг
cp .env.example .env

# 3. Запустить
docker-compose up -d

# 4. Открыть в браузере
http://localhost:8000
```

**Готово!** Supabase работает на вашем ПК.

#### Настройка Next.js для локального Supabase:

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

**Миграция данных:**
```bash
# 1. Экспортировать из cloud Supabase
supabase db dump > backup.sql

# 2. Импортировать в локальный
psql -h localhost -p 5432 -U postgres -d postgres < backup.sql
```

---

### Вариант 2: Docker Stack (PostgreSQL + MinIO + NextAuth)

Если не хотите Supabase, можно собрать свой стек.

#### Структура:
```
Docker Compose:
├── PostgreSQL (база данных)
├── MinIO (файлы)
├── Redis (кэш)
└── Next.js (приложение)
```

#### docker-compose.yml:

```yaml
version: '3.8'

services:
  # PostgreSQL база данных
  postgres:
    image: postgres:15
    container_name: forum_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: forum
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # MinIO для файлов (как S3)
  minio:
    image: minio/minio
    container_name: forum_storage
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: your_secure_password
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped

  # Redis для кэширования
  redis:
    image: redis:7-alpine
    container_name: forum_cache
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Adminer - веб-интерфейс для БД
  adminer:
    image: adminer
    container_name: forum_adminer
    ports:
      - "8080:8080"
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

#### Запуск:
```bash
# 1. Сохранить docker-compose.yml
# 2. Запустить
docker-compose up -d

# 3. Проверить статус
docker-compose ps
```

**Готово!** Теперь доступно:
- PostgreSQL: `localhost:5432`
- MinIO: `http://localhost:9001` (admin/your_secure_password)
- Adminer: `http://localhost:8080`

---

## 🔐 Замена Supabase Auth на NextAuth

### 1. Установка:
```bash
npm install next-auth @next-auth/prisma-adapter
npm install prisma @prisma/client
```

### 2. Схема БД для Auth (Prisma):

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}
```

### 3. NextAuth конфиг:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
```

### 4. Заменить Supabase Auth:

```typescript
// Было (Supabase):
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Стало (NextAuth):
import { getServerSession } from "next-auth"
const session = await getServerSession()
const user = session?.user
```

---

## 📁 Замена Supabase Storage на MinIO

### 1. Установка SDK:

```bash
npm install minio
```

### 2. Настройка MinIO клиента:

```typescript
// lib/minio.ts
import { Client } from 'minio'

export const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'admin',
  secretKey: 'your_secure_password'
})

// Создать bucket при старте
async function ensureBucket(bucketName: string) {
  const exists = await minioClient.bucketExists(bucketName)
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1')
  }
}

ensureBucket('avatars')
ensureBucket('post-images')
```

### 3. Загрузка файлов:

```typescript
// Было (Supabase):
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filename, file)

// Стало (MinIO):
import { minioClient } from '@/lib/minio'

await minioClient.putObject(
  'avatars',
  filename,
  file,
  file.size,
  { 'Content-Type': file.type }
)

// URL для доступа
const url = `http://localhost:9000/avatars/${filename}`
```

---

## 🌐 Доступ из интернета

Ваш ПК не доступен из интернета по умолчанию. Варианты решения:

### Вариант 1: Cloudflare Tunnel (БЕСПЛАТНО, ПРОСТО) ⭐

```bash
# 1. Установить cloudflared
# Windows: скачать с https://github.com/cloudflare/cloudflared/releases

# 2. Авторизоваться
cloudflared tunnel login

# 3. Создать туннель
cloudflared tunnel create my-forum

# 4. Запустить
cloudflared tunnel --url http://localhost:3000
```

**Готово!** Получите URL типа `https://random-name.trycloudflare.com`

### Вариант 2: Ngrok (Бесплатно с ограничениями)

```bash
# 1. Зарегистрироваться на ngrok.com

# 2. Установить
npm install -g ngrok

# 3. Авторизоваться
ngrok authtoken YOUR_TOKEN

# 4. Запустить
ngrok http 3000
```

### Вариант 3: Собственный домен + DynDNS

Если у вас есть домен:
```
1. Настроить DynDNS (DuckDNS, No-IP)
2. Пробросить порты на роутере (Port Forwarding)
3. Настроить SSL с Let's Encrypt
```

---

## 💻 Системные требования

### Минимальные:
- **CPU**: 2 ядра
- **RAM**: 4GB (2GB для Docker, 2GB для Next.js)
- **Диск**: 20GB SSD
- **Интернет**: 10 Мбит/с
- **ОС**: Windows 10/11, Linux, macOS

### Рекомендуемые:
- **CPU**: 4 ядра
- **RAM**: 8GB
- **Диск**: 50GB SSD
- **Интернет**: 50 Мбит/с

### Для 1000+ пользователей:
- **CPU**: 8 ядер
- **RAM**: 16GB
- **Диск**: 100GB SSD
- **Интернет**: 100 Мбит/с

---

## 📦 Полная настройка за 1 час

### Шаг 1: Установить Docker Desktop (10 мин)
```
Windows: https://www.docker.com/products/docker-desktop/
```

### Шаг 2: Развернуть Supabase локально (15 мин)
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
docker-compose up -d
```

### Шаг 3: Импортировать данные (10 мин)
```bash
# Экспорт из cloud
supabase db dump > backup.sql

# Импорт в локальный
docker exec -i supabase-db psql -U postgres < backup.sql
```

### Шаг 4: Настроить Next.js (5 мин)
```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Шаг 5: Настроить Cloudflare Tunnel (10 мин)
```bash
cloudflared tunnel --url http://localhost:3000
```

### Шаг 6: Запустить (5 мин)
```bash
npm run build
npm start
```

**Готово!** ✅ Сайт работает на вашем ПК и доступен из интернета.

---

## 💰 Стоимость

### Self-hosting:
- **Docker**: Бесплатно
- **Supabase self-hosted**: Бесплатно
- **Cloudflare Tunnel**: Бесплатно
- **Электричество**: ~$5-10/мес (ПК 24/7)
- **Интернет**: У вас уже есть

**Итого: $5-10/мес** (только электричество)

### vs Cloud:
- Supabase Pro: $25/мес
- Railway: $20/мес
- VPS: $5-20/мес

**Экономия: $15-40/мес**

---

## ⚠️ Предупреждения

### 1. Отключение электричества = сайт упал
**Решение**: UPS (источник бесперебойного питания)

### 2. Перезагрузка ПК = downtime
**Решение**: Настроить автозапуск Docker

### 3. Атаки на домашний IP
**Решение**: Cloudflare Tunnel (защита встроена)

### 4. Backup
**Решение**: Автоматический backup на внешний диск:
```bash
# Ежедневный backup
docker exec supabase-db pg_dump -U postgres > backup_$(date +%Y%m%d).sql
```

---

## 🎯 Рекомендация

### Для начала:
1. ✅ **Разверните локальный Supabase** (1 час)
2. ✅ **Используйте Cloudflare Tunnel** (бесплатно, безопасно)
3. ✅ **Минимум изменений кода** (почти ничего менять не надо!)

### Когда нужен рост:
- До 100 пользователей: ваш ПК справится
- 100-1000: нужен более мощный ПК или дешевый VPS ($5/мес)
- 1000+: время переходить на cloud или dedicated сервер

### Миграция позже:
Локальный Supabase легко мигрирует обратно в cloud или на VPS:
```bash
# Экспорт
docker exec supabase-db pg_dump -U postgres > migration.sql

# Импорт куда угодно
psql -h your-server.com -U postgres < migration.sql
```

---

## 🚀 Начнём?

Хотите, я помогу:
1. Настроить локальный Supabase?
2. Или сразу свой Docker stack (PostgreSQL + MinIO)?
3. Настроить Cloudflare Tunnel для доступа из интернета?

Какой вариант вам ближе?
