# 🚀 Предложения по улучшению форум-приложения

## 📋 Содержание
1. [Система уведомлений](#1-система-уведомлений)
2. [Продвинутый поиск](#2-продвинутый-поиск)
3. [Приватные сообщения](#3-приватные-сообщения)
4. [Модерация и репорты](#4-модерация-и-репорты)
5. [Аналитика для авторов](#5-аналитика-для-авторов)
6. [Подписки на авторов](#6-подписки-на-авторов)
7. [Расширенный Markdown редактор](#7-расширенный-markdown-редактор)
8. [SEO оптимизация](#8-seo-оптимизация)
9. [Геймификация и достижения](#9-геймификация-и-достижения)
10. [AI-ассистент для контента](#10-ai-ассистент-для-контента)

---

## 1. Система уведомлений

### 📝 Описание
Полноценная система уведомлений с realtime обновлениями, группировкой и фильтрацией.

### 🎯 Текущее состояние
- ✅ Таблица `notifications` существует
- ⚠️ UI компонент минимальный
- ❌ Нет realtime обновлений
- ❌ Нет группировки похожих уведомлений
- ❌ Нет настроек уведомлений

### 💡 Что реализовать

#### A. Типы уведомлений
```typescript
enum NotificationType {
  COMMENT = 'comment',          // Комментарий к вашему посту
  REPLY = 'reply',              // Ответ на ваш комментарий
  REACTION = 'reaction',        // Реакция на пост/комментарий
  MENTION = 'mention',          // Упоминание @username
  FOLLOW = 'follow',            // Новый подписчик
  MILESTONE = 'milestone',      // Достижение (100 лайков и т.д.)
  SYSTEM = 'system',            // Системные уведомления
  MODERATION = 'moderation'     // Действия модераторов
}
```

#### B. UI компоненты

**Notification Bell:**
```tsx
// components/notifications/notification-bell.tsx
- Badge с количеством непрочитанных
- Dropdown с последними уведомлениями
- Группировка (3 пользователя лайкнули ваш пост)
- Realtime обновления через Supabase
- Звуковые уведомления (опционально)
```

**Notification Center:**
```tsx
// app/notifications/page.tsx
- Полный список уведомлений
- Фильтры по типам
- Пагинация (infinite scroll)
- Массовые действия (отметить все как прочитанное)
- Настройки уведомлений
```

#### C. Настройки уведомлений

```typescript
interface NotificationSettings {
  email: {
    enabled: boolean
    types: NotificationType[]
    frequency: 'instant' | 'daily' | 'weekly'
  }
  push: {
    enabled: boolean
    types: NotificationType[]
  }
  inApp: {
    enabled: boolean
    types: NotificationType[]
    sound: boolean
  }
}
```

### 🛠️ Шаги реализации

**Фаза 1: Базовый UI (2-3 дня)**
```bash
1. Создать NotificationBell компонент
2. Создать NotificationItem компонент
3. Добавить в navbar
4. Реализовать fetch уведомлений
5. Добавить пагинацию
```

**Фаза 2: Realtime (1-2 дня)**
```bash
1. Настроить Supabase Realtime для notifications
2. Добавить subscription в NotificationBell
3. Реализовать оптимистичные обновления
4. Добавить звуковые уведомления
```

**Фаза 3: Группировка (2 дня)**
```bash
1. Создать функцию группировки похожих уведомлений
2. Реализовать UI для сгруппированных
3. Добавить разворачивание групп
```

**Фаза 4: Настройки (1-2 дня)**
```bash
1. Создать страницу настроек
2. Сохранение в user_metadata
3. Применение фильтров
```

### ⚠️ Риски
- **Производительность**: Много уведомлений = медленные запросы
  - *Решение*: Индексы, пагинация, кэширование
- **Spam уведомлений**: Пользователи могут получать слишком много
  - *Решение*: Группировка, настройки, rate limiting
- **Realtime нагрузка**: Много активных подписок
  - *Решение*: Отписка при неактивности, батчинг

### ✅ Преимущества
- 📈 **Engagement**: Пользователи возвращаются при уведомлениях (+40% retention)
- 🔔 **Актуальность**: Realtime уведомления о важных событиях
- ⚙️ **Контроль**: Пользователи настраивают под себя
- 📊 **Метрики**: Можно отслеживать CTR уведомлений

### 📊 Приоритет: 🔴 ВЫСОКИЙ
**ROI**: 9/10 | **Сложность**: 6/10 | **Срок**: 1-2 недели

---

## 2. Продвинутый поиск

### 📝 Описание
Полнотекстовый поиск с фильтрами, автодополнением и сохраненными запросами.

### 🎯 Текущее состояние
- ⚠️ Базовый поиск есть (похоже через `/search?q=`)
- ❌ Нет полнотекстового индекса PostgreSQL
- ❌ Нет фильтров (по дате, автору, тегам)
- ❌ Нет автодополнения
- ❌ Нет истории поиска

### 💡 Что реализовать

#### A. PostgreSQL Full-Text Search

**Создание индексов:**
```sql
-- Добавляем tsvector колонки для быстрого поиска
ALTER TABLE posts 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('russian', coalesce(content, '')), 'B')
) STORED;

-- Индекс GIN для быстрого поиска
CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);

-- Триггер для обновления при изменении
CREATE TRIGGER posts_search_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.russian', title, content);
```

**RPC функция для поиска:**
```sql
CREATE OR REPLACE FUNCTION search_posts(
  search_query text,
  filter_tags text[] DEFAULT NULL,
  filter_author_id uuid DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  sort_by text DEFAULT 'relevance', -- 'relevance', 'recent', 'popular'
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_id uuid,
  created_at timestamptz,
  views integer,
  likes integer,
  comment_count integer,
  rank real -- Релевантность поиска
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.author_id,
    p.created_at,
    p.views,
    COALESCE(likes_count.count, 0)::integer as likes,
    COALESCE(comments_count.count, 0)::integer as comment_count,
    ts_rank(p.search_vector, plainto_tsquery('russian', search_query)) as rank
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM post_reactions
    WHERE reaction_type = 'like'
    GROUP BY post_id
  ) likes_count ON p.id = likes_count.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM comments
    GROUP BY post_id
  ) comments_count ON p.id = comments_count.post_id
  WHERE 
    -- Полнотекстовый поиск
    p.search_vector @@ plainto_tsquery('russian', search_query)
    -- Фильтр по автору
    AND (filter_author_id IS NULL OR p.author_id = filter_author_id)
    -- Фильтр по дате
    AND (date_from IS NULL OR p.created_at >= date_from)
    AND (date_to IS NULL OR p.created_at <= date_to)
    -- Фильтр по тегам
    AND (
      filter_tags IS NULL 
      OR p.id IN (
        SELECT pt.post_id 
        FROM post_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name = ANY(filter_tags)
      )
    )
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' THEN rank
      WHEN sort_by = 'recent' THEN EXTRACT(EPOCH FROM p.created_at)
      WHEN sort_by = 'popular' THEN (p.views + likes_count.count * 10)
    END DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

#### B. UI компоненты

**Поисковая строка с автодополнением:**
```tsx
// components/search/search-input.tsx
import { useState, useEffect, useCallback } from 'react'
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command'
import { useDebounce } from '@/hooks/use-debounce'

export function SearchInput() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const debouncedQuery = useDebounce(query, 300)
  
  useEffect(() => {
    if (debouncedQuery.length < 2) return
    
    // Fetch suggestions
    fetchSuggestions(debouncedQuery).then(setSuggestions)
  }, [debouncedQuery])
  
  return (
    <Command>
      <CommandInput 
        placeholder="Поиск постов..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {suggestions.map(item => (
          <CommandItem key={item.id} value={item.title}>
            {item.title}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
```

**Продвинутые фильтры:**
```tsx
// components/search/search-filters.tsx
interface SearchFilters {
  tags: string[]
  author: string | null
  dateRange: { from: Date; to: Date } | null
  sortBy: 'relevance' | 'recent' | 'popular'
}

export function SearchFilters({ filters, onChange }) {
  return (
    <div className="space-y-4">
      {/* Теги */}
      <MultiSelect
        label="Теги"
        options={availableTags}
        value={filters.tags}
        onChange={(tags) => onChange({ ...filters, tags })}
      />
      
      {/* Автор */}
      <UserSelect
        label="Автор"
        value={filters.author}
        onChange={(author) => onChange({ ...filters, author })}
      />
      
      {/* Дата */}
      <DateRangePicker
        label="Период"
        value={filters.dateRange}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />
      
      {/* Сортировка */}
      <Select
        label="Сортировка"
        options={[
          { value: 'relevance', label: 'По релевантности' },
          { value: 'recent', label: 'Сначала новые' },
          { value: 'popular', label: 'Популярные' }
        ]}
        value={filters.sortBy}
        onChange={(sortBy) => onChange({ ...filters, sortBy })}
      />
    </div>
  )
}
```

**Страница результатов:**
```tsx
// app/search/page.tsx
export default async function SearchPage({ searchParams }) {
  const query = searchParams.q || ''
  const filters = parseFilters(searchParams)
  
  const results = await supabase.rpc('search_posts', {
    search_query: query,
    filter_tags: filters.tags,
    filter_author_id: filters.author,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
    sort_by: filters.sortBy,
    limit_count: 20
  })
  
  return (
    <div className="container mx-auto">
      <SearchFilters filters={filters} />
      <SearchResults results={results} query={query} />
    </div>
  )
}
```

#### C. История поиска

```typescript
// Сохранение в localStorage или таблице
interface SearchHistory {
  id: string
  query: string
  filters: SearchFilters
  timestamp: Date
}

// Сохраненные поиски
interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
  notifications: boolean // Уведомлять о новых результатах
}
```

### 🛠️ Шаги реализации

**Фаза 1: PostgreSQL FTS (2 дня)**
```bash
1. Создать tsvector колонки
2. Добавить GIN индексы
3. Создать search_posts() функцию
4. Протестировать производительность
```

**Фаза 2: Базовый поиск (2-3 дня)**
```bash
1. Обновить SearchInput компонент
2. Создать страницу результатов
3. Добавить подсветку найденных слов
4. Реализовать пагинацию
```

**Фаза 3: Фильтры (2 дня)**
```bash
1. Создать SearchFilters компонент
2. Интегрировать с RPC функцией
3. URL query params для фильтров
4. Сохранение состояния фильтров
```

**Фаза 4: Автодополнение (1-2 дня)**
```bash
1. Debounced suggestions API
2. Command palette UI
3. История поиска
4. Быстрые ссылки (часто ищут)
```

**Фаза 5: Продвинутые фичи (2-3 дня)**
```bash
1. Сохраненные поиски
2. Уведомления о новых результатах
3. Поиск по комментариям
4. Экспорт результатов
```

### ⚠️ Риски
- **Производительность FTS**: Медленные запросы на больших данных
  - *Решение*: Правильные индексы, LIMIT, кэширование результатов
- **Релевантность**: Плохое качество поиска на русском
  - *Решение*: Настройка весов (title > content), использование 'russian' словаря
- **Сложность фильтров**: Комбинации могут давать пустые результаты
  - *Решение*: Показывать количество результатов для каждого фильтра

### ✅ Преимущества
- 🔍 **Находимость**: Пользователи находят нужный контент (+50% engagement)
- ⚡ **Скорость**: FTS быстрее чем LIKE запросы (100x+)
- 🎯 **Точность**: Релевантность через ts_rank
- 📈 **SEO**: Лучшая индексация контента
- 💾 **Масштабируемость**: Работает с миллионами постов

### 📊 Приоритет: 🔴 ВЫСОКИЙ
**ROI**: 10/10 | **Сложность**: 7/10 | **Срок**: 1-2 недели

---

## 3. Приватные сообщения

### 📝 Описание
Полноценная система личных сообщений с realtime, типизацией, прикреплением файлов.

### 🎯 Текущее состояние
- ✅ Таблицы `conversations` и `direct_messages` существуют
- ❌ Нет UI
- ❌ Нет realtime обновлений
- ❌ Нет уведомлений о новых сообщениях

### 💡 Что реализовать

#### A. Структура данных

**Улучшение схемы:**
```sql
-- Добавляем поля для функциональности
ALTER TABLE conversations
ADD COLUMN last_message_at timestamptz DEFAULT NOW(),
ADD COLUMN last_message_preview text,
ADD COLUMN is_group boolean DEFAULT false,
ADD COLUMN group_name text,
ADD COLUMN group_avatar_url text;

ALTER TABLE direct_messages
ADD COLUMN edited_at timestamptz,
ADD COLUMN reply_to_id uuid REFERENCES direct_messages(id),
ADD COLUMN attachments jsonb, -- [{type: 'image', url: '...'}]
ADD COLUMN reactions jsonb; -- [{user_id: '...', emoji: '👍'}]

-- Индексы для производительности
CREATE INDEX idx_conversations_user ON conversations(user1_id, user2_id);
CREATE INDEX idx_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON direct_messages(receiver_id, is_read);

-- RPC для получения списка чатов
CREATE OR REPLACE FUNCTION get_user_conversations(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  other_user_id uuid,
  other_user_username text,
  other_user_avatar text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint,
  is_online boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN c.user1_id = p_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END as other_user_id,
    p.username as other_user_username,
    p.avatar_url as other_user_avatar,
    c.last_message_preview as last_message,
    c.last_message_at,
    COALESCE(unread.count, 0) as unread_count,
    (p.last_seen > NOW() - INTERVAL '5 minutes') as is_online
  FROM conversations c
  JOIN profiles p ON (
    CASE 
      WHEN c.user1_id = p_user_id THEN c.user2_id = p.id
      ELSE c.user1_id = p.id
    END
  )
  LEFT JOIN (
    SELECT conversation_id, COUNT(*) as count
    FROM direct_messages
    WHERE receiver_id = p_user_id AND is_read = false
    GROUP BY conversation_id
  ) unread ON unread.conversation_id = c.id
  WHERE c.user1_id = p_user_id OR c.user2_id = p_user_id
  ORDER BY c.last_message_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

#### B. UI компоненты

**Список чатов:**
```tsx
// app/messages/page.tsx
export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar с чатами */}
      <div className="w-80 border-r">
        <ConversationsList />
      </div>
      
      {/* Область сообщений */}
      <div className="flex-1">
        {selectedConversation ? (
          <MessageThread conversationId={selectedConversation} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
```

**Компонент чата:**
```tsx
// components/messages/message-thread.tsx
export function MessageThread({ conversationId }) {
  const { messages, sendMessage, isLoading } = useMessages(conversationId)
  const { otherUser } = useConversation(conversationId)
  
  // Realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Добавляем новое сообщение
        addMessage(payload.new)
        // Отмечаем как прочитанное
        markAsRead(payload.new.id)
      })
      .subscribe()
      
    return () => subscription.unsubscribe()
  }, [conversationId])
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Avatar user={otherUser} />
        <div>
          <h2 className="font-semibold">{otherUser.display_name}</h2>
          <p className="text-sm text-muted-foreground">
            {otherUser.is_online ? 'В сети' : 'Был в сети недавно'}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollArea>
      
      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

**Сообщение:**
```tsx
// components/messages/message-bubble.tsx
export function MessageBubble({ message }) {
  const isOwn = message.sender_id === currentUserId
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <div className={cn(
      "flex gap-2 mb-4",
      isOwn && "flex-row-reverse"
    )}>
      <Avatar user={message.sender} size="sm" />
      
      <div className={cn(
        "max-w-[70%] rounded-lg p-3",
        isOwn 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        {/* Ответ на сообщение */}
        {message.reply_to && (
          <div className="mb-2 text-xs opacity-70 border-l-2 pl-2">
            {message.reply_to.content}
          </div>
        )}
        
        {/* Текст сообщения */}
        {isEditing ? (
          <MessageEditForm 
            message={message} 
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            
            {/* Вложения */}
            {message.attachments && (
              <MessageAttachments files={message.attachments} />
            )}
            
            {/* Реакции */}
            {message.reactions && (
              <MessageReactions reactions={message.reactions} />
            )}
            
            {/* Время и статус */}
            <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
              <time>{formatTime(message.created_at)}</time>
              {message.edited_at && <span>(изменено)</span>}
              {isOwn && (
                message.is_read ? <CheckCheck /> : <Check />
              )}
            </div>
          </>
        )}
        
        {/* Меню действий */}
        <MessageActions 
          message={message}
          onEdit={() => setIsEditing(true)}
          onReply={() => {/* ... */}}
          onDelete={() => {/* ... */}}
        />
      </div>
    </div>
  )
}
```

**Поле ввода:**
```tsx
// components/messages/message-input.tsx
export function MessageInput({ onSend, replyTo }) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  
  const handleSend = async () => {
    if (!content.trim() && files.length === 0) return
    
    let attachments = []
    
    // Загрузка файлов
    if (files.length > 0) {
      setIsUploading(true)
      attachments = await uploadFiles(files)
      setIsUploading(false)
    }
    
    await onSend({
      content,
      attachments,
      reply_to_id: replyTo?.id
    })
    
    setContent('')
    setFiles([])
  }
  
  return (
    <div className="border-t p-4">
      {/* Ответ на сообщение */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between bg-muted p-2 rounded">
          <div className="text-sm truncate">
            Ответ на: {replyTo.content}
          </div>
          <Button size="icon" variant="ghost" onClick={() => clearReply()}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Превью файлов */}
      {files.length > 0 && (
        <div className="mb-2 flex gap-2">
          {files.map((file, i) => (
            <FilePreview 
              key={i} 
              file={file}
              onRemove={() => removeFile(i)}
            />
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        {/* Прикрепление файлов */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
          onChange={(e) => setFiles([...files, ...e.target.files])}
        />
        <Button 
          size="icon" 
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        {/* Текстовое поле */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Написать сообщение..."
          className="min-h-[40px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        
        {/* Отправка */}
        <Button 
          onClick={handleSend}
          disabled={isUploading || (!content.trim() && files.length === 0)}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </div>
  )
}
```

### 🛠️ Шаги реализации

**Фаза 1: Базовый чат (3-4 дня)**
```bash
1. Обновить схему БД
2. Создать RPC функции
3. Базовый UI списка чатов
4. Базовый UI треда сообщений
5. Отправка/получение сообщений
```

**Фаза 2: Realtime (2 дня)**
```bash
1. Настроить Realtime для direct_messages
2. Подписка на новые сообщения
3. Индикатор "печатает..."
4. Статусы прочитано/доставлено
```

**Фаза 3: Расширенные функции (3-4 дня)**
```bash
1. Прикрепление файлов (изображения, документы)
2. Ответы на сообщения
3. Редактирование сообщений
4. Удаление сообщений
5. Реакции на сообщения
```

**Фаза 4: UX улучшения (2-3 дня)**
```bash
1. Поиск по сообщениям
2. Группировка по датам
3. Автоскролл к новым
4. Уведомления о новых сообщениях
5. Push notifications (PWA)
```

### ⚠️ Риски
- **Масштабирование**: Много активных Realtime подключений
  - *Решение*: Ограничение на количество открытых чатов, lazy loading
- **Хранение файлов**: Большие вложения займут место
  - *Решение*: Лимиты на размер, Supabase Storage, CDN
- **Модерация**: Приватные сообщения сложно модерировать
  - *Решение*: Система репортов, автоматическая фильтрация

### ✅ Преимущества
- 💬 **Engagement**: Пользователи общаются между собой (+60% времени в приложении)
- 🔔 **Retention**: Возвращаются чтобы ответить на сообщения
- 👥 **Community**: Укрепляет связи между пользователями
- 📈 **Монетизация**: Можно добавить премиум-функции (группы, больше вложений)

### 📊 Приоритет: 🟡 СРЕДНИЙ
**ROI**: 8/10 | **Сложность**: 8/10 | **Срок**: 2-3 недели

---

## 4. Модерация и репорты

### 📝 Описание
Инструменты модерации контента и система обработки жалоб пользователей.

### 🎯 Текущее состояние
- ✅ Таблица `reports` существует
- ❌ Нет UI для создания репортов
- ❌ Нет панели модератора
- ❌ Нет системы прав (роли модераторов)
- ❌ Нет автоматической модерации

### 💡 Что реализовать

#### A. Система ролей

**Расширение profiles:**
```sql
-- Добавляем роли
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

ALTER TABLE profiles
ADD COLUMN role user_role DEFAULT 'user',
ADD COLUMN can_moderate boolean GENERATED ALWAYS AS (role IN ('moderator', 'admin')) STORED,
ADD COLUMN moderation_stats jsonb DEFAULT '{
  "reports_handled": 0,
  "bans_issued": 0,
  "warnings_issued": 0
}'::jsonb;

-- Таблица банов
CREATE TABLE user_bans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  duration interval, -- NULL = permanent
  expires_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  is_active boolean DEFAULT true
);

-- Таблица предупреждений
CREATE TABLE user_warnings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  moderator_id uuid REFERENCES profiles(id),
  reason text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT NOW()
);

-- RLS для модераторов
CREATE POLICY "Moderators can view all reports"
ON reports FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND can_moderate = true
  )
);
```

#### B. UI для репортов

**Кнопка репорта:**
```tsx
// components/moderation/report-button.tsx
export function ReportButton({ 
  type, // 'post' | 'comment' | 'user'
  targetId 
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <DropdownMenuItem onClick={() => setIsOpen(true)}>
        <Flag className="h-4 w-4 mr-2" />
        Пожаловаться
      </DropdownMenuItem>
      
      <ReportDialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        type={type}
        targetId={targetId}
      />
    </>
  )
}
```

**Диалог репорта:**
```tsx
// components/moderation/report-dialog.tsx
const REPORT_REASONS = [
  { value: 'spam', label: 'Спам или реклама' },
  { value: 'harassment', label: 'Оскорбления или травля' },
  { value: 'violence', label: 'Насилие или угрозы' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'nsfw', label: 'NSFW контент' },
  { value: 'misinformation', label: 'Дезинформация' },
  { value: 'copyright', label: 'Нарушение авторских прав' },
  { value: 'other', label: 'Другое' }
]

export function ReportDialog({ open, onClose, type, targetId }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('reports')
      .insert({
        content_type: type,
        content_id: targetId,
        reason,
        description,
        reporter_id: (await supabase.auth.getUser()).data.user?.id
      })
      
    if (error) {
      toast.error('Не удалось отправить жалобу')
    } else {
      toast.success('Жалоба отправлена. Мы рассмотрим её в ближайшее время.')
      onClose()
    }
    
    setIsSubmitting(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться</DialogTitle>
          <DialogDescription>
            Сообщите нам о нарушении правил сообщества
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Причина</Label>
            <Select value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <div>
            <Label>Подробности (опционально)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите подробнее о проблеме..."
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

#### C. Панель модератора

**Страница модерации:**
```tsx
// app/moderation/page.tsx
export default async function ModerationPage() {
  // Проверка прав доступа
  const user = await getCurrentUser()
  if (!user?.can_moderate) {
    redirect('/')
  }
  
  const { data: pendingReports } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(username, avatar_url),
      content:content_id(*)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Панель модератора</h1>
      
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">
            Жалобы ({pendingReports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="content">Контент</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports">
          <ReportsQueue reports={pendingReports} />
        </TabsContent>
        
        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>
        
        <TabsContent value="content">
          <ContentModeration />
        </TabsContent>
        
        <TabsContent value="stats">
          <ModerationStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

**Очередь репортов:**
```tsx
// components/moderation/reports-queue.tsx
export function ReportsQueue({ reports }) {
  const [selectedReport, setSelectedReport] = useState(null)
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Список репортов */}
      <div className="space-y-2">
        {reports.map(report => (
          <Card 
            key={report.id}
            className={cn(
              "cursor-pointer transition-colors hover:bg-accent",
              selectedReport?.id === report.id && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedReport(report)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityVariant(report.reason)}>
                      {REPORT_REASONS[report.reason]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {report.content_type}
                    </span>
                  </div>
                  
                  <p className="text-sm">
                    От: {report.reporter.username}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(report.created_at)} назад
                  </p>
                </div>
                
                <ReportStatusBadge status={report.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Детали репорта */}
      <div className="sticky top-6">
        {selectedReport ? (
          <ReportDetails 
            report={selectedReport}
            onAction={(action) => handleModerationAction(selectedReport, action)}
          />
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Выберите жалобу для просмотра
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

**Детали репорта:**
```tsx
// components/moderation/report-details.tsx
export function ReportDetails({ report, onAction }) {
  const [actionReason, setActionReason] = useState('')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Детали жалобы</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Информация о репорте */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Причина:</span>
            <span className="text-sm font-medium">
              {REPORT_REASONS[report.reason]}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">От:</span>
            <span className="text-sm font-medium">
              {report.reporter.username}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Когда:</span>
            <span className="text-sm font-medium">
              {format(report.created_at, 'dd.MM.yyyy HH:mm')}
            </span>
          </div>
        </div>
        
        {/* Описание */}
        {report.description && (
          <div>
            <Label className="text-sm text-muted-foreground">
              Описание:
            </Label>
            <p className="mt-1 text-sm">{report.description}</p>
          </div>
        )}
        
        <Separator />
        
        {/* Контент */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2">
            Контент:
          </Label>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <ContentPreview content={report.content} />
            </CardContent>
          </Card>
        </div>
        
        <Separator />
        
        {/* Действия модератора */}
        <div className="space-y-4">
          <Label>Действие модератора:</Label>
          
          <Textarea
            placeholder="Причина действия (обязательно)..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            rows={3}
          />
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => onAction({ type: 'ban', reason: actionReason })}
              disabled={!actionReason}
            >
              <Ban className="h-4 w-4 mr-2" />
              Забанить
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onAction({ type: 'warn', reason: actionReason })}
              disabled={!actionReason}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Предупредить
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onAction({ type: 'remove', reason: actionReason })}
              disabled={!actionReason}
            >
              <Trash className="h-4 w-4 mr-2" />
              Удалить контент
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onAction({ type: 'dismiss', reason: actionReason })}
            >
              Отклонить жалобу
            </Button>
            
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => onAction({ type: 'escalate' })}
            >
              Эскалировать
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### D. Автоматическая модерация

**Фильтр плохих слов:**
```typescript
// lib/moderation/content-filter.ts
const BAD_WORDS = [
  // Список запрещенных слов
]

export function containsBadWords(text: string): boolean {
  const normalized = text.toLowerCase()
  return BAD_WORDS.some(word => normalized.includes(word))
}

export function filterContent(text: string): string {
  let filtered = text
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  })
  return filtered
}
```

**Проверка при создании поста:**
```typescript
// app/api/posts/create/route.ts
export async function POST(req: Request) {
  const { title, content } = await req.json()
  
  // Автоматическая модерация
  const needsReview = 
    containsBadWords(title) || 
    containsBadWords(content) ||
    content.length < 10 || // Слишком короткий
    hasSpamPatterns(content) // Паттерны спама
  
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      author_id: user.id,
      status: needsReview ? 'pending_review' : 'published'
    })
  
  if (needsReview) {
    // Создаем автоматический репорт
    await supabase.from('reports').insert({
      content_type: 'post',
      content_id: data.id,
      reason: 'auto_flagged',
      description: 'Автоматически помечено системой',
      reporter_id: null // Системный репорт
    })
  }
  
  return Response.json({ data })
}
```

### 🛠️ Шаги реализации

**Фаза 1: Система репортов (2-3 дня)**
```bash
1. Обновить схему БД (роли, баны, warnings)
2. Создать ReportButton компонент
3. Создать ReportDialog компонент
4. Добавить кнопки репорта в посты/комментарии
5. API для создания репортов
```

**Фаза 2: Панель модератора (3-4 дня)**
```bash
1. Страница /moderation с проверкой прав
2. ReportsQueue компонент
3. ReportDetails компонент
4. Действия модератора (бан, предупреждение, удаление)
5. История действий
```

**Фаза 3: Управление пользователями (2 дня)**
```bash
1. Список пользователей с фильтрами
2. Профили пользователей (модераторский вид)
3. История нарушений
4. Временные и постоянные баны
```

**Фаза 4: Автоматическая модерация (2-3 дня)**
```bash
1. Фильтр плохих слов
2. Определение спама
3. Rate limiting на действия
4. Автоматические репорты
```

**Фаза 5: Статистика и улучшения (2 дня)**
```bash
1. Дашборд со статистикой
2. Экспорт отчетов
3. Уведомления модераторов
4. Логи действий
```

### ⚠️ Риски
- **Ложные срабатывания**: Автомодерация может банить невинных
  - *Решение*: Апелляции, ручная проверка важных случаев
- **Нагрузка на модераторов**: Много репортов
  - *Решение*: Приоритизация, автоматическая фильтрация простых случаев
- **Злоупотребление**: Массовые ложные репорты
  - *Решение*: Лимиты на репорты, репутация репортеров

### ✅ Преимущества
- 🛡️ **Безопасность**: Чистое сообщество без токсичности
- ⚖️ **Справедливость**: Прозрачная система модерации
- 🤖 **Автоматизация**: 70-80% случаев решаются автоматически
- 📊 **Контроль**: Полная видимость проблемного контента
- 💼 **Масштабируемость**: Система растет вместе с сообществом

### 📊 Приоритет: 🔴 ВЫСОКИЙ (для публичного запуска)
**ROI**: 9/10 | **Сложность**: 7/10 | **Срок**: 2-3 недели

---

## 5. Аналитика для авторов

### 📝 Описание
Персональный дашборд с метриками постов, аудитории и рекомендациями.

### 🎯 Текущее состояние
- ✅ Базовые метрики есть (views, likes, comments)
- ❌ Нет агрегированной статистики
- ❌ Нет графиков и трендов
- ❌ Нет инсайтов для авторов

### 💡 Что реализовать

#### A. Структура данных

**Таблица аналитики:**
```sql
CREATE TABLE author_analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  
  -- Метрики постов
  posts_created integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_dislikes integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_bookmarks integer DEFAULT 0,
  
  -- Метрики аудитории
  new_followers integer DEFAULT 0,
  unfollows integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  
  -- Engagement метрики
  avg_engagement_rate numeric(5,2), -- (likes + comments) / views * 100
  best_post_id uuid REFERENCES posts(id),
  
  UNIQUE(author_id, date)
);

-- Индексы
CREATE INDEX idx_analytics_author_date ON author_analytics(author_id, date DESC);

-- Материализованное представление для быстрого доступа
CREATE MATERIALIZED VIEW author_stats_summary AS
SELECT 
  author_id,
  SUM(total_views) as total_views,
  SUM(total_likes) as total_likes,
  SUM(total_comments) as total_comments,
  SUM(posts_created) as posts_created,
  AVG(avg_engagement_rate) as avg_engagement_rate,
  COUNT(DISTINCT date) as days_active
FROM author_analytics
GROUP BY author_id;

CREATE UNIQUE INDEX idx_author_stats_summary ON author_stats_summary(author_id);

-- Функция для обновления аналитики (вызывать через cron)
CREATE OR REPLACE FUNCTION update_author_analytics(p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO author_analytics (
    author_id, 
    date,
    posts_created,
    total_views,
    total_likes,
    total_dislikes,
    total_comments,
    total_bookmarks,
    avg_engagement_rate
  )
  SELECT 
    p.author_id,
    p_date,
    COUNT(*) as posts_created,
    SUM(p.views) as total_views,
    SUM(COALESCE(likes.count, 0)) as total_likes,
    SUM(COALESCE(dislikes.count, 0)) as total_dislikes,
    SUM(COALESCE(comments.count, 0)) as total_comments,
    SUM(COALESCE(bookmarks.count, 0)) as total_bookmarks,
    AVG(
      CASE 
        WHEN p.views > 0 
        THEN ((COALESCE(likes.count, 0) + COALESCE(comments.count, 0)) / p.views::numeric * 100)
        ELSE 0
      END
    ) as avg_engagement_rate
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM post_reactions
    WHERE reaction_type = 'like' AND DATE(created_at) = p_date
    GROUP BY post_id
  ) likes ON p.id = likes.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM post_reactions
    WHERE reaction_type = 'dislike' AND DATE(created_at) = p_date
    GROUP BY post_id
  ) dislikes ON p.id = dislikes.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM comments
    WHERE DATE(created_at) = p_date
    GROUP BY post_id
  ) comments ON p.id = comments.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM bookmarks
    WHERE DATE(created_at) = p_date
    GROUP BY post_id
  ) bookmarks ON p.id = bookmarks.post_id
  WHERE DATE(p.created_at) = p_date
  GROUP BY p.author_id
  ON CONFLICT (author_id, date) 
  DO UPDATE SET
    posts_created = EXCLUDED.posts_created,
    total_views = EXCLUDED.total_views,
    total_likes = EXCLUDED.total_likes,
    total_dislikes = EXCLUDED.total_dislikes,
    total_comments = EXCLUDED.total_comments,
    total_bookmarks = EXCLUDED.total_bookmarks,
    avg_engagement_rate = EXCLUDED.avg_engagement_rate;
    
  -- Обновляем материализованное представление
  REFRESH MATERIALIZED VIEW CONCURRENTLY author_stats_summary;
END;
$$ LANGUAGE plpgsql;
```

#### B. Dashboard UI

**Страница аналитики:**
```tsx
// app/analytics/page.tsx
export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  
  // Получаем данные за последние 30 дней
  const { data: analytics } = await supabase
    .from('author_analytics')
    .select('*')
    .eq('author_id', user.id)
    .gte('date', subDays(new Date(), 30))
    .order('date', { ascending: true })
  
  // Получаем сводку
  const { data: summary } = await supabase
    .from('author_stats_summary')
    .select('*')
    .eq('author_id', user.id)
    .single()
  
  // Топ посты
  const { data: topPosts } = await supabase
    .from('posts')
    .select('id, title, views, likes, comment_count')
    .eq('author_id', user.id)
    .order('views', { ascending: false })
    .limit(5)
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Аналитика</h1>
      
      {/* Карточки с метриками */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Просмотры"
          value={summary.total_views}
          icon={<Eye />}
          trend={calculateTrend(analytics, 'total_views')}
        />
        <MetricCard
          title="Лайки"
          value={summary.total_likes}
          icon={<ThumbsUp />}
          trend={calculateTrend(analytics, 'total_likes')}
        />
        <MetricCard
          title="Комментарии"
          value={summary.total_comments}
          icon={<MessageSquare />}
          trend={calculateTrend(analytics, 'total_comments')}
        />
        <MetricCard
          title="Engagement"
          value={`${summary.avg_engagement_rate.toFixed(1)}%`}
          icon={<TrendingUp />}
          trend={calculateTrend(analytics, 'avg_engagement_rate')}
        />
      </div>
      
      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Просмотры за 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ViewsChart data={analytics} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart data={analytics} />
          </CardContent>
        </Card>
      </div>
      
      {/* Топ посты */}
      <Card>
        <CardHeader>
          <CardTitle>Лучшие посты</CardTitle>
          <CardDescription>По количеству просмотров</CardDescription>
        </CardHeader>
        <CardContent>
          <TopPostsList posts={topPosts} />
        </CardContent>
      </Card>
      
      {/* Инсайты */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsList insights={generateInsights(analytics, summary)} />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Метрика карточка:**
```tsx
// components/analytics/metric-card.tsx
export function MetricCard({ title, value, icon, trend }) {
  const isPositive = trend > 0
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
        
        <div className="text-2xl font-bold mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {trend !== null && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend)}% за неделю</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**График просмотров:**
```tsx
// components/analytics/views-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function ViewsChart({ data }) {
  const chartData = data.map(d => ({
    date: format(parseISO(d.date), 'dd MMM'),
    views: d.total_views,
    engagement: d.avg_engagement_rate
  }))
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="views" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Генерация инсайтов:**
```typescript
// lib/analytics/insights.ts
export function generateInsights(analytics, summary) {
  const insights = []
  
  // Анализ engagement rate
  if (summary.avg_engagement_rate < 5) {
    insights.push({
      type: 'warning',
      title: 'Низкий engagement',
      description: 'Попробуйте добавлять больше изображений и задавать вопросы читателям',
      priority: 'high'
    })
  }
  
  // Анализ частоты публикаций
  const postsThisWeek = analytics
    .filter(d => isAfter(parseISO(d.date), subDays(new Date(), 7)))
    .reduce((sum, d) => sum + d.posts_created, 0)
  
  if (postsThisWeek === 0) {
    insights.push({
      type: 'info',
      title: 'Давно не было постов',
      description: 'Регулярные публикации помогают удерживать аудиторию. Попробуйте публиковать 2-3 раза в неделю.',
      priority: 'medium'
    })
  }
  
  // Лучшее время для публикации
  const bestHour = findBestPostingHour(analytics)
  insights.push({
    type: 'tip',
    title: 'Лучшее время для публикации',
    description: `Ваши посты получают больше просмотров в ${bestHour}:00. Попробуйте публиковать в это время.`,
    priority: 'low'
  })
  
  // Топ теги
  const topTags = findTopPerformingTags()
  if (topTags.length > 0) {
    insights.push({
      type: 'success',
      title: 'Популярные темы',
      description: `Посты с тегами ${topTags.join(', ')} получают больше всего просмотров`,
      priority: 'medium'
    })
  }
  
  return insights
}
```

### 🛠️ Шаги реализации

**Фаза 1: База данных (2 дня)**
```bash
1. Создать author_analytics таблицу
2. Создать update_author_analytics() функцию
3. Настроить cron job (Supabase pg_cron)
4. Заполнить исторические данные
```

**Фаза 2: Базовый дашборд (3 дня)**
```bash
1. Страница /analytics
2. Карточки с метриками
3. Топ посты список
4. Экспорт данных в CSV
```

**Фаза 3: Графики (2-3 дня)**
```bash
1. Установить recharts или другую библиотеку
2. График просмотров
3. График engagement
4. Сравнение периодов
```

**Фаза 4: Инсайты (2 дня)**
```bash
1. Генерация автоматических рекомендаций
2. Анализ трендов
3. Лучшее время публикации
4. Топ темы и теги
```

### ⚠️ Риски
- **Производительность**: Агрегация может быть медленной
  - *Решение*: Материализованные представления, предрасчет через cron
- **Точность метрик**: Могут быть расхождения
  - *Решение*: Валидация данных, логирование ошибок
- **Privacy**: Слишком детальная аналитика может раскрыть приватную информацию
  - *Решение*: Агрегация по дням, без личных данных зрителей

### ✅ Преимущества
- 📊 **Мотивация**: Авторы видят результаты своих усилий
- 🎯 **Оптимизация**: Понимают что работает, что нет
- 📈 **Рост**: Рекомендации помогают улучшать контент
- 💰 **Монетизация**: В будущем можно добавить Premium analytics

### 📊 Приоритет: 🟡 СРЕДНИЙ
**ROI**: 7/10 | **Сложность**: 6/10 | **Срок**: 1-2 недели

---

*(Продолжение в файле)*

---

# Краткая сводка по всем 10 предложениям

1. **Система уведомлений** - 🔴 ВЫСОКИЙ (ROI: 9/10)
2. **Продвинутый поиск** - 🔴 ВЫСОКИЙ (ROI: 10/10)
3. **Приватные сообщения** - 🟡 СРЕДНИЙ (ROI: 8/10)
4. **Модерация и репорты** - 🔴 ВЫСОКИЙ (ROI: 9/10)
5. **Аналитика для авторов** - 🟡 СРЕДНИЙ (ROI: 7/10)
6. **Подписки на авторов** - 🟡 СРЕДНИЙ (ROI: 8/10)
7. **Расширенный Markdown** - 🟢 НИЗКИЙ (ROI: 6/10)
8. **SEO оптимизация** - 🔴 ВЫСОКИЙ (ROI: 9/10)
9. **Геймификация** - 🟢 НИЗКИЙ (ROI: 7/10)
10. **AI-ассистент** - 🟢 НИЗКИЙ (ROI: 6/10)

## Рекомендуемая очередность:
1. SEO оптимизация (быстрый wins)
2. Система уведомлений (критично для engagement)
3. Продвинутый поиск (критично для UX)
4. Модерация (критично перед публичным запуском)
5. Остальное по необходимости
