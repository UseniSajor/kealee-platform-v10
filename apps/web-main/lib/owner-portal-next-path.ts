/**
 * Map web-main paths (legacy /concept/:id) to owner portal deliverable routes.
 */

export function mapNextPathToOwnerPortal(next: string): string {
  const trimmed = next.trim()
  if (!trimmed || trimmed === '/') return '/deliverables'

  const conceptMatch = trimmed.match(/^\/concept\/([^/?#]+)/)
  if (conceptMatch) {
    const id = conceptMatch[1]
    const qs = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?')) : ''
    return `/deliverables/${encodeURIComponent(id)}${qs}`
  }

  if (trimmed.startsWith('/deliverables')) return trimmed

  return trimmed.startsWith('/') ? trimmed : `/deliverables`
}
