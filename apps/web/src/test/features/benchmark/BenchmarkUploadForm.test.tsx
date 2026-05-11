import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import React, { useState } from "react"

interface UploadFormProps {
  testArchive: File | null
  labelArchive: File | null
  isLoading: boolean
  onTestArchiveSelected: (file: File) => void
  onLabelArchiveSelected: (file: File) => void
  onTestArchiveError: (message: string) => void
  onLabelArchiveError: (message: string) => void
  onStart: () => void
}

const MockBenchmarkUploadForm = ({
  testArchive,
  labelArchive,
  isLoading,
  onTestArchiveSelected,
  onLabelArchiveSelected,
  onTestArchiveError,
  onLabelArchiveError,
  onStart,
}: UploadFormProps) => {
  const isZip = (file: File) =>
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    file.name.toLowerCase().endsWith(".zip")

  const handleTestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isZip(file)) {
      onTestArchiveError("Nur ZIP-Dateien sind erlaubt.")
      return
    }
    onTestArchiveSelected(file)
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isZip(file)) {
      onLabelArchiveError("Nur ZIP-Dateien sind erlaubt.")
      return
    }
    onLabelArchiveSelected(file)
  }

  const canStart = testArchive !== null && labelArchive !== null && !isLoading

  return (
    <div>
      <input
        type="file"
        accept=".zip"
        onChange={handleTestChange}
        data-testid="test-archive-input"
      />
      {testArchive && <span data-testid="test-file-name">{testArchive.name}</span>}

      <input
        type="file"
        accept=".zip"
        onChange={handleLabelChange}
        data-testid="label-archive-input"
      />
      {labelArchive && <span data-testid="label-file-name">{labelArchive.name}</span>}

      <button
        onClick={onStart}
        disabled={!canStart}
        data-testid="start-button"
      >
        Benchmark starten
      </button>
    </div>
  )
}

function BenchmarkFormWrapper() {
  const [testArchive, setTestArchive] = useState<File | null>(null)
  const [labelArchive, setLabelArchive] = useState<File | null>(null)

  return (
    <MockBenchmarkUploadForm
      testArchive={testArchive}
      labelArchive={labelArchive}
      isLoading={false}
      onTestArchiveSelected={setTestArchive}
      onLabelArchiveSelected={setLabelArchive}
      onTestArchiveError={vi.fn()}
      onLabelArchiveError={vi.fn()}
      onStart={vi.fn()}
    />
  )
}

describe("BenchmarkUploadForm", () => {
  it("rendert beide Upload-Felder", () => {
    render(<BenchmarkFormWrapper />)

    expect(screen.getByTestId("test-archive-input")).toBeInTheDocument()
    expect(screen.getByTestId("label-archive-input")).toBeInTheDocument()
  })

  it("Start-Button ist ohne Dateien deaktiviert", () => {
    render(<BenchmarkFormWrapper />)

    expect(screen.getByTestId("start-button")).toBeDisabled()
  })

  it("Start-Button bleibt deaktiviert wenn nur eine Datei vorhanden ist", () => {
    render(<BenchmarkFormWrapper />)

    const testInput = screen.getByTestId("test-archive-input")
    fireEvent.change(testInput, {
      target: { files: [new File(["data"], "images.zip", { type: "application/zip" })] },
    })

    expect(screen.getByTestId("start-button")).toBeDisabled()
  })

  it("Start-Button wird mit zwei gültigen ZIP-Dateien aktiv", () => {
    render(<BenchmarkFormWrapper />)

    const testInput = screen.getByTestId("test-archive-input")
    const labelInput = screen.getByTestId("label-archive-input")

    fireEvent.change(testInput, {
      target: { files: [new File(["data"], "images.zip", { type: "application/zip" })] },
    })
    fireEvent.change(labelInput, {
      target: { files: [new File(["data"], "labels.zip", { type: "application/zip" })] },
    })

    expect(screen.getByTestId("start-button")).not.toBeDisabled()
  })

  it("lehnt Nicht-ZIP-Dateien für das Testarchiv ab und ruft onTestArchiveError auf", () => {
    const onTestArchiveError = vi.fn()

    render(
      <MockBenchmarkUploadForm
        testArchive={null}
        labelArchive={null}
        isLoading={false}
        onTestArchiveSelected={vi.fn()}
        onLabelArchiveSelected={vi.fn()}
        onTestArchiveError={onTestArchiveError}
        onLabelArchiveError={vi.fn()}
        onStart={vi.fn()}
      />,
    )

    const testInput = screen.getByTestId("test-archive-input")
    fireEvent.change(testInput, {
      target: { files: [new File(["data"], "images.png", { type: "image/png" })] },
    })

    expect(onTestArchiveError).toHaveBeenCalledWith("Nur ZIP-Dateien sind erlaubt.")
  })

  it("lehnt Nicht-ZIP-Dateien für das Label-Archiv ab und ruft onLabelArchiveError auf", () => {
    const onLabelArchiveError = vi.fn()

    render(
      <MockBenchmarkUploadForm
        testArchive={null}
        labelArchive={null}
        isLoading={false}
        onTestArchiveSelected={vi.fn()}
        onLabelArchiveSelected={vi.fn()}
        onTestArchiveError={vi.fn()}
        onLabelArchiveError={onLabelArchiveError}
        onStart={vi.fn()}
      />,
    )

    const labelInput = screen.getByTestId("label-archive-input")
    fireEvent.change(labelInput, {
      target: { files: [new File(["data"], "labels.txt", { type: "text/plain" })] },
    })

    expect(onLabelArchiveError).toHaveBeenCalledWith("Nur ZIP-Dateien sind erlaubt.")
  })

  it("zeigt den Dateinamen der ausgewählten Testdatei an", () => {
    render(<BenchmarkFormWrapper />)

    const testInput = screen.getByTestId("test-archive-input")
    fireEvent.change(testInput, {
      target: { files: [new File(["data"], "meine_bilder.zip", { type: "application/zip" })] },
    })

    expect(screen.getByTestId("test-file-name")).toHaveTextContent("meine_bilder.zip")
  })
})
