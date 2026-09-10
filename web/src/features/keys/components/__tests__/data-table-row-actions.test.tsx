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
import type { Row } from '@tanstack/react-table'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { API_KEY_STATUS } from '../../constants'
import type { ApiKey } from '../../types'
import { ApiKeysProvider, useApiKeys } from '../api-keys-provider'
import { DataTableRowActions } from '../data-table-row-actions'

vi.mock('../../api', () => ({
  fetchTokenKey: vi.fn(async () => ({
    success: true,
    data: { key: 'realkey' },
  })),
  fetchTokenKeysBatch: vi.fn(async () => ({
    success: true,
    data: { keys: {} },
  })),
  updateApiKeyStatus: vi.fn(async () => ({ success: true })),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: null, loading: false }),
}))

const writeText = vi.fn(() => Promise.resolve())

const apiKey: ApiKey = {
  id: 7,
  name: 'gpt',
  key: 'sk-abcd***wxyz',
  status: API_KEY_STATUS.ENABLED,
  remain_quota: 0,
  used_quota: 0,
  unlimited_quota: true,
  expired_time: -1,
  created_time: 0,
  accessed_time: 0,
  group: 'GPT-PLUS',
  auto_groups: [],
  cross_group_retry: false,
  model_limits_enabled: false,
  model_limits: '',
  allow_ips: '',
}

/** Surfaces the dialog the row actions asked the provider to open. */
function DialogProbe() {
  const { open } = useApiKeys()
  return <span data-testid='open-dialog'>{open ?? 'none'}</span>
}

function renderRowActions() {
  return render(
    <ApiKeysProvider>
      <DataTableRowActions
        row={{ original: apiKey } as unknown as Row<ApiKey>}
      />
      <DialogProbe />
    </ApiKeysProvider>
  )
}

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
})

describe('api key row actions', () => {
  test('exposes copy and CC Switch without opening the overflow menu', () => {
    renderRowActions()

    expect(screen.getByRole('button', { name: 'Copy Key' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'CC Switch' })
    ).toBeInTheDocument()
  })

  test('copies the full key straight from the row button', async () => {
    renderRowActions()

    fireEvent.click(screen.getByRole('button', { name: 'Copy Key' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('sk-realkey'))
  })

  test('opens the CC Switch dialog straight from the row button', async () => {
    renderRowActions()

    fireEvent.click(screen.getByRole('button', { name: 'CC Switch' }))

    await waitFor(() =>
      expect(screen.getByTestId('open-dialog')).toHaveTextContent('cc-switch')
    )
  })

  test('keeps the overflow menu available for the remaining actions', () => {
    renderRowActions()

    expect(
      screen.getByRole('button', { name: 'Open menu' })
    ).toBeInTheDocument()
  })
})
