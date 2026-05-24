import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import type { BenchmarkResponse, ImageBenchmarkResult } from "../model/benchmarkTypes"

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

const REPORT_COLORS = {
  background: [243, 239, 230] as const,
  card: [255, 252, 247] as const,
  primary: [17, 49, 38] as const,
  text: [20, 38, 29] as const,
  muted: [95, 113, 101] as const,
  border: [216, 222, 212] as const,
  accent: [232, 216, 197] as const,
  accentStrong: [122, 86, 58] as const,
  tp: [5, 150, 105] as const,
  fp: [180, 83, 9] as const,
  fn: [190, 24, 93] as const,
  white: [255, 255, 255] as const,
} as const

function formatPercent(value: number | null): string {
  if (value === null) return "–"
  return `${(value * 100).toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`
}

function formatMs(value: number | null): string {
  if (value === null) return "–"
  return `${value.toLocaleString("de-DE")} ms`
}

function sumImageResultValues(
  result: BenchmarkResponse,
  key: "truePositives" | "falsePositives" | "falseNegatives",
): number {
  return result.imageResults.reduce((sum, imageResult) => {
    return sum + (imageResult[key] ?? 0)
  }, 0)
}

function calculateAccuracy(result: BenchmarkResponse): number | null {
  const truePositives = sumImageResultValues(result, "truePositives")
  const falsePositives = sumImageResultValues(result, "falsePositives")
  const falseNegatives = sumImageResultValues(result, "falseNegatives")
  const total = truePositives + falsePositives + falseNegatives

  return total > 0 ? truePositives / total : null
}

function setFillColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setDrawColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setTextColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function drawPageBackground(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  setFillColor(doc, REPORT_COLORS.background)
  doc.rect(0, 0, pageWidth, pageHeight, "F")
}

function drawRoundedCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: readonly [number, number, number],
  border: readonly [number, number, number] = REPORT_COLORS.border,
) {
  setFillColor(doc, fill)
  setDrawColor(doc, border)
  doc.setLineWidth(0.35)
  doc.roundedRect(x, y, width, height, 4, 4, "FD")
}

function drawWordmark(doc: jsPDF, x: number, y: number) {
  drawRoundedCard(doc, x, y, 34, 12, REPORT_COLORS.primary, REPORT_COLORS.primary)
  setTextColor(doc, REPORT_COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("WALDPILZ", x + 17, y + 7.7, { align: "center" })
}

function drawHeader(doc: jsPDF, createdAt: Date) {
  const pageWidth = doc.internal.pageSize.getWidth()
  setFillColor(doc, REPORT_COLORS.primary)
  doc.rect(0, 0, pageWidth, 28, "F")

  drawWordmark(doc, 14, 8)

  setTextColor(doc, REPORT_COLORS.white)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.text("Benchmark-Report", 196, 15, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Erstellt am ${createdAt.toLocaleString("de-DE")}`, 196, 22, { align: "right" })
}

function getPerformanceAssessment(f1Score: number | null): {
  title: string
  description: string
} {
  if (f1Score === null) {
    return {
      title: "Keine belastbare Bewertung",
      description: "Für die Kernmetrik liegen aktuell nicht genügend Daten vor.",
    }
  }

  if (f1Score >= 0.8) {
    return {
      title: "Stabile Modellleistung",
      description: "Precision und Recall liegen auf einem hohen Niveau und wirken insgesamt ausgewogen.",
    }
  }

  if (f1Score >= 0.6) {
    return {
      title: "Solide Modellleistung",
      description: "Das Modell liefert bereits brauchbare Ergebnisse, zeigt aber noch Verbesserungspotenzial bei Fehlklassifikationen.",
    }
  }

  if (f1Score >= 0.4) {
    return {
      title: "Ausbaufähige Modellleistung",
      description: "Precision und Recall liegen im mittleren Bereich, wodurch sowohl False Positives als auch False Negatives relevant bleiben.",
    }
  }

  return {
    title: "Deutlich verbesserungsbedürftig",
    description: "Die Kernmetriken deuten aktuell auf eine noch instabile Erkennung mit relevanten Fehlzuordnungen hin.",
  }
}

function drawScoreRing(doc: jsPDF, centerX: number, centerY: number, radius: number, value: number | null) {
  const percent = value === null ? 0 : Math.max(0, Math.min(1, value))

  setDrawColor(doc, REPORT_COLORS.border)
  doc.setLineWidth(5)
  doc.circle(centerX, centerY, radius)

  setDrawColor(doc, REPORT_COLORS.tp)
  doc.setLineWidth(5)

  const startAngle = -Math.PI / 2
  const endAngle = startAngle + percent * Math.PI * 2
  let previousX = centerX + Math.cos(startAngle) * radius
  let previousY = centerY + Math.sin(startAngle) * radius

  for (let angle = startAngle; angle <= endAngle; angle += 0.05) {
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    doc.line(previousX, previousY, x, y)
    previousX = x
    previousY = y
  }

  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(formatPercent(value), centerX, centerY + 2, { align: "center" })
}

function drawHeroCard(doc: jsPDF, result: BenchmarkResponse, x: number, y: number, width: number) {
  const assessment = getPerformanceAssessment(result.f1Score)

  drawRoundedCard(doc, x, y, width, 56, REPORT_COLORS.card)

  setTextColor(doc, REPORT_COLORS.muted)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Kernmetrik", x + 6, y + 8)

  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("F1-Score", x + 6, y + 18)

  doc.setFontSize(26)
  doc.text(formatPercent(result.f1Score), x + 6, y + 31)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setTextColor(doc, REPORT_COLORS.muted)
  const description = doc.splitTextToSize(
    "Beurteilung des Modells durch das Zusammenspiel von Precision und Recall.",
    80,
  )
  doc.text(description, x + 6, y + 39)

  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text(assessment.title, x + 94, y + 15)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setTextColor(doc, REPORT_COLORS.muted)
  const assessmentText = doc.splitTextToSize(`Bewertung: ${assessment.description}`, 44)
  doc.text(assessmentText, x + 94, y + 22)

  drawScoreRing(doc, x + width - 18, y + 26, 10.5, result.f1Score)
}

function drawMetadataTable(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  metadata: ReadonlyArray<{
    label: string
    value: string
  }>,
): number {
  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Benchmark-Metadaten", x, y)

  const columns = 3
  const gap = 0
  const cellWidth = (width - gap * (columns - 1)) / columns
  const cellHeight = 18

  metadata.forEach((item, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const cellX = x + column * (cellWidth + gap)
    const cellY = y + 5 + row * cellHeight

    setFillColor(doc, REPORT_COLORS.card)
    setDrawColor(doc, REPORT_COLORS.border)
    doc.setLineWidth(0.35)
    doc.rect(cellX, cellY, cellWidth, cellHeight, "FD")

    setTextColor(doc, REPORT_COLORS.muted)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text(item.label, cellX + 3, cellY + 5)

    setTextColor(doc, REPORT_COLORS.primary)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(item.value.length > 28 ? 8 : 10)
    const lines = doc.splitTextToSize(item.value, cellWidth - 6)
    doc.text(lines, cellX + 3, cellY + 11)
  })

  return y + 5 + Math.ceil(metadata.length / columns) * cellHeight
}

function drawMetricCards(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  metrics: ReadonlyArray<{
    label: string
    value: string
    description: string
  }>,
): number {
  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Kennzahlen", x, y)

  const gap = 4
  const columns = 2
  const cardWidth = (width - gap) / columns
  const cardHeight = 28

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const cardX = x + column * (cardWidth + gap)
    const cardY = y + 5 + row * (cardHeight + gap)

    drawRoundedCard(doc, cardX, cardY, cardWidth, cardHeight, REPORT_COLORS.card)

    setTextColor(doc, REPORT_COLORS.muted)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(metric.label, cardX + 4, cardY + 7)

    setTextColor(doc, REPORT_COLORS.primary)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(metric.value, cardX + 4, cardY + 16)

    setTextColor(doc, REPORT_COLORS.muted)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.text(doc.splitTextToSize(metric.description, cardWidth - 8), cardX + 4, cardY + 22)
  })

  return y + 5 + Math.ceil(metrics.length / columns) * cardHeight + gap
}

function drawStackedConfusionBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  truePositives: number,
  falsePositives: number,
  falseNegatives: number,
) {
  drawRoundedCard(doc, x, y, width, 38, REPORT_COLORS.card)

  const total = truePositives + falsePositives + falseNegatives
  const safeTotal = Math.max(total, 1)

  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("Fehlerverteilung der Detektionen", x + 5, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setTextColor(doc, REPORT_COLORS.muted)
  doc.text(`Gesamt: ${total.toLocaleString("de-DE")}`, x + width - 5, y + 8, { align: "right" })

  const barX = x + 5
  const barY = y + 14
  const barWidth = width - 10
  const barHeight = 8

  drawRoundedCard(doc, barX, barY, barWidth, barHeight, REPORT_COLORS.background, REPORT_COLORS.border)

  const segments = [
    { label: "TP", value: truePositives, color: REPORT_COLORS.tp },
    { label: "FP", value: falsePositives, color: REPORT_COLORS.fp },
    { label: "FN", value: falseNegatives, color: REPORT_COLORS.fn },
  ] as const

  let currentX = barX
  segments.forEach((segment) => {
    const segmentWidth = (segment.value / safeTotal) * barWidth
    if (segmentWidth <= 0) return
    setFillColor(doc, segment.color)
    doc.rect(currentX, barY, segmentWidth, barHeight, "F")
    currentX += segmentWidth
  })

  segments.forEach((segment, index) => {
    const percentage = total > 0 ? `${((segment.value / total) * 100).toLocaleString("de-DE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} %` : "0,0 %"
    const blockX = x + 6 + index * 61

    setFillColor(doc, segment.color)
    doc.roundedRect(blockX, y + 27, 5, 5, 1, 1, "F")
    setTextColor(doc, REPORT_COLORS.primary)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.text(`${segment.label} ${segment.value}`, blockX + 8, y + 31)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    setTextColor(doc, REPORT_COLORS.muted)
    doc.text(percentage, blockX + 8, y + 35)
  })
}

function buildTopProblemCases(imageResults: ImageBenchmarkResult[]): ImageBenchmarkResult[] {
  return [...imageResults]
    .filter((imageResult) => (imageResult.falsePositives ?? 0) + (imageResult.falseNegatives ?? 0) > 0)
    .sort((a, b) => {
      const errorCountA = (a.falsePositives ?? 0) + (a.falseNegatives ?? 0)
      const errorCountB = (b.falsePositives ?? 0) + (b.falseNegatives ?? 0)
      return errorCountB - errorCountA
    })
    .slice(0, 3)
}

function getImageStatus(imageResult: ImageBenchmarkResult): string {
  if (imageResult.error) return "Nicht auswertbar"

  const falsePositives = imageResult.falsePositives ?? 0
  const falseNegatives = imageResult.falseNegatives ?? 0

  if (falsePositives === 0 && falseNegatives === 0) return "Korrekt"
  if (falsePositives > 0 && falseNegatives > 0) return "Mit FP/FN"
  if (falsePositives > 0) return "Mit FP"
  if (falseNegatives > 0) return "Mit FN"
  return "Ausgewertet"
}

function getRowFillColor(imageResult: ImageBenchmarkResult): [number, number, number] {
  if (imageResult.error) return [250, 236, 236]

  const falsePositives = imageResult.falsePositives ?? 0
  const falseNegatives = imageResult.falseNegatives ?? 0

  if (falsePositives > 0 && falseNegatives > 0) return [251, 239, 236]
  if (falsePositives > 0) return [253, 245, 234]
  if (falseNegatives > 0) return [251, 240, 240]
  return [255, 252, 247]
}

function drawDetailPageHeader(doc: jsPDF) {
  drawPageBackground(doc)

  setTextColor(doc, REPORT_COLORS.primary)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Detailauswertung pro Bild", 14, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  setTextColor(doc, REPORT_COLORS.muted)
  doc.text("Ground Truth, Predictions und Fehlerwerte pro ausgewertetem Bild.", 14, 25)
}

function drawTopProblemCases(doc: jsPDF, topCases: ImageBenchmarkResult[]): number {
  const baseY = 29

  setTextColor(doc, REPORT_COLORS.muted)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)

  if (topCases.length === 0) {
    doc.text("Keine auffälligen Problemfälle vorhanden.", 14, baseY)
    return baseY + 4
  }

  const summary = topCases
    .map((imageResult, index) => {
      const fp = imageResult.falsePositives ?? 0
      const fn = imageResult.falseNegatives ?? 0
      return `${index + 1}. ${imageResult.imageId ?? "Unbekanntes Bild"} (${fp} FP, ${fn} FN)`
    })
    .join("  •  ")

  const lines = doc.splitTextToSize(`Top-Problemfälle: ${summary}`, 182)
  doc.text(lines, 14, baseY)

  return baseY + lines.length * 3.6 + 2
}

function drawFooter(doc: jsPDF, page: number, pageCount: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  setDrawColor(doc, REPORT_COLORS.border)
  doc.line(14, pageHeight - 10, 196, pageHeight - 10)

  setTextColor(doc, REPORT_COLORS.muted)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("WALDPILZ • Benchmark-Report", 14, pageHeight - 5)
  doc.text(`Seite ${page} von ${pageCount}`, 196, pageHeight - 5, { align: "right" })
}

export function exportBenchmarkReport(result: BenchmarkResponse): void {
  const doc = new jsPDF("p", "mm", "a4")
  const createdAt = new Date()

  const truePositives = sumImageResultValues(result, "truePositives")
  const falsePositives = sumImageResultValues(result, "falsePositives")
  const falseNegatives = sumImageResultValues(result, "falseNegatives")
  const accuracy = calculateAccuracy(result)

  const totalImages = result.totalImages ?? result.imageResults.length
  const processedImages =
    result.totalImages !== null && result.failedImages !== null
      ? result.totalImages - result.failedImages
      : result.imageResults.length

  drawPageBackground(doc)
  drawHeader(doc, createdAt)

  const metadataEndY = drawMetadataTable(doc, 14, 38, 182, [
    { label: "Bilder gesamt", value: String(totalImages) },
    { label: "Verarbeitete Bilder", value: String(processedImages) },
    { label: "Fehlerhafte Bilder", value: result.failedImages === null ? "–" : String(result.failedImages) },
    { label: "Verarbeitungszeit", value: formatMs(result.processingTimeMs) },
    { label: "Modellversion", value: result.modelVersion ?? "–" },
    { label: "Request ID", value: result.requestId ?? "–" },
  ])

  drawHeroCard(doc, result, 14, metadataEndY + 8, 182)

  const metricCardsEndY = drawMetricCards(doc, 14, metadataEndY + 72, 182, [
    {
      label: "Precision",
      value: formatPercent(result.precision),
      description: "Anteil korrekter Treffer an allen Vorhersagen.",
    },
    {
      label: "Recall",
      value: formatPercent(result.recall),
      description: "Anteil erkannter Objekte an allen Ground-Truth-Objekten.",
    },
    {
      label: "mAP",
      value: formatPercent(result.mAP),
      description: "Durchschnittliche Präzision der Erkennung.",
    },
    {
      label: "Accuracy",
      value: formatPercent(accuracy),
      description: "Anteil korrekter Vorhersagen nach projektinterner Definition.",
    },
  ])

  drawStackedConfusionBar(
    doc,
    14,
    metricCardsEndY + 6,
    182,
    truePositives,
    falsePositives,
    falseNegatives,
  )

  doc.addPage()
  drawDetailPageHeader(doc)
  const topCasesEndY = drawTopProblemCases(doc, buildTopProblemCases(result.imageResults))

  autoTable(doc, {
    startY: topCasesEndY,
    head: [["Bild", "GT", "Predictions", "TP", "FP", "FN", "Fehler", "Status"]],
    body: result.imageResults.map((imageResult) => {
      const falsePositivesValue = imageResult.falsePositives ?? 0
      const falseNegativesValue = imageResult.falseNegatives ?? 0

      return [
        imageResult.imageId ?? "–",
        imageResult.groundTruthCount ?? "–",
        imageResult.predictedCount ?? "–",
        imageResult.truePositives ?? "–",
        imageResult.falsePositives ?? "–",
        imageResult.falseNegatives ?? "–",
        falsePositivesValue + falseNegativesValue,
        getImageStatus(imageResult),
      ]
    }),
    theme: "plain",
    margin: { left: 14, right: 14, top: 42, bottom: 16 },
    headStyles: {
      fillColor: [...REPORT_COLORS.primary],
      textColor: [...REPORT_COLORS.white],
      fontStyle: "bold",
      lineColor: [...REPORT_COLORS.primary],
      lineWidth: 0,
      minCellHeight: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [...REPORT_COLORS.text],
      lineColor: [...REPORT_COLORS.border],
      lineWidth: 0.15,
      overflow: "linebreak",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 64, halign: "left" },
      1: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 26, halign: "center" },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [251, 248, 243],
    },
    willDrawPage: (data: any) => {
      drawDetailPageHeader(doc)
      if (data.pageNumber > 1) {
        setTextColor(doc, REPORT_COLORS.muted)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8.5)
        doc.text("Fortsetzung der Detailauswertung.", 14, 33)
      }
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return

      const imageResult = result.imageResults[data.row.index]
      data.cell.styles.fillColor = [...getRowFillColor(imageResult)]
    },
  })

  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    drawFooter(doc, page, pageCount)
  }

  doc.save(`benchmark-report-${createdAt.toISOString().slice(0, 10)}.pdf`)
}
