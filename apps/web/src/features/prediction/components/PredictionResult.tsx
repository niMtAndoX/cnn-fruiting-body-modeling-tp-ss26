import { useState } from "react"
import { Check, Copy, CheckCircle2, AlertTriangle, ScanSearch } from "lucide-react"
import type { PredictionDisplayResult, PredictionFlowStatus } from "../model/prediction"

interface PredictionResultProps {
  errorMessage?: string | null
  result: PredictionDisplayResult | null
  status: PredictionFlowStatus
}

function formatInferenceTime(inferenceTimeMs: number | null): string {
  if (inferenceTimeMs === null) {
    return "Nicht verfügbar"
  }

  return `${inferenceTimeMs.toFixed(0)} ms`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 shrink-0 rounded-full p-1 text-[#6d7d71] transition-colors hover:bg-[#eef2ec] hover:text-[#223127]"
      aria-label="Kopieren"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#314a37]/10 bg-white/72 px-4 py-3 text-sm shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64786a]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate font-medium text-[#213126]">{value}</p>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

function ResultMetadata({ result }: { result: PredictionDisplayResult }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <MetadataCard label="Request ID" value={result.requestId ?? "Nicht verfügbar"} />
      <MetadataCard label="Model-Version" value={result.modelVersion ?? "Nicht verfügbar"} />
      <MetadataCard label="Inference-Zeit" value={formatInferenceTime(result.inferenceTimeMs)} />
    </div>
  )
}

function buildRawJson(result: PredictionDisplayResult): string {
  return JSON.stringify(
    {
      detections: result.detections,
      requestId: result.requestId,
      modelVersion: result.modelVersion,
      inferenceTimeMs: result.inferenceTimeMs,
    },
    null,
    2,
  )
}

function CopyJsonButton({ result }: { result: PredictionDisplayResult }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(buildRawJson(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-full border border-[#314a37]/12 bg-white/75 px-3 py-2 text-xs font-medium text-[#53675a] transition-colors hover:bg-white hover:text-[#223127]"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "JSON kopiert" : "Roh-Antwort als JSON kopieren"}
    </button>
  )
}

export function PredictionResult({
  errorMessage = null,
  result,
  status,
}: PredictionResultProps) {
  if (status === "idle" || status === "loading") {
    return null
  }

  if (status === "error") {
    return (
      <div className="rounded-[28px] border border-red-400/20 bg-[linear-gradient(180deg,rgba(255,245,245,0.92),rgba(249,232,232,0.9))] p-5 shadow-[0_16px_45px_rgba(81,24,24,0.08)]">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#301b1b]">Analyse fehlgeschlagen</h3>
            <p className="mt-2 text-sm leading-6 text-[#6a5555]">
              {errorMessage ?? "Die Anfrage konnte nicht erfolgreich verarbeitet werden."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  if (status === "empty") {
    return (
      <div className="space-y-5 rounded-[28px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(243,239,231,0.88))] p-5 shadow-[0_18px_55px_rgba(35,43,35,0.07)]">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e7eee7] text-[#2d5b3b]">
            <ScanSearch className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#617769]">Ergebnis</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#213126]">Keine Pilze erkannt</h3>
            <p className="mt-2 text-sm leading-6 text-[#68796d]">
              Die Analyse war erfolgreich, aber es wurden keine passenden Objekte im Bild gefunden.
            </p>
          </div>
        </div>
        <ResultMetadata result={result} />
        <CopyJsonButton result={result} />
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-[28px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(243,239,231,0.9))] p-5 shadow-[0_18px_55px_rgba(35,43,35,0.07)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e7eee7] text-[#2d5b3b]">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#617769]">Ergebnis</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#213126]">Erkannte Pilze</h3>
          </div>
        </div>

        <CopyJsonButton result={result} />
      </div>

      <div className="grid gap-3">
        {result.detections.map((detection, index) => (
          <div
            key={`${detection.label}-${index}`}
            className="grid gap-3 rounded-[22px] border border-[#314a37]/10 bg-white/72 px-4 py-4 shadow-sm md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64786a]">
                Objekt {index + 1}
              </p>
              <p className="mt-1 text-base font-semibold text-[#213126]">{detection.label}</p>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <span className="rounded-full bg-[#edf4ee] px-3 py-1 text-sm font-semibold text-[#2d5b3b]">
                {(detection.score * 100).toFixed(0)}%
              </span>
              <CopyButton value={`${detection.label} - ${(detection.score * 100).toFixed(0)}%`} />
            </div>
          </div>
        ))}
      </div>

      <ResultMetadata result={result} />
    </div>
  )
}
