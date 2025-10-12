"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react"

interface MediaGalleryProps {
  images: string[]
  className?: string
  compact?: boolean
}

export function MediaGallery({ images, className, compact = false }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  // In compact mode, show max 3 images
  const displayImages = compact ? images.slice(0, 3) : images
  const hiddenCount = compact ? Math.max(0, images.length - 3) : 0

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return

      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex])

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
    if (selectedIndex !== null) {
      const link = document.createElement("a")
      link.href = images[selectedIndex]
      link.download = `image-${selectedIndex + 1}.jpg`
      link.click()
    }
  }

  const getGridClass = () => {
    if (compact) {
      // Compact mode: visible horizontal layout
      if (displayImages.length === 1) return "grid-cols-1"
      if (displayImages.length === 2) return "grid-cols-2"
      return "grid-cols-3"
    }
    
    switch (images.length) {
      case 1:
        return "grid-cols-1"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-3"
      default:
        return "grid-cols-2 md:grid-cols-3"
    }
  }

  const getAspectClass = () => {
    if (compact) {
      return "aspect-square"
    }
    
    switch (images.length) {
      case 1:
        return "aspect-video"
      default:
        return "aspect-square"
    }
  }

  const getHeight = () => {
    if (compact) {
      // Larger height for better visibility
      if (displayImages.length === 1) return "h-40"
      return "h-32"
    }
    return ""
  }

  const getContainerClass = () => {
    return "grid" // Always use grid for consistent layout
  }

  const getMaxWidth = () => {
    if (compact) {
      return "max-w-full" // Use full available width
    }
    return ""
  }

  return (
    <>
      <div className={`${getContainerClass()} ${getGridClass()} ${compact ? 'gap-1.5' : 'gap-2'} rounded-lg overflow-hidden ${getHeight()} ${getMaxWidth()} ${className}`}>
        {displayImages.map((image, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openLightbox(index)
            }}
            className={`relative ${getAspectClass()} overflow-hidden bg-muted hover:opacity-90 transition-opacity group ${
              hiddenCount > 0 && index === displayImages.length - 1 ? "relative" : ""
            }`}
          >
            <Image
              src={image}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
              sizes={compact ? "(max-width: 768px) 33vw, 25vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            />
            {hiddenCount > 0 && index === displayImages.length - 1 && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-[2px]">
                <span className={`text-white ${compact ? 'text-sm' : 'text-lg'} font-semibold`}>
                  +{hiddenCount}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 bg-transparent border-none">
          <VisuallyHidden>
            <DialogTitle>
              Image {selectedIndex !== null ? selectedIndex + 1 : 1} of {images.length}
            </DialogTitle>
          </VisuallyHidden>
          
          {/* Image Container */}
          {selectedIndex !== null && (
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              <Image
                src={images[selectedIndex]}
                alt={`Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
              
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm bg-black/30 transition-all"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Download button */}
              <button
                onClick={downloadImage}
                className="absolute top-4 right-16 z-10 text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm bg-black/30 transition-all"
                aria-label="Скачать"
              >
                <Download className="h-4 w-4" />
              </button>

              {/* Previous button */}
              {selectedIndex > 0 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-10 w-10 rounded-full backdrop-blur-sm bg-black/30 flex items-center justify-center transition-all"
                  aria-label="Предыдущее"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Next button */}
              {selectedIndex < images.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-10 w-10 rounded-full backdrop-blur-sm bg-black/30 flex items-center justify-center transition-all"
                  aria-label="Следующее"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
