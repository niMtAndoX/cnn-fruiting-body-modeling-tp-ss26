export type PredictionFlowStatus = "idle" | "loading" | "success" | "empty" | "error"

export interface ImageDimensions {
  width: number
  height: number
}

export interface PredictionBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PredictionDetection {
  label: string
  score: number
  bbox: PredictionBoundingBox | null
}

export interface PredictionResponse {
  detections: PredictionDetection[]
  requestId: string | null
  modelVersion: string | null
  inferenceTimeMs: number | null
}

export interface PredictionDisplayResult extends PredictionResponse {
  boundingBoxes: PredictionBoundingBox[]
}

export interface SelectedImage {
  file: File
  imageUrl: string
  dimensions: ImageDimensions
}

export type LogIcon = "camera" | "search" | "check" | "error"

export interface LogEntry {
  id: string
  timestamp: string
  message: string
  icon: LogIcon
}

export interface AnalysisResult {
  id: string
  imageUrl: string
  prediction: PredictionDisplayResult
  status: Extract<PredictionFlowStatus, "success" | "empty">
  errorMessage: null
  logs: LogEntry[]
  mushroomColor: string
}

const MUSHROOM_COLORS = ["#016401", "#074710", "#2B1A17", "#4A2C2A", "#654422"]

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeBoundingBox(value: unknown): PredictionBoundingBox | null {
  const record = asRecord(value)
  if (!record) return null

  const x = asNullableNumber(record.x)
  const y = asNullableNumber(record.y)
  const width = asNullableNumber(record.width)
  const height = asNullableNumber(record.height)

  if (x === null || y === null || width === null || height === null) {
    return null
  }

  return { x, y, width, height }
}

function normalizeDetection(value: unknown): PredictionDetection | null {
  const record = asRecord(value)
  if (!record) return null

  const label = asNullableString(record.label)
  const score = asNullableNumber(record.score)

  if (label === null || score === null) {
    return null
  }

  return {
    label,
    score,
    bbox: normalizeBoundingBox(record.bbox),
  }
}

export function normalizePredictionResponse(value: unknown): PredictionResponse {
  const record = asRecord(value)
  const detections = Array.isArray(record?.detections)
    ? record.detections.map(normalizeDetection).filter((detection): detection is PredictionDetection => detection !== null)
    : []

  return {
    detections,
    requestId: asNullableString(record?.request_id),
    modelVersion: asNullableString(record?.model_version),
    inferenceTimeMs: asNullableNumber(record?.inference_time_ms),
  }
}

export function isValidImageFile(file: File | null | undefined): file is File {
  return Boolean(file && file.type.startsWith("image/"))
}

export function createLogEntry(message: string, icon: LogIcon): LogEntry {
  const timestamp = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return {
    id: crypto.randomUUID(),
    timestamp,
    message,
    icon,
  }
}

export function formatDetectionSummary(count: number): string {
  if (count === 0) {
    return "Keine Pilze erkannt"
  }

  return `${count} Pilz(e) erkannt`
}

export function getPredictionFlowStatus(
  result: Pick<PredictionResponse, "detections">,
): Extract<PredictionFlowStatus, "success" | "empty"> {
  return result.detections.length > 0 ? "success" : "empty"
}

export function toRelativeBoundingBoxes(
  detections: PredictionDetection[],
  imageDimensions: ImageDimensions,
): PredictionBoundingBox[] {
  return detections
    .filter((detection) => detection.bbox !== null)
    .map((detection) => ({
      x: (detection.bbox!.x / imageDimensions.width) * 100,
      y: (detection.bbox!.y / imageDimensions.height) * 100,
      width: (detection.bbox!.width / imageDimensions.width) * 100,
      height: (detection.bbox!.height / imageDimensions.height) * 100,
    }))
}

export function createPredictionDisplayResult(
  response: PredictionResponse,
  imageDimensions: ImageDimensions,
): PredictionDisplayResult {
  return {
    ...response,
    boundingBoxes: toRelativeBoundingBoxes(response.detections, imageDimensions),
  }
}

export function createAnalysisHistoryEntry({
  imageUrl,
  prediction,
  status,
  logs,
  historyLength,
}: {
  imageUrl: string
  prediction: PredictionDisplayResult
  status: Extract<PredictionFlowStatus, "success" | "empty">
  logs: LogEntry[]
  historyLength: number
}): AnalysisResult {
  return {
    id: crypto.randomUUID(),
    imageUrl,
    prediction,
    status,
    errorMessage: null,
    logs,
    mushroomColor: MUSHROOM_COLORS[historyLength % MUSHROOM_COLORS.length],
  }
}
