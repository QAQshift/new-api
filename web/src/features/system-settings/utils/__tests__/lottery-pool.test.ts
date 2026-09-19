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
  createEmptyPrize,
  parseLotteryPool,
  poolSignature,
  serializeLotteryPool,
  totalPrizeWeight,
  type LotteryPrizeDraft,
} from '../lottery-pool'

/** Drops the editor-only id so assertions read like the persisted value. */
function bare(pool: LotteryPrizeDraft[]) {
  return pool.map(({ quota, quotaMax, weight }) => ({ quota, quotaMax, weight }))
}

describe('parseLotteryPool', () => {
  test('parses the JSON string the backend stores', () => {
    expect(
      bare(
        parseLotteryPool('[{"quota":100,"weight":70},{"quota":200,"weight":30}]')
      )
    ).toEqual([
      { quota: 100, quotaMax: 0, weight: 70 },
      { quota: 200, quotaMax: 0, weight: 30 },
    ])
  })

  test('gives every tier a unique id so React keys stay stable', () => {
    const pool = parseLotteryPool(
      '[{"quota":100,"weight":70},{"quota":100,"weight":70},{"quota":200,"weight":30}]'
    )

    const ids = pool.map((prize) => prize.id)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('degrades to an empty pool instead of throwing', () => {
    expect(parseLotteryPool(undefined)).toEqual([])
    expect(parseLotteryPool('')).toEqual([])
    expect(parseLotteryPool('not json')).toEqual([])
    // A JSON object is not a pool
    expect(parseLotteryPool('{"quota":100}')).toEqual([])
    // Non-object entries are dropped rather than producing NaN rows
    expect(parseLotteryPool('[null,1,"x"]')).toEqual([])
  })

  test('accepts a pool saved as an empty array', () => {
    expect(parseLotteryPool('[]')).toEqual([])
  })
})

describe('serializeLotteryPool', () => {
  test('persists the amount range and the weight', () => {
    const pool = parseLotteryPool('[{"quota":100,"weight":70}]')
    // 固定额度写成 quota_max:0，后端据此走"固定金额"分支
    expect(serializeLotteryPool(pool)).toBe(
      '[{"quota":100,"quota_max":0,"weight":70}]'
    )
  })

  test('round-trips a ranged tier without losing the upper bound', () => {
    const source = '[{"quota":100,"quota_max":300,"weight":70}]'
    expect(serializeLotteryPool(parseLotteryPool(source))).toBe(source)
  })
})

describe('amount ranges', () => {
  test('reads the upper bound the backend stored', () => {
    const pool = parseLotteryPool('[{"quota":100,"quota_max":300,"weight":70}]')

    expect(pool[0].quota).toBe(100)
    expect(pool[0].quotaMax).toBe(300)
  })

  test('degrades a missing upper bound to a fixed amount', () => {
    expect(parseLotteryPool('[{"quota":100,"weight":70}]')[0].quotaMax).toBe(0)
  })

  test('treats an upper-bound change as an edit', () => {
    const before = parseLotteryPool('[{"quota":100,"weight":70}]')
    const after = parseLotteryPool('[{"quota":100,"quota_max":200,"weight":70}]')

    expect(poolSignature(before)).not.toBe(poolSignature(after))
  })

  test('keeps a backend round-trip from looking like an edit', () => {
    // 旧配置里没有 quota_max，保存一次会补上 0；重复保存不应再判定为"有改动"
    const stored = '[{"quota":100,"weight":70}]'
    const once = parseLotteryPool(stored)
    const twice = parseLotteryPool(serializeLotteryPool(once))

    expect(poolSignature(twice)).toBe(poolSignature(once))
  })
})

describe('totalPrizeWeight', () => {
  test('sums every tier weight', () => {
    expect(
      totalPrizeWeight([
        { id: 'a', quota: 10, quotaMax: 0, weight: 70 },
        { id: 'b', quota: 20, quotaMax: 0, weight: 30 },
      ])
    ).toBe(100)
  })

  test('is zero for an empty pool', () => {
    expect(totalPrizeWeight([])).toBe(0)
  })
})

describe('poolSignature', () => {
  test('ignores ids so re-parsing is not a user edit', () => {
    const first = parseLotteryPool('[{"quota":1,"weight":2}]')
    const second = parseLotteryPool('[{"quota":1,"weight":2}]')

    expect(poolSignature(first)).toBe(poolSignature(second))
  })

  test('ignores key order so a backend round-trip is not a user edit', () => {
    expect(poolSignature([{ id: 'a', quota: 1, quotaMax: 0, weight: 2 }])).toBe(
      poolSignature([{ id: 'b', quota: 1, quotaMax: 0, weight: 2 }])
    )
  })

  test('detects an actual edit', () => {
    expect(
      poolSignature([{ id: 'a', quota: 1, quotaMax: 0, weight: 2 }])
    ).not.toBe(poolSignature([{ id: 'a', quota: 2, quotaMax: 0, weight: 2 }]))
    expect(
      poolSignature([{ id: 'a', quota: 1, quotaMax: 0, weight: 2 }])
    ).not.toBe(
      poolSignature([
        { id: 'a', quota: 1, quotaMax: 0, weight: 2 },
        { id: 'b', quota: 5, quotaMax: 0, weight: 1 },
      ])
    )
  })
})

describe('createEmptyPrize', () => {
  test('starts a new tier with a usable weight so it cannot be ignored', () => {
    const prize = createEmptyPrize()

    expect(prize.quota).toBe(0)
    // 新档位默认是固定额度，而不是一个下限为 0 的区间
    expect(prize.quotaMax).toBe(0)
    expect(prize.weight).toBe(1)
    expect(prize.id).toBeTruthy()
  })

  test('never reuses an id', () => {
    expect(createEmptyPrize().id).not.toBe(createEmptyPrize().id)
  })
})
