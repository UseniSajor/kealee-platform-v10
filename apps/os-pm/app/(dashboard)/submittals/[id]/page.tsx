"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  LinkIcon,
  MessageSquare,
  Paperclip,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"

type SubmittalStatus =
  | "pending"
  | "under-review"
  | "approved"
  | "approved-as-noted"
  | "rejected"
  | "revise-resubmit"

const STATUS_STYLES: Record<SubmittalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  "under-review": "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  "approved-as-noted": "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  "revise-resubmit": "bg-orange-100 text-orange-800",
}

const STATUS_LABELS: Record<SubmittalStatus, string> = {
  pending: "Pending",
  "under-review": "Under Review",
  approved: "Approved",
  "approved-as-noted": "Approved as Noted",
  rejected: "Rejected",
  "revise-resubmit": "Revise & Resubmit",
}

interface SubmittalDetail {
  id: string
  number: string
  title: string
  specSection: string
  specTitle: string
  description: string
  submittedBy: string
  reviewer: string
  status: SubmittalStatus
  submitDate: string
  requiredDate: string
  ballInCourt: string
  project: string
  contractNumber: string
}

const MOCK_SUBMITTALS: Record<string, SubmittalDetail> = {
  "1": {
    id: "1",
    number: "SUB-001",
    title: "Concrete Mix Design - 5000 PSI",
    specSection: "03 30 00",
    specTitle: "Cast-in-Place Concrete",
    description:
      "5000 PSI concrete mix design for all foundation and elevated slab pours per structural specifications. Includes fly ash replacement at 20% by weight of cementitious material, air entrainment for freeze-thaw durability, and water-reducing admixture for workability. Mix design targets 28-day compressive strength of 5,000 PSI with a maximum w/c ratio of 0.40. Slump range 4-6 inches for pumped placement.",
    submittedBy: "Atlas Concrete Inc.",
    reviewer: "Martinez Structural Engineers",
    status: "approved",
    submitDate: "2026-01-15",
    requiredDate: "2026-01-29",
    ballInCourt: "Resolved",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "2": {
    id: "2",
    number: "SUB-002",
    title: "Structural Steel Shop Drawings",
    specSection: "05 12 00",
    specTitle: "Structural Steel Framing",
    description:
      "Complete structural steel shop drawing package for the primary building frame including wide-flange beams, columns, braced frames, and moment connections. Package includes 48 sheets of erection drawings, 62 sheets of detail drawings, and material certifications per ASTM A992/A992M. All connections designed per AISC 360-22 Specification for Structural Steel Buildings. Includes embed plate layouts and base plate anchor bolt patterns.",
    submittedBy: "Ironworks Fabricators LLC",
    reviewer: "Martinez Structural Engineers",
    status: "under-review",
    submitDate: "2026-01-22",
    requiredDate: "2026-02-12",
    ballInCourt: "Structural Engineer",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "3": {
    id: "3",
    number: "SUB-003",
    title: "HVAC Rooftop Units - Carrier 50XC",
    specSection: "23 74 00",
    specTitle: "Packaged Outdoor HVAC Equipment",
    description:
      "Carrier 50XC packaged rooftop units, 25-ton nominal cooling capacity with gas heat for zones 1-4. Units include integrated economizer with enthalpy control, variable frequency drives on supply fans, and factory-installed BACnet communication module for BAS integration. Equipment selections include sound power data, structural curb details, and electrical connection requirements. Units comply with ASHRAE 90.1-2022 minimum efficiency requirements.",
    submittedBy: "ProAir Mechanical Corp.",
    reviewer: "Summit MEP Consultants",
    status: "approved-as-noted",
    submitDate: "2026-01-25",
    requiredDate: "2026-02-08",
    ballInCourt: "Contractor",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "4": {
    id: "4",
    number: "SUB-004",
    title: "Plumbing Fixtures - Kohler Commercial",
    specSection: "22 40 00",
    specTitle: "Plumbing Fixtures",
    description:
      "Kohler commercial-grade plumbing fixtures for restroom cores on floors 1 through 6. Includes Highcliff Ultra wall-mount water closets (1.0 GPF), Kingston wall-mount lavatories with Triton Bowe faucets, and Bardon high-efficiency urinals (0.125 GPF). Package also includes stainless steel grab bars, soap dispensers, and paper towel dispensers. All fixtures meet ADA accessibility requirements and WaterSense certification for water conservation.",
    submittedBy: "Western Plumbing Solutions",
    reviewer: "Summit MEP Consultants",
    status: "pending",
    submitDate: "2026-02-01",
    requiredDate: "2026-02-15",
    ballInCourt: "MEP Engineer",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "5": {
    id: "5",
    number: "SUB-005",
    title: "Electrical Distribution Panels",
    specSection: "26 24 16",
    specTitle: "Panelboards",
    description:
      "Square D NF-series panelboards for branch circuit distribution on all floors. Submittal includes 225A main breaker panels with copper bus, bolt-on branch breakers, and integrated ground fault protection on designated circuits. Panel schedules show circuit loading calculations. Rejected due to incorrect 42-circuit bus rating (specification requires 54-circuit minimum) and missing Type 2 surge protective device on each panel.",
    submittedBy: "Apex Electrical Contractors",
    reviewer: "Summit MEP Consultants",
    status: "rejected",
    submitDate: "2026-01-28",
    requiredDate: "2026-02-11",
    ballInCourt: "Electrical Contractor",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "6": {
    id: "6",
    number: "SUB-006",
    title: "TPO Roofing Membrane System",
    specSection: "07 54 23",
    specTitle: "Thermoplastic Polyolefin Roofing",
    description:
      "Carlisle SynTec Sure-Weld 60-mil TPO fully adhered membrane roofing system for all low-slope roof areas (approximately 22,400 SF). System includes polyiso insulation boards with tapered crickets at drains, TPO-coated metal edge fascia, and pre-fabricated inside/outside corners. 20-year NDL manufacturer warranty. Submittal includes wind uplift calculations per FM Global 1-90 and thermal resistance calculations per ASHRAE 90.1.",
    submittedBy: "Summit Roofing Co.",
    reviewer: "Whitfield Architects",
    status: "under-review",
    submitDate: "2026-02-03",
    requiredDate: "2026-02-17",
    ballInCourt: "Architect",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "7": {
    id: "7",
    number: "SUB-007",
    title: "Curtain Wall Shop Drawings - North Elevation",
    specSection: "08 44 13",
    specTitle: "Glazed Aluminum Curtain Walls",
    description:
      "Unitized curtain wall shop drawings for the north building elevation, approximately 8,600 SF of aluminum-framed curtain wall with insulated glass units. Includes stack joint details, corner conditions, and integration with adjacent precast panels. Initial submission returned for revision due to insufficient thermal break details at transom connections and need for updated structural calculations reflecting wind tunnel test results. Resubmission expected with PE-stamped engineering.",
    submittedBy: "Clearview Glass Systems",
    reviewer: "Whitfield Architects",
    status: "revise-resubmit",
    submitDate: "2026-01-20",
    requiredDate: "2026-02-03",
    ballInCourt: "Curtain Wall Sub",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "8": {
    id: "8",
    number: "SUB-008",
    title: "Fire Suppression Sprinkler Layout",
    specSection: "21 13 13",
    specTitle: "Wet-Pipe Sprinkler Systems",
    description:
      "Wet-pipe automatic sprinkler system hydraulic calculations and layout drawings for floors 1-6 and the below-grade parking garage. System designed per NFPA 13 with Ordinary Hazard Group 1 classification for office areas and Extra Hazard Group 1 for parking levels. Includes 8-inch main riser, floor control valve assemblies, and inspector test connections at each level. Hydraulic calculations demonstrate adequate flow and pressure at the most remote sprinkler head.",
    submittedBy: "Guardian Fire Protection",
    reviewer: "Summit MEP Consultants",
    status: "approved",
    submitDate: "2026-01-18",
    requiredDate: "2026-02-01",
    ballInCourt: "Resolved",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "9": {
    id: "9",
    number: "SUB-009",
    title: "Elevator Equipment - Otis Gen3",
    specSection: "14 21 00",
    specTitle: "Electric Traction Elevators",
    description:
      "Otis Gen3 gearless traction elevator system: 2 passenger elevators (3,500 lb capacity, 350 FPM) and 1 freight/service elevator (4,500 lb capacity, 200 FPM). Submittal includes machine room layouts, hoistway cross-sections, pit depth requirements, cab interior finish selections (stainless steel panels with LED downlights), and integrated destination dispatch controller specifications. System includes ReGen drive for energy recovery and remote monitoring via Otis ONE IoT platform.",
    submittedBy: "Otis Elevator Company",
    reviewer: "Whitfield Architects",
    status: "pending",
    submitDate: "2026-02-05",
    requiredDate: "2026-02-19",
    ballInCourt: "Architect",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
  "10": {
    id: "10",
    number: "SUB-010",
    title: "Door Hardware Schedule & Catalog Cuts",
    specSection: "08 71 00",
    specTitle: "Door Hardware",
    description:
      "Complete door hardware schedule for 186 interior and exterior openings. Hardware sets include Von Duprin 98/99 series exit devices for egress doors, Schlage ND-series cylindrical locksets with Primus XP cylinders for office suite entries, and LCN 4040XP series door closers throughout. Package includes card reader prep for access-controlled openings, electrified hardware wiring diagrams, and coordination with fire-rated frames. All hardware compliant with ADA/ANSI A117.1 accessibility standards.",
    submittedBy: "Pacific Door & Hardware",
    reviewer: "Whitfield Architects",
    status: "under-review",
    submitDate: "2026-02-06",
    requiredDate: "2026-02-20",
    ballInCourt: "Architect",
    project: "Riverside Commons",
    contractNumber: "RC-2026-001",
  },
}

interface WorkflowStep {
  label: string
  stepStatus: "complete" | "active" | "pending"
  date: string
  user?: string
}

interface RevisionEntry {
  rev: string
  date: string
  status: string
  notes: string
}

interface Attachment {
  name: string
  size: string
  date: string
  type: string
}

interface ReviewComment {
  id: string
  user: string
  role: string
  date: string
  content: string
}

interface RelatedItem {
  type: "RFI" | "Drawing" | "Specification"
  number: string
  title: string
  link: string
}

const WORKFLOW_MAP: Record<string, WorkflowStep[]> = {
  "1": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 15", user: "Atlas Concrete Inc." },
    { label: "Under Review", stepStatus: "complete", date: "Jan 17", user: "Martinez Structural Engineers" },
    { label: "Approved", stepStatus: "complete", date: "Jan 24", user: "David Martinez, PE" },
  ],
  "2": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 22", user: "Ironworks Fabricators LLC" },
    { label: "Under Review", stepStatus: "active", date: "Jan 25", user: "Martinez Structural Engineers" },
    { label: "Decision", stepStatus: "pending", date: "---" },
  ],
  "3": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 25", user: "ProAir Mechanical Corp." },
    { label: "Under Review", stepStatus: "complete", date: "Jan 27", user: "Summit MEP Consultants" },
    { label: "Approved as Noted", stepStatus: "complete", date: "Feb 4", user: "Rachel Torres, PE" },
  ],
  "4": [
    { label: "Submitted", stepStatus: "complete", date: "Feb 1", user: "Western Plumbing Solutions" },
    { label: "Under Review", stepStatus: "pending", date: "---" },
    { label: "Decision", stepStatus: "pending", date: "---" },
  ],
  "5": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 28", user: "Apex Electrical Contractors" },
    { label: "Under Review", stepStatus: "complete", date: "Jan 30", user: "Summit MEP Consultants" },
    { label: "Rejected", stepStatus: "complete", date: "Feb 6", user: "James Park, PE" },
  ],
  "6": [
    { label: "Submitted", stepStatus: "complete", date: "Feb 3", user: "Summit Roofing Co." },
    { label: "Under Review", stepStatus: "active", date: "Feb 5", user: "Whitfield Architects" },
    { label: "Decision", stepStatus: "pending", date: "---" },
  ],
  "7": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 20", user: "Clearview Glass Systems" },
    { label: "Under Review", stepStatus: "complete", date: "Jan 22", user: "Whitfield Architects" },
    { label: "Revise & Resubmit", stepStatus: "complete", date: "Jan 30", user: "Sarah Whitfield, AIA" },
  ],
  "8": [
    { label: "Submitted", stepStatus: "complete", date: "Jan 18", user: "Guardian Fire Protection" },
    { label: "Under Review", stepStatus: "complete", date: "Jan 20", user: "Summit MEP Consultants" },
    { label: "Approved", stepStatus: "complete", date: "Jan 27", user: "Rachel Torres, PE" },
  ],
  "9": [
    { label: "Submitted", stepStatus: "complete", date: "Feb 5", user: "Otis Elevator Company" },
    { label: "Under Review", stepStatus: "pending", date: "---" },
    { label: "Decision", stepStatus: "pending", date: "---" },
  ],
  "10": [
    { label: "Submitted", stepStatus: "complete", date: "Feb 6", user: "Pacific Door & Hardware" },
    { label: "Under Review", stepStatus: "active", date: "Feb 10", user: "Whitfield Architects" },
    { label: "Decision", stepStatus: "pending", date: "---" },
  ],
}

const REVISIONS_MAP: Record<string, RevisionEntry[]> = {
  "1": [
    { rev: "Rev 0", date: "2026-01-15", status: "Approved", notes: "Initial submission - mix design report, trial batch data, and material certifications" },
  ],
  "2": [
    { rev: "Rev 0", date: "2026-01-22", status: "Under Review", notes: "Initial submission - 48 erection + 62 detail sheets, material certs" },
  ],
  "3": [
    { rev: "Rev 0", date: "2026-01-25", status: "Approved as Noted", notes: "Initial submission - 4 units. Note: verify condensate drain routing at unit 3" },
  ],
  "4": [
    { rev: "Rev 0", date: "2026-02-01", status: "Pending", notes: "Initial submission - fixture cut sheets and accessory catalog data" },
  ],
  "5": [
    { rev: "Rev 0", date: "2026-01-28", status: "Rejected", notes: "Incorrect bus rating (42-circuit vs. 54-circuit required). Missing SPD." },
  ],
  "6": [
    { rev: "Rev 0", date: "2026-02-03", status: "Under Review", notes: "Initial submission - membrane system, insulation, edge details" },
  ],
  "7": [
    { rev: "Rev 0", date: "2026-01-20", status: "Revise & Resubmit", notes: "Initial submission - 32 sheets. Thermal break and structural calcs need revision." },
    { rev: "Rev 1", date: "2026-02-10", status: "Pending", notes: "Resubmission in progress - updated thermal break details" },
  ],
  "8": [
    { rev: "Rev 0", date: "2026-01-18", status: "Approved", notes: "Complete hydraulic calculations and layout for all 7 levels" },
  ],
  "9": [
    { rev: "Rev 0", date: "2026-02-05", status: "Pending", notes: "Initial submission - 3 elevators with cab finish selections" },
  ],
  "10": [
    { rev: "Rev 0", date: "2026-02-06", status: "Under Review", notes: "Complete hardware schedule for 186 openings with catalog cuts" },
  ],
}

const ATTACHMENTS_MAP: Record<string, Attachment[]> = {
  "1": [
    { name: "Mix_Design_5000PSI_Report.pdf", size: "2.4 MB", date: "Jan 15", type: "pdf" },
    { name: "Trial_Batch_Test_Results.pdf", size: "1.8 MB", date: "Jan 15", type: "pdf" },
    { name: "Aggregate_Certifications.pdf", size: "890 KB", date: "Jan 15", type: "pdf" },
  ],
  "2": [
    { name: "Steel_Erection_Drawings_Rev0.pdf", size: "18.6 MB", date: "Jan 22", type: "pdf" },
    { name: "Steel_Detail_Drawings_Rev0.pdf", size: "24.3 MB", date: "Jan 22", type: "pdf" },
    { name: "Material_Certifications_ASTM_A992.pdf", size: "1.1 MB", date: "Jan 22", type: "pdf" },
    { name: "Connection_Details.dwg", size: "8.7 MB", date: "Jan 22", type: "dwg" },
  ],
  "3": [
    { name: "Carrier_50XC_Submittal_Data.pdf", size: "5.2 MB", date: "Jan 25", type: "pdf" },
    { name: "Sound_Power_Data.pdf", size: "430 KB", date: "Jan 25", type: "pdf" },
    { name: "Structural_Curb_Details.pdf", size: "1.6 MB", date: "Jan 25", type: "pdf" },
  ],
  "4": [
    { name: "Kohler_WC_Highcliff_Ultra.pdf", size: "3.1 MB", date: "Feb 1", type: "pdf" },
    { name: "Kohler_Lavatory_Kingston.pdf", size: "2.8 MB", date: "Feb 1", type: "pdf" },
    { name: "Kohler_Urinal_Bardon.pdf", size: "1.9 MB", date: "Feb 1", type: "pdf" },
    { name: "ADA_Accessories_Package.pdf", size: "4.2 MB", date: "Feb 1", type: "pdf" },
  ],
  "5": [
    { name: "SquareD_NF_Panelboard_Data.pdf", size: "6.7 MB", date: "Jan 28", type: "pdf" },
    { name: "Panel_Schedules_All_Floors.pdf", size: "3.4 MB", date: "Jan 28", type: "pdf" },
  ],
  "6": [
    { name: "Carlisle_TPO_System_Data.pdf", size: "8.3 MB", date: "Feb 3", type: "pdf" },
    { name: "Wind_Uplift_Calculations.pdf", size: "2.1 MB", date: "Feb 3", type: "pdf" },
    { name: "Insulation_Layout_Plan.pdf", size: "4.5 MB", date: "Feb 3", type: "pdf" },
  ],
  "7": [
    { name: "Curtain_Wall_North_Elev_Rev0.pdf", size: "15.8 MB", date: "Jan 20", type: "pdf" },
    { name: "Structural_Calcs_Draft.pdf", size: "3.2 MB", date: "Jan 20", type: "pdf" },
    { name: "Thermal_Performance_Report.pdf", size: "1.7 MB", date: "Jan 20", type: "pdf" },
  ],
  "8": [
    { name: "Sprinkler_Layout_All_Floors.pdf", size: "12.4 MB", date: "Jan 18", type: "pdf" },
    { name: "Hydraulic_Calculations.pdf", size: "5.6 MB", date: "Jan 18", type: "pdf" },
    { name: "Riser_Diagram.pdf", size: "1.3 MB", date: "Jan 18", type: "pdf" },
  ],
  "9": [
    { name: "Otis_Gen3_Equipment_Data.pdf", size: "9.1 MB", date: "Feb 5", type: "pdf" },
    { name: "Hoistway_Cross_Sections.pdf", size: "3.8 MB", date: "Feb 5", type: "pdf" },
    { name: "Cab_Finish_Selections.pdf", size: "6.2 MB", date: "Feb 5", type: "pdf" },
  ],
  "10": [
    { name: "Door_Hardware_Schedule.pdf", size: "7.4 MB", date: "Feb 6", type: "pdf" },
    { name: "VonDuprin_Exit_Devices.pdf", size: "4.1 MB", date: "Feb 6", type: "pdf" },
    { name: "Schlage_ND_Locksets.pdf", size: "3.6 MB", date: "Feb 6", type: "pdf" },
    { name: "LCN_Closers_4040XP.pdf", size: "2.2 MB", date: "Feb 6", type: "pdf" },
    { name: "Electrified_Hardware_Wiring.pdf", size: "1.8 MB", date: "Feb 6", type: "pdf" },
  ],
}

const COMMENTS_MAP: Record<string, ReviewComment[]> = {
  "1": [
    { id: "c1", user: "Atlas Concrete Inc.", role: "Subcontractor", date: "2026-01-15", content: "Submitted per spec section 03 30 00. Mix design meets 28-day strength requirement with 20% fly ash replacement." },
    { id: "c2", user: "Sarah Kim", role: "PM Coordinator", date: "2026-01-17", content: "Forwarded to Martinez Structural Engineers for review." },
    { id: "c3", user: "David Martinez, PE", role: "Structural Engineer", date: "2026-01-24", content: "Mix design reviewed and approved. Compressive strength, w/c ratio, and air content meet specification requirements. No exceptions noted." },
  ],
  "2": [
    { id: "c1", user: "Ironworks Fabricators LLC", role: "Subcontractor", date: "2026-01-22", content: "Submitted complete shop drawing package per spec section 05 12 00. All connections per AISC 360-22. Please note column splice detail at grid C-4 has been revised per RFI-005 response." },
    { id: "c2", user: "Sarah Kim", role: "PM Coordinator", date: "2026-01-25", content: "Forwarded to Martinez Structural Engineers for review. Target response by Feb 12." },
  ],
  "3": [
    { id: "c1", user: "ProAir Mechanical Corp.", role: "Subcontractor", date: "2026-01-25", content: "Carrier 50XC units selected per equipment schedule. VFD and BACnet module factory-installed on all units." },
    { id: "c2", user: "Rachel Torres, PE", role: "MEP Engineer", date: "2026-02-04", content: "Approved as noted. Verify condensate drain routing at unit 3 does not conflict with structural framing. Contractor to coordinate with structural during installation." },
  ],
  "4": [
    { id: "c1", user: "Western Plumbing Solutions", role: "Subcontractor", date: "2026-02-01", content: "Kohler commercial fixtures submitted per plumbing fixture schedule. All fixtures WaterSense certified and ADA compliant." },
  ],
  "5": [
    { id: "c1", user: "Apex Electrical Contractors", role: "Subcontractor", date: "2026-01-28", content: "Square D NF panelboards submitted per electrical panel schedule." },
    { id: "c2", user: "James Park, PE", role: "MEP Engineer", date: "2026-02-06", content: "Rejected. Two issues: (1) Panels submitted are 42-circuit, spec requires minimum 54-circuit for future expansion. (2) Type 2 SPD required per spec section 26 43 00 is missing from submittal. Please resubmit with corrected equipment." },
  ],
  "6": [
    { id: "c1", user: "Summit Roofing Co.", role: "Subcontractor", date: "2026-02-03", content: "Carlisle SynTec 60-mil TPO system submitted with all accessories and warranty documentation. Wind uplift calcs included per FM 1-90." },
    { id: "c2", user: "Sarah Kim", role: "PM Coordinator", date: "2026-02-05", content: "Forwarded to Whitfield Architects for review. Target response by Feb 17." },
  ],
  "7": [
    { id: "c1", user: "Clearview Glass Systems", role: "Subcontractor", date: "2026-01-20", content: "Initial curtain wall shop drawings for north elevation submitted. 32 sheets total including unit types, stack joints, and corner conditions." },
    { id: "c2", user: "Sarah Whitfield, AIA", role: "Architect", date: "2026-01-30", content: "Revise and resubmit. Thermal break detail at transom connections does not meet energy code requirements. Structural calculations need to be updated to reflect wind tunnel test data from report dated Jan 15. Please resubmit with PE-stamped engineering." },
  ],
  "8": [
    { id: "c1", user: "Guardian Fire Protection", role: "Subcontractor", date: "2026-01-18", content: "Wet-pipe sprinkler layout submitted for all levels per NFPA 13. Hydraulic calculations demonstrate adequate pressure and flow at the most remote head." },
    { id: "c2", user: "Rachel Torres, PE", role: "MEP Engineer", date: "2026-01-27", content: "Approved. Layout and hydraulic calculations meet NFPA 13 requirements. Fire pump capacity adequate for calculated demand. Proceed with installation." },
  ],
  "9": [
    { id: "c1", user: "Otis Elevator Company", role: "Subcontractor", date: "2026-02-05", content: "Gen3 gearless traction system submitted for 3 elevators. Includes destination dispatch controller, ReGen drive, and cab finish selections per architect specifications." },
  ],
  "10": [
    { id: "c1", user: "Pacific Door & Hardware", role: "Subcontractor", date: "2026-02-06", content: "Complete hardware schedule for 186 openings submitted with all catalog cuts. Electrified hardware coordination diagrams included for 24 access-controlled openings." },
    { id: "c2", user: "Sarah Kim", role: "PM Coordinator", date: "2026-02-10", content: "Forwarded to Whitfield Architects for review against door schedule and fire rating requirements." },
  ],
}

const RELATED_ITEMS_MAP: Record<string, RelatedItem[]> = {
  "1": [
    { type: "Specification", number: "03 30 00", title: "Cast-in-Place Concrete", link: "#" },
    { type: "Drawing", number: "S-101", title: "Foundation Plan", link: "#" },
    { type: "Drawing", number: "S-201", title: "Elevated Slab Framing Plan", link: "#" },
  ],
  "2": [
    { type: "Specification", number: "05 12 00", title: "Structural Steel Framing", link: "#" },
    { type: "RFI", number: "RFI-005", title: "Roof drain location conflict with structural", link: "/rfis/5" },
    { type: "Drawing", number: "S-301", title: "Steel Framing Plan - Level 2", link: "#" },
    { type: "Drawing", number: "S-501", title: "Typical Connection Details", link: "#" },
  ],
  "3": [
    { type: "Specification", number: "23 74 00", title: "Packaged Outdoor HVAC Equipment", link: "#" },
    { type: "Drawing", number: "M-401", title: "Rooftop Equipment Layout", link: "#" },
  ],
  "4": [
    { type: "Specification", number: "22 40 00", title: "Plumbing Fixtures", link: "#" },
    { type: "Drawing", number: "P-201", title: "Plumbing Floor Plan - Typical", link: "#" },
  ],
  "5": [
    { type: "Specification", number: "26 24 16", title: "Panelboards", link: "#" },
    { type: "Specification", number: "26 43 00", title: "Surge Protective Devices", link: "#" },
    { type: "Drawing", number: "E-101", title: "Electrical Riser Diagram", link: "#" },
  ],
  "6": [
    { type: "Specification", number: "07 54 23", title: "Thermoplastic Polyolefin Roofing", link: "#" },
    { type: "Drawing", number: "A-501", title: "Roof Plan and Details", link: "#" },
  ],
  "7": [
    { type: "Specification", number: "08 44 13", title: "Glazed Aluminum Curtain Walls", link: "#" },
    { type: "RFI", number: "RFI-002", title: "Exterior cladding material substitution", link: "/rfis/2" },
    { type: "Drawing", number: "A-301", title: "North Elevation", link: "#" },
    { type: "Drawing", number: "A-601", title: "Curtain Wall Details", link: "#" },
  ],
  "8": [
    { type: "Specification", number: "21 13 13", title: "Wet-Pipe Sprinkler Systems", link: "#" },
    { type: "Drawing", number: "FP-101", title: "Fire Protection Floor Plan - Level 1", link: "#" },
    { type: "Drawing", number: "FP-001", title: "Fire Protection Riser Diagram", link: "#" },
  ],
  "9": [
    { type: "Specification", number: "14 21 00", title: "Electric Traction Elevators", link: "#" },
    { type: "Drawing", number: "A-110", title: "Elevator Lobby Plan", link: "#" },
    { type: "Drawing", number: "A-510", title: "Elevator Shaft Section", link: "#" },
  ],
  "10": [
    { type: "Specification", number: "08 71 00", title: "Door Hardware", link: "#" },
    { type: "RFI", number: "RFI-006", title: "Fire rating for corridor partition walls", link: "/rfis/6" },
    { type: "Drawing", number: "A-801", title: "Door Schedule", link: "#" },
    { type: "Drawing", number: "A-802", title: "Door Frame Types and Details", link: "#" },
  ],
}

function getStepIcon(stepStatus: "complete" | "active" | "pending", index: number) {
  if (stepStatus === "complete") return <Check size={18} />
  if (stepStatus === "active") return <Clock size={18} />
  return <span className="text-xs">{index + 1}</span>
}

function getStepColor(stepStatus: "complete" | "active" | "pending") {
  if (stepStatus === "complete") return "bg-green-500 border-green-500 text-white"
  if (stepStatus === "active") return "bg-blue-500 border-blue-500 text-white"
  return "bg-gray-100 border-gray-300 text-gray-400"
}

function getConnectorColor(currentStatus: string) {
  return currentStatus === "complete" ? "bg-green-500" : "bg-gray-200"
}

export default function SubmittalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [comment, setComment] = React.useState("")
  const id = params.id

  const sub = MOCK_SUBMITTALS[id] || MOCK_SUBMITTALS["2"]
  const lookupId = MOCK_SUBMITTALS[id] ? id : "2"
  const workflow = WORKFLOW_MAP[lookupId] || WORKFLOW_MAP["2"]
  const revisions = REVISIONS_MAP[lookupId] || REVISIONS_MAP["2"]
  const attachments = ATTACHMENTS_MAP[lookupId] || ATTACHMENTS_MAP["2"]
  const comments = COMMENTS_MAP[lookupId] || COMMENTS_MAP["2"]
  const relatedItems = RELATED_ITEMS_MAP[lookupId] || RELATED_ITEMS_MAP["2"]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/submittals">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back to Submittals
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{sub.number}</h1>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                STATUS_STYLES[sub.status]
              )}
            >
              {STATUS_LABELS[sub.status]}
            </span>
          </div>
          <p className="text-lg text-gray-700">{sub.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Spec Section: {sub.specSection} - {sub.specTitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <XCircle size={16} />
            Reject
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw size={16} />
            Revise & Resubmit
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <CheckCircle2 size={16} />
            Approve as Noted
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 size={16} />
            Approve
          </Button>
        </div>
      </div>

      {/* Approval Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Review Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {workflow.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      getStepColor(step.stepStatus)
                    )}
                  >
                    {getStepIcon(step.stepStatus, i)}
                  </div>
                  <p
                    className={cn(
                      "text-xs font-medium text-center",
                      step.stepStatus === "pending"
                        ? "text-gray-400"
                        : "text-gray-700"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-gray-400">{step.date}</p>
                  {step.user && (
                    <p className="text-[10px] text-gray-400 max-w-[100px] text-center truncate">
                      {step.user}
                    </p>
                  )}
                </div>
                {i < workflow.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      getConnectorColor(step.stepStatus)
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {sub.description}
              </p>
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-gray-500">
                  Specification Reference
                </Label>
                <p className="text-sm font-medium mt-1">
                  Section {sub.specSection} - {sub.specTitle}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip size={18} />
                Attachments ({attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {attachments.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {doc.size} &middot; {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{doc.date}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revision History */}
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">
                      Rev
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((r) => (
                    <tr key={r.rev} className="border-b last:border-0">
                      <td className="py-2 font-medium">{r.rev}</td>
                      <td className="py-2 text-gray-500">
                        {new Date(
                          r.date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            r.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : r.status === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : r.status === "Approved as Noted"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r.status === "Revise & Resubmit"
                                    ? "bg-orange-100 text-orange-800"
                                    : r.status === "Under Review"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Review Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={18} />
                Review Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {c.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.user}</p>
                      <p className="text-xs text-gray-400">
                        {c.role} &middot;{" "}
                        {new Date(
                          c.date + "T00:00:00"
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Add a review comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <MessageSquare size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Project", sub.project],
                ["Contract", sub.contractNumber],
                ["Spec Section", `${sub.specSection} - ${sub.specTitle}`],
                ["Submitted By", sub.submittedBy],
                [
                  "Submit Date",
                  new Date(
                    sub.submitDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                ],
                ["Reviewer", sub.reviewer],
                [
                  "Required Date",
                  new Date(
                    sub.requiredDate + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                ],
                ["Ball-in-Court", sub.ballInCourt],
                ["Status", STATUS_LABELS[sub.status]],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Related Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon size={18} />
                Related Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedItems.map((item) => (
                <Link
                  key={`${item.type}-${item.number}`}
                  href={item.link}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        item.type === "RFI"
                          ? "bg-blue-100 text-blue-700"
                          : item.type === "Drawing"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {item.type}
                    </span>
                    <div>
                      <p className="text-xs font-medium">{item.number}</p>
                      <p className="text-[11px] text-gray-500">
                        {item.title}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-gray-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
