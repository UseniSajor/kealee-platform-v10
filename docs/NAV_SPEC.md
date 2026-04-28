# Kealee Platform — Navigation Specification v3.0

## Final Topbar Structure

```
[K Logo] | Services▾ | Design Concept | What does it Cost | Get Permits | Marketplace | FAQ | ─── | Sign in | [Get Started]
```

## Desktop Layout (1024px+)

- Container: `max-w-screen-2xl`
- Height: `h-16`
- Background: `bg-white` with `shadow-sm border-b border-gray-200`
- Sticky: `sticky top-0 z-50`

### Left: Logo + Nav
| Element | Type | href | Active Color |
|---|---|---|---|
| K Logo | Icon + Text | / | — |
| Services | Dropdown | — | slate-900 |
| Design Concept | Tab | /concept | orange-500 |
| What does it Cost | Tab | /estimate | blue-500 |
| Get Permits | Tab | /permits | green-600 |
| Marketplace | Tab | /marketplace | orange-500 |
| FAQ | Tab | /faq | orange-500 |

### Divider
`w-px h-6 bg-gray-300` — visual separator

### Right: Account
- Sign in → `/auth/sign-in` (text link)
- Get Started → `/concept` (orange button, `bg-orange-500 hover:bg-orange-600`)

## Color & Hover States

```
Design Concept:  default slate-600  | hover text-orange-500 + underline | active border-b-2 border-orange-500
What does it Cost: default slate-600 | hover text-blue-500 + underline   | active border-b-2 border-blue-500
Get Permits:     default slate-600  | hover text-green-600 + underline  | active border-b-2 border-green-600
Marketplace:     default slate-600  | hover text-orange-500 + underline | active border-b-2 border-orange-500
FAQ:             default slate-600  | hover text-orange-500 + underline | active border-b-2 border-orange-500
```

## Mobile Hamburger Menu (below 1024px)

```
┌──────────────────────────────┐
│ ✕  Close button (top right)  │
├──────────────────────────────┤
│ NAVIGATION                   │
│ ├─ Services (expandable ▾)   │
│ │  └─ All 10 services        │
│ ├─ Design Concept            │
│ ├─ What does it Cost         │
│ ├─ Get Permits               │
│ ├─ Marketplace               │
│ └─ FAQ                       │
├──────────────────────────────┤
│ ACCOUNT                      │
│ └─ Sign in                   │
├──────────────────────────────┤
│ [Get Started — full width]   │
│ [Orange, extra large]        │
└──────────────────────────────┘
```

## Removed from Nav
- Gallery (accessible via /gallery but not in topbar)
- Build Now (accessible via /new-construction)
- Milestone Pay (accessible via /milestone-pay)
