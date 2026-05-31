import { HttpClientError, request } from "@/shared/api/httpClient"

import {
  normalizeAvailableModelsResponse,
  type AvailableModelsResponse,
} from "../model/models"

export class ModelSelectionRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ModelSelectionRequestError"
  }
}

export async function getAvailableModels(): Promise<AvailableModelsResponse> {
  try {
    const response = await request<unknown>("models")
    return normalizeAvailableModelsResponse(response)
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new ModelSelectionRequestError(error.message)
    }

    throw error
  }
}
