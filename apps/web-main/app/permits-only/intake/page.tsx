'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kealee.com'

const PROJECT_TYPES = [
  { value: 'kitchen_remodel', label: 'Kitchen Remodel' },
  { value: 'bathroom_remodel', label: 'Bathroom Remodel' },
  { value: 'addition_expansion', label: 'Home Addition' },
  { value: 'deck_patio', label: 'Deck & Patio' },
  { value: 'exterior_concept', label: 'Exterior Upgrade' },
  { value: 'interior_renovation', label: 'Interior Renovation' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'commercial_office', label: 'Commercial / Office' },
]

const BUDGET_RANGES = [
  { value: '25000', label: 'Under $25K' },
  { value: '50000', label: '$25K – $50K' },
  { value: '100000', label: '$50K – $100K' },
  { value: '250000', label: '$100K – $250K' },
  { value: '500000', label: '$250K – $500K' },
  { value: '1000000', label: '$500K+' },
]

const TIERS = [
  { value: 'basic', label: 'Basic', price: '$99–$299', note: 'Permit checklist + code summary. You submit.' },
  { value: 'professional', label: 'Professional', price: '$349', note: 'We file all permits and coordinate inspections.' },
  { value: 'premium', label: 'Premium', price: '$599', note: 'Expedited + white-glove inspection support.' },
]

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  projectType: string
  address: string
  city: string
  state: string
  zipCode: string
  scope: string
  budgetRange: string
  timeline: string
  hasPlans: 'yes' | 'no'
  tier: string
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{children}</label>
}

function Input({ value, onChange, placeholder, type = 'text', maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
    />
  )
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#9ca3af' }}>
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}% complete</span>
      </div>
      <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${(step / total) * 100}%`, background: '#16a34a', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.08)', padding: 32 }}>
      {children}
    </div>
  )
}

function IntakeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTier = searchParams.get('tier') ?? 'professional'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    projectType: '', address: '', city: '', state: '', zipCode: '',
    scope: '', budgetRange: '100000', timeline: '',
    hasPlans: 'yes', tier: defaultTier,
  })

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const canNext: Record<number, boolean> = {
    1: !!form.firstName && !!form.lastName && !!form.email,
    2: !!form.projectType && !!form.address && !!form.city && !!form.state && !!form.zipCode && !!form.scope,
    3: !!form.tier,
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      // Create project via API
      const projectRes = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `${form.projectType.replace(/_/g, ' ')} – ${form.address}`,
          type: form.projectType,
          address: form.address,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          scope: form.scope,
          budgetRange: form.budgetRange,
          timeline: form.timeline,
          service: 'permits-only',
          tier: form.tier,
        }),
      })

      let projectId: string | null = null
      if (projectRes.ok) {
        const d = await projectRes.json()
        projectId = d.project?.id ?? d.id ?? null
      }

      // Generate permit roadmap via PermitBot
      if (projectId) {
        await fetch(`${API}/api/permits/generate-roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            projectId,
            jurisdiction: `${form.city}, ${form.state}`,
            projectType: form.projectType,
            scope: form.scope,
            budget: parseInt(form.budgetRange),
          }),
        })
      }

      // Redirect to confirmation
      router.push(`/permits-only/confirmation?tier=${form.tier}${projectId ? `&project=${projectId}` : ''}`)
    } catch (e: any) {
      setError('Something went wrong. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const btnStyle = (primary: boolean): React.CSSProperties => ({
    padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
    background: primary ? '#16a34a' : '#f3f4f6',
    color: primary ? '#fff' : '#374151',
  })

  return (
    <main style={{ background: '#f0fdf4', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Permit Services
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#14532d', margin: 0 }}>Permit Application</h1>
        </div>

        <ProgressBar step={step} total={3} />

        {/* ── Step 1: Contact Info ─────────────────────────────────── */}
        {step === 1 && (
          <Card>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: '#111' }}>Your Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={v => set('firstName', v)} placeholder="Jane" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={v => set('lastName', v)} placeholder="Smith" />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={v => set('email', v)} placeholder="jane@example.com" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="(202) 555-0100" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <Label>Do you have existing plans or drawings?</Label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['yes', 'no'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => set('hasPlans', v)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${form.hasPlans === v ? '#16a34a' : '#d1d5db'}`, background: form.hasPlans === v ? '#f0fdf4' : '#fff', fontWeight: 600, fontSize: 14, color: form.hasPlans === v ? '#15803d' : '#374151', cursor: 'pointer' }}
                  >
                    {v === 'yes' ? 'Yes, I have plans' : 'No, not yet'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!canNext[1]} style={btnStyle(true)}>Next →</button>
          </Card>
        )}

        {/* ── Step 2: Project Details ──────────────────────────────── */}
        {step === 2 && (
          <Card>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: '#111' }}>Project Details</h2>
            <div style={{ marginBottom: 16 }}>
              <Label>Project Type</Label>
              <select
                value={form.projectType}
                onChange={e => set('projectType', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, background: '#fff' }}
              >
                <option value="">Select project type…</option>
                {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label>Street Address</Label>
              <Input value={form.address} onChange={v => set('address', v)} placeholder="123 Main St" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><Label>City</Label><Input value={form.city} onChange={v => set('city', v)} placeholder="Washington" /></div>
              <div><Label>State</Label><Input value={form.state} onChange={v => set('state', v)} placeholder="DC" maxLength={2} /></div>
              <div><Label>ZIP</Label><Input value={form.zipCode} onChange={v => set('zipCode', v)} placeholder="20001" maxLength={5} /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Label>Scope of Work</Label>
              <textarea
                value={form.scope}
                onChange={e => set('scope', e.target.value)}
                placeholder="Describe what you're building or renovating…"
                rows={4}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <Label>Budget Range</Label>
                <select
                  value={form.budgetRange}
                  onChange={e => set('budgetRange', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, background: '#fff' }}
                >
                  {BUDGET_RANGES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Desired Start</Label>
                <Input type="date" value={form.timeline} onChange={v => set('timeline', v)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={btnStyle(false)}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!canNext[2]} style={{ ...btnStyle(true), marginLeft: 'auto' }}>Next →</button>
            </div>
          </Card>
        )}

        {/* ── Step 3: Choose Tier ──────────────────────────────────── */}
        {step === 3 && (
          <Card>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>Choose Your Service</h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 24px' }}>
              All tiers include AI-generated permit roadmap with human specialist review.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {TIERS.map(t => (
                <button
                  key={t.value}
                  onClick={() => set('tier', t.value)}
                  style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 12, cursor: 'pointer',
                    border: `2px solid ${form.tier === t.value ? '#16a34a' : '#e5e7eb'}`,
                    background: form.tier === t.value ? '#f0fdf4' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{t.label}</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: '#16a34a' }}>{t.price}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{t.note}</p>
                </button>
              ))}
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(2)} style={btnStyle(false)}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading || !canNext[3]}
                style={{ ...btnStyle(true), marginLeft: 'auto', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Submitting…' : 'Complete Application'}
              </button>
            </div>

            <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16 }}>
              Your AI roadmap will be generated immediately. A specialist reviews before any permit is filed.
            </p>
          </Card>
        )}
      </div>
    </main>
  )
}

export default function PermitOnlyIntakePage() {
  return (
    <Suspense fallback={<main style={{ background: '#f0fdf4', minHeight: '100vh', padding: '48px 24px' }}><div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center', color: '#6b7280' }}>Loading…</div></main>}>
      <IntakeForm />
    </Suspense>
  )
}
