import backgroundWald from "@/components/wald_background.jpg"
import { Header } from "@/components/waldpilz/header"
import { BenchmarkProgress } from "@/features/benchmark/components/BenchmarkProgress"
import { BenchmarkResultView } from "@/features/benchmark/components/BenchmarkResultView"
import { BenchmarkUploadForm } from "@/features/benchmark/components/BenchmarkUploadForm"
import { useBenchmark } from "@/features/benchmark/hooks/useBenchmark"
import { useCallback, useState } from "react"

export default function BenchmarkPage() {
  const [testArchive, setTestArchive] = useState<File | null>(null)
  const [labelArchive, setLabelArchive] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { startBenchmark, isLoading, error, result, status, reset } = useBenchmark()

  const handleTestArchiveSelected = useCallback((file: File) => {
    setTestArchive(file)
    setFormError(null)
    reset()
  }, [reset])

  const handleLabelArchiveSelected = useCallback((file: File) => {
    setLabelArchive(file)
    setFormError(null)
    reset()
  }, [reset])

  const handleStart = useCallback(async () => {
    if (!testArchive || !labelArchive) return
    await startBenchmark(testArchive, labelArchive)
  }, [startBenchmark, testArchive, labelArchive])

  const displayedError = formError ?? error

  function handleDownload() {
    const link = document.createElement("a");
    
    link.href = "/Benchmark Testdaten.zip"; 
    link.download = "Benchmark Testdaten.zip"; 
    
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div
      className="min-h-screen bg-background bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundWald})` }}
    >
      <Header />
      <div className="opacity-0">Benchmark Page</div>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card/90 rounded-lg border-4 border-border relative">
          <div className="py-6 px-16 space-y-6">
            <BenchmarkUploadForm
              testArchive={testArchive}
              labelArchive={labelArchive}
              isLoading={isLoading}
              onTestArchiveSelected={handleTestArchiveSelected}
              onLabelArchiveSelected={handleLabelArchiveSelected}
              onTestArchiveError={setFormError}
              onLabelArchiveError={setFormError}
              onStart={handleStart}
              download={handleDownload}
            />

            <BenchmarkProgress status={status} error={displayedError} />

            <BenchmarkResultView result={result} status={status} />
          </div>
        </div>
      </main>
    </div>
  )
}
