"use client"

/**
 * Lazy-loaded компоненты для оптимизации производительности
 */

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading компонент
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)

// Ленивые компоненты
export const LazyMarkdownEditor = dynamic(
  () => import('@/components/ui/markdown-editor').then(mod => ({ default: mod.MarkdownEditor })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Не рендерить на сервере
  }
)

export const LazyMarkdownViewer = dynamic(
  () => import('@/components/ui/markdown-viewer').then(mod => ({ default: mod.MarkdownViewer })),
  {
    loading: () => <LoadingSpinner />,
  }
)

export const LazyMediaGallery = dynamic(
  () => import('@/components/media/media-gallery').then(mod => ({ default: mod.MediaGallery })),
  {
    loading: () => <LoadingSpinner />,
  }
)

export const LazyAudioPlayer = dynamic(
  () => import('@/components/media/audio-player').then(mod => ({ default: mod.AudioPlayer })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyVoiceRecorder = dynamic(
  () => import('@/components/media/voice-recorder').then(mod => ({ default: mod.VoiceRecorder })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyImageUploader = dynamic(
  () => import('@/components/media/image-uploader').then(mod => ({ default: mod.ImageUploader })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyEmojiPicker = dynamic(
  () => import('@/components/reactions/emoji-picker').then(mod => ({ default: mod.EmojiPicker })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazySharePostModal = dynamic(
  () => import('@/components/post/share-post-modal').then(mod => ({ default: mod.SharePostModal })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyChart = dynamic(
  () => import('@/components/ui/chart').then(mod => ({ default: mod.ChartContainer })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

export const LazyTrendingTopics = dynamic(
  () => import('@/components/widgets/trending-topics').then(mod => ({ default: mod.TrendingTopics })),
  {
    loading: () => <LoadingSpinner />,
  }
)

export const LazyLeaderboard = dynamic(
  () => import('@/components/leaderboard/leaderboard').then(mod => ({ default: mod.Leaderboard })),
  {
    loading: () => <LoadingSpinner />,
  }
)
