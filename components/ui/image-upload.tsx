"use client"

import { useState, useRef } from "react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимальный размер: ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение")
      return
    }

    setIsUploading(true)
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onUpload(publicUrl)
      toast.success("Изображение загружено")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Ошибка при загрузке изображения")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload("")
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

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-64 rounded-lg border"
          />
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
