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
export type DocsChangedEvent = {
  kind: 'docs_changed'
  source: string
  nonce: string
  timestamp: number
}

const DOCS_CHANGED_CHANNEL = 'new-api:docs-changed'
const DOCS_CHANGED_STORAGE_KEY = 'new-api:docs-changed:event'

function randomIdentifier(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const docsChangedSource = randomIdentifier()
let docsChangedPublisher: BroadcastChannel | null = null

function isDocsChangedEvent(value: unknown): value is DocsChangedEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<DocsChangedEvent>
  return (
    event.kind === 'docs_changed' &&
    typeof event.source === 'string' &&
    typeof event.nonce === 'string' &&
    typeof event.timestamp === 'number'
  )
}

export function publishDocsChanged(): void {
  if (typeof window === 'undefined') return
  const event: DocsChangedEvent = {
    kind: 'docs_changed',
    source: docsChangedSource,
    nonce: randomIdentifier(),
    timestamp: Date.now(),
  }

  if (typeof BroadcastChannel !== 'undefined') {
    docsChangedPublisher ??= new BroadcastChannel(DOCS_CHANGED_CHANNEL)
    docsChangedPublisher.postMessage(event)
    return
  }

  try {
    window.localStorage.setItem(DOCS_CHANGED_STORAGE_KEY, JSON.stringify(event))
    window.localStorage.removeItem(DOCS_CHANGED_STORAGE_KEY)
  } catch {
    // Cross-tab synchronization is best-effort when storage is unavailable.
  }
}

export function subscribeDocsChanged(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => undefined

  const deliver = (value: unknown) => {
    if (
      isDocsChangedEvent(value) &&
      value.source !== docsChangedSource &&
      Math.abs(Date.now() - value.timestamp) < 60_000
    ) {
      listener()
    }
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(DOCS_CHANGED_CHANNEL)
    const handleMessage = (message: MessageEvent<unknown>) => {
      deliver(message.data)
    }
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== DOCS_CHANGED_STORAGE_KEY || !event.newValue) return
    try {
      deliver(JSON.parse(event.newValue))
    } catch {
      // Ignore malformed same-origin storage events.
    }
  }
  window.addEventListener('storage', handleStorage)
  return () => {
    window.removeEventListener('storage', handleStorage)
  }
}
