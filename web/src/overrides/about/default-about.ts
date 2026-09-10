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
import type { AboutDocument } from './parse-about'

/**
 * Starting point for the About page editor. It mirrors the shipped built-in
 * page (English source strings) so administrators can see and edit the real
 * content instead of an empty canvas. Contact/QR blocks are added by the
 * administrator — WeChat and QQ QR codes are `qr` blocks.
 */
export const defaultAboutDocument: AboutDocument = {
  version: 1,
  eyebrow: 'SUPPORT',
  title: 'How can we help?',
  summary:
    'Find answers, report an issue, or contact our support team about your account and API usage.',
  blocks: [
    {
      type: 'card',
      title: 'API and account help',
      text: 'Get help with API keys, model access, billing, and request errors.',
      link: { href: '/docs', label: 'Read the docs', external: false },
    },
    {
      type: 'card',
      title: 'Contact support',
      text: 'Include your account email, request ID, and a short description so we can respond quickly.',
      link: {
        href: 'mailto:support@example.com',
        label: 'Email support',
        external: false,
      },
    },
    {
      type: 'card',
      title: 'Security first',
      text: 'Never share an API key in screenshots, public repositories, or support requests.',
    },
  ],
}

export const emptyAboutDocument: AboutDocument = {
  version: 1,
  eyebrow: '',
  title: '',
  summary: '',
  blocks: [],
}
