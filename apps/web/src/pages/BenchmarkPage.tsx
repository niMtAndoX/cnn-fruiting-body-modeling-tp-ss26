import { useCallback, useState } from "react"
import backgroundWald from "@/components/wald_background.jpg"
import { Header } from "@/components/waldpilz/header"
import { SiteFooter } from "@/components/waldpilz/site-footer"
import { BenchmarkProgress } from "@/features/benchmark/components/BenchmarkProgress"
import { BenchmarkResultView } from "@/features/benchmark/components/BenchmarkResultView"
import { BenchmarkUploadForm } from "@/features/benchmark/components/BenchmarkUploadForm"
import { useBenchmark } from "@/features/benchmark/hooks/useBenchmark"

export default function BenchmarkPage() {
  const [testArchive, setTestArchive] = useState<File | null>(null)
  const [labelArchive, setLabelArchive] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { startBenchmark, isLoading, error, result, status, imgMap, reset } = useBenchmark()

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
  }, [labelArchive, startBenchmark, testArchive])

  const displayedError = formError ?? error

  function handleDownload() {
    const link = document.createElement("a")
    link.href = "/Benchmark Testdaten.zip"
    link.download = "Benchmark Testdaten.zip"
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

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
            "radial-gradient(circle at 18% 0%, rgba(214,230,214,0.16), transparent 34%), radial-gradient(circle at 82% 12%, rgba(112,84,58,0.12), transparent 30%)",
        }}
      />

      <div className="relative z-10 min-h-screen">
        <Header />
        <div className="opacity-0">Benchmark Page</div>

        <main className="container mx-auto max-w-6xl px-4 py-8">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,34,28,0.82),rgba(44,58,46,0.72))] px-6 py-7 shadow-[0_28px_90px_rgba(14,22,17,0.26)] backdrop-blur-xl sm:px-8">
              <div className="max-w-3xl">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
                    Benchmark
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Modellqualität strukturiert auswerten
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-200/82 sm:text-base">
                    Führe reproduzierbare Benchmark-Läufe mit Testbildern und Ground-Truth-Labels
                    durch, prüfe technische Kennzahlen und analysiere die Ergebnisverteilung pro Bild.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(250,248,243,0.92),rgba(242,238,229,0.88))] p-5 shadow-[0_26px_80px_rgba(28,34,28,0.10)] backdrop-blur-xl sm:p-6">
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
            </section>

            <BenchmarkProgress status={status} error={displayedError} />

            <BenchmarkResultView result={result} status={status} imgMap={imgMap ? imgMap : new Map<string, string>()}/>
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
