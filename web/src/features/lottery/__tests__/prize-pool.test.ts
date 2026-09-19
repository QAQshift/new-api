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
import { describe, expect, test } from 'vitest'

import {
  mergeIdenticalPrizes,
  formatPrizePercent,
  prizeWeightPercent,
  topPrize,
} from '../prize-pool'

describe('mergeIdenticalPrizes', () => {
  test('leaves distinct tiers untouched', () => {
    const pool = [
      { quota: 10, weight: 70 },
      { quota: 50, weight: 30 },
    ]

    expect(mergeIdenticalPrizes(pool)).toEqual(pool)
  })

  test('adds the weights of identical tiers so the chance stays correct', () => {
    // Two tiers with the same amount and weight are the same outcome
    const merged = mergeIdenticalPrizes([
      { quota: 50, weight: 20 },
      { quota: 50, weight: 20 },
    ])

    expect(merged).toEqual([{ quota: 50, weight: 40 }])
  })

  test('keeps tiers that share an amount but differ in weight', () => {
    const merged = mergeIdenticalPrizes([
      { quota: 70, weight: 25 },
      { quota: 70, weight: 5 },
    ])

    expect(merged).toHaveLength(2)
  })

  test('produces keys that are unique per rendered tier', () => {
    const merged = mergeIdenticalPrizes([
      { quota: 10, weight: 5 },
      { quota: 10, weight: 5 },
      { quota: 10, weight: 5 },
    ])
    const keys = merged.map((prize) => `${prize.quota}-${prize.weight}`)

    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('prizeWeightPercent', () => {
  test('expresses a tier as a whole percentage of the pool', () => {
    const pool = [
      { quota: 10, weight: 70 },
      { quota: 50, weight: 30 },
    ]

    expect(prizeWeightPercent(pool[0], pool)).toBe(70)
    expect(prizeWeightPercent(pool[1], pool)).toBe(30)
  })

  test('keeps the exact value instead of rounding it away', () => {
    const pool = [
      { quota: 10, weight: 1 },
      { quota: 20, weight: 2 },
    ]

    // 1/3 不该在计算阶段就被取整成 33：保留精度，显示交给 formatPrizePercent
    expect(prizeWeightPercent(pool[0], pool)).toBeCloseTo(33.3333, 3)
  })

  test('reports a half percent as a half percent', () => {
    const pool = [
      { quota: 10, weight: 199 },
      { quota: 20, weight: 1 },
    ]

    // 1/200 = 0.5%：这一档正是之前被四舍五入成 "1%" 的那一档，误差整整一倍
    expect(prizeWeightPercent(pool[1], pool)).toBe(0.5)
    expect(formatPrizePercent(prizeWeightPercent(pool[1], pool))).toBe('0.5')
  })

  test('is zero for an empty pool instead of dividing by zero', () => {
    expect(prizeWeightPercent({ quota: 10, weight: 1 }, [])).toBe(0)
    expect(
      prizeWeightPercent({ quota: 10, weight: 1 }, [{ quota: 5, weight: 0 }])
    ).toBe(0)
  })
})

describe('formatPrizePercent', () => {
  test('shows at most two decimals and drops trailing zeros', () => {
    expect(formatPrizePercent(70)).toBe('70')
    expect(formatPrizePercent(30)).toBe('30')
    expect(formatPrizePercent(0.5)).toBe('0.5')
    expect(formatPrizePercent(33.3333)).toBe('33.33')
    expect(formatPrizePercent(0.05)).toBe('0.05')
  })

  test('never reports a real chance as a flat zero', () => {
    // 0.001% 用两位小数表示不出来，但显示成 "0%" 是在骗人
    expect(formatPrizePercent(0.001)).toBe('<0.01')
    expect(formatPrizePercent(0)).toBe('0')
  })
})

describe('topPrize', () => {
  test('returns the largest amount in the pool', () => {
    expect(
      topPrize([
        { quota: 10, weight: 70 },
        { quota: 500, weight: 5 },
        { quota: 50, weight: 25 },
      ])
    ).toEqual({ quota: 500, weight: 5 })
  })

  test('is null for an empty pool', () => {
    expect(topPrize([])).toBeNull()
  })
})
