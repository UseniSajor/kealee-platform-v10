'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  homepage: [
    'How much does a kitchen remodel cost?',
    'Do I need a permit for my addition?',
    'What is an AI concept package?',
    'How do I find a contractor?',
  ],
  permit: [
    'Do I need plans before submitting a permit?',
    'How long does permit review take?',
    'What is included in the permit package?',
    'Can I expedite my permit application?',
  ],
  default: [
    'What services does Kealee offer?',
    'How does the AI concept work?',
    'How are contractors vetted?',
    'Where do I start my project?',
  ],
}

// Infer a CTA link from assistant response text
function detectCTA(content: string): { label: string; href: string } | null {
  const c = content.toLowerCase()
  if (/permit/i.test(c) && /have.*plan|existing plan/i.test(c)) return { label: 'Get Permit Services', href: '/permits' }
  if (/permit/i.test(c) && /need.*plan|design service/i.test(c)) return { label: 'See Design Services', href: '/design-services' }
  if (/permit/i.test(c)) return { label: 'Get Permit Services', href: '/permits' }
  if (/concept|visualization|floor plan/i.test(c)) return { label: 'Start AI Concept', href: '/concept-engine' }
  if (/estimate|cost|budget|how much/i.test(c)) return { label: 'Get an Estimate', href: '/estimate' }
  if (/contractor|builder|hire/i.test(c)) return { label: 'Find a Contractor', href: '/marketplace' }
  if (/design service|architect|stamped|permit.ready|drawings?/i.test(c)) return { label: 'See Design Services', href: '/design-services' }
  if (/escrow|milestone|pay/i.test(c)) return { label: 'Learn About Milestone Pay', href: '/milestone-pay' }
  return null
}

interface Props {
  context?: string
  className?: string
  /** 'dark' for hero sections (white text, translucent bg) | 'light' for light-bg pages */
  variant?: 'dark' | 'light'
}

export function AskChatBar({ context = 'default', className = '', variant = 'dark' }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const isDark = variant === 'dark'
  const suggestions = SUGGESTED_PROMPTS[context] ?? SUGGESTED_PROMPTS['default']
  const hasMessages = messages.length > 0

  // Auto-scroll thread to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }

    // Snapshot history before adding the new messages
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsLoading(true)
    setStreamingId(assistantId)
    setIsFocused(false)

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, context, messages: history, stream: true }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        const snapshot = fullText
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: snapshot } : m))
        )
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      setStreamingId(null)
    }
  }, [messages, context, isLoading])

  // --- Styles depending on variant ---
  const threadBg = isDark
    ? 'rgba(10,20,40,0.85)'
    : 'rgba(248,250,252,1)'
  const threadBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(226,232,240,1)'

  const inputBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,1)'
  const inputBorderDefault = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(203,213,225,1)'
  const inputBorderFocused = '#2ABFBF'
  const inputTextColor = isDark ? 'text-white' : 'text-slate-900'
  const inputPlaceholderColor = isDark ? 'placeholder-white/50' : 'placeholder-slate-400'

  const suggestionBg = isDark ? 'rgba(26,43,74,0.95)' : 'rgba(255,255,255,1)'
  const suggestionBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(226,232,240,1)'
  const suggestionLabelColor = isDark ? 'text-white/40' : 'text-slate-400'
  const suggestionTextColor = isDark ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'

  const userBubbleBg = '#E8724B'
  const assistantBubbleBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(241,245,249,1)'
  const assistantTextColor = isDark ? 'text-white/90' : 'text-slate-800'

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Conversation thread */}
      {hasMessages && (
        <div
          ref={threadRef}
          className="mb-3 max-h-[400px] overflow-y-auto rounded-2xl border p-4 space-y-4 scroll-smooth"
          style={{ backgroundColor: threadBg, borderColor: threadBorder, backdropFilter: 'blur(12px)' }}
        >
          {messages.map(msg => {
            const isStreaming = msg.id === streamingId
            const cta =
              msg.role === 'assistant' && msg.content && !isStreaming
                ? detectCTA(msg.content)
                : null

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Kea avatar (assistant only) */}
                {msg.role === 'assistant' && (
                  <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: '#2ABFBF' }}
                  >
                    K
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-br-sm'
                        : `${assistantTextColor} rounded-bl-sm`
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === 'user' ? userBubbleBg : assistantBubbleBg,
                    }}
                  >
                    {msg.content ? (
                      msg.content
                    ) : (
                      /* Typing dots while streaming */
                      <span className="flex gap-1 items-center h-5">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </span>
                    )}
                  </div>

                  {/* CTA chip after assistant response */}
                  {cta && (
                    <Link
                      href={cta.href}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#E8724B' }}
                    >
                      {cta.label} →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input row */}
      <div
        className="relative flex items-center rounded-2xl border-2 transition-all"
        style={{
          backgroundColor: inputBg,
          borderColor: isFocused ? inputBorderFocused : inputBorderDefault,
          backdropFilter: 'blur(8px)',
          boxShadow: isDark ? undefined : '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage(input)}
          placeholder={
            hasMessages
              ? 'Ask a follow-up…'
              : 'Ask anything — permits, costs, design, contractors…'
          }
          className={`flex-1 bg-transparent px-5 py-3.5 text-sm outline-none ${inputTextColor} ${inputPlaceholderColor}`}
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-40"
          style={{ backgroundColor: '#E8724B' }}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <ArrowUp className="h-4 w-4 text-white" />
          )}
        </button>
      </div>

      {/* Suggested prompts — only when input focused and no messages yet */}
      {isFocused && !hasMessages && (
        <div
          className="mt-2 rounded-xl border p-3"
          style={{
            backgroundColor: suggestionBg,
            borderColor: suggestionBorder,
            backdropFilter: 'blur(12px)',
          }}
        >
          <p className={`mb-2 px-1 text-xs font-semibold uppercase tracking-widest ${suggestionLabelColor}`}>
            Try asking
          </p>
          <ul className="space-y-0.5">
            {suggestions.map(prompt => (
              <li key={prompt}>
                <button
                  onMouseDown={() => sendMessage(prompt)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${suggestionTextColor}`}
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
