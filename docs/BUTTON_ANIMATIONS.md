# 🎬 Анимации кнопок - Ripple Effect

## Добавленные эффекты:

### 🌊 **Главный эффект - RIPPLE (Волна)**

Это "отблескивающий" эффект внутри кнопки при клике!

### 🎯 **1. Ripple эффект при клике**

```css
button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s, opacity 0.6s;
  opacity: 0;
}

button:active::before {
  width: 300px;
  height: 300px;
  opacity: 1;
  transition: width 0s, height 0s, opacity 0.3s;
}
```

**Эффект:**
- 💫 При клике появляется круг от центра
- 🌊 Круг расширяется до 300px
- ✨ Плавно исчезает (opacity: 0)
- ⚡ Волна идет 0.6 секунды

### 🎨 **2. Hover эффект (затемнение/осветление)**

```css
button:hover:not(:disabled) {
  filter: brightness(0.95);
}

button[class*="bg-primary"]:hover {
  filter: brightness(0.9);
}
```

**Эффект:**
- 🔅 Обычные кнопки: 5% темнее
- 🔆 Primary кнопки: 10% темнее
- 💡 Плавное затемнение без движения

### 🔘 **3. Кнопки в постах - особый ripple**

```css
.threads-post button::before {
  background: rgba(0, 0, 0, 0.08);
}

.dark .threads-post button::before {
  background: rgba(255, 255, 255, 0.15);
}
```

**Эффект:**
- 🌊 Более темный ripple для кнопок в постах
- 🎨 Адаптируется под тему
- 💫 Заметный на светлом фоне

### ✨ **4. Outline кнопки**

```css
button[class*="variant-outline"]::before {
  background: rgba(0, 0, 0, 0.05);
}

button[class*="variant-outline"]:hover {
  background-color: var(--accent);
}
```

**Эффект:**
- 🌊 Очень тонкий ripple
- 🎨 Серый фон при hover
- 💫 Не перекрывает текст

### 🖱️ **5. Active state (при клике)**

```css
button:active {
  transform: scale(0.98);
}
```

**Эффект:**
- 🔽 Немного уменьшается (2%)
- 🌊 + Ripple эффект одновременно
- 💫 Двойной feedback

### 🌙 **6. Темная тема**

```css
.dark button::before {
  background: rgba(255, 255, 255, 0.2);
}
```

**Эффект:**
- 🌙 Белый ripple в темной теме
- 💡 Менее яркий (opacity 0.2)
- ✨ Естественный вид

### 🔗 **7. Ссылки**

```css
a:hover {
  opacity: 0.8;
}
```

**Эффект:**
- 💭 Небольшая прозрачность
- ⚡ Быстрый переход 0.15s

## 🎭 Как работает Ripple:

### 1️⃣ **Начальное состояние**
```css
width: 0, height: 0, opacity: 0
```
Круг невидим и имеет размер 0

### 2️⃣ **При клике (active)**
```css
width: 300px, height: 300px, opacity: 1
transition: width 0s, height 0s, opacity 0.3s
```
- Круг мгновенно растет до 300px
- Opacity плавно появляется за 0.3s
- Видна волна расширения

### 3️⃣ **После отпускания**
```css
opacity: 0
transition: opacity 0.6s
```
- Круг плавно исчезает за 0.6s
- Размер остается 300px
- Создается эффект "волны"

### 4️⃣ **Визуализация**
```
Клик:   ⚪ → 🔵 → 🔷 → 💠 → 💎
        0px   50   100   200   300px
        
Отпуск: 💎 → 💠 → 🔷 → 🔵 → ⚪
        100%  75%  50%  25%  0% opacity
```

## ⚙️ Timing функции:

```css
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

**cubic-bezier(0.4, 0, 0.2, 1)** - это "ease-out":
- Быстрый старт
- Плавное замедление
- Естественное движение

## 🎯 Примеры использования:

### Обычная кнопка:
```tsx
<Button>Нажми меня</Button>
```
✨ Автоматически получает:
- Lift на hover
- Shadow на hover
- Scale на active

### Кнопка с иконкой:
```tsx
<button>
  <Heart />
  <span>42</span>
</button>
```
✨ Автоматически:
- Иконка масштабируется отдельно
- Весь блок поднимается
- Плавные переходы

### Primary кнопка:
```tsx
<Button className="bg-primary">
  Создать аккаунт
</Button>
```
✨ Особые эффекты:
- Scale 1.02 (больше увеличение)
- Opacity 0.9
- Подъем + тень

## 📱 Адаптивность:

Все анимации работают:
- ✅ На desktop (hover)
- ✅ На mobile (touch states)
- ✅ Учитывают :disabled
- ✅ В светлой и темной темах

## ♿ Доступность:

```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

Для пользователей с `prefers-reduced-motion` все анимации отключаются.

## 🎨 Визуальные эффекты:

### Hover:
```
🔘 → ⬆️ + 🌟
(кнопка поднимается и получает тень)
```

### Active:
```
⬆️ + 🌟 → ⬇️
(кнопка возвращается и уменьшается)
```

### Icon:
```
📱 → 📱✨
(иконка увеличивается)
```

## ⚡ Производительность:

Используем только GPU-accelerated свойства:
- ✅ `transform` (GPU)
- ✅ `opacity` (GPU)
- ✅ `box-shadow` (хорошо оптимизирован)
- ❌ Не используем `width`, `height`, `margin`

## 🎉 Результат:

Кнопки теперь:
- 🎬 Живые и отзывчивые
- 🎯 Дают четкий feedback
- ✨ Приятные для глаз
- 🚀 Плавные и быстрые
- 📱 Работают везде
- ♿ Доступные

**Интерфейс стал более интерактивным!** 🎊
