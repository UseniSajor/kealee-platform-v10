import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { COUNTIES } from '@/lib/permit-counties'
import { CountyPermitPageContent } from '@/components/permits/CountyPermitPageContent'

export async function generateStaticParams() {
  return COUNTIES.map((c) => ({ county: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { county: string }
}): Promise<Metadata> {
  const county = COUNTIES.find((c) => c.slug === params.county)
  if (!county) return {}
  return {
    title: `How Long Does It Take to Get a Building Permit in ${county.shortName}? (Real Timelines + How to Get Approved Faster)`,
    description: `Building permit timelines in ${county.shortName}: ${county.simpleTimeline} for simple projects, ${county.additionTimeline} for additions. Kealee gets permits approved in fewer cycles.`,
  }
}

export default function CountyPermitPage({ params }: { params: { county: string } }) {
  const county = COUNTIES.find((c) => c.slug === params.county)
  if (!county) notFound()
  return React.createElement(CountyPermitPageContent, { county: county! })
}
