import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Heading } from '@/components/ui/Heading'
import { CheckCircle } from 'lucide-react'

interface Benefit {
  icon:   string
  title:  string
  desc:   string
}

interface RoleBenefitsProps {
  badge?:    string
  headline:  string
  subhead?:  string
  benefits:  Benefit[]
  accent?:   string
}

export function RoleBenefits({ badge, headline, subhead, benefits, accent = '#2ABFBF' }: RoleBenefitsProps) {
  return (
    <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {badge && <Badge variant="teal" className="mb-4">{badge}</Badge>}
          <Heading>{headline}</Heading>
          {subhead && <p className="mt-4 text-lg text-gray-600">{subhead}</p>}
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(b => (
            <div
              key={b.title}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-current hover:shadow-sm"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${accent}12` }}
              >
                {b.icon}
              </div>
              <h3 className="mb-2 font-bold" style={{ color: '#1A2B4A' }}>{b.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
