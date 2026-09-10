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
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { DocBlockRenderer } from '../doc-blocks'

const CHECKSUM = 'a'.repeat(64)

function renderDownloadCard() {
  return render(
    <DocBlockRenderer
      block={{
        type: 'downloads',
        title: 'Codex installer',
        href: 'https://github.com/openai/codex/releases/latest',
        items: [
          {
            name: 'codex-installer-windows-x64.exe',
            desc: `152.3 MB · SHA-256 ${CHECKSUM}`,
          },
        ],
      }}
    />
  )
}

describe('docs download cards', () => {
  test('wraps a long checksum inside its own card', () => {
    renderDownloadCard()

    const description = screen.getByText(`152.3 MB · SHA-256 ${CHECKSUM}`)
    const card = description.parentElement

    expect(description.className.split(' ').includes('break-words')).toBeTruthy()
    expect(card?.className.split(' ').includes('min-w-0')).toBeTruthy()
  })

  test('renders the file name and download link for the item', () => {
    renderDownloadCard()

    expect(
      screen.getByText('codex-installer-windows-x64.exe')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '官方下载' })
    ).toBeInTheDocument()
  })
})
