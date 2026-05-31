import { HttpClientError, request } from "@/shared/api/httpClient"

import { isValidImageFile, normalizePredictionResponse, type PredictionResponse } from "../model/prediction"

export class PredictionRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PredictionRequestError"
  }
}

export async function predict(
  file: File,
  modelVersion?: string | null,
): Promise<PredictionResponse> {
  if (!isValidImageFile(file)) {
    throw new PredictionRequestError("Bitte wähle ein gültiges Bild aus.")
  }

  const formData = new FormData()
  formData.append("file", file)
  if (modelVersion) {
    formData.append("model_version", modelVersion)
  }

  try {
    const response = await request<unknown>("predict", {
      method: "POST",
      body: formData,
    })
    return normalizePredictionResponse(response)
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new PredictionRequestError(error.message)
    }

    throw error
  }
}
