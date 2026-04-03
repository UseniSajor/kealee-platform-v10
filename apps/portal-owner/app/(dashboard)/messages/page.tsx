'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, Search, User } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface Conversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  project: string
}

interface Message {
  id: string
  sender: string
  content: string
  time: string
  isMine: boolean
}

const SEED_CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Mike Rodriguez (GC)', lastMessage: 'Framing inspection is scheduled for Thursday', time: '2 hours ago', unread: 2, project: 'Modern Duplex' },
  { id: '2', name: 'Sarah Chen (Architect)', lastMessage: 'Updated plans uploaded to the documents folder', time: '1 day ago', unread: 0, project: 'Kitchen Remodel' },
  { id: '3', name: 'Kealee PM Bot', lastMessage: 'Your draw request #3 has been approved', time: '3 days ago', unread: 0, project: 'Modern Duplex' },
  { id: '4', name: 'Tom Jackson (Inspector)', lastMessage: 'Foundation passed - report attached', time: '1 week ago', unread: 0, project: 'Modern Duplex' },
]

const SEED_MESSAGES: Message[] = [
  { id: '1', sender: 'Mike Rodriguez', content: 'Good morning! Just wanted to let you know the trusses arrived on site today.', time: '10:30 AM', isMine: false },
  { id: '2', sender: 'You', content: 'Great news! Are we still on track for the framing inspection this week?', time: '10:45 AM', isMine: true },
  { id: '3', sender: 'Mike Rodriguez', content: 'Yes, framing inspection is scheduled for Thursday at 9 AM. The inspector from the city will be on site.', time: '11:02 AM', isMine: false },
  { id: '4', sender: 'Mike Rodriguez', content: "I'll send you photos once the last section is complete, should be by tomorrow EOD.", time: '11:03 AM', isMine: false },
  { id: '5', sender: 'You', content: 'Perfect. Can you also provide an updated schedule for MEP rough-in start date?', time: '11:15 AM', isMine: true },
  { id: '6', sender: 'Mike Rodriguez', content: 'Will get that to you by end of day. The plumber is confirmed for April 7th start.', time: '11:20 AM', isMine: false },
]

function formatTime(ts: string) {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diffH = (now.getTime() - d.getTime()) / 3600000
    if (diffH < 1) return 'Just now'
    if (diffH < 24) return `${Math.floor(diffH)} hours ago`
    if (diffH < 48) return '1 day ago'
    return `${Math.floor(diffH / 24)} days ago`
  } catch { return ts }
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS)
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES)
  const [selectedConv, setSelectedConv] = useState('1')
  const [newMessage, setNewMessage] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [sending, setSending] = useState(false)

  const loadConversations = useCallback(async () => {
    if (!API_URL) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kealee_token') : null
      const res = await fetch(`${API_URL}/api/v1/messages/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return
      const data = await res.json() as { conversations?: Array<{ id: string; participantName: string; lastMessage: string; updatedAt: string; unreadCount: number; projectName: string }> }
      if (data.conversations?.length) {
        setConversations(data.conversations.map(c => ({
          id: c.id,
          name: c.participantName,
          lastMessage: c.lastMessage,
          time: formatTime(c.updatedAt),
          unread: c.unreadCount,
          project: c.projectName,
        })))
        setIsLive(true)
      }
    } catch { /* keep seed */ }
  }, [])

  const loadMessages = useCallback(async (convId: string) => {
    if (!API_URL || !isLive) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kealee_token') : null
      const res = await fetch(`${API_URL}/api/v1/messages/conversations/${convId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return
      const data = await res.json() as { messages?: Array<{ id: string; senderName: string; content: string; createdAt: string; isOwn: boolean }> }
      if (data.messages?.length) {
        setMessages(data.messages.map(m => ({
          id: m.id,
          sender: m.senderName,
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          isMine: m.isOwn,
        })))
      }
    } catch { /* keep current */ }
  }, [isLive])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => { if (selectedConv) loadMessages(selectedConv) }, [selectedConv, loadMessages])

  async function handleSend() {
    if (!newMessage.trim()) return
    if (isLive && API_URL) {
      setSending(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('kealee_token') : null
        await fetch(`${API_URL}/api/v1/messages/conversations/${selectedConv}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ content: newMessage }),
        })
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'You',
          content: newMessage,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          isMine: true,
        }])
      } catch { /* show optimistically */ }
      setSending(false)
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        content: newMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isMine: true,
      }])
    }
    setNewMessage('')
  }

  const activeConv = conversations.find(c => c.id === selectedConv)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Messages</h1>
          <p className="mt-1 text-sm text-gray-600">Communicate with your project team</p>
        </div>
        {isLive && (
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Live
          </span>
        )}
      </div>

      <div className="flex h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Conversation list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200">
          <div className="border-b border-gray-200 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search conversations..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto">
            {conversations.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                className={`w-full p-4 text-left transition-colors ${selectedConv === conv.id ? '' : 'hover:bg-gray-50'}`}
                style={selectedConv === conv.id ? { backgroundColor: 'rgba(42,191,191,0.1)' } : undefined}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{conv.name}</p>
                      <p className="text-xs text-gray-500">{conv.project}</p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{conv.lastMessage}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{conv.time}</span>
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: '#E8793A' }}>{conv.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message area */}
        <div className="flex flex-1 flex-col">
          <div className="border-b border-gray-200 px-5 py-3">
            <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{activeConv?.name ?? '—'}</p>
            <p className="text-xs text-gray-500">{activeConv?.project ?? ''}</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  msg.isMine ? 'text-white' : 'bg-gray-100 text-gray-900'
                }`}
                style={msg.isMine ? { backgroundColor: '#1A2B4A' } : undefined}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`mt-1 text-xs ${msg.isMine ? 'opacity-60' : 'text-gray-400'}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': '#2ABFBF' } as React.CSSProperties}
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="rounded-lg p-2.5 text-white hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E8793A' }}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
