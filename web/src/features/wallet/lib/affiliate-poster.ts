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

const POSTER_WIDTH = 720
const POSTER_HEIGHT = 1000
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

async function saveCanvasAsPng(
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

/**
 * Composes the referral poster and downloads it as a PNG.
 *
 * Drawn with the plain 2D context so no extra dependency is needed; the
 * confirmation QR is composited from an already-rendered canvas.
 */
export async function downloadAffiliatePoster(
  input: AffiliatePosterInput
): Promise<void> {
  const { siteName, headline, referralLink, qrCanvas } = input

  const canvas = document.createElement('canvas')
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is not available')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  // 顶部色块与标题
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

  // 二维码卡片
  const qrSize = qrCanvas.width || 220
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

  // 说明与链接
  const hintY = cardY + cardSize + 64
  ctx.fillStyle = '#64748b'
  ctx.font = '22px sans-serif'
  ctx.fillText('扫码注册', POSTER_WIDTH / 2, hintY)

  ctx.fillStyle = '#0f172a'
  ctx.font = '18px monospace'
  ctx.fillText(
    trimToWidth(ctx, referralLink, POSTER_WIDTH - POSTER_PADDING * 2),
    POSTER_WIDTH / 2,
    hintY + 44
  )

  await saveCanvasAsPng(canvas, buildPosterFilename(siteName))
}
