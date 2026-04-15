import { useState, useRef, useCallback } from "react"
import { Header } from "@/components/waldpilz/header"
import { UploadArea } from "@/components/waldpilz/upload-area"
import { AnalysisPanel } from "@/components/waldpilz/analysis-panel"
import { LogPanel } from "@/components/waldpilz/log-panel"
import { HistorySection } from "@/components/waldpilz/history-section"
import backgroundWald from "@/components/wald_background.jpg"

export interface LogEntry {
  id: string
  timestamp: string
  message: string
  icon: "camera" | "search" | "check"
}

export interface AnalysisResult {
  id: string
  imageUrl: string
  boundingBoxes: { x: number; y: number; width: number; height: number }[]
  logs: LogEntry[]
  mushroomColor: string
}

const MUSHROOM_COLORS = ["#016401", "#074710", "#2B1A17", "#4A2C2A", "#654422"]

export default function HomePage() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([])
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<{ x: number; y: number; width: number; height: number }[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const addLog = useCallback((message: string, icon: LogEntry["icon"]) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: generateTimestamp(),
      message,
      icon,
    }
    setCurrentLogs((prev) => [...prev, newLog])
    return newLog
  }, [])

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setCurrentImage(imageUrl)
      setCurrentLogs([])
      setBoundingBoxes([])
      setSelectedHistoryIndex(null)
      addLog("Bild erfolgreich hochgeladen", "camera")
    }
    reader.readAsDataURL(file)
  }, [addLog])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleAnalyze = useCallback(async () => {
    if (!currentImage) return

    setIsAnalyzing(true)
    setCurrentLogs([])
    setBoundingBoxes([])

    // Platzhalter für Analyseprozess
    await new Promise((resolve) => setTimeout(resolve, 500))
    addLog("Analyse gestartet...", "search")

    await new Promise((resolve) => setTimeout(resolve, 1000))
    addLog("Bildverarbeitung läuft...", "search")

    await new Promise((resolve) => setTimeout(resolve, 800))
    addLog("Pilzerkennung aktiv...", "search")

    // Zufällige Anzahl von Pilzen generieren
    const numBoxes = Math.floor(Math.random() * 3) + 1
    const newBoxes = Array.from({ length: numBoxes }, () => ({
      x: Math.random() * 60 + 10,
      y: Math.random() * 60 + 10,
      width: Math.random() * 20 + 15,
      height: Math.random() * 20 + 15,
    }))
    setBoundingBoxes(newBoxes)

    await new Promise((resolve) => setTimeout(resolve, 600))
    addLog(`${numBoxes} Pilz(e) erkannt`, "check")

    await new Promise((resolve) => setTimeout(resolve, 400))
    addLog("Analyse abgeschlossen!", "check")

    // History aktualisieren
    const historyEntry: AnalysisResult = {
      id: crypto.randomUUID(),
      imageUrl: currentImage,
      boundingBoxes: newBoxes,
      logs: [...currentLogs, 
        { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: `${numBoxes} Pilz(e) erkannt`, icon: "check" as const },
        { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: "Analyse abgeschlossen!", icon: "check" as const }
      ],
      mushroomColor: MUSHROOM_COLORS[history.length % 5],
    }

    setHistory((prev) => {
      const newHistory = [historyEntry, ...prev]
      return newHistory.slice(0, 5)
    })

    setIsAnalyzing(false)
  }, [currentImage, addLog, currentLogs, history.length])

  const handleHistorySelect = useCallback((index: number) => {
    const result = history[index]
    if (result) {
      setSelectedHistoryIndex(index)
      setCurrentImage(result.imageUrl)
      setBoundingBoxes(result.boundingBoxes)
      setCurrentLogs(result.logs)
    }
  }, [history])

  const handleClose = useCallback(() => {
    setCurrentImage(null)
    setCurrentLogs([])
    setBoundingBoxes([])
    setSelectedHistoryIndex(null)
  }, [])

  return (
    <div
      className="min-h-screen bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundWald})` }}
    >
      <Header />
      <div className="opacity-0">Prediction Page</div>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card/90 rounded-lg border-4 border-border relative">

          <div className="p-6 space-y-6">
            <UploadArea
              onFileDrop={handleFileDrop}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnalysisPanel
                imageUrl={currentImage}
                boundingBoxes={boundingBoxes}
                onClose={handleClose}
              />
              <LogPanel
                logs={currentLogs}
                isAnalyzing={isAnalyzing}
              />
            </div>

            <HistorySection
              history={history}
              selectedIndex={selectedHistoryIndex}
              onSelect={handleHistorySelect}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              hasImage={!!currentImage}
            />
          </div>
        </div>
      </main>
    </div>
  )
}