'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { PortalAskConfig } from './portal-ask-config'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  config: PortalAskConfig
  /** API route on this portal app, default /api/ask */
  askEndpoint?: string
  /** Appended to context for page-aware answers */
  pagePath?: string
  className?: string
}

export function PortalAskChatBar({
  config,
  askEndpoint = '/api/ask',
  pagePath,
  className = '',
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const threadRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const hasMessages = messages.length > 0
  const askContext = pagePath ? `${config.context}:${pagePath}` : config.context

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed }
      const assistantId = crypto.randomUUID()
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }
      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInput('')
      setIsLoading(true)
      setStreamingId(assistantId)
      setIsFocused(false)

      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const res = await fetch(askEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            context: askContext,
            messages: history,
            stream: true,
          }),
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
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m)),
          )
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
                : m,
            ),
          )
        }
      } finally {
        setIsLoading(false)
        setStreamingId(null)
      }
    },
    [messages, askContext, askEndpoint, isLoading],
  )

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {hasMessages && (
        <div
          ref={threadRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3 mb-2 scroll-smooth"
        >
          {messages.map((msg) => {
            const isStreaming = msg.id === streamingId
            return (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    K
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm',
                  )}
                  style={msg.role === 'user' ? { backgroundColor: config.sendColor } : undefined}
                >
                  {msg.content ? (
                    msg.content
                  ) : (
                    <span className="flex gap-1 items-center h-5">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div
        className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-white shrink-0 transition-all"
        style={{ borderColor: isFocused ? config.accentColor : undefined }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
          placeholder={hasMessages ? 'Ask a follow-up…' : config.inputPlaceholder}
          className="flex-1 bg-transparent px-4 py-3 text-sm outline-none text-slate-900 placeholder:text-slate-400"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-40"
          style={{ backgroundColor: config.sendColor }}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <ArrowUp className="h-4 w-4 text-white" />
          )}
        </button>
      </div>

      {isFocused && !hasMessages && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shrink-0 max-h-36 overflow-y-auto">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Try asking
          </p>
          <ul className="space-y-0.5">
            {config.suggestions.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  onMouseDown={() => sendMessage(prompt)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
