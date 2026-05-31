import { useCallback, useEffect, useState } from "react"

import { getAvailableModels } from "../api/models"

const MODEL_SELECTION_SESSION_KEY = "selected-model-version"

function readStoredModelVersion(): string | null {
  try {
    return sessionStorage.getItem(MODEL_SELECTION_SESSION_KEY)
  } catch {
    return null
  }
}

function persistModelVersion(modelVersion: string | null): void {
  try {
    if (modelVersion) {
      sessionStorage.setItem(MODEL_SELECTION_SESSION_KEY, modelVersion)
      return
    }

    sessionStorage.removeItem(MODEL_SELECTION_SESSION_KEY)
  } catch {
    // ignore storage access errors
  }
}

function resolveSelectedModelVersion(options: {
  availableModels: string[]
  currentSelectedModelVersion: string | null
  defaultModelVersion: string | null
}): string | null {
  const { availableModels, currentSelectedModelVersion, defaultModelVersion } = options

  if (currentSelectedModelVersion && availableModels.includes(currentSelectedModelVersion)) {
    return currentSelectedModelVersion
  }

  if (defaultModelVersion && availableModels.includes(defaultModelVersion)) {
    return defaultModelVersion
  }

  return availableModels[0] ?? null
}

export function useModelSelection() {
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModelVersion, setSelectedModelVersionState] = useState<string | null>(() => (
    readStoredModelVersion()
  ))
  const [defaultModelVersion, setDefaultModelVersion] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isActive = true

    async function loadAvailableModels() {
      setIsLoading(true)

      try {
        const response = await getAvailableModels()
        if (!isActive) {
          return
        }

        setAvailableModels(response.availableModels)
        setDefaultModelVersion(response.defaultModelVersion)

        const nextSelectedModelVersion = resolveSelectedModelVersion({
          availableModels: response.availableModels,
          currentSelectedModelVersion: readStoredModelVersion(),
          defaultModelVersion: response.defaultModelVersion,
        })

        setSelectedModelVersionState(nextSelectedModelVersion)
        persistModelVersion(nextSelectedModelVersion)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        setAvailableModels([])
        setDefaultModelVersion(null)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Die verfügbaren Modelle konnten nicht geladen werden.",
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadAvailableModels()

    return () => {
      isActive = false
    }
  }, [])

  const setSelectedModelVersion = useCallback((nextModelVersion: string) => {
    setSelectedModelVersionState(nextModelVersion)
    persistModelVersion(nextModelVersion)
  }, [])

  return {
    availableModels,
    defaultModelVersion,
    errorMessage,
    isLoading,
    selectedModelVersion,
    setSelectedModelVersion,
  }
}
