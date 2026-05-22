'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { isV30EnabledClient } from '@/lib/v30'

export function V30HeroCta() {
  const v30 = isV30EnabledClient()
  const href = v30 ? '/get-concept' : '/concept'
  const label = v30 ? 'Get your custom quote' : 'Build Your Project'

  return (
    <Link href={href}>
      <button className="group flex items-center gap-3 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#B84A28] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 hover:-translate-y-0.5">
        {label}
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </Link>
  )
}
