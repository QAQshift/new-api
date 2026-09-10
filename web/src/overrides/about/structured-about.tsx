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
import { useSystemConfig } from '@/hooks/use-system-config'

import { DocBlocksView } from '@/overrides/docs/doc-blocks'

import type { AboutDocument } from './parse-about'

/**
 * Administrator-configured About page. Renders the same block vocabulary as
 * the documentation page, so contact cards, copyable support handles and
 * WeChat / QQ QR codes (`qr` blocks) all work here.
 */
export function StructuredAboutPage(props: { document: AboutDocument }) {
  const { systemName, logo } = useSystemConfig()
  const document = props.document

  return (
    <main className='bg-muted/20 min-h-svh border-t'>
      <section className='mx-auto max-w-5xl px-6 pt-20 pb-14 md:px-10 md:pt-28'>
        <div className='flex items-center gap-3'>
          <img
            src={logo}
            alt=''
            className='size-10 rounded-xl object-contain'
          />
          <span className='text-muted-foreground text-sm font-medium'>
            {systemName}
          </span>
        </div>
        {document.eyebrow && (
          <p className='text-primary mt-8 text-xs font-semibold tracking-[0.2em] uppercase'>
            {document.eyebrow}
          </p>
        )}
        {document.title && (
          <h1 className='mt-2 max-w-3xl text-4xl leading-tight font-bold tracking-tight md:text-6xl'>
            {document.title}
          </h1>
        )}
        {document.summary && (
          <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-relaxed md:text-lg'>
            {document.summary}
          </p>
        )}
      </section>

      {document.blocks.length > 0 && (
        <section className='mx-auto max-w-5xl px-6 pb-20 md:px-10'>
          <DocBlocksView blocks={document.blocks} />
        </section>
      )}
    </main>
  )
}
