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
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useStatus } from '@/hooks/use-status'

import { Welfare } from '../index'

vi.mock('@/hooks/use-status', () => ({
  useStatus: vi.fn(),
}))

// Child modules fetch their own data and are covered by their own tests
vi.mock('@/features/lottery/components/lottery-tab', () => ({
  LotteryTab: () => <div>lottery-module</div>,
}))

vi.mock('@/features/profile/components/checkin-calendar-card', () => ({
  CheckinCalendarCard: () => <div>checkin-module</div>,
}))

// The page layout pulls in shell providers that are irrelevant here
vi.mock('@/components/layout', () => {
  const Slot = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    SectionPageLayout: Object.assign(Slot, {
      Title: Slot,
      Content: Slot,
      Actions: Slot,
      Breadcrumb: Slot,
    }),
  }
})

const mockedUseStatus = vi.mocked(useStatus)

function mockModules(
  flags: { checkin?: boolean; lottery?: boolean },
  loading = false
) {
  mockedUseStatus.mockReturnValue({
    status: {
      checkin_enabled: flags.checkin === true,
      lottery_enabled: flags.lottery === true,
      turnstile_check: false,
      turnstile_site_key: '',
    },
    loading,
    error: null,
  } as unknown as ReturnType<typeof useStatus>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('welfare hub', () => {
  test('renders one tab per enabled module', () => {
    mockModules({ checkin: true, lottery: true })

    render(<Welfare />)

    expect(screen.getByRole('tab', { name: 'Daily Check-in' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Lottery' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy()
  })

  test('leaves out a module the operator has switched off', () => {
    mockModules({ checkin: false, lottery: true })

    render(<Welfare />)

    expect(screen.getByRole('tab', { name: 'Lottery' })).toBeTruthy()
    expect(screen.queryByRole('tab', { name: 'Daily Check-in' })).toBeNull()
  })

  test('opens the only enabled module directly instead of the overview', () => {
    mockModules({ checkin: false, lottery: true })

    render(<Welfare />)

    expect(screen.getByText('lottery-module')).toBeTruthy()
  })

  test('shows the overview when several modules are available', () => {
    mockModules({ checkin: true, lottery: true })

    render(<Welfare />)

    // Two module cards, each with a way in
    expect(screen.getAllByRole('button', { name: 'Open' })).toHaveLength(2)
    expect(screen.queryByText('lottery-module')).toBeNull()
  })

  test('jumps into a module from the overview', async () => {
    mockModules({ checkin: true, lottery: true })

    render(<Welfare />)

    const openButtons = screen.getAllByRole('button', { name: 'Open' })
    fireEvent.click(openButtons[0])

    await waitFor(() =>
      expect(screen.getByText('checkin-module')).toBeTruthy()
    )
  })

  test('explains the situation when nothing is enabled', () => {
    mockModules({})

    render(<Welfare />)

    expect(
      screen.getByText('No welfare module is currently available')
    ).toBeTruthy()
    expect(screen.queryByRole('tab')).toBeNull()
  })

  test('does not claim the hub is empty while the status is still loading', () => {
    mockModules({}, true)

    render(<Welfare />)

    expect(
      screen.queryByText('No welfare module is currently available')
    ).toBeNull()
  })
})
