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
      className="h-11 rounded-2xl border-[#314a37]/15 bg-[#fbfaf7] text-[#213126] hover:border-[#314a37]/28 hover:bg-[#f4efe6] hover:text-[#213126] hover:shadow-[0_10px_24px_rgba(33,49,38,0.08)]"
    >
      <Download className="size-4" />
      Report herunterladen
    </Button>
  )
}
