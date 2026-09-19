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

/**
 * One editable prize tier. `id` only exists to give React a stable key while
 * rows are added and removed — it is stripped before the pool is persisted.
 */
export interface LotteryPrizeDraft {
  id: string
  /** 额度下限。上限缺省或等于下限时表示固定额度。 */
  quota: number
  /** 额度上限，0 表示固定额度（与旧配置兼容）。 */
  quotaMax: number
  weight: number
}

let prizeSeq = 0

function nextPrizeId(): string {
  prizeSeq += 1
  return `prize-${prizeSeq}`
}

export function createEmptyPrize(): LotteryPrizeDraft {
  return { id: nextPrizeId(), quota: 0, quotaMax: 0, weight: 1 }
}

/**
 * Sum of all tier weights, used to preview each tier's hit chance.
 */
export function totalPrizeWeight(pool: LotteryPrizeDraft[]): number {
  return pool.reduce((sum, prize) => sum + (Number(prize.weight) || 0), 0)
}

/**
 * 除指定档位之外，其余档位的权重之和。
 *
 * "按概率输入"时需要它：先把其他档位的相对比例固定住，再反推这一档该给多少权重，
 * 这样改一档不会把其他档的概率也搅乱。
 */
export function weightOfOthers(
  pool: LotteryPrizeDraft[],
  index: number
): number {
  return pool.reduce(
    (sum, prize, i) => (i === index ? sum : sum + (Number(prize.weight) || 0)),
    0
  )
}

/**
 * 把"这一档应占的百分比"换算成权重。
 *
 * 权重是正整数（后端抽奖按整数权重累加命中），所以概率存在固有的精度上限：
 * 0.01% 这类极小概率无法精确表达，只能落到最小权重 1。调用方要把这件事告诉
 * 管理员，而不是假装能精确设置。
 *
 * 其他档位权重为 0 时（例如池里只有这一档）返回 1：此时它本来就是 100%。
 */
export function weightFromPercent(
  percent: number,
  otherWeight: number
): number {
  if (!Number.isFinite(percent) || percent <= 0) return 1
  if (otherWeight <= 0) return 1
  // 上限 99%：留出余量，避免算出权重 0（权重必须大于 0）
  const pct = Math.min(percent, 99)
  return Math.max(1, Math.round((pct * otherWeight) / (100 - pct)))
}

/**
 * 把某一档上移或下移。越界时为无操作，返回原数组。
 *
 * 顺序不影响中奖概率（每档的概率只由自己的权重占总权重的比例决定），它只决定
 * 奖池怎么排列 —— 比如按额度从小到大展示给用户看。
 */
export function movePrize(
  pool: LotteryPrizeDraft[],
  index: number,
  offset: number
): LotteryPrizeDraft[] {
  const target = index + offset
  if (index < 0 || index >= pool.length) return pool
  if (target < 0 || target >= pool.length) return pool
  const next = [...pool]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

/**
 * Parses a prize pool that the backend stores as a JSON string.
 * Missing or malformed input degrades to an empty pool instead of throwing,
 * so a bad stored value cannot break the settings page.
 */
/**
 * Turns a prize pool that arrived as an array (rather than a JSON string)
 * into editable drafts.
 */
export function toPrizeDrafts(
  prizes: ReadonlyArray<{ quota: number; quota_max?: number; weight: number }>
): LotteryPrizeDraft[] {
  return prizes.map((prize) => ({
    id: nextPrizeId(),
    quota: Number(prize.quota) || 0,
    quotaMax: Number(prize.quota_max) || 0,
    weight: Number(prize.weight) || 0,
  }))
}

export function parseLotteryPool(value: string | undefined): LotteryPrizeDraft[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null
      )
      .map((item) => ({
        id: nextPrizeId(),
        quota: Number(item.quota) || 0,
        quotaMax: Number(item.quota_max) || 0,
        weight: Number(item.weight) || 0,
      }))
  } catch {
    return []
  }
}

/**
 * Serialises a pool for the backend, dropping the editor-only `id`.
 */
export function serializeLotteryPool(pool: LotteryPrizeDraft[]): string {
  return JSON.stringify(
    pool.map((prize) => ({
      quota: prize.quota,
      // 始终带上上限（0 表示固定额度）：让后端去校验"上限低于下限"并给出明确
      // 报错，而不是在前端静默丢弃管理员填的值。
      quota_max: prize.quotaMax,
      weight: prize.weight,
    }))
  )
}

/**
 * Compares two pools independently of object key order, so a round-trip
 * through the backend never looks like a user edit.
 */
export function poolSignature(pool: LotteryPrizeDraft[]): string {
  return JSON.stringify(
    pool.map((prize) => [prize.quota, prize.quotaMax, prize.weight])
  )
}
