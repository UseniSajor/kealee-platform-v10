'use client'

import { useState } from 'react'
import { Download, Share2, Link2, CheckCircle2 } from 'lucide-react'

interface Props {
  conceptId: string
}

export function DownloadShare({ conceptId }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: 'My Kealee Concept',
        text: 'Check out my AI-designed home concept from Kealee!',
        url: window.location.href,
      })
    } else {
      handleCopyLink()
    }
  }

  function handleDownloadPDF() {
    window.open(`/api/concepts/${conceptId}/download?format=pdf`, '_blank')
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleDownloadPDF}
        className="flex items-center gap-2 rounded-xl border-2 border-white/30 hover:border-white text-white font-semibold px-5 py-2.5 text-sm transition-all"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </button>

      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 rounded-xl border-2 border-white/30 hover:border-white text-white font-semibold px-5 py-2.5 text-sm transition-all"
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Link Copied!' : 'Copy Link'}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 text-sm transition-all"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    </div>
  )
}
