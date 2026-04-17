type AssetLike = string | { src: string }

export function getAssetSrc(asset: AssetLike): string {
  return typeof asset === "string" ? asset : asset.src
}
