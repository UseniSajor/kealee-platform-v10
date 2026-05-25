export type PortalAskKind = 'owner' | 'contractor' | 'developer'

export interface PortalAskConfig {
  context: string
  title: string
  subtitle: string
  accentColor: string
  sendColor: string
  inputPlaceholder: string
  suggestions: string[]
}

export const PORTAL_ASK_CONFIG: Record<PortalAskKind, PortalAskConfig> = {
  owner: {
    context: 'portal-owner',
    title: 'Ask Kea',
    subtitle: 'Concept packages, payments, next steps',
    accentColor: '#2ABFBF',
    sendColor: '#E8724B',
    inputPlaceholder: 'E.g., When is my concept PDF ready, or what is my permit path?',
    suggestions: [
      'What is included in my concept package?',
      'How do I get a cost estimate for my project?',
      'What is my permit path?',
      'What are my next steps after concept?',
    ],
  },
  contractor: {
    context: 'portal-contractor',
    title: 'Ask Kea',
    subtitle: 'Leads, bids, permits, payments',
    accentColor: '#F59E0B',
    sendColor: '#D97706',
    inputPlaceholder: 'E.g., Summarize new leads this week, or which bids need signature…',
    suggestions: [
      'How do I respond to a new lead?',
      'What bids are waiting on the owner?',
      'How do milestone payments work?',
      'What credentials do I need on file?',
    ],
  },
  developer: {
    context: 'portal-developer',
    title: 'Ask Kea',
    subtitle: 'Pipeline, feasibility, capital stack',
    accentColor: '#818CF8',
    sendColor: '#6366F1',
    inputPlaceholder: 'E.g., What feasibility items are open on this parcel?',
    suggestions: [
      'How does land pipeline scoring work?',
      'What goes in a feasibility brief?',
      'How is capital stack modeled?',
      'What reports can I export?',
    ],
  },
}
