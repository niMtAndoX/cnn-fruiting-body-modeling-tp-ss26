"use client"

import { useState, useCallback, RefObject } from "react"
import { Upload, Camera, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface UploadAreaProps {
  onFileDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFileName?: string | null
}

export function UploadArea({ onFileDrop, onFileSelect, fileInputRef, selectedFileName }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    setIsDragging(false)
    onFileDrop(e)
  }, [onFileDrop])

  const handleButtonClick = useCallback(() => {
    if (isMobile) {
      setIsSheetOpen(true)
    } else {
      fileInputRef.current?.click()
    }
  }, [isMobile, fileInputRef])

  const handleChooseExisting = useCallback(() => {
    fileInputRef.current?.click()
    setIsSheetOpen(false)
  }, [fileInputRef])

  const handleTakePhoto = useCallback(() => {
    // Temporärer Kamerainput  
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Create a synthetic change event
        const syntheticEvent = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        onFileSelect(syntheticEvent)
      }
    }
    input.click()
    setIsSheetOpen(false)
  }, [onFileSelect])

  if (selectedFileName) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border rounded-lg px-4 py-3 transition-all duration-200
          flex items-center gap-3
          ${isDragging
            ? "border-primary bg-primary/10"
            : "border-border bg-muted/30"
          }
        `}
      >
        <ImageIcon className="size-4 text-foreground/60 shrink-0" />
        <span className="text-sm text-foreground/60 shrink-0">Aktuelles Bild:</span>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{selectedFileName}</span>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button className="text-sm text-primary hover:text-primary/80 transition-colors shrink-0 underline underline-offset-2">
                Bild ersetzen
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
              <SheetHeader>
                <SheetTitle className="text-foreground">Bild auswählen</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 text-foreground"
                  onClick={handleChooseExisting}
                >
                  <ImageIcon className="size-6" />
                  Vorhandenes Foto wählen
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 text-foreground"
                  onClick={handleTakePhoto}
                >
                  <Camera className="size-6" />
                  Neues Foto aufnehmen
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <button
            onClick={handleButtonClick}
            className="text-sm text-primary hover:text-primary/80 transition-colors shrink-0 underline underline-offset-2"
          >
            Bild ersetzen
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-8 transition-all duration-200
        ${isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
        }
      `}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Upload className="size-12 text-foreground/60" />
        <p className="text-lg font-medium text-foreground">
          Zieh dein Bild hierher
        </p>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-accent"
              >
                Datei einfügen
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-xl">
              <SheetHeader>
                <SheetTitle className="text-foreground">Bild auswählen</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 text-foreground"
                  onClick={handleChooseExisting}
                >
                  <ImageIcon className="size-6" />
                  Vorhandenes Foto wählen
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 text-foreground"
                  onClick={handleTakePhoto}
                >
                  <Camera className="size-6" />
                  Neues Foto aufnehmen
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button
            onClick={handleButtonClick}
            className="bg-primary text-primary-foreground hover:bg-accent"
          >
            Datei einfügen
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  )
}
