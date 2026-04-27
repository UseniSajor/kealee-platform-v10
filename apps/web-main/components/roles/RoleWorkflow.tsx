import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

interface Step {
  number?:      number
  title:        string
  desc?:        string
  description?: string  // alias for desc
}

interface RoleWorkflowProps {
  headline:     string
  eyebrow?:     string  // accepted but not rendered (cosmetic alignment)
  steps:        Step[]
  accent?:      string
  accentColor?: string  // alias for accent
}

export function RoleWorkflow({ headline, steps, accent, accentColor }: RoleWorkflowProps) {
  const resolvedAccent = accent ?? accentColor ?? '#2ABFBF'
  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading>{headline}</Heading>
        </div>

        <div className="relative mt-16">
          {/* Connector line — hidden on mobile */}
          <div
            className="absolute left-1/2 top-5 hidden h-0.5 w-full -translate-x-1/2 lg:block"
            style={{ backgroundColor: `${resolvedAccent}25`, maxWidth: 700 + (steps.length - 1) * 100 }}
          />

          <div className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-${Math.min(steps.length, 4)}`}>
            {steps.map((step, i) => (
              <div key={step.number ?? i} className="relative flex flex-col items-center text-center">
                <div
                  className="relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: resolvedAccent }}
                >
                  {step.number ?? i + 1}
                </div>
                <h3 className="mb-2 text-base font-bold" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.desc ?? step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
