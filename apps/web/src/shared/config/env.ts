interface Config {
  API_URL: string
}

const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1"

function normalizeApiUrl(value: string): string {
  return value.replace(/\/+$/, "")
}

export const ENV: Config = {
  API_URL: normalizeApiUrl(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL),
}
