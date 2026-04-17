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
  type SelectedImage,
} from "@/features/prediction/model/prediction"

export default function PredictionPage() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
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
    const completedPrediction = await analyzeImage(selectedImage)

    if (!completedPrediction || !selectedImage) {
      return
    }

    setHistory((prev) => {
      const historyEntry = createAnalysisHistoryEntry({
        historyLength: prev.length,
        imageUrl: selectedImage.imageUrl,
        logs: completedPrediction.logs,
        prediction: completedPrediction.result,
        status: completedPrediction.status,
      })

      return [historyEntry, ...prev].slice(0, 5)
    })
  }, [analyzeImage, selectedImage])

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
    <div
      className="min-h-screen bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundWald})` }}
    >
      <Header />
      <div className="opacity-0">Prediction Page</div>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card/90 rounded-lg border-4 border-border relative">
          <div className="p-6 space-y-6">
            <UploadForm onImageSelected={handleImageSelected} />

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
              hasImage={selectedImage !== null}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
