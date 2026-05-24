import { useRef, useState } from "react"
import { Upload, FileArchive, AlertCircle, CheckCircle2, XCircle, ArrowRight } from "lucide-react"
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
  download: () => void
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
    <div className="flex h-full flex-col gap-4 rounded-[24px] border border-[#314a37]/12 bg-white/76 p-5 shadow-[0_16px_45px_rgba(33,49,38,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#e8efe7] text-[#2d5b3b]">
          <FileArchive className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#213126]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-[#687a6d]">{description}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#314a37]/10 bg-[#f4efe6]/76 p-3 text-xs leading-6 text-[#5d7261]">
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
        className="flex items-center justify-between rounded-[20px] border border-dashed border-[#314a37]/18 bg-[#fbfaf7] px-4 py-3 text-left text-sm text-[#53675a] transition-colors hover:border-emerald-700/28 hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <Upload className="size-4 shrink-0" />
          {file ? "Andere Datei wählen" : "ZIP-Datei auswählen"}
        </span>
        <ArrowRight className="size-4" />
      </button>

      {inlineError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-300/25 bg-red-50 px-3 py-3 text-sm text-red-700">
          <XCircle className="size-4 shrink-0" />
          <span>{inlineError}</span>
        </div>
      )}

      {file && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-800/10 bg-emerald-50/75 px-3 py-3 text-sm text-[#23402d]">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate font-medium">{file.name}</span>
          <span className="shrink-0 text-[#617769]">({formatFileSize(file.size)})</span>
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
  download,
}: BenchmarkUploadFormProps) {
  const testInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const canStart = testArchive !== null && labelArchive !== null && !isLoading

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Dateneingabe
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#213126]">
            Benchmark-Datensätze bereitstellen
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687a6d]">
            Lade Testbilder und Ground-Truth-Labels als getrennte ZIP-Archive hoch, um die
            Modellleistung reproduzierbar zu vergleichen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FileInputCard
          label="Testbilder-Archiv"
          description="Enthält die Einzelbilder, die das Modell analysieren soll."
          formatHint={
            <p>
              <strong>Inhalt:</strong> Bilddateien (JPG, PNG) direkt im Archiv-Wurzelverzeichnis
              oder in Unterordnern.
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
              <p>Alle Koordinaten sind auf 0-1 normiert. Dateinamen müssen den Bilddateien entsprechen.</p>
            </div>
          }
          file={labelArchive}
          inputId="label-archive-input"
          inputRef={labelInputRef}
          onFileChange={onLabelArchiveSelected}
          onError={onLabelArchiveError}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[24px] border border-[#7a563a]/14 bg-[linear-gradient(180deg,rgba(122,86,58,0.08),rgba(244,239,230,0.84))] p-4 shadow-[0_12px_35px_rgba(52,36,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a563a]">
            Wichtig
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5f6f63]">
            Die Dateinamen müssen exakt zusammenpassen, sonst kann der Benchmark Bilder und Labels
            nicht korrekt zuordnen.
          </p>
          <div className="mt-3 rounded-[18px] border border-[#7a563a]/14 bg-white/75 px-4 py-3 font-mono text-sm text-[#213126]">
            <p>bild_001.jpg ↔ bild_001.txt</p>
            <p className="mt-1">bild_002.jpg ↔ bild_002.txt</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#314a37]/10 bg-[#f4efe6]/80 p-4 shadow-[0_12px_35px_rgba(31,49,36,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Erwartete ZIP-Struktur
          </p>
          <div className="mt-3 grid gap-3 font-mono text-sm text-[#213126] sm:grid-cols-2">
            <div className="rounded-[18px] border border-[#314a37]/10 bg-white/72 px-4 py-3">
              <p className="font-semibold">testbilder.zip</p>
              <p className="mt-1">├─ bild_001.jpg</p>
              <p>├─ bild_002.jpg</p>
            </div>
            <div className="rounded-[18px] border border-[#314a37]/10 bg-white/72 px-4 py-3">
              <p className="font-semibold">labels.zip</p>
              <p className="mt-1">├─ bild_001.txt</p>
              <p>├─ bild_002.txt</p>
            </div>
          </div>
        </div>
      </div>

      {(!testArchive || !labelArchive) && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#314a37]/10 bg-[#f4efe7]/72 px-4 py-3 text-sm text-[#5f7363]">
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

      <div className="flex flex-col gap-3 border-t border-[#314a37]/10 pt-2 sm:flex-row sm:items-center">
        <Button
          onClick={onStart}
          disabled={!canStart}
          className="h-11 rounded-2xl bg-[#2d5b3b] px-5 text-white shadow-[0_16px_35px_rgba(45,91,59,0.22)] hover:bg-[#254b31]"
        >
          {isLoading ? "Benchmark läuft..." : "Benchmark starten"}
        </Button>

        <Button
          onClick={download}
          variant="outline"
          className="h-11 rounded-2xl border-[#314a37]/15 bg-[#fbfaf7] text-[#213126] hover:border-[#314a37]/28 hover:bg-[#f4efe6] hover:text-[#213126] hover:shadow-[0_10px_24px_rgba(33,49,38,0.08)] sm:ml-auto"
        >
          Testdaten runterladen
        </Button>
      </div>
    </div>
  )
}
