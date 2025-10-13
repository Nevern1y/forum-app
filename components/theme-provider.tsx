'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)
  const [defaultTheme, setDefaultTheme] = React.useState(props.defaultTheme || 'system')

  React.useEffect(() => {
    setMounted(true)
    // Определяем дефолтную тему для мобильных устройств
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Для мобильных устройств используем светлую тему по умолчанию
      setDefaultTheme('light')
    }
  }, [])

  if (!mounted) {
    return <NextThemesProvider {...props} defaultTheme="light">{children}</NextThemesProvider>
  }

  return <NextThemesProvider {...props} defaultTheme={defaultTheme}>{children}</NextThemesProvider>
}
