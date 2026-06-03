import JSZip from 'jszip'

export function getSvgDimensions(svgString) {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return { width: 800, height: 600 }

  const viewBox = svg.getAttribute('viewBox')?.split(/\s+/).map(Number)
  if (viewBox?.length === 4) {
    return { width: viewBox[2], height: viewBox[3] }
  }

  return {
    width: Number.parseFloat(svg.getAttribute('width') ?? '800') || 800,
    height: Number.parseFloat(svg.getAttribute('height') ?? '600') || 600,
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to render SVG image'))
    img.src = url
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function svgBasename(filename) {
  return filename.replace(/\.svg$/i, '')
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function svgToPngBlob(svgString, { scale = 2, background = '#ffffff' } = {}) {
  const { width, height } = getSvgDimensions(svgString)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)
    const ctx = canvas.getContext('2d')
    if (background) {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function downloadZipSvgs(results, filename = 'batch.zip') {
  const zip = new JSZip()
  results.forEach((r) => zip.file(r.name, r.content))
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, filename)
}

export async function downloadZipPngs(results, { onProgress, scale = 2 } = {}) {
  const zip = new JSZip()

  for (let i = 0; i < results.length; i += 1) {
    const png = await svgToPngBlob(results[i].content, { scale })
    zip.file(`${svgBasename(results[i].name)}.png`, png)
    onProgress?.(i + 1, results.length)
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, 'batch.zip')
}

export async function downloadPdf(results, { onProgress, scale = 2 } = {}) {
  if (results.length === 0) return

  const { jsPDF } = await import('jspdf')
  const { width, height } = getSvgDimensions(results[0].content)
  const orientation = width >= height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
  })

  for (let i = 0; i < results.length; i += 1) {
    if (i > 0) pdf.addPage([width, height], orientation)
    const png = await svgToPngBlob(results[i].content, { scale })
    const dataUrl = await blobToDataUrl(png)
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
    onProgress?.(i + 1, results.length)
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0))
  }

  pdf.save('batch.pdf')
}

export async function exportResults(results, format, options = {}) {
  if (format === 'png') return downloadZipPngs(results, options)
  if (format === 'pdf') return downloadPdf(results, options)
  return downloadZipSvgs(results, options.filename ?? 'batch.zip')
}

export function exportFormatLabel(format) {
  if (format === 'png') return 'PNG (ZIP)'
  if (format === 'pdf') return 'PDF'
  return 'SVG (ZIP)'
}

export function downloadButtonLabel(format, hasPreview) {
  if (!hasPreview) return 'Preview'
  if (format === 'pdf') return 'Download PDF'
  if (format === 'png') return 'Download PNG ZIP'
  return 'Download ZIP'
}
