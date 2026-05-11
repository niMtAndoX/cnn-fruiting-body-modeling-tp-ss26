export type BenchmarkStatus = "idle" | "loading" | "success" | "error"

export interface BenchmarkResponse {
  requestId: string | null
  modelVersion: string | null
  processingTimeMs: number | null
  precision: number | null
  recall: number | null
  f1Score: number | null
  mAP: number | null
  totalImages: number | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function normalizeBenchmarkResponse(value: unknown): BenchmarkResponse {
  const record = asRecord(value)

  return {
    requestId: asNullableString(record?.request_id),
    modelVersion: asNullableString(record?.model_version),
    processingTimeMs: asNullableNumber(record?.processing_time_ms),
    precision: asNullableNumber(record?.precision),
    recall: asNullableNumber(record?.recall),
    f1Score: asNullableNumber(record?.f1_score),
    mAP: asNullableNumber(record?.map),
    totalImages: asNullableNumber(record?.total_images),
  }
}

export function isZipFile(file: File | null | undefined): file is File {
  return Boolean(
    file &&
      (file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.name.toLowerCase().endsWith(".zip")),
  )
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
