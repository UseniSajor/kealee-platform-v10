"use client"

import * as React from "react"
import { CalendarClock, Mail, Phone, Plus, Send, Settings, User } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

type Channel = "messages" | "sms" | "email" | "calls" | "meetings"

type Conversation = { id: string; name: string; last: string; unread: number }
type ChatMessage = { id: string; at: string; from: "me" | "them"; text: string }
type CallLog = { id: string; at: string; contact: string; direction: "inbound" | "outbound"; durationMin: number; note?: string }
type Meeting = { id: string; when: string; title: string; attendees: string; location: string; status: "scheduled" | "completed" | "cancelled" }

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`
}

export default function CommunicationPage() {
  const [tab, setTab] = React.useState<Channel>("messages")

  const [conversations] = React.useState<Conversation[]>([
    { id: "c1", name: "Client - Avery Johnson", last: "Can we confirm inspection date?", unread: 2 },
    { id: "c2", name: "GC - Morgan Lee", last: "Invoice uploaded for review.", unread: 0 },
    { id: "c3", name: "Permit office", last: "Submission received.", unread: 0 },
  ])
  const [activeConvId, setActiveConvId] = React.useState<string>("c1")
  const [messages, setMessages] = React.useState<Record<string, ChatMessage[]>>({
    c1: [
      { id: "m1", at: "2026-01-13 10:12", from: "them", text: "Can we confirm inspection date?" },
      { id: "m2", at: "2026-01-13 10:16", from: "me", text: "Tentatively 2/3 at 10:00 — I’ll confirm today." },
    ],
    c2: [{ id: "m1", at: "2026-01-12 14:44", from: "them", text: "Invoice uploaded for review." }],
    c3: [{ id: "m1", at: "2026-01-10 09:05", from: "them", text: "Submission received. Review ETA 5-7 business days." }],
  })
  const [draft, setDraft] = React.useState("")

  const [emailConnected, setEmailConnected] = React.useState(false)
  const [emailInbox] = React.useState([
    { id: "e1", from: "client@company.com", subject: "Change order approval", at: "2026-01-13 08:22" },
    { id: "e2", from: "inspections@city.gov", subject: "Inspection scheduled confirmation", at: "2026-01-12 16:01" },
  ])

  const [calls, setCalls] = React.useState<CallLog[]>([
    { id: "cl1", at: "2026-01-13 11:05", contact: "Client - Avery", direction: "outbound", durationMin: 7, note: "Status update" },
    { id: "cl2", at: "2026-01-12 15:32", contact: "Permit office", direction: "inbound", durationMin: 4, note: "Clarified plan set requirements" },
  ])

  const [meetings, setMeetings] = React.useState<Meeting[]>([
    { id: "mt1", when: "2026-01-15 09:00", title: "Weekly client check-in", attendees: "client@company.com, pm@company.com", location: "Zoom", status: "scheduled" },
  ])
  const [meetingForm, setMeetingForm] = React.useState({ when: "2026-01-16 10:00", title: "Site coordination", attendees: "gc@company.com", location: "On-site" })

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? conversations[0]!
  const thread = messages[activeConvId] ?? []

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    const msg: ChatMessage = { id: uid("msg"), at: new Date().toLocaleString(), from: "me", text }
    setMessages((prev) => ({ ...prev, [activeConvId]: [...(prev[activeConvId] ?? []), msg] }))
    setDraft("")
  }

  function scheduleMeeting() {
    const m: Meeting = {
      id: uid("mt"),
      when: meetingForm.when,
      title: meetingForm.title,
      attendees: meetingForm.attendees,
      location: meetingForm.location,
      status: "scheduled",
    }
    setMeetings((prev) => [m, ...prev])
  }

  function addCallLog() {
    const c: CallLog = {
      id: uid("cl"),
      at: new Date().toLocaleString(),
      contact: "New contact (placeholder)",
      direction: "outbound",
      durationMin: 3,
      note: "Logged call (placeholder)",
    }
    setCalls((prev) => [c, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="text-neutral-600 mt-1">Messaging, SMS/WhatsApp (via Twilio), email, call logs, and meeting scheduler.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "messages", label: "Messages" },
            { id: "sms", label: "SMS / WhatsApp" },
            { id: "email", label: "Email" },
            { id: "calls", label: "Calls" },
            { id: "meetings", label: "Meetings" },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "messages" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveConvId(c.id)}
                  className={cn(
                    "w-full rounded-xl border bg-white p-3 text-left hover:bg-neutral-50 transition-colors",
                    c.id === activeConvId ? "ring-2 ring-neutral-900/20" : ""
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 truncate">{c.name}</div>
                      <div className="text-sm text-neutral-600 truncate mt-0.5">{c.last}</div>
                    </div>
                    {c.unread ? (
                      <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                        {c.unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="py-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{activeConv.name}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4 max-h-[420px] overflow-y-auto">
                <div className="space-y-3">
                  {thread.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                          m.from === "me" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
                        )}
                      >
                        <div className="text-[10px] opacity-70 mb-1">{m.at}</div>
                        <div>{m.text}</div>
                      </div>
                    </div>
                  ))}
                  {!thread.length ? <div className="text-sm text-neutral-600">No messages.</div> : null}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button onClick={sendMessage} disabled={!draft.trim()}>
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
              <div className="text-xs text-neutral-600">
                Placeholder: wire to realtime messaging + notifications (email/SMS optional).
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "sms" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="py-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Send SMS / WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="rounded-xl border bg-white p-4 space-y-4">
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Recipient Phone (E.164 format)</div>
                  <Input placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Channel</div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm">SMS</Button>
                    <Button variant="outline" size="sm">WhatsApp</Button>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Message</div>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    placeholder="Type your message..."
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-700 mb-1">Or use a template</div>
                  <select className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <option value="">Select template...</option>
                    <option value="NEW_LEAD">New Lead Notification</option>
                    <option value="BID_SUBMITTED">Bid Submitted</option>
                    <option value="INSPECTION_REMINDER">Inspection Reminder</option>
                    <option value="MILESTONE_COMPLETE">Milestone Complete</option>
                    <option value="PAYMENT_RELEASED">Payment Released</option>
                    <option value="SCHEDULE_DISRUPTION">Schedule Disruption</option>
                    <option value="CHANGE_ORDER">Change Order</option>
                    <option value="DOCUMENT_READY">Document Ready</option>
                    <option value="DECISION_NEEDED">Decision Needed</option>
                    <option value="BUDGET_ALERT">Budget Alert</option>
                    <option value="WEEKLY_REPORT">Weekly Report</option>
                  </select>
                </div>
                <Button>
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="py-0">
              <CardHeader>
                <CardTitle className="text-base">Twilio Configuration</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Status</span>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        Needs Configuration
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600">
                      Set the following environment variables on your deployment:
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-3 font-mono text-xs space-y-1">
                      <div>TWILIO_ACCOUNT_SID=AC...</div>
                      <div>TWILIO_AUTH_TOKEN=...</div>
                      <div>TWILIO_PHONE_NUMBER=+1...</div>
                    </div>
                    <div className="text-xs text-neutral-600 mt-2">
                      Get credentials from <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.twilio.com</a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="py-0">
              <CardHeader>
                <CardTitle className="text-base">SMS Templates</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className="text-xs text-neutral-600 mb-2">
                  Pre-built templates from <code className="bg-neutral-100 px-1 rounded">@kealee/communications</code>
                </div>
                {[
                  { name: "Welcome", desc: "Onboarding message for new clients" },
                  { name: "Inspection Reminder", desc: "Upcoming inspection alert" },
                  { name: "Payment Released", desc: "Escrow payment notification" },
                  { name: "Schedule Disruption", desc: "Delay or change notification" },
                  { name: "Decision Needed", desc: "Request for client approval" },
                  { name: "Budget Alert", desc: "Budget threshold warning" },
                ].map((t) => (
                  <div key={t.name} className="rounded-lg border bg-white p-3">
                    <div className="font-medium text-neutral-900 text-sm">{t.name}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">{t.desc}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "email" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="py-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Email inbox</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {!emailConnected ? (
                <div className="rounded-xl border bg-white p-6">
                  <div className="font-medium text-neutral-900">Connect email</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    Placeholder for Gmail/Outlook integration (OAuth + syncing threads).
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => setEmailConnected(true)}>
                      <Mail className="h-4 w-4" />
                      Connect mailbox
                    </Button>
                    <Button variant="outline" onClick={() => alert("Configure providers (placeholder)")}>
                      Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border bg-white">
                  <ul className="divide-y">
                    {emailInbox.map((e) => (
                      <li key={e.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">{e.subject}</div>
                            <div className="text-xs text-neutral-600 mt-0.5">
                              from: {e.from} • {e.at}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => alert("Open email thread (placeholder)")}>
                            Open
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Compose</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <Input placeholder="To" disabled={!emailConnected} />
              <Input placeholder="Subject" disabled={!emailConnected} />
              <textarea
                className="min-h-[140px] w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                placeholder="Message…"
                disabled={!emailConnected}
              />
              <Button disabled={!emailConnected} onClick={() => alert("Send email (placeholder)")}>
                <Send className="h-4 w-4" />
                Send
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "calls" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="py-0 xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Call logs</CardTitle>
                <Button size="sm" onClick={addCallLog}>
                  <Plus className="h-4 w-4" />
                  Log call
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-[820px] w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">When</th>
                      <th className="text-left font-medium px-4 py-3">Contact</th>
                      <th className="text-left font-medium px-4 py-3">Direction</th>
                      <th className="text-right font-medium px-4 py-3">Duration</th>
                      <th className="text-left font-medium px-4 py-3">Note</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-4 py-3 text-neutral-700">{c.at}</td>
                        <td className="px-4 py-3 text-neutral-900 font-medium">{c.contact}</td>
                        <td className="px-4 py-3 text-neutral-700">{c.direction}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{c.durationMin}m</td>
                        <td className="px-4 py-3 text-neutral-700">{c.note ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => setCalls((p) => p.filter((x) => x.id !== c.id))}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!calls.length ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">
                          No calls logged.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-neutral-600 mt-2">
                Placeholder: integrate VoIP provider for automatic call logging + recordings.
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Quick dial</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700">
                <div className="font-medium text-neutral-900">Phone integration placeholder</div>
                <div className="text-sm text-neutral-600 mt-1">Click-to-call and call recordings require a telephony provider.</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => alert("Dial (placeholder)")}>
                <Phone className="h-4 w-4" />
                Dial
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "meetings" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="py-0 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Meeting scheduler</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">When</div>
                    <Input value={meetingForm.when} onChange={(e) => setMeetingForm((p) => ({ ...p, when: e.target.value }))} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-neutral-700 mb-1">Title</div>
                    <Input value={meetingForm.title} onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-medium text-neutral-700 mb-1">Attendees</div>
                    <Input value={meetingForm.attendees} onChange={(e) => setMeetingForm((p) => ({ ...p, attendees: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-medium text-neutral-700 mb-1">Location</div>
                    <Input value={meetingForm.location} onChange={(e) => setMeetingForm((p) => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={scheduleMeeting}>
                  <CalendarClock className="h-4 w-4" />
                  Schedule
                </Button>
              </div>

              <div className="rounded-xl border bg-white">
                <div className="px-4 py-3 border-b text-sm font-medium text-neutral-900">Upcoming</div>
                <ul className="divide-y">
                  {meetings.map((m) => (
                    <li key={m.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate">{m.title}</div>
                          <div className="text-xs text-neutral-600 mt-0.5">
                            {m.when} • {m.location}
                          </div>
                          <div className="text-xs text-neutral-600 mt-0.5 truncate">attendees: {m.attendees}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => alert("Send invite (placeholder)")}>
                            <User className="h-4 w-4" />
                            Invite
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setMeetings((p) => p.filter((x) => x.id !== m.id))}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                  {!meetings.length ? (
                    <li className="px-4 py-8 text-center text-sm text-neutral-600">No meetings.</li>
                  ) : null}
                </ul>
              </div>

              <div className="text-xs text-neutral-600">
                Placeholder: integrate Google Calendar / Microsoft Graph for real scheduling + availability.
              </div>
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="rounded-xl border bg-white p-4 text-sm text-neutral-700">
                <div className="font-medium text-neutral-900">Calendar providers</div>
                <div className="text-sm text-neutral-600 mt-1">Connect a calendar to create events and send invites.</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => alert("Connect calendar (placeholder)")}>
                <CalendarClock className="h-4 w-4" />
                Connect calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

