/** Perkecil gambar di klien sebelum disimpan, supaya penyimpanan tidak penuh. */
export function resizeImage(source: Blob | HTMLVideoElement, max: number, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const draw = (img: CanvasImageSource, w: number, h: number) => {
      const scale = Math.min(1, max / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas tidak tersedia'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    if (source instanceof HTMLVideoElement) return draw(source, source.videoWidth, source.videoHeight)
    const url = URL.createObjectURL(source)
    const img = new Image()
    img.onload = () => {
      draw(img, img.naturalWidth, img.naturalHeight)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => reject(new Error('File bukan gambar yang valid'))
    img.src = url
  })
}
