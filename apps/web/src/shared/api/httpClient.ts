import { ENV } from "../config/env"

export class HttpClientError extends Error {
  status: number | null

  constructor(message: string, options?: { status?: number | null }) {
    super(message)
    this.name = "HttpClientError"
    this.status = options?.status ?? null
  }
}

function buildUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "")
  return `${ENV.API_URL}/${normalizedPath}`
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload
  }

  if (typeof payload !== "object" || payload === null) {
    return null
  }

  const record = payload as Record<string, unknown>
  const candidates = [record.detail, record.message, record.error]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  return null
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

async function createHttpError(response: Response): Promise<HttpClientError> {
  let message = `Die Anfrage konnte nicht abgeschlossen werden (HTTP ${response.status}).`

  try {
    const payload = await readResponseBody(response)
    message = extractErrorMessage(payload) ?? message
  } catch {
    // Fall back to the default HTTP status message above.
  }

  return new HttpClientError(message, { status: response.status })
}

export async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  let response: Response

  try {
    response = await fetch(buildUrl(path), init)
  } catch {
    throw new HttpClientError("Der Backend-Service ist aktuell nicht erreichbar.")
  }

  if (!response.ok) {
    throw await createHttpError(response)
  }

  return readResponseBody(response) as Promise<TResponse>
}
