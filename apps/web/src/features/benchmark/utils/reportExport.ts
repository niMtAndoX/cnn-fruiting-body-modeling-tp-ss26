import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import type { BenchmarkResponse } from "../model/benchmarkTypes"

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return "–"
  return `${(value * 100).toFixed(1)} %`
}

function formatMs(value: number | null): string {
  if (value === null) return "–"
  return `${value} ms`
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

function getLastAutoTableY(doc: JsPdfWithAutoTable, fallbackY: number): number {
  return doc.lastAutoTable?.finalY ?? fallbackY
}

function drawGauge(
  doc: jsPDF,
  value: number | null,
  label: string,
  startY: number,
): void {
  const percent = value ?? 0
  const centerX = 105
  const centerY = startY + 24
  const radius = 19

  doc.setDrawColor(245, 237, 225)
  doc.setLineWidth(4)
  doc.circle(centerX, centerY, radius)

  const startAngle = -Math.PI / 2
  const endAngle = startAngle + percent * Math.PI * 2

  doc.setDrawColor(12, 90, 50)
  doc.setLineWidth(4)

  let previousX = centerX + Math.cos(startAngle) * radius
  let previousY = centerY + Math.sin(startAngle) * radius

  for (let angle = startAngle; angle <= endAngle; angle += 0.05) {
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    doc.line(previousX, previousY, x, y)

    previousX = x
    previousY = y
  }

  doc.setTextColor(12, 36, 26)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(label, centerX, centerY - 4, {
    align: "center",
  })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(formatPercent(value).replace(".0", ""), centerX, centerY + 5, {
    align: "center",
  })
}

function drawStackedConfusionBar(
  doc: jsPDF,
  startY: number,
  truePositives: number,
  falsePositives: number,
  falseNegatives: number,
): number {
  const total = truePositives + falsePositives + falseNegatives
  const safeTotal = Math.max(total, 1)

  const barX = 14
  const barY = startY + 18
  const barWidth = 165
  const barHeight = 10

  const truePositiveWidth = (truePositives / safeTotal) * barWidth
  const falsePositiveWidth = (falsePositives / safeTotal) * barWidth
  const falseNegativeWidth = (falseNegatives / safeTotal) * barWidth

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(12, 36, 26)
  doc.text("TP / FP / FN Übersicht", 14, startY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Gesamt: ${total}`, 182, startY, { align: "right" })

  doc.setFillColor(245, 237, 225)
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F")

  let currentX = barX

  doc.setFillColor(34, 139, 94)
  doc.rect(currentX, barY, truePositiveWidth, barHeight, "F")
  currentX += truePositiveWidth

  doc.setFillColor(214, 125, 20)
  doc.rect(currentX, barY, falsePositiveWidth, barHeight, "F")
  currentX += falsePositiveWidth

  doc.setFillColor(185, 52, 52)
  doc.rect(currentX, barY, falseNegativeWidth, barHeight, "F")

  doc.setDrawColor(245, 237, 225)
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2)

  const legendY = barY + 20

  const legendItems = [
    { label: `TP ${truePositives}`, color: [34, 139, 94] },
    { label: `FP ${falsePositives}`, color: [214, 125, 20] },
    { label: `FN ${falseNegatives}`, color: [185, 52, 52] },
  ] as const

  let legendX = 14

  legendItems.forEach((item) => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2])
    doc.roundedRect(legendX, legendY - 4, 5, 5, 1, 1, "F")

    doc.setTextColor(12, 36, 26)
    doc.setFontSize(10)
    doc.text(item.label, legendX + 8, legendY)

    legendX += 42
  })

  return legendY + 10
}

export function exportBenchmarkReport(result: BenchmarkResponse): void {
  const doc = new jsPDF("p", "mm", "a4")
  const autoTableDoc = doc as JsPdfWithAutoTable
  const createdAt = new Date()

  const truePositives = sumImageResultValues(result, "truePositives")
  const falsePositives = sumImageResultValues(result, "falsePositives")
  const falseNegatives = sumImageResultValues(result, "falseNegatives")
  const accuracy = calculateAccuracy(result)

  const totalImages = result.totalImages ?? result.imageResults.length
  const processedImages =
    result.totalImages !== null && result.failedImages !== null
      ? result.totalImages - result.failedImages
      : "–"

  doc.setFillColor(8, 38, 24)
  doc.rect(0, 0, 210, 38, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(24)
  doc.text("Benchmark-Report", 14, 18)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Erstellt am ${createdAt.toLocaleString("de-DE")}`, 14, 28)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(12, 36, 26)
  doc.text("Allgemeine Informationen", 14, 48)

  autoTable(doc, {
    startY: 52,
    body: [
      ["Model-Version", result.modelVersion ?? "–"],
      ["Request ID", result.requestId ?? "–"],
      ["Bilder gesamt", String(totalImages)],
      ["Verarbeitete Bilder", String(processedImages)],
      [
        "Fehlerhafte Bilder",
        result.failedImages === null ? "–" : String(result.failedImages),
      ],
      ["Verarbeitungszeit", formatMs(result.processingTimeMs)],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 60,
        fillColor: [247, 244, 236],
      },
      1: {
        cellWidth: 115,
      },
    },
  })

  const firstTableEndY = getLastAutoTableY(autoTableDoc, 52)

  drawGauge(doc, result.mAP, "mAP", firstTableEndY + 6)

  autoTable(doc, {
    startY: firstTableEndY + 54,
    head: [["Kennzahl", "Wert"]],
    body: [
      ["Accuracy", formatPercent(accuracy)],
      ["mAP", formatPercent(result.mAP)],
      ["Precision", formatPercent(result.precision)],
      ["Recall", formatPercent(result.recall)],
      ["F1-Score", formatPercent(result.f1Score)],
      ["True Positives", String(truePositives)],
      ["False Positives", String(falsePositives)],
      ["False Negatives", String(falseNegatives)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [8, 38, 24],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 245, 238],
    },
    styles: {
      fontSize: 11,
      cellPadding: 4,
    },
  })

  doc.addPage()

  const stackedBarEndY = drawStackedConfusionBar(
    doc,
    24,
    truePositives,
    falsePositives,
    falseNegatives,
  )

  autoTable(doc, {
    startY: stackedBarEndY + 10,
    head: [["Bild", "GT", "Predictions", "TP", "FP", "FN", "Status"]],
    body: result.imageResults.map((imageResult) => [
      imageResult.imageId ?? "–",
      imageResult.groundTruthCount ?? "–",
      imageResult.predictedCount ?? "–",
      imageResult.truePositives ?? "–",
      imageResult.falsePositives ?? "–",
      imageResult.falseNegatives ?? "–",
      imageResult.error ? "Fehler" : "OK",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [8, 38, 24],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: {
        cellWidth: 65,
      },
    },
  })

  const pageCount = doc.getNumberOfPages()

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(90, 100, 92)
    doc.text(
      `Benchmark-Report • Seite ${page} von ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 4,
    )
  }

  doc.save(`benchmark-report-${createdAt.toISOString().slice(0, 10)}.pdf`)
}