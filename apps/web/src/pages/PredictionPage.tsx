import { useCallback, useState } from "react"
import { Header } from "@/components/waldpilz/header"
import { SiteFooter } from "@/components/waldpilz/site-footer"
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
  const displayedImageDimensions = selectedHistoryEntry?.dimensions ?? selectedImage?.dimensions ?? null
  const displayedPrediction = selectedHistoryEntry?.prediction ?? result
  const displayedStatus = selectedHistoryEntry?.status ?? status
  const displayedErrorMessage = selectedHistoryEntry?.errorMessage ?? errorMessage
  const displayedLogs = selectedHistoryEntry?.logs ?? logs
  const activeImageLabel =
    selectedImage?.file.name ?? (selectedHistoryEntry ? "Bild aus Verlauf" : null)

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
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundWald})`, filter: "blur(5px) saturate(0.85)" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,28,21,0.8),rgba(23,35,27,0.68)_24%,rgba(18,28,22,0.56)_100%)]" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(214,230,214,0.16), transparent 34%), radial-gradient(circle at 80% 10%, rgba(112,84,58,0.12), transparent 30%)",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <Header />
        <div className="opacity-0">Prediction Page</div>

        <main className="container mx-auto max-w-6xl px-4 py-8">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,34,28,0.82),rgba(44,58,46,0.72))] px-6 py-7 shadow-[0_28px_90px_rgba(14,22,17,0.26)] backdrop-blur-xl sm:px-8">
              <div className="max-w-3xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                    Analyse
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Bildanalyse für Lackporlinge
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-200/82 sm:text-base">
                    Bild hochladen, Analyse starten und erkannte Treffer mit Bounding Boxes,
                    Protokoll und Metadaten prüfen.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(250,248,243,0.92),rgba(242,238,229,0.88))] p-5 shadow-[0_26px_80px_rgba(28,34,28,0.10)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 border-b border-[#314a37]/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
                    Workflow
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#213126]">
                    Bild laden, prüfen und analysieren
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <UploadForm
                    onImageSelected={handleImageSelected}
                    selectedFileName={activeImageLabel}
                  />
                  {displayedImageUrl ? (
                    <AnalysisPanel
                      imageUrl={displayedImageUrl}
                      imageDimensions={displayedImageDimensions}
                      boundingBoxes={displayedPrediction?.boundingBoxes ?? []}
                      onClose={handleClose}
                    />
                  ) : null}
                </div>

                <LogPanel
                  errorMessage={displayedErrorMessage}
                  hasImage={Boolean(displayedImageUrl)}
                  logs={displayedLogs}
                  isAnalyzing={isAnalyzing}
                  status={displayedStatus}
                />
              </div>
            </section>

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
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
