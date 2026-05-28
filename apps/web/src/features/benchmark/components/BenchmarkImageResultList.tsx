import { useEffect, useRef, useState } from "react";
import { type ImageBenchmarkResult } from "../model/benchmarkTypes"
import { expand } from "./BenchmarkImageExpander";

interface BenchmarkImageResultListProps {
  imageResults: ImageBenchmarkResult[]
  imgMap: Map<string, string>
  onSearchUpdate: (filteredData: ImageBenchmarkResult[]) => void
}

function formatNumber(value: number | null): string {
  return value === null ? "–" : String(value)
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#697b70]">
        {label}
      </span>
      <span className="mt-1 block font-mono text-sm text-[#213126]">{value}</span>
    </div>
  )
}

function expandImage(url: (string | undefined)){
  expand(url);
}

export function BenchmarkImageResultList({
  imageResults,
  imgMap,
  onSearchUpdate
}: BenchmarkImageResultListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const originalImageResults = useRef<ImageBenchmarkResult[]>([]);

  useEffect(() => {
    if (originalImageResults.current.length === 0){
      imageResults.forEach(v => originalImageResults.current.push(Object.assign({}, v)))
    }

    console.log(originalImageResults.current);
  }, []);

  const handleSearch = () => {
    const newResults = originalImageResults.current.filter((value) => {
      return value.imageId?.startsWith(searchQuery);
    }); 

    if (newResults.length > 0){
      onSearchUpdate(newResults);
    }
  }

  if (imageResults.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
        <h4 className="text-lg font-semibold tracking-tight text-[#213126]">Detailansicht pro Bild</h4>
        <p className="mt-2 text-sm text-[#687a6d]">Keine Bilddetails vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
      <div className="flex flex-col gap-2 border-b border-[#314a37]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Detailansicht
          </p>
          <h4 className="mt-1 text-lg font-semibold tracking-tight text-[#213126]">
            Ergebnisse pro Bild
          </h4>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-[#314a37]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="mt-5 flex items-center" style={{width: "100%", position: "relative"}}>
          <input 
            placeholder="Suche" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter'){
                handleSearch();
              }
            }}
            style={{
              height: "50px",
              width: "30%",
              backgroundColor: "#fff",
              borderTopLeftRadius: "10px",
              borderBottomLeftRadius: "10px",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
              padding: "10px",
              fontSize: "16px",
              border: "none",
              outline: "none"
            }}
          />          
          
          <button onClick={handleSearch}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive has-[>svg]:px-3 bg-[#2d5b3b] px-5 text-white shadow-[0_16px_35px_rgba(45,91,59,0.22)] hover:bg-[#254b31] h-[50px] rounded-r-[10px] rounded-l-none">
            Suchen
          </button>
          
          <div className="flex" style={{
            position: "absolute",
            right: 0
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={"50px"} height={"50px"}>
              <path fill="currentColor" d="M96 128C83.1 128 71.4 135.8 66.4 147.8C61.4 159.8 64.2 173.5 73.4 182.6L256 365.3L256 480C256 488.5 259.4 496.6 265.4 502.6L329.4 566.6C338.6 575.8 352.3 578.5 364.3 573.5C376.3 568.5 384 556.9 384 544L384 365.3L566.6 182.7C575.8 173.5 578.5 159.8 573.5 147.8C568.5 135.8 556.9 128 544 128L96 128z"/>
            </svg>

            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={"50px"} height={"50px"}>
              <path fill="currentColor" d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {imageResults.map((imageResult) => (
          <div
            key={imageResult.imageId ?? imageResult.error}
            className="rounded-[22px] border border-[#314a37]/10 bg-white/74 p-4 shadow-sm"
          >
            <div className="flex flex-row gap-10">
              
              <div style={{width: "20%", display: "flex", justifyContent: "center"}}
                  onClick={() => {
                    expandImage(imgMap.get(imageResult.imageId ? imageResult.imageId : ""))
                  }}>
                <img src={imgMap.get(imageResult.imageId ? imageResult.imageId : "") ? imgMap.get(imageResult.imageId ? imageResult.imageId : "") : ""} 
                  style={{
                    maxHeight: "100.5px",
                    width: "auto",
                    borderRadius: "15px"
                  }}/> 
              </div>

              <div className="flex flex-col" style={{width: "80%"}}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[#213126]">
                      {imageResult.imageId ?? "Unbekanntes Bild"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#6a7b6f]">
                      {imageResult.error ? "Fehlerhaft" : "Ausgewertet"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      imageResult.error
                        ? "border border-red-300/25 bg-red-50 text-red-700"
                        : "border border-emerald-800/10 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {imageResult.error ? "Fehler" : "OK"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                  <StatCell label="Ground Truth" value={formatNumber(imageResult.groundTruthCount)} />
                  <StatCell label="Predictions" value={formatNumber(imageResult.predictedCount)} />
                  <StatCell label="TP" value={formatNumber(imageResult.truePositives)} />
                  <StatCell label="FP" value={formatNumber(imageResult.falsePositives)} />
                  <StatCell label="FN" value={formatNumber(imageResult.falseNegatives)} />
                </div>

                {imageResult.error && (
                  <p className="mt-4 break-words rounded-2xl border border-red-300/20 bg-red-50/70 px-3 py-3 text-sm text-[#6a5555]">
                    {imageResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
