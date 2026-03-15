'use client'

import { Modal } from '@/components/ui/Modal'
import { RoleOption } from './RoleOption'
import type { RoleSelectorContext } from '@/hooks/useRoleSelector'

interface Props {
  isOpen:  boolean
  onClose: () => void
  context: RoleSelectorContext
}

const ROLES = [
  {
    icon:        '🏠',
    label:       'Homeowner',
    description: 'Renovations, additions, new construction, or property investment',
    href:        '/homeowners',
    accent:      '#2ABFBF',
  },
  {
    icon:        '🏢',
    label:       'Developer',
    description: 'Multifamily, commercial, mixed-use, or land development projects',
    href:        '/developers',
    accent:      '#1A2B4A',
  },
  {
    icon:        '🔨',
    label:       'Contractor',
    description: 'General contractors, specialty trades, and construction professionals',
    href:        '/contractors',
    accent:      '#E8793A',
  },
  {
    icon:        '📐',
    label:       'Architect / Engineer',
    description: 'Design professionals working on construction projects',
    href:        '/design-professionals',
    accent:      '#805AD5',
  },
  {
    icon:        '🏛️',
    label:       'Government / Municipal',
    description: 'Permit authorities, housing agencies, and municipal planners',
    href:        '/government',
    accent:      '#38A169',
  },
]

const TITLES: Record<RoleSelectorContext, { title: string; description: string }> = {
  'start-project':    { title: 'How will you use Kealee?',       description: 'Tell us your role to get the right experience.' },
  'join-marketplace': { title: 'Join as which role?',             description: 'We\'ll show you the right onboarding path.' },
  'general':          { title: 'How will you use Kealee?',        description: 'Select your role to see what Kealee can do for you.' },
}

export function RoleSelectorModal({ isOpen, onClose, context }: Props) {
  const { title, description } = TITLES[context]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="lg">
      <div className="space-y-2.5">
        {ROLES.map(role => (
          <RoleOption key={role.label} {...role} onClick={onClose} />
        ))}
      </div>
    </Modal>
  )
}
