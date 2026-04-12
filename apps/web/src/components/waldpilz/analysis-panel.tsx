"use client"

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

interface AnalysisPanelProps {
  imageUrl: string | null
  boundingBoxes: BoundingBox[]
}

function MushroomPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-24 opacity-30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mushroom cap */}
      <ellipse cx="50" cy="35" rx="35" ry="25" className="fill-foreground/20" />
      {/* Cap spots */}
      <circle cx="40" cy="30" r="4" className="fill-foreground/10" />
      <circle cx="55" cy="25" r="3" className="fill-foreground/10" />
      <circle cx="60" cy="38" r="5" className="fill-foreground/10" />
      {/* Mushroom stem */}
      <path
        d="M35 50 Q35 80 40 85 L60 85 Q65 80 65 50 Z"
        className="fill-foreground/15"
      />
      {/* Ground */}
      <ellipse cx="50" cy="88" rx="30" ry="5" className="fill-foreground/10" />
    </svg>
  )
}

export function AnalysisPanel({ imageUrl, boundingBoxes }: AnalysisPanelProps) {
  return (
    <div className="relative aspect-square border-2 border-border rounded-lg overflow-hidden bg-muted/30">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Hochgeladenes Bild"
            className="w-full h-full object-cover"
          />
          {/* Bounding boxes overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {boundingBoxes.map((box, index) => (
              <rect
                key={index}
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill="rgba(147, 51, 234, 0.3)"
                stroke="rgba(147, 51, 234, 0.8)"
                strokeWidth="0.5"
                rx="1"
              />
            ))}
          </svg>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MushroomPlaceholder />
        </div>
      )}
    </div>
  )
}
