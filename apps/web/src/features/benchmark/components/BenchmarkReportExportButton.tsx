import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { BenchmarkResponse } from "../model/benchmarkTypes"
import { exportBenchmarkReport } from "../utils/reportExport"

interface BenchmarkReportExportButtonProps {
  result: BenchmarkResponse
}

export function BenchmarkReportExportButton({ result }: BenchmarkReportExportButtonProps) {
  return (
    <Button type="button" variant="outline" onClick={() => exportBenchmarkReport(result)}>
      <Download className="mr-2 size-4" />
      Report herunterladen
    </Button>
  )
}