import { createFileRoute } from '@tanstack/react-router'

import { CustomTabPage } from '@/features/custom-tab'

export const Route = createFileRoute('/_authenticated/custom-tab/$pageId')({
  component: CustomTabRoute,
})

function CustomTabRoute() {
  const { pageId } = Route.useParams()
  return <CustomTabPage pageId={pageId} />
}
