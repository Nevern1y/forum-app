"use client"

import { useState, useRef } from "react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max images
    if (images.length + files.length > maxImages) {
      toast.error(`Максимум ${maxImages} изображений`)
      return
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Можно загружать только изображения")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB")
        return
      }
    }

    setUploading(true)
    const supabase = createClient()
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        // Create preview
        const preview = URL.createObjectURL(file)
        setPreviewUrls((prev) => [...prev, preview])

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

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onUpload(newImages)
      toast.success(`Загружено ${files.length} изображений`)
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Ошибка при загрузке изображений")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setPreviewUrls(newPreviews)
    onUpload(newImages)
    toast.success("Изображение удалено")
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
          {previewUrls.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden aspect-square">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
