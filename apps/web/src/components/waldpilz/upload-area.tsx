"use client"

import { useState, useCallback, type RefObject } from "react"
import { Upload, Camera, Image as ImageIcon, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface UploadAreaProps {
  onFileDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFileName?: string | null
}

function MobileImageSourceSheet({
  isOpen,
  onOpenChange,
  onChooseExisting,
  onTakePhoto,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onChooseExisting: () => void
  onTakePhoto: () => void
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[24px] border-none bg-stone-50/95 px-5 pb-8 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-semibold text-[#1f3124]">
            Bildquelle wählen
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 flex flex-col gap-3">
          <Button
            variant="outline"
            className="h-14 justify-start gap-3 rounded-2xl border-[#314a37]/15 bg-white/80 text-[#1f3124] shadow-sm hover:bg-white"
            onClick={onChooseExisting}
          >
            <ImageIcon className="size-5" />
            Vorhandenes Bild auswählen
          </Button>
          <Button
            variant="outline"
            className="h-14 justify-start gap-3 rounded-2xl border-[#314a37]/15 bg-white/80 text-[#1f3124] shadow-sm hover:bg-white"
            onClick={onTakePhoto}
          >
            <Camera className="size-5" />
            Neues Foto aufnehmen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
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
  }, [fileInputRef, isMobile])

  const handleChooseExisting = useCallback(() => {
    fileInputRef.current?.click()
    setIsSheetOpen(false)
  }, [fileInputRef])

  const handleTakePhoto = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
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
        className={`rounded-[22px] border px-4 py-4 transition-all duration-200 ${
          isDragging
            ? "border-emerald-700/50 bg-emerald-50/90 shadow-lg shadow-emerald-950/10"
            : "border-[#314a37]/12 bg-white/82 shadow-[0_14px_40px_rgba(34,45,34,0.08)]"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-stone-200 text-[#23412d] shadow-inner">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7662]">
                Aktives Bild
              </p>
              <p className="mt-1 truncate text-sm font-medium text-[#213126]">
                {selectedFileName}
              </p>
              <p className="mt-1 text-xs text-[#68796d]">
                Das Bild ist geladen und kann erneut analysiert oder ersetzt werden.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            className="h-11 rounded-2xl border-[#314a37]/15 bg-[#f7f4ee] px-4 text-[#213126] hover:bg-white"
          >
            Bild ersetzen
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <MobileImageSourceSheet
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onChooseExisting={handleChooseExisting}
          onTakePhoto={handleTakePhoto}
        />

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
      className={`rounded-[28px] border border-dashed p-6 transition-all duration-200 sm:p-8 ${
        isDragging
          ? "border-emerald-700/50 bg-emerald-50/80 shadow-[0_20px_50px_rgba(37,70,45,0.12)]"
          : "border-[#314a37]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,239,230,0.86))] shadow-[0_18px_60px_rgba(35,43,35,0.08)] hover:border-emerald-700/30 hover:bg-white/90"
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b735f]">
              Bildquelle
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#213126]">
              Foto für die Analyse hochladen
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#68796d]">
              Lade eine Nahaufnahme hoch oder ziehe sie direkt hierher. Danach erscheint das Bild
              sofort in der Analysefläche.
            </p>
          </div>

          <div className="rounded-[22px] border border-[#314a37]/10 bg-[#f3efe7]/80 p-3 text-sm text-[#55685a] md:min-w-[12rem]">
            <div>
              <p className="font-medium text-[#213126]">Formate</p>
              <p>JPG, PNG, WEBP</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border border-[#314a37]/10 bg-white/72 px-6 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#e0ebde] to-[#d2c6b4] text-[#23412d] shadow-inner">
            <Upload className="size-8" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-[#213126]">Bild hier ablegen oder manuell auswählen</p>
            <p className="mx-auto max-w-md text-sm leading-6 text-[#6a796f]">
              Für die besten Ergebnisse empfehlen wir ein scharfes, gut ausgeleuchtetes Bild mit
              möglichst wenig Hintergrundrauschen.
            </p>
          </div>

          <Button
            onClick={handleButtonClick}
            className="h-11 rounded-2xl bg-[#2d5b3b] px-5 text-white shadow-[0_12px_30px_rgba(45,91,59,0.28)] hover:bg-[#254b31]"
          >
            Datei auswählen
          </Button>
        </div>
      </div>

      <MobileImageSourceSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onChooseExisting={handleChooseExisting}
        onTakePhoto={handleTakePhoto}
      />

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
