"use client"

import * as React from "react"
import {
  Archive,
  Bell,
  BellOff,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Flag,
  Forward,
  Inbox,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Mic,
  Moon,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Printer,
  Reply,
  Search,
  Send,
  Settings,
  Smartphone,
  Star,
  Type,
  User,
  Users,
  Video,
  X,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId =
  | "inbox"
  | "messages"
  | "email"
  | "calls"
  | "meetings"
  | "announcements"
  | "templates"

type CommType = "EMAIL" | "MESSAGE" | "CALL" | "MEETING" | "ANNOUNCEMENT" | "SMS"
type Priority = "High" | "Medium" | "Normal" | "Low"

interface InboxItem {
  id: string
  type: CommType
  sender: string
  subject: string
  project: string
  time: string
  priority: Priority
  read: boolean
}

interface CallLogEntry {
  id: string
  contact: string
  direction: "Inbound" | "Outbound"
  duration: string
  project: string
  date: string
  notes: string
  followUp: string
}

interface MeetingEntry {
  id: string
  day: string
  title: string
  time: string
  attendees: string
  location: string
}

interface ThreadMessage {
  id: string
  from: string
  timestamp: string
  content: string
  isMe: boolean
}

interface AnnouncementEntry {
  id: string
  title: string
  content: string
  author: string
  date: string
  audience: string
  priority: Priority
}

interface TemplateEntry {
  id: string
  name: string
  type: CommType
  subject: string
  lastUsed: string
  usageCount: number
}

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const STATS = [
  { label: "Unread Messages", value: "12", delta: "+3 since yesterday", icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
  { label: "Emails Sent Today", value: "8", delta: "2 drafts pending", icon: Mail, color: "text-indigo-600 bg-indigo-50" },
  { label: "Calls Logged", value: "5", delta: "3 inbound, 2 outbound", icon: Phone, color: "text-amber-600 bg-amber-50" },
  { label: "Meetings Scheduled", value: "3", delta: "this week", icon: CalendarClock, color: "text-purple-600 bg-purple-50" },
  { label: "Client Responses Pending", value: "4", delta: "oldest: 3 days", icon: Clock, color: "text-red-600 bg-red-50" },
]

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "inbox", label: "Inbox", badge: "12" },
  { id: "messages", label: "Messages" },
  { id: "email", label: "Email" },
  { id: "calls", label: "Calls" },
  { id: "meetings", label: "Meetings" },
  { id: "announcements", label: "Announcements" },
  { id: "templates", label: "Templates" },
]

const INBOX_ITEMS: InboxItem[] = [
  { id: "in-1", type: "EMAIL", sender: "Sarah Johnson", subject: "RE: Kitchen tile selection approval needed", project: "Johnson Kitchen", time: "10 min ago", priority: "High", read: false },
  { id: "in-2", type: "MESSAGE", sender: "Rodriguez Electric", subject: "Electrical panel upgrade question for RFI-024", project: "Chen Bath", time: "25 min ago", priority: "Medium", read: false },
  { id: "in-3", type: "CALL", sender: "Mary Williams", subject: "Missed call - callback requested re: roof completion", project: "Williams Roof", time: "1 hr ago", priority: "High", read: false },
  { id: "in-4", type: "EMAIL", sender: "Solid Ground Concrete", subject: "Invoice #2847 for foundation work", project: "Garcia Pool", time: "2 hrs ago", priority: "Normal", read: false },
  { id: "in-5", type: "MESSAGE", sender: "Mike Rodriguez (PM)", subject: "Davis ADU schedule update - need to discuss", project: "Davis ADU", time: "2 hrs ago", priority: "High", read: false },
  { id: "in-6", type: "MEETING", sender: "Sub coordination meeting", subject: "Thompson Build - 3 PM Today", project: "Thompson Build", time: "3 PM Today", priority: "Normal", read: true },
  { id: "in-7", type: "EMAIL", sender: "City Inspector Office", subject: "Inspection scheduled Feb 6 - HVAC rough", project: "Martinez HVAC", time: "3 hrs ago", priority: "Normal", read: true },
  { id: "in-8", type: "MESSAGE", sender: "Premier Plumbing", subject: "Material delivery delayed 2 days", project: "Chen Bath", time: "4 hrs ago", priority: "High", read: true },
  { id: "in-9", type: "CALL", sender: "Tom Anderson (Prospect)", subject: "Inquiry about home renovation services", project: "New Lead", time: "5 hrs ago", priority: "Normal", read: true },
  { id: "in-10", type: "EMAIL", sender: "Summit HVAC", subject: "Submittal: Carrier 24ACC636A003 spec sheet", project: "Martinez HVAC", time: "6 hrs ago", priority: "Normal", read: true },
  { id: "in-11", type: "ANNOUNCEMENT", sender: "System", subject: "Weekly progress reports generated successfully", project: "All Projects", time: "8 hrs ago", priority: "Low", read: true },
  { id: "in-12", type: "MESSAGE", sender: "James Park", subject: "Requesting meeting to review demolition scope", project: "Park Reno", time: "Yesterday", priority: "Medium", read: false },
  { id: "in-13", type: "EMAIL", sender: "Floor Pros Inc", subject: "Flooring material samples ready for pickup", project: "Johnson Kitchen", time: "Yesterday", priority: "Normal", read: true },
  { id: "in-14", type: "CALL", sender: "Jennifer Lee", subject: "Discussed Q2 expansion project timeline", project: "Lee Developments", time: "Yesterday", priority: "Normal", read: true },
  { id: "in-15", type: "MESSAGE", sender: "Lisa Chen (Coordinator)", subject: "All daily logs submitted for this week", project: "All Projects", time: "Yesterday", priority: "Low", read: true },
]

const CALL_LOG: CallLogEntry[] = [
  { id: "cl-1", contact: "Mary Williams", direction: "Inbound", duration: "8:23", project: "Williams Roof", date: "Today 10:15 AM", notes: "Discussed punch list items, client happy with progress", followUp: "None needed" },
  { id: "cl-2", contact: "Rodriguez Electric", direction: "Outbound", duration: "12:45", project: "Chen Bath", date: "Today 9:00 AM", notes: "Clarified RFI-024 electrical routing", followUp: "Send updated plan by Friday" },
  { id: "cl-3", contact: "Tom Anderson", direction: "Inbound", duration: "3:15", project: "New Lead", date: "Today 8:30 AM", notes: "Kitchen reno inquiry, $45K budget", followUp: "Schedule site visit" },
  { id: "cl-4", contact: "Building Inspector", direction: "Outbound", duration: "2:10", project: "Martinez HVAC", date: "Yesterday 4:30 PM", notes: "Confirmed HVAC inspection for Feb 6", followUp: "None needed" },
  { id: "cl-5", contact: "Sarah Johnson", direction: "Outbound", duration: "15:22", project: "Johnson Kitchen", date: "Yesterday 2:00 PM", notes: "Tile selection walkthrough, client approved marble", followUp: "Send updated budget" },
  { id: "cl-6", contact: "Mike Rodriguez (PM)", direction: "Outbound", duration: "6:48", project: "Davis ADU", date: "Yesterday 11:30 AM", notes: "Discussed framing delay and adjusted timeline", followUp: "Update Gantt chart" },
  { id: "cl-7", contact: "James Park", direction: "Inbound", duration: "4:33", project: "Park Reno", date: "Feb 4 3:15 PM", notes: "Client wants to add bathroom to demolition scope", followUp: "Prepare change order" },
  { id: "cl-8", contact: "Premier Plumbing", direction: "Inbound", duration: "2:55", project: "Chen Bath", date: "Feb 4 1:00 PM", notes: "Material supply delay, shipment arriving Thursday", followUp: "Notify client of delay" },
  { id: "cl-9", contact: "Robert Hayes", direction: "Outbound", duration: "22:10", project: "Hayes Custom Home", date: "Feb 3 4:00 PM", notes: "Pre-proposal discussion, client wants modern farmhouse", followUp: "Send proposal draft" },
  { id: "cl-10", contact: "City Permit Office", direction: "Outbound", duration: "5:17", project: "Davis ADU", date: "Feb 3 10:00 AM", notes: "Permit status check - approved pending final review", followUp: "Pick up permit Wednesday" },
]

const MEETINGS: MeetingEntry[] = [
  { id: "mt-1", day: "Mon Feb 3", title: "Weekly PM standup", time: "9:00 AM - 9:30 AM", attendees: "All PMs (5)", location: "Zoom" },
  { id: "mt-2", day: "Tue Feb 4", title: "Thompson Build progress review", time: "10:00 AM - 11:00 AM", attendees: "Client + PM", location: "On-site" },
  { id: "mt-3", day: "Tue Feb 4", title: "Sub coordination - Davis ADU", time: "2:00 PM - 3:00 PM", attendees: "4 subs", location: "Office" },
  { id: "mt-4", day: "Wed Feb 5", title: "Client proposal presentation - Hayes Custom Home", time: "1:00 PM - 2:00 PM", attendees: "Robert Hayes", location: "Zoom" },
  { id: "mt-5", day: "Thu Feb 6", title: "Safety committee meeting", time: "8:00 AM - 8:30 AM", attendees: "Safety team (3)", location: "Office" },
  { id: "mt-6", day: "Fri Feb 7", title: "Week-end wrap-up", time: "4:00 PM - 4:30 PM", attendees: "All PMs", location: "Zoom" },
]

const THREAD_MESSAGES: ThreadMessage[] = [
  { id: "th-1", from: "Sarah Johnson", timestamp: "Feb 5, 2026 2:14 PM", content: "Hi Mike, we need to finalize the kitchen tile selection. I've narrowed it down to the Calacatta Gold marble or the Carrara herringbone. Can you check with the tile installer on lead times for both options? The client presentation is next Tuesday.", isMe: false },
  { id: "th-2", from: "Me", timestamp: "Feb 5, 2026 3:02 PM", content: "Hi Sarah, I checked with Floor Pros Inc - they have Calacatta Gold in stock (2-day lead) but Carrara herringbone needs to be ordered (10-14 days). Given the timeline, I'd recommend the Calacatta Gold. Also, it's within the approved material budget.", isMe: true },
  { id: "th-3", from: "Sarah Johnson", timestamp: "Feb 5, 2026 4:30 PM", content: "That's helpful. The Johnsons have been leaning toward the Calacatta anyway. Can you get a formal quote from Floor Pros for the full kitchen backsplash area (42 sq ft) plus the island accent wall (18 sq ft)? I'll need it for the updated budget.", isMe: false },
  { id: "th-4", from: "Me", timestamp: "Feb 6, 2026 8:45 AM", content: "Quote request sent to Floor Pros this morning. They said they'll have it back by noon today. I also asked about matching grout options and edge trim profiles. I'll forward everything as soon as I have it.", isMe: true },
  { id: "th-5", from: "Sarah Johnson", timestamp: "Feb 6, 2026 9:12 AM", content: "RE: Kitchen tile selection approval needed - Perfect, thanks Mike. Once we have the quote, I need your sign-off on the material spec sheet before I submit it to the Johnsons for final approval. Can you review by EOD?", isMe: false },
]

const ANNOUNCEMENTS: AnnouncementEntry[] = [
  { id: "ann-1", title: "Weekly Progress Reports Generated", content: "All project progress reports for the week of Feb 3-7 have been automatically generated and are available in the Reports section. Please review your assigned projects before Monday standup.", author: "System", date: "Today 6:00 AM", audience: "All PMs", priority: "Low" },
  { id: "ann-2", title: "New Safety Protocol - Updated PPE Requirements", content: "Effective immediately, all on-site personnel must wear high-visibility vests and hard hats at all times. This applies to all active construction sites. Updated safety documentation has been uploaded to the resource library.", author: "Mike Rodriguez", date: "Yesterday 9:00 AM", audience: "All Team", priority: "High" },
  { id: "ann-3", title: "System Maintenance Window - Feb 8", content: "The platform will undergo scheduled maintenance on Saturday Feb 8 from 11 PM to 2 AM EST. All services will be temporarily unavailable. Please save your work before this window.", author: "IT Admin", date: "Feb 4 2:00 PM", audience: "All Users", priority: "Medium" },
  { id: "ann-4", title: "Q1 Client Satisfaction Survey Results", content: "Our Q1 client satisfaction scores are in: 4.7/5.0 overall rating, up from 4.5 last quarter. Top areas: communication (4.8), quality (4.7), timeline adherence (4.6). Areas for improvement: change order turnaround time.", author: "Lisa Chen", date: "Feb 3 10:00 AM", audience: "All PMs", priority: "Normal" },
  { id: "ann-5", title: "New Subcontractor Onboarded - Elite Electrical", content: "Elite Electrical has been approved and added to our preferred vendor list. They specialize in commercial and residential panel upgrades and EV charger installations. Contact details have been added to the vendor directory.", author: "Operations", date: "Feb 2 3:00 PM", audience: "All PMs", priority: "Normal" },
]

const TEMPLATES: TemplateEntry[] = [
  { id: "tpl-1", name: "Project Kickoff Welcome", type: "EMAIL", subject: "Welcome to Your [Project Name] Journey!", lastUsed: "Jan 28", usageCount: 24 },
  { id: "tpl-2", name: "Change Order Notification", type: "EMAIL", subject: "Change Order #[CO Number] - [Project Name]", lastUsed: "Feb 3", usageCount: 38 },
  { id: "tpl-3", name: "Inspection Reminder", type: "SMS", subject: "Reminder: Inspection scheduled for [Date]", lastUsed: "Feb 5", usageCount: 52 },
  { id: "tpl-4", name: "Weekly Progress Update", type: "EMAIL", subject: "Weekly Progress Report - [Project Name] - Week of [Date]", lastUsed: "Feb 3", usageCount: 96 },
  { id: "tpl-5", name: "Material Delay Notice", type: "MESSAGE", subject: "Material delivery update for [Project Name]", lastUsed: "Feb 4", usageCount: 15 },
  { id: "tpl-6", name: "Sub Coordination Request", type: "MESSAGE", subject: "Coordination needed - [Trade] - [Project Name]", lastUsed: "Feb 5", usageCount: 31 },
  { id: "tpl-7", name: "Invoice Follow-up", type: "EMAIL", subject: "Payment Reminder - Invoice #[Number]", lastUsed: "Feb 1", usageCount: 19 },
  { id: "tpl-8", name: "Meeting Minutes", type: "EMAIL", subject: "Meeting Minutes - [Meeting Title] - [Date]", lastUsed: "Feb 4", usageCount: 44 },
  { id: "tpl-9", name: "Punch List Notification", type: "EMAIL", subject: "Punch List Items - [Project Name]", lastUsed: "Jan 30", usageCount: 12 },
  { id: "tpl-10", name: "Emergency Weather Alert", type: "SMS", subject: "Weather Alert: [Project Name] site precautions", lastUsed: "Jan 15", usageCount: 7 },
  { id: "tpl-11", name: "Client Thank You", type: "EMAIL", subject: "Thank You - [Project Name] Complete!", lastUsed: "Jan 22", usageCount: 18 },
  { id: "tpl-12", name: "RFI Response", type: "MESSAGE", subject: "RFI-[Number] Response - [Project Name]", lastUsed: "Feb 5", usageCount: 27 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeBadgeStyles(type: CommType): string {
  switch (type) {
    case "EMAIL": return "bg-blue-100 text-blue-700"
    case "MESSAGE": return "bg-green-100 text-green-700"
    case "CALL": return "bg-amber-100 text-amber-700"
    case "MEETING": return "bg-purple-100 text-purple-700"
    case "ANNOUNCEMENT": return "bg-gray-100 text-gray-600"
    case "SMS": return "bg-cyan-100 text-cyan-700"
  }
}

function typeIcon(type: CommType) {
  switch (type) {
    case "EMAIL": return <Mail className="h-4 w-4" />
    case "MESSAGE": return <MessageCircle className="h-4 w-4" />
    case "CALL": return <Phone className="h-4 w-4" />
    case "MEETING": return <Calendar className="h-4 w-4" />
    case "ANNOUNCEMENT": return <Megaphone className="h-4 w-4" />
    case "SMS": return <Smartphone className="h-4 w-4" />
  }
}

function priorityBadgeStyles(p: Priority): string {
  switch (p) {
    case "High": return "bg-red-100 text-red-700"
    case "Medium": return "bg-amber-100 text-amber-700"
    case "Normal": return "bg-blue-100 text-blue-700"
    case "Low": return "bg-gray-100 text-gray-600"
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("inbox")
  const [composerOpen, setComposerOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<InboxItem | null>(null)
  const [threadOpen, setThreadOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Composer state
  const [composerTo, setComposerTo] = React.useState("")
  const [composerProject, setComposerProject] = React.useState("")
  const [composerSubject, setComposerSubject] = React.useState("")
  const [composerBody, setComposerBody] = React.useState("")
  const [composerChannel, setComposerChannel] = React.useState<"Message" | "Email" | "SMS">("Message")
  const [composerTemplate, setComposerTemplate] = React.useState("")

  // Reply state
  const [replyText, setReplyText] = React.useState("")

  const today = new Date()

  function handleInboxItemClick(item: InboxItem) {
    setSelectedItem(item)
    setThreadOpen(true)
  }

  function handleCloseThread() {
    setThreadOpen(false)
    setSelectedItem(null)
  }

  function handleNewMessage() {
    setComposerOpen(!composerOpen)
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HEADER                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Communication Hub
          </h1>
          <p className="text-neutral-500 mt-1">
            Messages, emails, calls, meetings, and notifications in one place
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleNewMessage}>
            <MessageSquare className="h-4 w-4" />
            New Message
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("meetings")}>
            <CalendarClock className="h-4 w-4" />
            Schedule Meeting
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("calls")}>
            <PhoneCall className="h-4 w-4" />
            Log Call
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("announcements")}>
            <Megaphone className="h-4 w-4" />
            Send Announcement
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. COMMUNICATION STATS                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="py-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{s.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.delta}</p>
                </div>
                <div className={cn("rounded-lg p-2", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. TAB NAVIGATION                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTab(t.id); setThreadOpen(false); setSelectedItem(null) }}
            className={cn(
              "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg",
              activeTab === t.id
                ? "text-neutral-900 bg-white border border-b-white -mb-px"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
            )}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pl-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search communications..."
              className="pl-9 w-64 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 5. MESSAGE COMPOSER (expandable panel)                             */}
      {/* ----------------------------------------------------------------- */}
      {composerOpen ? (
        <Card className="py-0 border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Message</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setComposerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">To</label>
                <Input
                  placeholder="Search clients, subs, team members..."
                  value={composerTo}
                  onChange={(e) => setComposerTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Project</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={composerProject}
                  onChange={(e) => setComposerProject(e.target.value)}
                >
                  <option value="">Select project...</option>
                  <option value="johnson-kitchen">Johnson Kitchen</option>
                  <option value="chen-bath">Chen Bath</option>
                  <option value="williams-roof">Williams Roof</option>
                  <option value="garcia-pool">Garcia Pool</option>
                  <option value="davis-adu">Davis ADU</option>
                  <option value="thompson-build">Thompson Build</option>
                  <option value="martinez-hvac">Martinez HVAC</option>
                  <option value="park-reno">Park Reno</option>
                  <option value="hayes-custom">Hayes Custom Home</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Subject</label>
              <Input
                placeholder="Subject line..."
                value={composerSubject}
                onChange={(e) => setComposerSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Message</label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="Type your message..."
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
                Attach Files
              </Button>
              <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white">
                {(["Message", "Email", "SMS"] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setComposerChannel(ch)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      composerChannel === ch
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-neutral-600">Template:</label>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={composerTemplate}
                  onChange={(e) => setComposerTemplate(e.target.value)}
                >
                  <option value="">None</option>
                  {TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto">
                <Button size="sm" onClick={() => { setComposerOpen(false); setComposerTo(""); setComposerSubject(""); setComposerBody("") }}>
                  <Send className="h-4 w-4" />
                  Send {composerChannel}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ----------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* -------------------------------------------------------------- */}
        {/* LEFT: Main content (3 cols)                                     */}
        {/* -------------------------------------------------------------- */}
        <div className="xl:col-span-3 space-y-6">
          {/* ============================================================ */}
          {/* 4. INBOX VIEW                                                 */}
          {/* ============================================================ */}
          {activeTab === "inbox" && !threadOpen ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Unified Inbox
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {INBOX_ITEMS.filter((i) => !i.read).length} unread
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Check className="h-4 w-4" />
                      Mark All Read
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4" />
                      Archive Read
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="rounded-xl border bg-white divide-y">
                  {INBOX_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInboxItemClick(item)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-start gap-3",
                        !item.read && "bg-blue-50/40"
                      )}
                    >
                      {/* Type icon */}
                      <div className={cn("rounded-lg p-2 shrink-0 mt-0.5", typeBadgeStyles(item.type))}>
                        {typeIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm truncate", !item.read ? "font-semibold text-neutral-900" : "font-medium text-neutral-700")}>
                                {item.sender}
                              </span>
                              <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", typeBadgeStyles(item.type))}>
                                {item.type}
                              </span>
                            </div>
                            <p className={cn("text-sm mt-0.5 truncate", !item.read ? "text-neutral-800" : "text-neutral-600")}>
                              {item.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", priorityBadgeStyles(item.priority))}>
                              {item.priority}
                            </span>
                            {!item.read ? (
                              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                          <span>{item.project}</span>
                          <span className="text-neutral-300">|</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ============================================================ */}
          {/* 6. MESSAGE THREAD VIEW                                        */}
          {/* ============================================================ */}
          {activeTab === "inbox" && threadOpen && selectedItem ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleCloseThread}>
                      Back
                    </Button>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{selectedItem.sender}</CardTitle>
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", typeBadgeStyles(selectedItem.type))}>
                          {selectedItem.type}
                        </span>
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", priorityBadgeStyles(selectedItem.priority))}>
                          {selectedItem.priority}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">{selectedItem.project} | {selectedItem.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4" />
                      Forward
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="h-4 w-4" />
                      Flag
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-4">
                {/* Subject line */}
                <div className="rounded-xl border bg-neutral-50 px-4 py-3">
                  <p className="text-sm font-semibold text-neutral-900">{selectedItem.subject}</p>
                </div>

                {/* Conversation thread */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {THREAD_MESSAGES.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-xl px-4 py-3", msg.isMe ? "bg-neutral-900 text-white" : "bg-white border")}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn("text-xs font-semibold", msg.isMe ? "text-neutral-300" : "text-neutral-700")}>{msg.from}</span>
                          <span className={cn("text-[10px]", msg.isMe ? "text-neutral-400" : "text-neutral-500")}>{msg.timestamp}</span>
                        </div>
                        <p className={cn("text-sm leading-relaxed", msg.isMe ? "text-neutral-100" : "text-neutral-700")}>{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attachments */}
                <div className="rounded-xl border bg-white px-4 py-3">
                  <p className="text-xs font-medium text-neutral-600 mb-2">Attachments (2)</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-neutral-700">Calacatta_Gold_Spec.pdf</span>
                      <span className="text-neutral-400 text-xs">248 KB</span>
                    </div>
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="text-neutral-700">Kitchen_Layout_v3.dwg</span>
                      <span className="text-neutral-400 text-xs">1.2 MB</span>
                    </div>
                  </div>
                </div>

                {/* Reply composer */}
                <div className="border rounded-xl p-3 bg-white space-y-3">
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                        Attach
                      </Button>
                      <Button variant="outline" size="sm">
                        <Type className="h-4 w-4" />
                        Format
                      </Button>
                    </div>
                    <Button size="sm" disabled={!replyText.trim()}>
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ============================================================ */}
          {/* MESSAGES TAB                                                  */}
          {/* ============================================================ */}
          {activeTab === "messages" ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Direct Messages</CardTitle>
                  <Button size="sm" onClick={handleNewMessage}>
                    <Plus className="h-4 w-4" />
                    New Conversation
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="rounded-xl border bg-white divide-y">
                  {INBOX_ITEMS.filter((i) => i.type === "MESSAGE").map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInboxItemClick(item)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-start gap-3",
                        !item.read && "bg-green-50/40"
                      )}
                    >
                      <div className={cn("rounded-lg p-2 shrink-0 mt-0.5", typeBadgeStyles("MESSAGE"))}>
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={cn("text-sm", !item.read ? "font-semibold text-neutral-900" : "font-medium text-neutral-700")}>{item.sender}</span>
                            <p className="text-sm text-neutral-600 mt-0.5 truncate">{item.subject}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", priorityBadgeStyles(item.priority))}>
                              {item.priority}
                            </span>
                            <span className="text-xs text-neutral-500">{item.time}</span>
                            {!item.read ? <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" /> : null}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{item.project}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ============================================================ */}
          {/* EMAIL TAB                                                     */}
          {/* ============================================================ */}
          {activeTab === "email" ? (
            <div className="space-y-6">
              {/* 7. Email Integration Panel */}
              <Card className="py-0 border-indigo-200 bg-indigo-50/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-green-100 text-green-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Connected: Gmail</p>
                        <p className="text-xs text-neutral-500">mike@kealeepm.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-blue-100 text-blue-600">
                        <Inbox className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">45 Auto-filed</p>
                        <p className="text-xs text-neutral-500">Matched to projects this week</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-amber-100 text-amber-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">3 Pending Filing</p>
                        <p className="text-xs text-neutral-500">Need manual project assignment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2 bg-purple-100 text-purple-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">12 Templates</p>
                        <p className="text-xs text-neutral-500">Available for quick compose</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email list */}
              <Card className="py-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Email Inbox</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                        Filters
                      </Button>
                      <Button size="sm" onClick={handleNewMessage}>
                        <Plus className="h-4 w-4" />
                        Compose
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="rounded-xl border bg-white divide-y">
                    {INBOX_ITEMS.filter((i) => i.type === "EMAIL").map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { setSelectedItem(item); setThreadOpen(true); setActiveTab("inbox") }}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-start gap-3",
                          !item.read && "bg-blue-50/40"
                        )}
                      >
                        <div className={cn("rounded-lg p-2 shrink-0 mt-0.5", typeBadgeStyles("EMAIL"))}>
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className={cn("text-sm", !item.read ? "font-semibold text-neutral-900" : "font-medium text-neutral-700")}>{item.sender}</span>
                              <p className="text-sm text-neutral-600 mt-0.5 truncate">{item.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", priorityBadgeStyles(item.priority))}>
                                {item.priority}
                              </span>
                              <span className="text-xs text-neutral-500">{item.time}</span>
                              {!item.read ? <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" /> : null}
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{item.project}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* ============================================================ */}
          {/* 8. CALLS TAB                                                  */}
          {/* ============================================================ */}
          {activeTab === "calls" ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Call Log
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {CALL_LOG.length} recent calls
                    </span>
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Log New Call
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="overflow-x-auto rounded-xl border bg-white">
                  <table className="min-w-[1000px] w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Contact</th>
                        <th className="text-left font-medium px-4 py-3">Direction</th>
                        <th className="text-left font-medium px-4 py-3">Duration</th>
                        <th className="text-left font-medium px-4 py-3">Project</th>
                        <th className="text-left font-medium px-4 py-3">Date</th>
                        <th className="text-left font-medium px-4 py-3">Notes</th>
                        <th className="text-left font-medium px-4 py-3">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {CALL_LOG.map((call) => (
                        <tr key={call.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "rounded-full p-1",
                                call.direction === "Inbound" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                              )}>
                                {call.direction === "Inbound" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                              </div>
                              <span className="font-medium text-neutral-900">{call.contact}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              call.direction === "Inbound" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {call.direction}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-neutral-700">{call.duration}</td>
                          <td className="px-4 py-3 text-neutral-700">{call.project}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">{call.date}</td>
                          <td className="px-4 py-3 text-neutral-600 max-w-[250px]">
                            <p className="truncate">{call.notes}</p>
                          </td>
                          <td className="px-4 py-3">
                            {call.followUp === "None needed" ? (
                              <span className="text-xs text-neutral-400">{call.followUp}</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                                {call.followUp}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ============================================================ */}
          {/* 9. MEETINGS TAB                                               */}
          {/* ============================================================ */}
          {activeTab === "meetings" ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Meeting Calendar
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      Week of Feb 3 - Feb 7, 2026
                    </span>
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {MEETINGS.map((mtg) => {
                    const isToday = mtg.day === "Thu Feb 6"
                    const isPast = ["Mon Feb 3", "Tue Feb 4", "Wed Feb 5"].includes(mtg.day)
                    return (
                      <div
                        key={mtg.id}
                        className={cn(
                          "rounded-xl border p-4 transition-colors",
                          isToday ? "border-purple-300 bg-purple-50/50" : isPast ? "bg-neutral-50/50 opacity-75" : "bg-white hover:bg-neutral-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "rounded-lg p-2.5 text-center min-w-[72px]",
                              isToday ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-600"
                            )}>
                              <div className="text-[10px] font-medium uppercase">{mtg.day.split(" ")[0]}</div>
                              <div className="text-lg font-bold">{mtg.day.split(" ")[2]}</div>
                              <div className="text-[10px]">{mtg.day.split(" ")[1]}</div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-neutral-900">{mtg.title}</h4>
                                {isToday ? (
                                  <span className="inline-flex items-center rounded-full bg-purple-200 text-purple-800 px-2 py-0.5 text-[10px] font-semibold">
                                    TODAY
                                  </span>
                                ) : null}
                                {isPast ? (
                                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-semibold">
                                    COMPLETED
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {mtg.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {mtg.attendees}
                                </span>
                                <span className="flex items-center gap-1">
                                  {mtg.location === "Zoom" ? <Video className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                                  {mtg.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {mtg.location === "Zoom" ? (
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4" />
                                Join
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* ============================================================ */}
          {/* ANNOUNCEMENTS TAB                                             */}
          {/* ============================================================ */}
          {activeTab === "announcements" ? (
            <div className="space-y-6">
              {/* Compose announcement */}
              <Card className="py-0 border-gray-200 bg-gray-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Send New Announcement</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-600 mb-1 block">Title</label>
                      <Input placeholder="Announcement title..." />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600 mb-1 block">Audience</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="all-team">All Team</option>
                        <option value="all-pms">All PMs</option>
                        <option value="field-crew">Field Crew</option>
                        <option value="clients">Clients</option>
                        <option value="subs">Subcontractors</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600 mb-1 block">Priority</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                    placeholder="Write your announcement..."
                  />
                  <div className="flex justify-end">
                    <Button size="sm">
                      <Megaphone className="h-4 w-4" />
                      Send Announcement
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Announcement history */}
              <Card className="py-0">
                <CardHeader>
                  <CardTitle className="text-base">Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  {ANNOUNCEMENTS.map((ann) => (
                    <div key={ann.id} className="rounded-xl border bg-white p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg p-2 bg-gray-100 text-gray-600 shrink-0 mt-0.5">
                            <Megaphone className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-neutral-900">{ann.title}</h4>
                              <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none", priorityBadgeStyles(ann.priority))}>
                                {ann.priority}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{ann.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                              <span>By {ann.author}</span>
                              <span className="text-neutral-300">|</span>
                              <span>{ann.date}</span>
                              <span className="text-neutral-300">|</span>
                              <span>Audience: {ann.audience}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* ============================================================ */}
          {/* TEMPLATES TAB                                                 */}
          {/* ============================================================ */}
          {activeTab === "templates" ? (
            <Card className="py-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Communication Templates
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {TEMPLATES.length} templates
                    </span>
                  </CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="overflow-x-auto rounded-xl border bg-white">
                  <table className="min-w-[800px] w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">Template Name</th>
                        <th className="text-left font-medium px-4 py-3">Type</th>
                        <th className="text-left font-medium px-4 py-3">Subject</th>
                        <th className="text-left font-medium px-4 py-3">Last Used</th>
                        <th className="text-right font-medium px-4 py-3">Usage</th>
                        <th className="text-right font-medium px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {TEMPLATES.map((tpl) => (
                        <tr key={tpl.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-neutral-900">{tpl.name}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", typeBadgeStyles(tpl.type))}>
                              {tpl.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600 max-w-[250px] truncate">{tpl.subject}</td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">{tpl.lastUsed}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{tpl.usageCount}x</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="outline" size="sm">Use</Button>
                              <Button variant="outline" size="sm">Edit</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* RIGHT SIDEBAR (1 col)                                           */}
        {/* -------------------------------------------------------------- */}
        <div className="space-y-6">
          {/* 10. NOTIFICATION PREFERENCES                                   */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">Email notifications</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                    On
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">SMS notifications</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                    Urgent Only
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">Push notifications</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                    On
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">Daily digest</span>
                  </div>
                  <span className="text-xs font-medium text-neutral-700">7:00 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm text-neutral-700">Quiet hours</span>
                  </div>
                  <span className="text-xs font-medium text-neutral-700">9 PM - 7 AM</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4" />
                Manage Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleNewMessage}>
                <MessageSquare className="h-4 w-4" />
                New Message
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab("meetings")}>
                <CalendarClock className="h-4 w-4" />
                Schedule Meeting
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab("calls")}>
                <PhoneCall className="h-4 w-4" />
                Log a Call
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab("announcements")}>
                <Megaphone className="h-4 w-4" />
                Send Announcement
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setActiveTab("templates")}>
                <FileText className="h-4 w-4" />
                Browse Templates
              </Button>
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">Recent Contacts</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {[
                { name: "Sarah Johnson", role: "Client", project: "Johnson Kitchen" },
                { name: "Rodriguez Electric", role: "Subcontractor", project: "Chen Bath" },
                { name: "Mary Williams", role: "Client", project: "Williams Roof" },
                { name: "Mike Rodriguez", role: "PM", project: "Davis ADU" },
                { name: "Tom Anderson", role: "Prospect", project: "New Lead" },
                { name: "James Park", role: "Client", project: "Park Reno" },
              ].map((contact) => (
                <div
                  key={contact.name}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-white hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-100 text-neutral-600 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">{contact.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{contact.role} - {contact.project}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 h-7 w-7 p-0">
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Communication Activity */}
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base">This Week&apos;s Activity</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                {[
                  { label: "Messages Sent", value: 34, max: 50, color: "bg-green-500" },
                  { label: "Emails Processed", value: 45, max: 60, color: "bg-blue-500" },
                  { label: "Calls Made", value: 12, max: 20, color: "bg-amber-500" },
                  { label: "Meetings Attended", value: 5, max: 8, color: "bg-purple-500" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-600">{metric.label}</span>
                      <span className="text-xs font-medium text-neutral-900">{metric.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", metric.color)}
                        style={{ width: `${Math.min(100, (metric.value / metric.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
