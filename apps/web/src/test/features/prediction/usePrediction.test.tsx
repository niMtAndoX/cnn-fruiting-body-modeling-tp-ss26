import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, beforeEach, vi } from "vitest"

import { predict } from "@/features/prediction/api/predict"
import { usePrediction } from "@/features/prediction/hooks/usePrediction"
import type { PredictionResponse, SelectedImage } from "@/features/prediction/model/prediction"

vi.mock("@/features/prediction/api/predict", () => ({
  predict: vi.fn(),
}))

const mockedPredict = vi.mocked(predict)

const selectedImage: SelectedImage = {
  dimensions: { width: 800, height: 600 },
  file: new File(["image"], "mushroom.png", { type: "image/png" }),
  imageUrl: "data:image/png;base64,abc",
}

describe("usePrediction", () => {
  beforeEach(() => {
    mockedPredict.mockReset()
  })

  it("sendet ohne Bild keinen Request und setzt einen verständlichen Fehler", async () => {
    const { result } = renderHook(() => usePrediction())

    await act(async () => {
      await result.current.analyzeImage(null)
    })

    expect(mockedPredict).not.toHaveBeenCalled()
    expect(result.current.status).toBe("error")
    expect(result.current.errorMessage).toBe("Bitte wähle zuerst ein Bild aus.")
    expect(result.current.logs.at(-1)?.message).toBe("Bitte wähle zuerst ein Bild aus.")
  })

  it("behandelt einen leeren Erfolgsfall als Erfolg und speichert Metadaten", async () => {
    const response: PredictionResponse = {
      detections: [],
      inferenceTimeMs: 18,
      modelVersion: "detector-2026-04",
      requestId: "req-empty-1",
    }
    mockedPredict.mockResolvedValue(response)

    const { result } = renderHook(() => usePrediction())

    act(() => {
      result.current.handleImageSelected()
    })

    await act(async () => {
      await result.current.analyzeImage(selectedImage)
    })

    expect(mockedPredict).toHaveBeenCalledWith(selectedImage.file)
    expect(result.current.status).toBe("empty")
    expect(result.current.result?.requestId).toBe("req-empty-1")
    expect(result.current.result?.modelVersion).toBe("detector-2026-04")
    expect(result.current.result?.inferenceTimeMs).toBe(18)
    expect(result.current.result?.boundingBoxes).toEqual([])
    expect(result.current.logs.some((log) => log.message === "Keine Pilze erkannt")).toBe(true)
  })
})
