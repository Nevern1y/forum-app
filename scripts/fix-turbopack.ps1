# ============================================================================
# TURBOPACK ERROR FIX SCRIPT
# ============================================================================
# Этот скрипт исправляет распространенные ошибки Turbopack в Next.js
# ============================================================================

Write-Host "🔧 Starting Turbopack error fix..." -ForegroundColor Cyan
Write-Host ""

# Функция для безопасного удаления
function Remove-SafelyIfExists {
    param($Path)
    if (Test-Path $Path) {
        Write-Host "  ➜ Removing $Path..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $Path -ErrorAction SilentlyContinue
        if ($?) {
            Write-Host "    ✓ Removed successfully" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Failed to remove (maybe in use)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ➜ $Path not found, skipping" -ForegroundColor Gray
    }
}

# Шаг 1: Очистка .next директории
Write-Host "Step 1: Cleaning .next directory" -ForegroundColor Cyan
Remove-SafelyIfExists ".next"

# Шаг 2: Очистка .turbo кэша
Write-Host ""
Write-Host "Step 2: Cleaning .turbo cache" -ForegroundColor Cyan
Remove-SafelyIfExists ".turbo"

# Шаг 3: Очистка Windows Temp файлов Next.js
Write-Host ""
Write-Host "Step 3: Cleaning Windows Temp" -ForegroundColor Cyan
$tempPath = Join-Path $env:TEMP "next-panic-*"
Write-Host "  ➜ Removing $tempPath..." -ForegroundColor Yellow
Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
if ($?) {
    Write-Host "    ✓ Temp files removed" -ForegroundColor Green
} else {
    Write-Host "    ℹ No temp files found" -ForegroundColor Gray
}

# Шаг 4: Очистка npm кэша
Write-Host ""
Write-Host "Step 4: Cleaning npm cache" -ForegroundColor Cyan
Write-Host "  ➜ Running: npm cache clean --force" -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
if ($?) {
    Write-Host "    ✓ npm cache cleaned" -ForegroundColor Green
} else {
    Write-Host "    ✗ Failed to clean npm cache" -ForegroundColor Red
}

# Шаг 5: Проверка node_modules (опционально)
Write-Host ""
Write-Host "Step 5: Checking node_modules" -ForegroundColor Cyan
$reinstall = Read-Host "  Do you want to reinstall node_modules? This will take time. (y/N)"
if ($reinstall -eq 'y' -or $reinstall -eq 'Y') {
    Write-Host "  ➜ Removing node_modules..." -ForegroundColor Yellow
    Remove-SafelyIfExists "node_modules"
    Write-Host "  ➜ Running: npm install" -ForegroundColor Yellow
    npm install
    if ($?) {
        Write-Host "    ✓ Dependencies reinstalled" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Failed to reinstall dependencies" -ForegroundColor Red
    }
} else {
    Write-Host "    ℹ Skipping node_modules reinstall" -ForegroundColor Gray
}

# Финальные рекомендации
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "✓ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Apply SQL fix in Supabase Dashboard (see TROUBLESHOOTING_GUIDE.md)"
Write-Host "  2. Try running: npm run dev"
Write-Host "  3. If errors persist, try WITHOUT Turbopack: Remove --turbo from package.json"
Write-Host ""
Write-Host "For detailed troubleshooting, see: TROUBLESHOOTING_GUIDE.md" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Опция для немедленного запуска
$runDev = Read-Host "Start dev server now? (Y/n)"
if ($runDev -ne 'n' -and $runDev -ne 'N') {
    Write-Host ""
    Write-Host "🚀 Starting dev server..." -ForegroundColor Green
    npm run dev
}
