/** カルテ写真を読み取り用に縮小し、保存用のJPEGも作る。 */
export async function prepareKarteImage(file: File): Promise<{ previewUrl: string; ocrBlob: Blob }> {
  const bitmap = await createImageBitmap(file)
  const maxEdge = 1600
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("カルテ画像を処理できませんでした。")
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const previewUrl = canvas.toDataURL("image/jpeg", 0.8)
  const ocrBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("カルテ画像を処理できませんでした。"))), "image/png")
  })
  return { previewUrl, ocrBlob }
}

/** 写真の日本語を文字にする。初回は言語データを取得する。 */
export async function recognizeKarteImage(source: Blob): Promise<string> {
  const { createWorker } = await import("tesseract.js")
  const worker = await createWorker("jpn")
  try {
    const result = await worker.recognize(source)
    return (result.data.text ?? "").replace(/[ \t]+\n/g, "\n").trim()
  } finally {
    await worker.terminate()
  }
}
