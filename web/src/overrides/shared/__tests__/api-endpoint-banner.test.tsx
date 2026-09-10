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
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ApiEndpointBanner } from '../api-endpoint-banner'
import { resolveSiteOrigin } from '../site-origin'

const writeText = vi.fn(() => Promise.resolve())

function classList(element: Element): string[] {
  return element.className.split(' ')
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
})

describe('api endpoint banner', () => {
  test('derives both addresses from the origin the visitor is browsing', () => {
    const origin = resolveSiteOrigin()
    render(<ApiEndpointBanner />)

    expect(screen.getByText(`${origin}/v1`)).toBeInTheDocument()
    expect(screen.getByText(origin)).toBeInTheDocument()
  })

  test('copies the root domain when the Anthropic row is used', async () => {
    const origin = resolveSiteOrigin()
    render(<ApiEndpointBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy: Anthropic' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(origin))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Copy: Anthropic' })
      ).toHaveTextContent('Copied')
    )
  })

  test('keeps a long address shrinkable instead of overflowing its row', () => {
    const origin = resolveSiteOrigin()
    render(<ApiEndpointBanner />)

    const value = screen.getByText(`${origin}/v1`)
    const shrinkWrapper = value.parentElement

    expect(classList(value).includes('truncate')).toBeTruthy()
    expect(shrinkWrapper).not.toBeNull()
    expect(classList(shrinkWrapper as Element).includes('min-w-0')).toBeTruthy()
  })
})
