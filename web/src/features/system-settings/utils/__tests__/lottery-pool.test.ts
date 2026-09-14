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
  return pool.map(({ quota, weight }) => ({ quota, weight }))
}

describe('parseLotteryPool', () => {
  test('parses the JSON string the backend stores', () => {
    expect(
      bare(
        parseLotteryPool('[{"quota":100,"weight":70},{"quota":200,"weight":30}]')
      )
    ).toEqual([
      { quota: 100, weight: 70 },
      { quota: 200, weight: 30 },
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
  test('persists only quota and weight', () => {
    const pool = parseLotteryPool('[{"quota":100,"weight":70}]')
    expect(serializeLotteryPool(pool)).toBe('[{"quota":100,"weight":70}]')
  })
})

describe('totalPrizeWeight', () => {
  test('sums every tier weight', () => {
    expect(
      totalPrizeWeight([
        { id: 'a', quota: 10, weight: 70 },
        { id: 'b', quota: 20, weight: 30 },
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
    expect(
      poolSignature([{ id: 'a', quota: 1, weight: 2 }])
    ).toBe(poolSignature([{ id: 'b', quota: 1, weight: 2 }]))
  })

  test('detects an actual edit', () => {
    expect(
      poolSignature([{ id: 'a', quota: 1, weight: 2 }])
    ).not.toBe(poolSignature([{ id: 'a', quota: 2, weight: 2 }]))
    expect(
      poolSignature([{ id: 'a', quota: 1, weight: 2 }])
    ).not.toBe(
      poolSignature([
        { id: 'a', quota: 1, weight: 2 },
        { id: 'b', quota: 5, weight: 1 },
      ])
    )
  })
})

describe('createEmptyPrize', () => {
  test('starts a new tier with a usable weight so it cannot be ignored', () => {
    const prize = createEmptyPrize()

    expect(prize.quota).toBe(0)
    expect(prize.weight).toBe(1)
    expect(prize.id).toBeTruthy()
  })

  test('never reuses an id', () => {
    expect(createEmptyPrize().id).not.toBe(createEmptyPrize().id)
  })
})
