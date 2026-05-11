import { useRef, useState } from "react"
import { Upload, FileArchive, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatFileSize, isZipFile } from "../model/benchmarkTypes"

interface BenchmarkUploadFormProps {
  testArchive: File | null
  labelArchive: File | null
  isLoading: boolean
  onTestArchiveSelected: (file: File) => void
  onLabelArchiveSelected: (file: File) => void
  onTestArchiveError: (message: string) => void
  onLabelArchiveError: (message: string) => void
  onStart: () => void
}

interface FileInputCardProps {
  label: string
  description: string
  formatHint: React.ReactNode
  file: File | null
  inputId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (file: File) => void
  onError: (message: string) => void
}

function FileInputCard({
  label,
  description,
  formatHint,
  file,
  inputId,
  inputRef,
  onFileChange,
  onError,
}: FileInputCardProps) {
  const [inlineError, setInlineError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    e.target.value = ""
    if (!selected) return

    if (!isZipFile(selected)) {
      const msg = "Nur ZIP-Dateien sind erlaubt."
      setInlineError(msg)
      onError(msg)
      return
    }

    setInlineError(null)
    onFileChange(selected)
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border-2 border-border bg-card/50">
      <div className="flex items-center gap-2">
        <FileArchive className="size-5 text-primary shrink-0" />
        <span className="font-semibold text-foreground">{label}</span>
      </div>

      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 border border-border/50">
        {formatHint}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        onChange={handleChange}
        className="sr-only"
        data-testid={inputId}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 rounded border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-foreground"
      >
        <Upload className="size-4 shrink-0" />
        <span>{file ? "Andere Datei wählen" : "ZIP-Datei auswählen"}</span>
      </button>

      {inlineError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4 shrink-0" />
          <span>{inlineError}</span>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="size-4 text-green-600 shrink-0" />
          <span className="truncate font-medium">{file.name}</span>
          <span className="text-muted-foreground shrink-0">({formatFileSize(file.size)})</span>
        </div>
      )}
    </div>
  )
}

export function BenchmarkUploadForm({
  testArchive,
  labelArchive,
  isLoading,
  onTestArchiveSelected,
  onLabelArchiveSelected,
  onTestArchiveError,
  onLabelArchiveError,
  onStart,
}: BenchmarkUploadFormProps) {
  const testInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const canStart = testArchive !== null && labelArchive !== null && !isLoading

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Benchmark starten</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lade zwei ZIP-Archive hoch, um die Modellgenauigkeit zu messen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileInputCard
          label="Testbilder-Archiv"
          description="Enthält die Einzelbilder, die das Modell analysieren soll."
          formatHint={
            <p>
              <strong>Inhalt:</strong> Bilddateien (JPG, PNG) direkt im Archiv-Wurzelverzeichnis oder in
              Unterordnern.
            </p>
          }
          file={testArchive}
          inputId="test-archive-input"
          inputRef={testInputRef}
          onFileChange={onTestArchiveSelected}
          onError={onTestArchiveError}
        />

        <FileInputCard
          label="Label-Archiv"
          description="Enthält die maschinenlesbaren Vergleichsdaten (Ground Truth) zu den Testbildern."
          formatHint={
            <div className="space-y-1">
              <p>
                <strong>Format:</strong> YOLO-Textdateien (eine <code>.txt</code> pro Bild).
              </p>
              <p>
                <strong>Zeile:</strong>{" "}
                <code>{"<class_id> <x_center> <y_center> <width> <height>"}</code>
              </p>
              <p>Alle Koordinaten normiert auf 0–1. Dateinamen müssen den Bilddateinamen entsprechen.</p>
            </div>
          }
          file={labelArchive}
          inputId="label-archive-input"
          inputRef={labelInputRef}
          onFileChange={onLabelArchiveSelected}
          onError={onLabelArchiveError}
        />
      </div>

      {(!testArchive || !labelArchive) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {!testArchive && !labelArchive
              ? "Bitte beide ZIP-Dateien auswählen, um den Benchmark zu starten."
              : !testArchive
                ? "Testbilder-Archiv fehlt noch."
                : "Label-Archiv fehlt noch."}
          </span>
        </div>
      )}

      <Button onClick={onStart} disabled={!canStart} className="w-full sm:w-auto">
        {isLoading ? "Benchmark läuft..." : "Benchmark starten"}
      </Button>
    </div>
  )
}
