export interface AvailableModelsResponse {
  availableModels: string[]
  defaultModelVersion: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

export function normalizeAvailableModelsResponse(value: unknown): AvailableModelsResponse {
  const record = asRecord(value)
  const availableModels = Array.isArray(record?.available_models)
    ? record.available_models.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : []

  return {
    availableModels,
    defaultModelVersion: asNullableString(record?.default_model_version),
  }
}
