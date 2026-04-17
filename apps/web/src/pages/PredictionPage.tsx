import backgroundWald from "@/components/background_wald.jpg"
import { AnalysisPanel } from "@/components/waldpilz/analysis-panel"
import { Header } from "@/components/waldpilz/header"
import { HistorySection } from "@/components/waldpilz/history-section"
import { LogPanel } from "@/components/waldpilz/log-panel"
import { UploadArea } from "@/components/waldpilz/upload-area"
import { useCallback, useRef, useState } from "react"

export interface LogEntry {
  id: string
  timestamp: string
  message: string
  icon: "camera" | "search" | "check"
}

export interface DetectionResult {
  label: string
  score: number
  bbox: { x: number; y: number; width: number; height: number } | null
}

export interface AnalysisResult {
  id: string
  imageUrl: string
  boundingBoxes: { x: number; y: number; width: number; height: number }[]
  detections: DetectionResult[]
  logs: LogEntry[]
  mushroomColor: string
}

const MUSHROOM_COLORS = ["#016401", "#074710", "#2B1A17", "#4A2C2A", "#654422"]

export default function PredictionPage() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentLogs, setCurrentLogs] = useState<LogEntry[]>([])
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<{ x: number; y: number; width: number; height: number }[]>([])
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

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

      const img = new Image()
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }
      img.src = imageUrl

      setCurrentImage(imageUrl)
      setSelectedFile(file)
      setCurrentLogs([])
      setBoundingBoxes([])
      setDetections([])
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
    if (!currentImage || !selectedFile) return

    if (!imageDimensions) {
      addLog("Bild wird noch geladen...", "search")
      return
    }

    setIsAnalyzing(true)
    setCurrentLogs([])
    setBoundingBoxes([])
    setDetections([])

    addLog("Analyse gestartet...", "search")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("http://127.0.0.1:8000/api/v1/predict", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`)
      }

      const result = await response.json()

      addLog("Bildverarbeitung läuft...", "search")
      addLog("Pilzerkennung aktiv...", "search")

      const apiDetections: DetectionResult[] = (result.detections ?? []).map((detection: any) => ({
        label: detection.label,
        score: detection.score,
        bbox: detection.bbox,
      }))

      const newBoxes = apiDetections
        .filter((detection) => detection.bbox !== null)
        .map((detection) => ({
          x: (detection.bbox!.x / imageDimensions.width) * 100,
          y: (detection.bbox!.y / imageDimensions.height) * 100,
          width: (detection.bbox!.width / imageDimensions.width) * 100,
          height: (detection.bbox!.height / imageDimensions.height) * 100,
        }))

      setDetections(apiDetections)
      setBoundingBoxes(newBoxes)

      addLog(`${apiDetections.length} Pilz(e) erkannt`, "check")
      addLog("Analyse abgeschlossen!", "check")

      const historyEntry: AnalysisResult = {
        id: crypto.randomUUID(),
        imageUrl: currentImage,
        boundingBoxes: newBoxes,
        detections: apiDetections,
        logs: [
          { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: "Analyse gestartet...", icon: "search" },
          { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: "Bildverarbeitung läuft...", icon: "search" },
          { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: "Pilzerkennung aktiv...", icon: "search" },
          { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: `${apiDetections.length} Pilz(e) erkannt`, icon: "check" },
          { id: crypto.randomUUID(), timestamp: generateTimestamp(), message: "Analyse abgeschlossen!", icon: "check" },
        ],
        mushroomColor: MUSHROOM_COLORS[history.length % 5],
      }

      setHistory((prev) => {
        const newHistory = [historyEntry, ...prev]
        return newHistory.slice(0, 5)
      })

      setCurrentLogs(historyEntry.logs)
    } catch {
      addLog("Analyse fehlgeschlagen", "check")
    } finally {
      setIsAnalyzing(false)
    }
  }, [currentImage, selectedFile, imageDimensions, addLog, history.length])

  const handleHistorySelect = useCallback((index: number) => {
    const result = history[index]
    if (result) {
      setSelectedHistoryIndex(index)
      setCurrentImage(result.imageUrl)
      setBoundingBoxes(result.boundingBoxes)
      setDetections(result.detections)
      setCurrentLogs(result.logs)
    }
  }, [history])

  const handleClose = useCallback(() => {
    setCurrentImage(null)
    setSelectedFile(null)
    setCurrentLogs([])
    setBoundingBoxes([])
    setDetections([])
    setImageDimensions(null)
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

            {detections.length > 0 && (
              <div className="bg-card/90 rounded-lg border border-border p-4">
                <h3 className="text-lg font-semibold mb-2">Erkannte Pilze</h3>
                <div className="space-y-2">
                  {detections.map((detection, index) => (
                    <div key={index} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="font-medium">{detection.label}</span>
                      <span>{(detection.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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