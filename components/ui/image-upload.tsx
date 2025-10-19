"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, X, Upload, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ImageUploadProps {
  onUpload: (url: string) => void
  bucket?: string
  maxSize?: number // in MB
  accept?: string
}

export function ImageUpload({
  onUpload,
  bucket = "post-images",
  maxSize = 5,
  accept = "image/*"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [hasFailed, setHasFailed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error("Ошибка: Файл слишком большой", {
        description: `Максимальный размер: ${maxSize}MB. Выбранный файл: ${(file.size / 1024 / 1024).toFixed(1)}MB`
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Ошибка: Неверный тип файла", {
        description: `Файл "${file.name}" не является изображением. Выберите файл с расширением .jpg, .png, .gif и т.д.`
      })
      return
    }

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setIsUploading(true)
    setUploadProgress(0)
    const controller = new AbortController()
    setAbortController(controller)
    const supabase = createClient()

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      setUploadProgress(100)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      setHasFailed(false)
      onUpload(publicUrl)
      toast.success("Изображение загружено", {
        description: `Файл "${file.name}" успешно загружен`
      })
    } catch (error) {
      console.error("Upload error:", error)
      // Clean up preview on error
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreview(null)
      setUploadProgress(0)
      setAbortController(null)
      setHasFailed(true)
      toast.error("Ошибка при загрузке изображения", {
        description: "Проверьте подключение к интернету и попробуйте снова"
      })
    } finally {
      setIsUploading(false)
      setAbortController(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    // Clean up blob URL before removing
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setHasFailed(false)
    onUpload("")
  }

  const handleRetry = () => {
    const fileInput = fileInputRef.current
    if (!fileInput || !fileInput.files?.[0]) return

    const file = fileInput.files[0]
    handleFileSelect({ target: { files: [file] } } as any)
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {hasFailed ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center p-8 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/5">
            <div className="text-center">
              <div className="text-sm text-destructive mb-2">Ошибка загрузки изображения</div>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                disabled={isUploading}
              >
                Повторить загрузку
              </Button>
            </div>
          </div>
        </div>
      ) : preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-64 rounded-lg border"
          />
          {isUploading && uploadProgress < 100 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <div className="text-sm">Загрузка...</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    abortController?.abort()
                    setAbortController(null)
                    setIsUploading(false)
                    toast.info("Загрузка отменена")
                  }}
                  className="text-xs underline hover:no-underline mt-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full sm:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Загрузить изображение
            </>
          )}
        </Button>
      )}
    </div>
  )
}

interface ImageGalleryProps {
  images: string[]
  onRemove?: (index: number) => void
  editable?: boolean
}

export function ImageGallery({ images, onRemove, editable = false }: ImageGalleryProps) {
  if (images.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
      {images.map((url, index) => (
        <div key={index} className="relative group">
          <img
            src={url}
            alt={`Image ${index + 1}`}
            className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, "_blank")}
          />
          {editable && onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
