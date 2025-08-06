import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bank/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/bank/"!</div>
}
