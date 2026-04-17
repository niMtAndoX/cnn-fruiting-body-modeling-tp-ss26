import type { PredictionBoundingBox } from "../model/prediction"

interface BoundingBoxOverlayProps {
  boxes: PredictionBoundingBox[]
}

export function BoundingBoxOverlay({ boxes }: BoundingBoxOverlayProps) {
  if (boxes.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {boxes.map((box, index) => (
        <div
          key={`${box.x}-${box.y}-${index}`}
          className="absolute border-2 rounded-sm"
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            backgroundColor: "rgba(147, 51, 234, 0.3)",
            borderColor: "rgba(147, 51, 234, 0.8)",
          }}
        />
      ))}
    </div>
  )
}
