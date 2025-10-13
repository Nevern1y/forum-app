# 🔴 Realtime Система - Руководство

Полное руководство по realtime функционалу форума с использованием Supabase Realtime.

## 📋 Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Хуки Realtime](#хуки-realtime)
- [Интеграция](#интеграция)
- [Примеры использования](#примеры-использования)
- [Оптимизация](#оптимизация)
- [Troubleshooting](#troubleshooting)

## 🎯 Обзор

Вся система использует Supabase Realtime для мгновенного обновления данных у всех пользователей:

### Что обновляется в реальном времени?

✅ **Посты**
- Новые посты появляются автоматически
- Обновления постов (редактирование)
- Удаление постов

✅ **Комментарии**
- Новые комментарии появляются мгновенно
- Обновление комментариев
- Удаление комментариев

✅ **Реакции (лайки)**
- Счетчик лайков обновляется у всех
- Без перезагрузки страницы

✅ **Сообщения в чате**
- Новые сообщения
- Индикатор печати
- Статус прочтения

✅ **Друзья**
- Новые заявки в друзья
- Принятие/отклонение заявок
- Обновление списка друзей

✅ **Уведомления**
- Новые уведомления в реальном времени
- Обновление счетчика

✅ **Онлайн-статусы**
- Кто сейчас онлайн
- Обновление каждые 30 секунд

## 🏗️ Архитектура

### Структура файлов

```
hooks/
├── use-realtime.ts                # Базовый универсальный хук
├── use-posts-realtime.ts          # Подписка на посты
├── use-comments-realtime.ts       # Подписка на комментарии
├── use-reactions-realtime.ts      # Подписка на реакции
└── use-friends-realtime.ts        # Подписка на друзей

lib/api/
└── presence.ts                     # Онлайн-статусы

components/
├── feed/
│   ├── infinite-post-list.tsx      # Список постов с realtime
│   └── post-card.tsx               # Карточка поста с realtime
├── post/
│   └── comment-list.tsx            # Комментарии с realtime
└── messages/
    ├── chat-window.tsx             # Чат с realtime
    └── whatsapp-style-messages.tsx # Список чатов с realtime
```

### Принцип работы

```
┌─────────────┐
│   Browser   │
│  Component  │
└──────┬──────┘
       │
       │ useRealtime hook
       │
┌──────▼──────┐
│   Supabase  │
│   Realtime  │
│   Channel   │
└──────┬──────┘
       │
       │ WebSocket
       │
┌──────▼──────┐
│  Supabase   │
│  Database   │
└─────────────┘
```

## 🎣 Хуки Realtime

### `useRealtime` - Универсальный хук

Базовый хук для подписки на любую таблицу:

```typescript
import { useRealtime } from "@/hooks/use-realtime"

useRealtime({
  table: "posts",
  event: "*", // INSERT, UPDATE, DELETE или *
  filter: "user_id=eq.123", // Опциональный фильтр
  onInsert: (payload) => console.log("Новая запись:", payload),
  onUpdate: ({ old, new }) => console.log("Обновлено:", old, new),
  onDelete: (payload) => console.log("Удалено:", payload),
  onChange: (payload) => console.log("Любое изменение:", payload),
})
```

### `usePostsRealtime` - Посты

```typescript
import { usePostsRealtime } from "@/hooks/use-posts-realtime"

usePostsRealtime({
  onNewPost: (post) => {
    console.log("Новый пост:", post)
    setPosts(prev => [post, ...prev])
  },
  onUpdatePost: (post) => {
    console.log("Обновлен пост:", post)
  },
  onDeletePost: (postId) => {
    console.log("Удален пост:", postId)
  },
  userId: "filter-by-user", // Опционально
})
```

### `useCommentsRealtime` - Комментарии

```typescript
import { useCommentsRealtime } from "@/hooks/use-comments-realtime"

useCommentsRealtime({
  postId: "post-id", // Опционально
  onNewComment: (comment) => {
    console.log("Новый комментарий:", comment)
  },
  onUpdateComment: (comment) => {
    console.log("Обновлен комментарий:", comment)
  },
  onDeleteComment: (commentId) => {
    console.log("Удален комментарий:", commentId)
  },
})
```

### `useReactionsRealtime` - Реакции

```typescript
import { useReactionsRealtime } from "@/hooks/use-reactions-realtime"

useReactionsRealtime({
  postId: "post-id",
  onNewReaction: (reaction) => {
    console.log("Новая реакция:", reaction)
  },
  onDeleteReaction: (reactionId) => {
    console.log("Удалена реакция:", reactionId)
  },
  onReactionsChange: () => {
    // Перезагрузить счетчики
    refetchReactions()
  },
})
```

### `useFriendsRealtime` - Друзья

```typescript
import { useFriendsRealtime } from "@/hooks/use-friends-realtime"

useFriendsRealtime({
  userId: currentUserId,
  onNewRequest: (request) => {
    toast.info("Новая заявка в друзья!")
  },
  onAcceptedRequest: (request) => {
    toast.success("Заявка принята!")
  },
  onRejectedRequest: (request) => {
    toast.info("Заявка отклонена")
  },
  onFriendsChange: () => {
    // Обновить список друзей
    refetchFriends()
  },
})
```

## 🔌 Интеграция

### Пример: Список постов с realtime

```typescript
"use client"

import { useState } from "react"
import { usePostsRealtime } from "@/hooks/use-posts-realtime"
import { PostCard } from "./post-card"

export function PostList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts)

  // Подписка на изменения постов
  usePostsRealtime({
    onNewPost: (newPost) => {
      setPosts(prev => [newPost, ...prev])
    },
    onUpdatePost: (updatedPost) => {
      setPosts(prev => 
        prev.map(p => p.id === updatedPost.id ? updatedPost : p)
      )
    },
    onDeletePost: (postId) => {
      setPosts(prev => prev.filter(p => p.id !== postId))
    },
  })

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Пример: Счетчик лайков с realtime

```typescript
"use client"

import { useState } from "react"
import { useReactionsRealtime } from "@/hooks/use-reactions-realtime"

export function PostLikes({ postId, initialCount }) {
  const [count, setCount] = useState(initialCount)

  useReactionsRealtime({
    postId,
    onReactionsChange: async () => {
      // Перезагрузить счетчик
      const { count: newCount } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
      
      if (newCount !== null) {
        setCount(newCount)
      }
    },
  })

  return <span>{count} лайков</span>
}
```

## ⚡ Оптимизация

### 1. Фильтрация по клиенту

Используйте фильтры для подписки только на нужные данные:

```typescript
// ❌ Плохо - получаем ВСЕ посты
useRealtime({ table: "posts" })

// ✅ Хорошо - только посты конкретного пользователя
useRealtime({ 
  table: "posts",
  filter: `user_id=eq.${userId}`
})
```

### 2. Debouncing обновлений

Если данные часто обновляются:

```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedUpdate = useDebouncedCallback(
  (data) => {
    setData(data)
  },
  500 // 500ms
)

usePostsRealtime({
  onUpdatePost: debouncedUpdate,
})
```

### 3. Отключение на неактивных вкладках

```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Отключить realtime
      unsubscribe()
    } else {
      // Включить realtime и обновить данные
      subscribe()
      refetch()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])
```

### 4. Батчинг обновлений

```typescript
const [updates, setUpdates] = useState([])

usePostsRealtime({
  onNewPost: (post) => {
    setUpdates(prev => [...prev, post])
  },
})

// Применяем батч каждые 2 секунды
useEffect(() => {
  const interval = setInterval(() => {
    if (updates.length > 0) {
      setPosts(prev => [...updates, ...prev])
      setUpdates([])
    }
  }, 2000)

  return () => clearInterval(interval)
}, [updates])
```

## 🐛 Troubleshooting

### Проблема: Realtime не работает

**Решение:**
1. Проверьте, что Realtime включен в Supabase Dashboard:
   - Settings → API → Realtime → Enable
2. Проверьте RLS политики - должен быть доступ на SELECT
3. Проверьте консоль браузера на ошибки WebSocket

### Проблема: Слишком много подписок

**Симптомы:**
- Медленная работа
- Сообщения в консоли о превышении лимита

**Решение:**
```typescript
// ❌ Плохо - подписка в каждом компоненте
{posts.map(post => (
  <PostCard key={post.id} post={post} /> // каждый с realtime
))}

// ✅ Хорошо - одна подписка на весь список
<PostList posts={posts} /> // realtime внутри списка
```

### Проблема: Дублирование данных

**Решение:**
```typescript
const [posts, setPosts] = useState(initialPosts)

usePostsRealtime({
  onNewPost: (newPost) => {
    // Проверяем, нет ли уже такого поста
    setPosts(prev => {
      if (prev.find(p => p.id === newPost.id)) {
        return prev
      }
      return [newPost, ...prev]
    })
  },
})
```

### Проблема: Утечки памяти

**Решение:**
Хуки автоматически отписываются при размонтировании. Но если используете ручную подписку:

```typescript
useEffect(() => {
  const channel = supabase.channel('custom')
  
  channel.subscribe()

  // ✅ Обязательно отписывайтесь
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## 📊 Мониторинг

### Проверка активных подписок

```typescript
// В браузерной консоли
supabase.getChannels() // Список всех активных каналов
```

### Логирование событий

```typescript
useRealtime({
  table: "posts",
  onChange: (payload) => {
    console.log('[Realtime]', payload.eventType, payload.table, payload)
  },
})
```

## 🎓 Best Practices

1. **Используйте фильтры** - подписывайтесь только на нужные данные
2. **Один канал на компонент** - не создавайте множество подписок
3. **Обрабатывайте ошибки** - realtime может отключиться
4. **Показывайте индикаторы** - уведомляйте о новых данных
5. **Оптимизируйте обновления** - используйте debouncing для частых изменений

## 🔗 Полезные ссылки

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Performance](https://supabase.com/docs/guides/realtime/performance)
- [WebSocket в браузере](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

**Дата обновления:** 2024
**Версия:** 1.0.0
