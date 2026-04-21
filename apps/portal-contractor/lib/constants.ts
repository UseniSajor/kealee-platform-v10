// Shared constants for portal-contractor

export const CSI_DIVISIONS: Record<string, string> = {
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics & Composites',
  '07': 'Thermal & Moisture Protection',
  '08': 'Doors & Windows',
  '09': 'Finishes',
  '22': 'Plumbing',
  '23': 'HVAC',
  '26': 'Electrical',
}

export const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1 },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2 },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3 },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4 },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5 },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6 },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7 },
] as const

export const twinTierLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  L1: { label: 'L1 Light', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  L2: { label: 'L2 Standard', color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  L3: { label: 'L3 Premium', color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)' },
}
