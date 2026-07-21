import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PageRenderer } from './PageRenderer'
import { GeneratingState } from './components/GeneratingState'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getPageData(sessionId: string) {
  try {
    const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}/page`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getSessionStatus(sessionId: string) {
  try {
    const res = await fetch(`${API_URL}/funnel/sessions/${sessionId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function YourPlanPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const [pageData, session] = await Promise.all([
    getPageData(sessionId),
    getSessionStatus(sessionId),
  ])

  const isGenerating = session?.status === 'GENERATING'
  const hasPage = !!pageData

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow pt-8 pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          {hasPage ? (
            <PageRenderer pageData={pageData} />
          ) : isGenerating ? (
            <GeneratingState sessionId={sessionId} />
          ) : (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Plan Not Found</h2>
                <p className="text-neutral-500 mb-6">
                  This plan may have expired or hasn&apos;t been generated yet.
                </p>
                <a
                  href="/get-started"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Start Over
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
