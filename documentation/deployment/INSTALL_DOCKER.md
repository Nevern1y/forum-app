# Установка Docker Desktop для Windows

## Шаг 1: Скачать Docker Desktop

1. Откройте браузер
2. Перейдите на: **https://www.docker.com/products/docker-desktop/**
3. Нажмите **"Download for Windows"**
4. Дождитесь загрузки файла `Docker Desktop Installer.exe`

## Шаг 2: Установить

1. **Запустите** установщик `Docker Desktop Installer.exe`
2. Если появится запрос UAC (User Account Control) - нажмите **"Да"**
3. В окне установки:
   - ✅ Оставьте галочку **"Use WSL 2 instead of Hyper-V"** (рекомендуется)
   - ✅ Галочка **"Add shortcut to desktop"**
4. Нажмите **"Ok"**
5. Дождитесь установки (2-5 минут)
6. Нажмите **"Close and restart"** когда появится

## Шаг 3: Первый запуск

После перезагрузки компьютера:

1. Docker Desktop запустится автоматически (или найдите иконку на рабочем столе)
2. Может появиться окно **"WSL 2 installation is incomplete"**
   - Если да, нажмите на ссылку в окне
   - Скачайте и установите WSL 2 kernel update
   - Перезапустите Docker Desktop
3. Примите **License Agreement**
4. Можете пропустить регистрацию (Skip)

## Шаг 4: Проверка установки

Откройте PowerShell (или CMD) и выполните:

```bash
docker --version
```

Должно показать что-то вроде:
```
Docker version 24.0.x, build xxxxx
```

Если видите версию - всё готово! ✅

## Шаг 5: Настройка (опционально)

Если хотите ограничить ресурсы Docker:

1. Откройте Docker Desktop
2. Settings (шестеренка справа вверху)
3. Resources → Advanced
4. Настройте:
   - **Memory**: 4 GB (минимум) или 6-8 GB (рекомендуется)
   - **CPUs**: 2 (минимум) или 4 (рекомендуется)
5. Apply & Restart

## Возможные проблемы

### Ошибка: "WSL 2 installation is incomplete"

**Решение:**
1. Скачайте: https://aka.ms/wsl2kernel
2. Установите WSL 2 kernel update
3. Перезапустите Docker Desktop

### Ошибка: "Hardware assisted virtualization and data execution protection must be enabled"

**Решение:**
1. Перезагрузите ПК
2. Войдите в BIOS (обычно F2, F10, Del при загрузке)
3. Найдите и включите:
   - Intel: **VT-x** или **Intel Virtualization Technology**
   - AMD: **AMD-V** или **SVM Mode**
4. Сохраните и перезагрузитесь

### Docker Desktop не запускается

**Решение:**
1. Перезагрузите ПК
2. Запустите Docker Desktop от имени администратора
3. Проверьте, что Windows 10/11 обновлен до последней версии

---

## Что дальше?

После успешной установки Docker:

1. ✅ Откройте терминал в папке проекта
2. ✅ Сообщите мне, что Docker установлен
3. ✅ Я помогу развернуть локальный Supabase

---

## Полезные команды Docker

```bash
# Проверить статус
docker ps

# Остановить все контейнеры
docker stop $(docker ps -q)

# Удалить все контейнеры
docker rm $(docker ps -aq)

# Очистить место (удалить неиспользуемые образы)
docker system prune -a
```
