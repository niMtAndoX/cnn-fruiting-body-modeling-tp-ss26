import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { BenchmarkResponse } from "../model/benchmarkTypes"
import { exportBenchmarkReport } from "../utils/reportExport"

interface BenchmarkReportExportButtonProps {
  result: BenchmarkResponse
}

export function BenchmarkReportExportButton({ result }: BenchmarkReportExportButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => exportBenchmarkReport(result)}
      className="h-11 rounded-2xl border-[#314a37]/15 bg-[#fbfaf7] text-[#213126] hover:bg-white"
    >
      <Download className="size-4" />
      Report herunterladen
    </Button>
  )
}
