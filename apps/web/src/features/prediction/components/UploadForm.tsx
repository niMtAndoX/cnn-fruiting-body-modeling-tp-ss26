import { useCallback, useRef } from "react"

import { UploadArea } from "@/components/waldpilz/upload-area"

import { isValidImageFile, type ImageDimensions, type SelectedImage } from "../model/prediction"

interface UploadFormProps {
  onError?: (message: string) => void
  onImageSelected: (selectedImage: SelectedImage) => void
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("Unerwartetes Dateiformat"))
    }
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden"))
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(imageUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        height: image.naturalHeight,
        width: image.naturalWidth,
      })
    }
    image.onerror = () => reject(new Error("Bild konnte nicht geladen werden"))
    image.src = imageUrl
  })
}

export function UploadForm({ onError, onImageSelected }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File | null | undefined) => {
    if (!file) {
      return
    }

    if (!isValidImageFile(file)) {
      onError?.("Bitte wähle ein gültiges Bild aus.")
      return
    }

    try {
      const imageUrl = await readFileAsDataUrl(file)
      const dimensions = await getImageDimensions(imageUrl)
      onImageSelected({ dimensions, file, imageUrl })
    } catch {
      onError?.("Das ausgewählte Bild konnte nicht geladen werden.")
    }
  }, [onError, onImageSelected])

  const handleFileDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    void processFile(event.dataTransfer.files[0])
  }, [processFile])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0])
    event.target.value = ""
  }, [processFile])

  return (
    <UploadArea
      onFileDrop={handleFileDrop}
      onFileSelect={handleFileSelect}
      fileInputRef={fileInputRef}
    />
  )
}
