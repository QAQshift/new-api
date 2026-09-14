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

import { enterWelfareActivity, getWelfareActivities } from '../api'
import { ActivityPanel } from '../components/activity-panel'
import type { WelfareActivity } from '../types'

vi.mock('../api', () => ({
  getWelfareActivities: vi.fn(),
  enterWelfareActivity: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockedGetActivities = vi.mocked(getWelfareActivities)
const mockedEnter = vi.mocked(enterWelfareActivity)

function baseActivity(
  overrides: Partial<WelfareActivity> = {}
): WelfareActivity {
  return {
    id: 1,
    title: 'Summer event',
    description: 'Limited time only',
    status: 'active',
    starts_at: 0,
    ends_at: 0,
    min_consume_quota: 0,
    total_limit: 0,
    daily_limit: 0,
    prizes: [
      { quota: 100, weight: 70 },
      { quota: 500, weight: 30 },
    ],
    used_quota: 0,
    entered_count: 0,
    entered_today: 0,
    remaining_total: -1,
    remaining_today: -1,
    threshold_met: true,
    can_enter: true,
    ...overrides,
  }
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ActivityPanel />
    </QueryClientProvider>
  )
}

function mockActivities(activities: WelfareActivity[]) {
  mockedGetActivities.mockResolvedValue({
    success: true,
    data: { activities },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('activity panel', () => {
  test('explains when nothing is running', async () => {
    mockActivities([])

    renderPanel()

    expect(await screen.findByText('No activities yet')).toBeInTheDocument()
  })

  test('shows the activity, its prize pool and chances', async () => {
    mockActivities([baseActivity()])

    renderPanel()

    expect(await screen.findByText('Summer event')).toBeInTheDocument()
    expect(screen.getByText('Limited time only')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    // remaining_total / remaining_today 的 -1 表示不限
    expect(
      screen.getByText('Unlimited today, Unlimited in total')
    ).toBeInTheDocument()
  })

  test('joins the activity and refreshes afterwards', async () => {
    mockActivities([baseActivity()])
    mockedEnter.mockResolvedValue({
      success: true,
      data: {
        activity_id: 1,
        entry_index: 1,
        prize_quota: 500,
        created_at: 1_700_000_000,
      },
    })

    renderPanel()

    const button = await screen.findByRole('button', { name: 'Participate' })
    const callsBefore = mockedGetActivities.mock.calls.length
    fireEvent.click(button)

    await waitFor(() => expect(mockedEnter).toHaveBeenCalledWith(1))
    await waitFor(() =>
      expect(mockedGetActivities.mock.calls.length).toBeGreaterThan(callsBefore)
    )
  })

  test('blocks participation and says why when the threshold is unmet', async () => {
    mockActivities([
      baseActivity({
        min_consume_quota: 1000,
        used_quota: 400,
        threshold_met: false,
        can_enter: false,
      }),
    ])

    renderPanel()

    const button = await screen.findByRole('button', {
      name: 'Threshold not met',
    })
    expect(button).toBeDisabled()
    expect(
      screen.getByText(/Consume .* more to participate/)
    ).toBeInTheDocument()
  })

  test('blocks participation when the daily limit is used up', async () => {
    mockActivities([
      baseActivity({
        daily_limit: 1,
        entered_today: 1,
        remaining_today: 0,
        can_enter: false,
      }),
    ])

    renderPanel()

    const button = await screen.findByRole('button', {
      name: 'Daily limit reached',
    })
    expect(button).toBeDisabled()
  })

  test('blocks participation when the total limit is used up', async () => {
    mockActivities([
      baseActivity({
        total_limit: 1,
        entered_count: 1,
        remaining_total: 0,
        can_enter: false,
      }),
    ])

    renderPanel()

    expect(
      await screen.findByRole('button', { name: 'No entries left' })
    ).toBeDisabled()
  })

  test('marks an activity that has already finished', async () => {
    mockActivities([
      baseActivity({ status: 'ended', can_enter: false }),
    ])

    renderPanel()

    expect(
      await screen.findByRole('button', { name: 'Ended' })
    ).toBeDisabled()
  })

  test('surfaces the backend reason when joining is rejected', async () => {
    mockActivities([baseActivity()])
    mockedEnter.mockResolvedValue({
      success: false,
      message: '今日参与次数已用完',
    })

    renderPanel()

    fireEvent.click(await screen.findByRole('button', { name: 'Participate' }))

    await waitFor(() => expect(mockedEnter).toHaveBeenCalledTimes(1))
    // A rejected attempt must not leave the button stuck loading
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Participate' })
      ).toBeEnabled()
    )
  })
})
