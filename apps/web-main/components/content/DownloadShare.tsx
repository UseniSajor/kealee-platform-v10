'use client'

import { useState } from 'react'
import { Share2, Link2, CheckCircle2, Download, Loader2 } from 'lucide-react'

interface Props {
  conceptId: string
  pdfUrl?: string
}

export function DownloadShare({ conceptId, pdfUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

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
        text: 'Check out my designed using AI tools home concept from Kealee!',
        url: window.location.href,
      })
    } else {
      handleCopyLink()
    }
  }

  async function handleDownloadPDF() {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setPdfLoading(true)
    try {
      const res = await fetch(`/api/portal/concept/${conceptId}/pdf`)
      if (!res.ok) throw new Error('PDF unavailable')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kealee-concept-${conceptId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.print()
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleDownloadPDF}
        disabled={pdfLoading}
        className="flex items-center gap-2 rounded-xl border-2 border-white/30 hover:border-white text-white font-semibold px-5 py-2.5 text-sm transition-all disabled:opacity-60"
      >
        {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
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
