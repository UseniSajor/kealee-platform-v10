/**
 * emit-event.ts — Fire-and-forget event emission helper
 * Wraps StreamPublisher with lazy connect and error swallowing.
 * Safe to call from any service; never throws.
 */
import { StreamPublisher, createEvent } from '@kealee/core-events'

let _publisher: StreamPublisher | null = null

function getPublisher(): StreamPublisher {
  if (!_publisher) {
    _publisher = new StreamPublisher(process.env.REDIS_URL)
  }
  return _publisher
}

export interface EmitOpts {
  type: string
  projectId?: string
  orgId?: string
  entity?: { type: string; id: string }
  initiatorId: string
  initiatorType?: 'USER' | 'SYSTEM' | 'AI' | 'BOT'
  payload: Record<string, unknown>
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

/**
 * Emit a platform event asynchronously. Never throws — errors are logged only.
 */
export function emitEvent(opts: EmitOpts): void {
  const publisher = getPublisher()
  const event = createEvent({
    type: opts.type,
    source: 'api',
    projectId: opts.projectId,
    orgId: opts.orgId,
    entity: opts.entity,
    payload: opts.payload,
    severity: opts.severity ?? 'INFO',
    initiatorType: opts.initiatorType ?? 'USER',
    initiatorId: opts.initiatorId,
  })

  publisher
    .connect()
    .then(() => publisher.publish(event))
    .catch((err: Error) =>
      console.error('[events] emit failed', { type: opts.type, err: err.message }),
    )
}
