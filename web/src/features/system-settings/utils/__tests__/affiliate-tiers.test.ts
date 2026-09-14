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
import { describe, expect, it } from 'vitest'

import {
  parseAffiliateTiers,
  percentToRateBp,
  rateBpToPercent,
  serializeAffiliateTiers,
  tierStartsAt,
} from '../affiliate-tiers'

describe('parseAffiliateTiers', () => {
  it('parses the backend ladder (bblabu default)', () => {
    const tiers = parseAffiliateTiers(
      '[{"times":3,"rate_bp":500},{"times":0,"rate_bp":300}]'
    )

    expect(tiers).toHaveLength(2)
    expect(tiers[0]).toMatchObject({ times: 3, rateBp: 500 })
    expect(tiers[1]).toMatchObject({ times: 0, rateBp: 300 })
  })

  it('assigns a unique id per tier so React keys stay stable', () => {
    const tiers = parseAffiliateTiers(
      '[{"times":3,"rate_bp":500},{"times":3,"rate_bp":500}]'
    )

    expect(tiers[0]?.id).not.toBe(tiers[1]?.id)
  })

  it('returns an empty list for malformed or missing input', () => {
    expect(parseAffiliateTiers(undefined)).toEqual([])
    expect(parseAffiliateTiers('')).toEqual([])
    expect(parseAffiliateTiers('not json')).toEqual([])
    expect(parseAffiliateTiers('{"times":3}')).toEqual([])
    expect(parseAffiliateTiers(null)).toEqual([])
  })
})

describe('serializeAffiliateTiers', () => {
  it('round-trips without drift', () => {
    const raw = '[{"times":3,"rate_bp":500},{"times":0,"rate_bp":300}]'
    expect(serializeAffiliateTiers(parseAffiliateTiers(raw))).toBe(raw)
  })

  it('never emits floats', () => {
    const serialized = serializeAffiliateTiers([
      { id: 'a', times: 2.9, rateBp: 499.6 },
    ])

    expect(serialized).toBe('[{"times":2,"rate_bp":500}]')
  })

  it('coerces non-numeric input to zero instead of NaN', () => {
    const serialized = serializeAffiliateTiers([
      { id: 'a', times: Number.NaN, rateBp: Number.NaN },
    ])

    expect(serialized).toBe('[{"times":0,"rate_bp":0}]')
  })
})

describe('percent <-> basis points', () => {
  it('converts between the two representations', () => {
    expect(rateBpToPercent(500)).toBe(5)
    expect(rateBpToPercent(300)).toBe(3)
    expect(rateBpToPercent(50)).toBe(0.5)
    expect(percentToRateBp(5)).toBe(500)
    expect(percentToRateBp(0.5)).toBe(50)
  })

  it('keeps two decimal places of precision', () => {
    expect(percentToRateBp(2.35)).toBe(235)
    expect(rateBpToPercent(235)).toBe(2.35)
  })
})

describe('tierStartsAt', () => {
  it('continues right after the previous tier', () => {
    const tiers = parseAffiliateTiers(
      '[{"times":3,"rate_bp":500},{"times":5,"rate_bp":400},{"times":0,"rate_bp":300}]'
    )

    expect(tierStartsAt(tiers, 0)).toBe(1)
    expect(tierStartsAt(tiers, 1)).toBe(4)
    expect(tierStartsAt(tiers, 2)).toBe(6)
  })
})
