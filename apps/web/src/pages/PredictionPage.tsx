import { useCallback, useState } from "react"
import { Header } from "@/components/waldpilz/header"
import { AnalysisPanel } from "@/components/waldpilz/analysis-panel"
import { LogPanel } from "@/components/waldpilz/log-panel"
import { HistorySection } from "@/components/waldpilz/history-section"
import backgroundWald from "@/components/wald_background.jpg"
import { PredictionResult } from "@/features/prediction/components/PredictionResult"
import { UploadForm } from "@/features/prediction/components/UploadForm"
import { usePrediction } from "@/features/prediction/hooks/usePrediction"
import {
  createAnalysisHistoryEntry,
  type AnalysisResult,
  type ImageDimensions,
  type SelectedImage,
} from "@/features/prediction/model/prediction"

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

async function createSelectedImageFromHistoryEntry(entry: AnalysisResult): Promise<SelectedImage> {
  const response = await fetch(entry.imageUrl)
  const blob = await response.blob()
  const extension = blob.type.split("/")[1] || "png"
  const file = new File([blob], `prediction-history.${extension}`, {
    type: blob.type || "image/png",
  })

  return {
    dimensions: entry.dimensions ?? await getImageDimensions(entry.imageUrl),
    file,
    imageUrl: entry.imageUrl,
  }
}

export default function PredictionPage() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const stored = sessionStorage.getItem("prediction-history")
      return stored ? (JSON.parse(stored) as AnalysisResult[]) : []
    } catch {
      return []
    }
  })
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  const {
    analyzeImage,
    errorMessage,
    handleImageSelected: registerImageSelection,
    isAnalyzing,
    logs,
    reset,
    result,
    status,
  } = usePrediction()

  const selectedHistoryEntry = selectedHistoryIndex !== null ? history[selectedHistoryIndex] ?? null : null

  const displayedImageUrl = selectedHistoryEntry?.imageUrl ?? selectedImage?.imageUrl ?? null
  const displayedPrediction = selectedHistoryEntry?.prediction ?? result
  const displayedStatus = selectedHistoryEntry?.status ?? status
  const displayedErrorMessage = selectedHistoryEntry?.errorMessage ?? errorMessage
  const displayedLogs = selectedHistoryEntry?.logs ?? logs

  const handleImageSelected = useCallback((image: SelectedImage) => {
    setSelectedImage(image)
    setSelectedHistoryIndex(null)
    registerImageSelection()
  }, [registerImageSelection])

  const handleAnalyze = useCallback(async () => {
    const imageToAnalyze =
      selectedImage ?? (selectedHistoryEntry ? await createSelectedImageFromHistoryEntry(selectedHistoryEntry) : null)

    if (!imageToAnalyze) {
      await analyzeImage(null)
      return
    }

    setSelectedImage(imageToAnalyze)
    setSelectedHistoryIndex(null)

    const completedPrediction = await analyzeImage(imageToAnalyze)

    if (!completedPrediction) {
      return
    }

    setHistory((prev) => {
      const historyEntry = createAnalysisHistoryEntry({
        historyLength: prev.length,
        dimensions: imageToAnalyze.dimensions,
        imageUrl: imageToAnalyze.imageUrl,
        logs: completedPrediction.logs,
        prediction: completedPrediction.result,
        status: completedPrediction.status,
      })

      const newHistory = [historyEntry, ...prev].slice(0, 5)
      try {
        sessionStorage.setItem("prediction-history", JSON.stringify(newHistory))
      } catch {
        // ignore quota errors
      }
      return newHistory
    })
  }, [analyzeImage, selectedHistoryEntry, selectedImage])

  const handleHistorySelect = useCallback((index: number) => {
    if (history[index]) {
      setSelectedHistoryIndex(index)
      setSelectedImage(null)
      reset()
    }
  }, [history, reset])

  const handleClose = useCallback(() => {
    setSelectedImage(null)
    setSelectedHistoryIndex(null)
    reset()
  }, [reset])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${backgroundWald})`, filter: "blur(4px)" }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 min-h-screen">
        <Header />
        <div className="opacity-0">Prediction Page</div>

        <main className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="bg-card/90 rounded-lg border-4 border-border relative">
            <div className="p-6 space-y-6">
              <UploadForm
                onImageSelected={handleImageSelected}
                selectedFileName={selectedImage?.file.name ?? null}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnalysisPanel
                  imageUrl={displayedImageUrl}
                  boundingBoxes={displayedPrediction?.boundingBoxes ?? []}
                  onClose={handleClose}
                />
                <LogPanel
                  errorMessage={displayedErrorMessage}
                  hasImage={Boolean(displayedImageUrl)}
                  logs={displayedLogs}
                  isAnalyzing={isAnalyzing}
                  status={displayedStatus}
                />
              </div>

              <PredictionResult
                errorMessage={displayedErrorMessage}
                result={displayedPrediction}
                status={displayedStatus}
              />

              <HistorySection
                history={history}
                selectedIndex={selectedHistoryIndex}
                onSelect={handleHistorySelect}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                hasImage={selectedImage !== null || selectedHistoryEntry !== null}
                hasResult={displayedPrediction !== null}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
