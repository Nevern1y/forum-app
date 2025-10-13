# Миграция с Supabase на собственную БД

## ⚠️ Важно понять

Ваш проект использует **не просто Supabase БД**, а **полный стек Supabase**:

### Что нужно будет заменить:

1. **PostgreSQL база данных** ✅ Легко
2. **Supabase Auth** ❌ Сложно - нужна полная замена авторизации
3. **Supabase Storage** ❌ Сложно - нужен S3/другой file storage
4. **Row Level Security (RLS)** ❌ Сложно - нужна логика на backend
5. **Realtime subscriptions** (если используете) ❌ Сложно

**Оценка работы**: 2-4 недели полной переработки

---

## 🎯 Рекомендации по приоритету

### Вариант 1: Остаться на Supabase (РЕКОМЕНДУЕТСЯ) ⭐

**Почему:**
- ✅ Все уже работает
- ✅ Auth, Storage, RLS из коробки
- ✅ Бесплатно до 500 пользователей
- ✅ Простое масштабирование
- ✅ Автоматические бэкапы
- ✅ PostgreSQL - мощная БД

**Когда переходить:**
- При 50,000+ активных пользователей/месяц
- При превышении 500GB хранилища
- При необходимости специфичной БД логики

**Стоимость**:
- Free: $0/мес (до 500 MAU)
- Pro: $25/мес (до 100k MAU)
- Team: $599/мес (до 1M MAU)

### Вариант 2: Самостоятельный PostgreSQL + MinIO

**Если хотите больше контроля, но меньше переписывать:**

#### Что менять:
```
Supabase PostgreSQL → Своя PostgreSQL
Supabase Storage → MinIO (S3-совместимый)
Supabase Auth → NextAuth.js или Lucia
RLS → Middleware + SQL проверки
```

**Плюсы:**
- ✅ Полный контроль
- ✅ Можно хостить где угодно
- ✅ PostgreSQL остается (минимальная переработка SQL)

**Минусы:**
- ❌ 2-3 недели работы
- ❌ Нужен backend для Auth
- ❌ Настройка MinIO, PostgreSQL
- ❌ Нужна настройка безопасности вручную

**Стоимость VPS** (например Hetzner):
- 4GB RAM, 2 CPU: €4.50/мес (~$5)
- 8GB RAM, 4 CPU: €7.50/мес (~$8)

### Вариант 3: MySQL + собственный стек

**Если действительно хотите MySQL:**

#### Что менять:
```
PostgreSQL → MySQL/MariaDB
Supabase Auth → NextAuth.js
Supabase Storage → S3/MinIO
RLS → Backend middleware
Все SQL запросы → переписать на MySQL синтаксис
```

**Проблемы миграции:**

| PostgreSQL фича | MySQL эквивалент | Сложность |
|-----------------|------------------|-----------|
| `UUID DEFAULT gen_random_uuid()` | `CHAR(36) DEFAULT (UUID())` | Средняя |
| `TEXT[]` массивы | JSON или отдельная таблица | Высокая |
| Row Level Security | Backend логика | Очень высокая |
| `TIMESTAMPTZ` | `TIMESTAMP` + timezone handling | Средняя |
| `JSONB` | `JSON` (медленнее) | Низкая |

**Оценка работы**: 3-4 недели

**Плюсы:**
- ✅ MySQL проще для начинающих
- ✅ Меньше ресурсов сервера
- ✅ Больше хостинг-провайдеров

**Минусы:**
- ❌ Нет массивов (нужно JSON или JOIN таблицы)
- ❌ Медленнее на сложных запросах
- ❌ Нет встроенного RLS
- ❌ Полная переработка всех SQL запросов

---

## 🚀 Самый простой вариант миграции

### PlanetScale (MySQL) - Managed Database

Если хотите MySQL без головной боли:

**Что это:**
- Managed MySQL (как Supabase, но для MySQL)
- Автоматические бэкапы
- Бесплатный tier
- Branching для БД (как git)

**Что все равно нужно заменить:**
```typescript
// Текущий стек
Supabase DB + Auth + Storage

// Новый стек
PlanetScale (MySQL) + NextAuth + AWS S3
```

**Стоимость:**
- Free: 5GB storage, 1 миллиард row reads
- Scaler: $39/мес

**Время миграции**: 2-3 недели

---

## 🔧 Практический план миграции

Если решите мигрировать, вот порядок действий:

### Этап 1: Подготовка (1-2 дня)

1. **Выбрать новую БД:**
   - PostgreSQL на VPS (Hetzner, DigitalOcean)
   - PlanetScale (MySQL)
   - Railway/Render (Managed PostgreSQL)

2. **Выбрать Auth решение:**
   ```bash
   npm install next-auth
   # или
   npm install lucia
   ```

3. **Выбрать File Storage:**
   - AWS S3
   - Cloudflare R2
   - MinIO (self-hosted)

### Этап 2: База данных (3-5 дней)

1. Экспортировать схему из Supabase:
   ```bash
   supabase db dump --schema public > schema.sql
   ```

2. Адаптировать под новую БД (если MySQL):
   ```sql
   -- PostgreSQL
   id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   
   -- MySQL
   id CHAR(36) PRIMARY KEY DEFAULT (UUID())
   ```

3. Перенести данные:
   ```bash
   supabase db dump --data-only > data.sql
   ```

### Этап 3: Auth (5-7 дней)

Заменить все `createClient()` на NextAuth:

```typescript
// Было (Supabase):
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Станет (NextAuth):
import { getServerSession } from "next-auth"
const session = await getServerSession(authOptions)
const user = session?.user
```

### Этап 4: Storage (2-3 дня)

```typescript
// Было:
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(file)

// Станет (AWS S3):
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({ region: 'us-east-1' })
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: filename,
  Body: file
}))
```

### Этап 5: RLS → Middleware (7-10 дней)

Переписать все RLS политики в код:

```typescript
// Было: RLS в Supabase
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

// Станет: Middleware
export async function getPosts(userId: string) {
  return await db.posts.findMany({
    where: { user_id: userId }
  })
}
```

---

## 💡 Моя рекомендация

### Для вашего случая:

**Сейчас (0-10k пользователей):**
- ✅ **Оставайтесь на Supabase Free**
- Фокус на продукт, не на инфраструктуру
- $0/мес, все работает

**При росте (10k-50k пользователей):**
- ✅ **Supabase Pro ($25/мес)**
- Все еще дешевле чем собственная инфраструктура
- Без головной боли с DevOps

**При масштабе (100k+ пользователей):**
- 🔄 **Тогда мигрировать**
- На самостоятельный PostgreSQL + S3
- Экономия на масштабе

### Альтернатива Supabase (если хочется мигрировать):

**Railway или Render.com:**
- Managed PostgreSQL + Redis
- Проще чем свой VPS
- Дороже Supabase, но больше контроля

**Стоимость Railway:**
- Starter: $5/мес за БД
- Pro: От $20/мес

---

## 📊 Сравнительная таблица

| Критерий | Supabase | PostgreSQL на VPS | PlanetScale MySQL |
|----------|----------|-------------------|-------------------|
| **Простота настройки** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Стоимость (до 10k users)** | $0 | $5-8/мес | $0 |
| **Auth из коробки** | ✅ | ❌ | ❌ |
| **Storage из коробки** | ✅ | ❌ | ❌ |
| **Контроль** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Время миграции** | 0 | 3-4 недели | 2-3 недели |
| **DevOps требования** | Нет | Высокие | Низкие |
| **Масштабирование** | Автоматическое | Ручное | Автоматическое |

---

## 🎯 Финальная рекомендация

**Для вашего проекта форума:**

1. **Оставайтесь на Supabase минимум до 5-10k пользователей**
   - Экономия 2-4 недель разработки
   - $0 на инфраструктуру
   - Фокус на продукте

2. **Если нужен больший контроль сейчас:**
   - Railway PostgreSQL ($5/мес) + NextAuth + S3
   - Миграция 1-2 недели
   - PostgreSQL остается (меньше переработки)

3. **НЕ переходите на MySQL** для этого проекта:
   - Слишком много переработки
   - Потеря массивов, RLS
   - PostgreSQL мощнее для форума

Нужна помощь с конкретным вариантом?
