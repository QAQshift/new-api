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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { drawLottery, getLotteryStatus } from '../api'
import { LotteryTab } from '../components/lottery-tab'
import type { LotteryStatus } from '../types'

vi.mock('../api', () => ({
  getLotteryStatus: vi.fn(),
  drawLottery: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockedGetLotteryStatus = vi.mocked(getLotteryStatus)
const mockedDrawLottery = vi.mocked(drawLottery)

function baseStatus(overrides: Partial<LotteryStatus> = {}): LotteryStatus {
  return {
    enabled: true,
    mode: 'segment',
    used_quota: 350,
    drawn_count: 3,
    drawable_count: 0,
    next_threshold: 400,
    next_prizes: [
      { quota: 100, weight: 70 },
      { quota: 500, weight: 30 },
    ],
    records: [],
    ...overrides,
  }
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <LotteryTab />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('lottery tab', () => {
  test('explains the situation when the operator has the feature switched off', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ enabled: false }),
    })

    renderTab()

    expect(
      await screen.findByText('Lottery is not available')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Draw now' })).toBeNull()
  })

  test('renders the next prize pool with each tier chance', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ drawable_count: 2 }),
    })

    renderTab()

    expect(await screen.findByText('Next prize pool')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('2 draw(s) available')).toBeInTheDocument()
  })

  test('collapses identical tiers into one entry whose chance adds up', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({
        drawable_count: 1,
        next_prizes: [
          { quota: 500, weight: 20 },
          { quota: 500, weight: 20 },
        ],
      }),
    })

    renderTab()

    expect(await screen.findByText('Next prize pool')).toBeInTheDocument()
    // 20 + 20 over a total of 40
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  test('blocks the button and explains the gap while the threshold is unmet', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ drawable_count: 0 }),
    })

    renderTab()

    const button = await screen.findByRole('button', {
      name: 'No draw available',
    })
    expect(button).toBeDisabled()
    // 400 required - 350 consumed = 50 to go
    expect(screen.getByText(/Consume .* more for the next draw/)).toBeTruthy()
  })

  test('draws and refreshes the status afterwards', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ drawable_count: 1 }),
    })
    mockedDrawLottery.mockResolvedValue({
      success: true,
      data: {
        mode: 'segment',
        draw_index: 4,
        prize_quota: 500,
        created_at: 1_700_000_000,
      },
    })

    renderTab()

    const button = await screen.findByRole('button', { name: 'Draw now' })
    const callsBefore = mockedGetLotteryStatus.mock.calls.length
    fireEvent.click(button)

    await waitFor(() => expect(mockedDrawLottery).toHaveBeenCalledTimes(1))
    // The tab must refresh so the remaining draws stay accurate
    await waitFor(() =>
      expect(mockedGetLotteryStatus.mock.calls.length).toBeGreaterThan(
        callsBefore
      )
    )
  })

  test('reports the backend reason when a draw is rejected', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ drawable_count: 1 }),
    })
    mockedDrawLottery.mockResolvedValue({
      success: false,
      message: '累计消费未达到门槛',
    })

    renderTab()

    fireEvent.click(await screen.findByRole('button', { name: 'Draw now' }))

    await waitFor(() => expect(mockedDrawLottery).toHaveBeenCalledTimes(1))
    // A rejected draw must not leave the button stuck in a loading state
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Draw now' })).toBeEnabled()
    )
  })

  test('shows an empty state before the first draw', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({ drawable_count: 1, records: [] }),
    })

    renderTab()

    expect(await screen.findByText('Draw history')).toBeInTheDocument()
    expect(screen.getByText('No lottery records yet')).toBeInTheDocument()
  })

  test('lists past draws with their tier index', async () => {
    mockedGetLotteryStatus.mockResolvedValue({
      success: true,
      data: baseStatus({
        drawable_count: 1,
        records: [
          {
            id: 2,
            mode: 'segment',
            draw_index: 2,
            prize_quota: 500,
            created_at: 1_700_000_000,
          },
          {
            id: 1,
            mode: 'segment',
            draw_index: 1,
            prize_quota: 100,
            created_at: 1_699_000_000,
          },
        ],
      }),
    })

    renderTab()

    expect(await screen.findByText('Draw #2')).toBeInTheDocument()
    expect(screen.getByText('Draw #1')).toBeInTheDocument()
  })
})
