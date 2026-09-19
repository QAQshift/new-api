/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

/** Poster geometry. Exported so the preview can keep the same aspect ratio. */
export const POSTER_WIDTH = 720
export const POSTER_HEIGHT = 1000

const POSTER_PADDING = 64

export interface AffiliatePosterInput {
  /** Site name shown as the poster headline */
  siteName: string
  /** One-line rebate summary, e.g. "前 3 次充值返 5%，之后 3%" */
  headline: string
  /** Referral link printed under the QR code */
  referralLink: string
  /** The rendered QR code canvas (from qrcode.react's QRCodeCanvas) */
  qrCanvas: HTMLCanvasElement
  /** Localised hint printed above the link, e.g. "扫码注册" */
  scanHint: string
  /**
   * Operator-configured background image. When set it replaces the built-in
   * flat layout; everything functional is drawn on a white panel on top of it,
   * so a busy image can never make the QR code unscannable.
   */
  backgroundImageUrl?: string
}

/**
 * Builds a safe download filename for the poster.
 *
 * Site names can contain characters that are illegal in file names on Windows,
 * so they are replaced rather than dropped.
 */
export function buildPosterFilename(siteName: string): string {
  const cleaned = (siteName || 'referral')
    .replaceAll(/[/\\:*?"<>|]+/g, '-')
    .trim()
  const base = cleaned === '' ? 'referral' : cleaned
  return `${base}-referral-poster.png`
}

/** Truncates text with an ellipsis so it fits the given width. */
function trimToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let trimmed = text
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1)
  }
  return `${trimmed}…`
}

/**
 * Loads an image for canvas use.
 *
 * `crossOrigin` is required: without it a cross-origin image taints the canvas
 * and `toBlob` throws on export. When the host does not send CORS headers the
 * load fails and we fall back to the built-in layout rather than breaking the
 * poster entirely.
 */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', () => resolve(null), { once: true })
    image.src = url
  })
}

/** Draws an image so it covers the whole canvas, cropping the overflow. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  if (image.width <= 0 || image.height <= 0) return
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  )
}

/** The original flat design: dark header, QR card on white. */
function drawDefaultLayout(
  ctx: CanvasRenderingContext2D,
  input: AffiliatePosterInput,
  qrSize: number
) {
  const { siteName, headline, referralLink, qrCanvas, scanHint } = input

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, POSTER_WIDTH, 240)
  ctx.textAlign = 'center'

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(
    trimToWidth(ctx, siteName, POSTER_WIDTH - POSTER_PADDING * 2),
    POSTER_WIDTH / 2,
    120
  )

  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
  ctx.font = '24px sans-serif'
  ctx.fillText(
    trimToWidth(ctx, headline, POSTER_WIDTH - POSTER_PADDING * 2),
    POSTER_WIDTH / 2,
    175
  )

  const cardSize = qrSize + 48
  const cardX = (POSTER_WIDTH - cardSize) / 2
  const cardY = 330

  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardSize, cardSize, 20)
  ctx.fill()
  ctx.stroke()
  ctx.drawImage(qrCanvas, cardX + 24, cardY + 24, qrSize, qrSize)

  const hintY = cardY + cardSize + 64
  ctx.fillStyle = '#64748b'
  ctx.font = '22px sans-serif'
  ctx.fillText(scanHint, POSTER_WIDTH / 2, hintY)

  ctx.fillStyle = '#0f172a'
  ctx.font = '18px monospace'
  ctx.fillText(
    trimToWidth(ctx, referralLink, POSTER_WIDTH - POSTER_PADDING * 2),
    POSTER_WIDTH / 2,
    hintY + 44
  )
}

/**
 * The layout used when the operator supplied a background image.
 *
 * The image is the whole poster; every functional element (site name, QR code,
 * link) sits on one opaque white panel so it stays readable no matter what the
 * image looks like.
 */
function drawBackgroundLayout(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  input: AffiliatePosterInput,
  qrSize: number
) {
  const { siteName, referralLink, qrCanvas, scanHint } = input

  drawCover(ctx, image, POSTER_WIDTH, POSTER_HEIGHT)

  const panelWidth = POSTER_WIDTH - POSTER_PADDING * 2
  const panelX = POSTER_PADDING
  const panelY = 300
  const panelHeight = 660

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 28)
  ctx.fill()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText(
    trimToWidth(ctx, siteName, panelWidth - 80),
    POSTER_WIDTH / 2,
    panelY + 80
  )

  const cardSize = qrSize + 48
  const cardX = (POSTER_WIDTH - cardSize) / 2
  const cardY = panelY + 130

  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardSize, cardSize, 20)
  ctx.fill()
  ctx.stroke()
  ctx.drawImage(qrCanvas, cardX + 24, cardY + 24, qrSize, qrSize)

  const hintY = cardY + cardSize + 56
  ctx.fillStyle = '#64748b'
  ctx.font = '22px sans-serif'
  ctx.fillText(scanHint, POSTER_WIDTH / 2, hintY)

  ctx.fillStyle = '#0f172a'
  ctx.font = '18px monospace'
  ctx.fillText(
    trimToWidth(ctx, referralLink, panelWidth - 80),
    POSTER_WIDTH / 2,
    hintY + 44
  )
}

/**
 * Renders the referral poster into a caller-provided canvas.
 *
 * The caller owns the canvas so the same element can back both the on-page
 * preview and the download — what the operator sees is exactly what they save.
 */
export async function renderAffiliatePoster(
  input: AffiliatePosterInput,
  canvas: HTMLCanvasElement
): Promise<void> {
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is not available')

  const qrSize = input.qrCanvas.width || 220
  const background = input.backgroundImageUrl
    ? await loadImage(input.backgroundImageUrl)
    : null

  if (background) {
    drawBackgroundLayout(ctx, background, input, qrSize)
  } else {
    drawDefaultLayout(ctx, input, qrSize)
  }
}

/** Exports an already-rendered poster canvas as a PNG download. */
export async function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  if (!blob) throw new Error('Failed to render the poster')

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
