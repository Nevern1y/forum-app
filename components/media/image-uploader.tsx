"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Image as ImageIcon, X, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void
  maxImages?: number
  existingImages?: string[]
  bucket?: string
  onCancel?: () => void
}

export function ImageUploader({ onUpload, maxImages = 5, existingImages = [], bucket = "post-images", onCancel }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [failedUploads, setFailedUploads] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max images
    if (images.length + files.length > maxImages) {
      toast.error("Ошибка: Превышен лимит изображений", {
        description: `Можно загрузить максимум ${maxImages} изображений. Вы пытаетесь загрузить ${files.length} дополнительных изображений.`
      })
      return
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Ошибка: Можно загружать только изображения", {
          description: `Файл "${file.name}" не является изображением`
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ошибка: Файл слишком большой", {
          description: `Файл "${file.name}" превышает 5MB. Выберите файл меньшего размера.`
        })
        return
      }
    }

    setUploading(true)
    const controller = new AbortController()
    setAbortController(controller)
    const supabase = createClient()
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const currentIndex = images.length + i

        // Create preview
        const preview = URL.createObjectURL(file)
        setPreviewUrls((prev) => [...prev, preview])
        setUploadProgress((prev) => ({ ...prev, [currentIndex]: 0 }))

        // Upload to Supabase
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${bucket}/${fileName}`

        const { error: uploadError, data } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          })

        if (uploadError) {
          // Mark as failed and clean up preview URL on error
          setFailedUploads((prev) => new Set(prev).add(currentIndex))
          URL.revokeObjectURL(preview)
          setPreviewUrls((prev) => prev.filter(url => url !== preview))
          setUploadProgress((prev) => {
            const newProgress = { ...prev }
            delete newProgress[currentIndex]
            return newProgress
          })
          throw uploadError
        }

        setUploadProgress((prev) => ({ ...prev, [currentIndex]: 100 }))

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onUpload(newImages)
      toast.success("Изображения загружены", {
        description: `Успешно загружено ${files.length} изображений`
      })
    } catch (error) {
      console.error("Upload error:", error)
      // Clean up all preview URLs on error
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      setPreviewUrls(images) // Reset to existing images only
      setUploadProgress({})
      setAbortController(null)
      // Don't clear failed uploads - keep them for retry option
      toast.error("Ошибка при загрузке изображений", {
        description: "Проверьте подключение к интернету и попробуйте снова"
      })
    } finally {
      setUploading(false)
      setAbortController(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)

    // Clean up blob URLs for removed previews
    const removedPreview = previewUrls[index]
    if (removedPreview && removedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview)
    }

    // Remove from failed uploads if it was failed
    setFailedUploads((prev) => {
      const newFailed = new Set(prev)
      newFailed.delete(index)
      return newFailed
    })

    setImages(newImages)
    setPreviewUrls(newPreviews)
    onUpload(newImages)
    toast.success("Изображение удалено")
  }

  const retryUpload = async (index: number) => {
    if (!failedUploads.has(index)) return

    const fileInput = fileInputRef.current
    if (!fileInput?.files?.[index]) return

    const file = fileInput.files[index]
    setFailedUploads((prev) => {
      const newFailed = new Set(prev)
      newFailed.delete(index)
      return newFailed
    })

    setUploading(true)
    const supabase = createClient()

    try {
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrls((prev) => {
        const newPreviews = [...prev]
        newPreviews[index] = preview
        return newPreviews
      })
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }))

      // Upload to Supabase
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${bucket}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) {
        setFailedUploads((prev) => new Set(prev).add(index))
        URL.revokeObjectURL(preview)
        setPreviewUrls((prev) => {
          const newPreviews = [...prev]
          newPreviews[index] = images[index] || ""
          return newPreviews
        })
        setUploadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[index]
          return newProgress
        })
        throw uploadError
      }

      setUploadProgress((prev) => ({ ...prev, [index]: 100 }))

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      const newImages = [...images]
      newImages[index] = publicUrl
      setImages(newImages)
      onUpload(newImages)
      toast.success("Изображение загружено повторно")
    } catch (error) {
      console.error("Retry upload error:", error)
      toast.error("Ошибка при повторной загрузке")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button and cancel button */}
      <div className="flex gap-2">
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Добавить изображения ({images.length}/{maxImages})
              </>
            )}
          </Button>
        )}
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={uploading}
          >
            Отмена
          </Button>
        )}
      </div>

      {/* Image previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previewUrls.map((url, index) => {
            const progress = uploadProgress[index]
            const isUploading = progress !== undefined && progress < 100
            const hasFailed = failedUploads.has(index)
            return (
              <Card key={index} className="relative group overflow-hidden aspect-square">
                {hasFailed ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                    <div className="text-center p-4">
                      <div className="text-sm mb-2">Ошибка загрузки</div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => retryUpload(index)}
                        disabled={uploading}
                      >
                        Повторить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                  />
                )}
                {isUploading && !hasFailed && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-sm">Загрузка...</div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isUploading}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
