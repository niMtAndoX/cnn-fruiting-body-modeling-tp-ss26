import { HttpClientError, request } from "@/shared/api/httpClient"

import { isZipFile, normalizeBenchmarkResponse, type BenchmarkResponse } from "../model/benchmarkTypes"

export class BenchmarkRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BenchmarkRequestError"
  }
}

export async function runBenchmark(
  testArchive: File,
  labelArchive: File,
  modelVersion?: string | null,
): Promise<BenchmarkResponse> {
  if (!isZipFile(testArchive)) {
    throw new BenchmarkRequestError("Bitte wähle eine gültige ZIP-Datei für die Testbilder aus.")
  }

  if (!isZipFile(labelArchive)) {
    throw new BenchmarkRequestError("Bitte wähle eine gültige ZIP-Datei für die Labels aus.")
  }

  const formData = new FormData()
  formData.append("test_archive", testArchive)
  formData.append("label_archive", labelArchive)
  if (modelVersion) {
    formData.append("model_version", modelVersion)
  }

  try {
    const response = await request<unknown>("benchmark", {
      method: "POST",
      body: formData,
    })
    return normalizeBenchmarkResponse(response)
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new BenchmarkRequestError(error.message)
    }

    throw error
  }
}
