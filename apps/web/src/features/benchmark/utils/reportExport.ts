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

  const bottomCenterAngle = Math.PI / 2
  const angleSpan = percent * Math.PI * 2
  const startAngle = bottomCenterAngle - angleSpan / 2
  const endAngle = bottomCenterAngle + angleSpan / 2

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
  const innerInset = 0.6
  const innerBarX = barX + innerInset
  const innerBarY = barY + innerInset
  const innerBarWidth = barWidth - innerInset * 2
  const innerBarHeight = barHeight - innerInset * 2
  const innerRadius = 1.8

  const truePositiveWidth = (truePositives / safeTotal) * innerBarWidth
  const falsePositiveWidth = (falsePositives / safeTotal) * innerBarWidth
  const falseNegativeWidth = (falseNegatives / safeTotal) * innerBarWidth

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(12, 36, 26)
  doc.text("TP / FP / FN Übersicht", 14, startY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Gesamt: ${total}`, 182, startY, { align: "right" })

  doc.setFillColor(245, 237, 225)
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, "F")

  const segments = [
    { color: [34, 139, 94] as const, width: truePositiveWidth },
    { color: [214, 125, 20] as const, width: falsePositiveWidth },
    { color: [185, 52, 52] as const, width: falseNegativeWidth },
  ]

  const visibleSegmentIndexes = segments
    .map((segment, index) => (segment.width > 0 ? index : -1))
    .filter((index) => index >= 0)
  const firstVisibleIndex = visibleSegmentIndexes[0] ?? -1
  const lastVisibleIndex = visibleSegmentIndexes[visibleSegmentIndexes.length - 1] ?? -1

  let currentX = innerBarX

  segments.forEach((segment, index) => {
    if (segment.width <= 0) return

    doc.setFillColor(segment.color[0], segment.color[1], segment.color[2])

    if (index === firstVisibleIndex && index === lastVisibleIndex) {
      doc.roundedRect(
        currentX,
        innerBarY,
        segment.width,
        innerBarHeight,
        innerRadius,
        innerRadius,
        "F",
      )
    } else if (index === firstVisibleIndex) {
      doc.roundedRect(
        currentX,
        innerBarY,
        segment.width,
        innerBarHeight,
        innerRadius,
        innerRadius,
        "F",
      )
      doc.rect(
        currentX + Math.max(segment.width - innerRadius, 0),
        innerBarY,
        Math.min(innerRadius, segment.width),
        innerBarHeight,
        "F",
      )
    } else if (index === lastVisibleIndex) {
      doc.roundedRect(
        currentX,
        innerBarY,
        segment.width,
        innerBarHeight,
        innerRadius,
        innerRadius,
        "F",
      )
      doc.rect(
        currentX,
        innerBarY,
        Math.min(innerRadius, segment.width),
        innerBarHeight,
        "F",
      )
    } else {
      doc.rect(currentX, innerBarY, segment.width, innerBarHeight, "F")
    }

    currentX += segment.width
  })

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

function drawMetricCards(
  doc: jsPDF,
  startY: number,
  metrics: ReadonlyArray<{
    label: string
    value: string
  }>,
): number {
  const sectionX = 14
  const sectionWidth = 182
  const gap = 4
  const columns = 4
  const cardWidth = (sectionWidth - gap * (columns - 1)) / columns
  const cardHeight = 24

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(12, 36, 26)
  doc.text("Kennzahlen", sectionX, startY)

  metrics.forEach((metric, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = sectionX + column * (cardWidth + gap)
    const y = startY + 6 + row * (cardHeight + gap)

    doc.setFillColor(248, 245, 238)
    doc.setDrawColor(8, 38, 24)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, cardWidth, cardHeight, 2.5, 2.5, "FD")

    doc.setTextColor(90, 100, 92)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(metric.label.toUpperCase(), x + cardWidth / 2, y + 18, {
      align: "center",
    })

    doc.setTextColor(12, 36, 26)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(metric.value.replace(".0", ""), x + cardWidth / 2, y + 10, {
      align: "center",
    })
  })

  const rows = Math.ceil(metrics.length / columns)
  return startY + 6 + rows * cardHeight + Math.max(0, rows - 1) * gap
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
      textColor: [28, 38, 31],
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 60,
        fillColor: [247, 244, 236],
        textColor: [12, 36, 26],
      },
      1: {
        cellWidth: 115,
        textColor: [28, 38, 31],
      },
    },
  })

  const firstTableEndY = getLastAutoTableY(autoTableDoc, 52)

  drawGauge(doc, result.mAP, "mAP", firstTableEndY + 6)

  const metricCardsEndY = drawMetricCards(doc, firstTableEndY + 54, [
    { label: "Accuracy", value: formatPercent(accuracy) },
    { label: "Precision", value: formatPercent(result.precision) },
    { label: "Recall", value: formatPercent(result.recall) },
    { label: "F1-Score", value: formatPercent(result.f1Score) },
  ])

  drawStackedConfusionBar(
    doc,
    metricCardsEndY + 14,
    truePositives,
    falsePositives,
    falseNegatives,
  )

  doc.addPage()

  autoTable(doc, {
    startY: 24,
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
