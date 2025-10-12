"use client"

import { useState, useEffect, memo } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaGalleryProps {
  images: string[]
  className?: string
  compact?: boolean
  disableHover?: boolean
  contentSize?: 'small' | 'medium' | 'large'
}

const MediaGalleryComponent = ({ images, className = "", compact = false, disableHover = false, contentSize = 'medium' }: MediaGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (images.length === 0) return null

  const displayImages = compact ? images.slice(0, 3) : images
  const hiddenCount = compact ? Math.max(0, images.length - 3) : 0

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedIndex(null)
      setIsClosing(false)
      document.body.style.overflow = ""
    }, 200)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const downloadImage = () => {
    if (selectedIndex === null) return
    const link = document.createElement("a")
    link.href = images[selectedIndex]
    link.download = `image-${selectedIndex + 1}.jpg`
    link.click()
  }

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox()
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev)
      } else if (e.key === "ArrowRight") {
        setSelectedIndex(prev => (prev !== null && prev < images.length - 1) ? prev + 1 : prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, images.length])

  // Grid layout classes
  const getGridCols = () => {
    if (compact) {
      return displayImages.length === 1 ? "grid-cols-1" : displayImages.length === 2 ? "grid-cols-2" : "grid-cols-3"
    }
    return images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
  }

  // Get aspect ratio for grid items
  const getAspectRatio = () => {
    if (compact) {
      // Single image - adapt based on content size
      if (displayImages.length === 1) {
        if (contentSize === 'small') return "aspect-[16/9]"  // Bigger for short text
        if (contentSize === 'large') return "aspect-[21/9]"  // More compact for long text
        return "aspect-video" // Default
      }
      // Two images - adapt based on content size
      if (displayImages.length === 2) {
        if (contentSize === 'small') return "aspect-[5/4]"
        if (contentSize === 'large') return "aspect-video"
        return "aspect-[4/3]"
      }
      // Three or more - keep square
      return "aspect-square"
    }
    return images.length === 1 ? "aspect-[16/10]" : "aspect-square"
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className={cn("grid gap-2 rounded-xl overflow-hidden", getGridCols(), className)}>
        {displayImages.map((image, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openLightbox(index)
            }}
            className={cn(
              "relative overflow-hidden bg-muted/50",
              !disableHover && "hover:opacity-95 transition-opacity group",
              getAspectRatio()
            )}
          >
            <Image
              src={image}
              alt={`Image ${index + 1}`}
              fill
              className={cn(
                "object-cover",
                !disableHover && "transition-opacity duration-300 group-hover:opacity-90"
              )}
              sizes={compact ? "200px" : images.length === 1 ? "800px" : "400px"}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
            />
            {hiddenCount > 0 && index === displayImages.length - 1 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-white text-xl font-bold">+{hiddenCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Lightbox - Portal to body */}
      {selectedIndex !== null && mounted && createPortal(
        <div
          className={cn(
            "fixed inset-0 z-[9999] bg-black/95 transition-opacity duration-200",
            isClosing ? "opacity-0" : "opacity-100"
          )}
          onClick={closeLightbox}
        >
          {/* Main Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Image Container */}
            <div 
              className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={images[selectedIndex]}
                  alt={`Image ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 right-6 flex gap-3 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  downloadImage()
                }}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
                aria-label="Скачать"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeLightbox()
                }}
                className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Buttons */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all z-10"
                aria-label="Предыдущее"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {selectedIndex < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-all z-10"
                aria-label="Следующее"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <div className="px-5 py-2.5 rounded-full bg-black/60 text-white text-sm font-medium backdrop-blur-md border border-white/10">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// Мемоизация для оптимизации рендеринга медиа-галереи
export const MediaGallery = memo(MediaGalleryComponent)
