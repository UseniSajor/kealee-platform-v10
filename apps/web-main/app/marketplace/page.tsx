'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search, X, ArrowRight, Home, Wrench, Plus, LayoutGrid,
  Building2, Store, Flower2, Shield, Calculator, Users, Zap, PenTool, PlayCircle, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useVideoModal } from '@/context/video-modal-context'
import { MarketplaceTopbar } from '@/components/marketplace/MarketplaceTopbar'
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav'
import { MarketplaceFilterBar, type Filters } from '@/components/marketplace/MarketplaceFilterBar'
import { MarketplaceCard, type ContractorCardData } from '@/components/marketplace/MarketplaceCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { MARKETPLACE_DIRECTORY_SEARCH_PLACEHOLDER } from '@kealee/shared'

// ─── Media library ──────────────────────────────────────────────────────────────
// Verified local Kealee AI-render photos (git-tracked under public/media/service-photos).
const PHOTO = {
  kitchen:   '/media/service-photos/product-kitchen.jpg',
  bathroom:  '/media/service-photos/product-bathroom.jpg',
  wholeHouse:'/media/service-photos/product-whole-house.jpg',
  interior:  '/media/service-photos/product-interior.jpg',
  addition:  '/media/service-photos/product-addition.jpg',
  facade:    '/media/service-photos/product-facade.jpg',
  deck:      '/media/service-photos/product-deck.jpg',
  garden:    '/media/service-photos/product-garden.jpg',
  design:    '/media/service-photos/product-design-services.jpg',
  homeBuild: '/media/service-photos/home-build.jpg',
  homeDesign:'/media/service-photos/home-design.jpg',
  homeEstimate:'/media/service-photos/home-estimate.jpg',
  homePermits:'/media/service-photos/home-permits.jpg',
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = {
  slug: string
  label: string
  priceRange: string
  typical: string
  popular?: boolean
  href: string
  photoUrl?: string
  videoUrl?: string
  image: string
  scope: string
}

type ServiceCategory = {
  id: string
  label: string
  color: string
  bgLight: string
  Icon: React.ElementType
  services: ServiceItem[]
  trades: string[]
  fromPrice: string
  bannerImage: string
  blurb: string
}

// ─── Service Category Data ─────────────────────────────────────────────────────

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'interior',
    label: 'Interior Renovations',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    Icon: Home,
    fromPrice: '$10K',
    bannerImage: PHOTO.homeDesign,
    blurb: 'Gut to finish — cabinetry, tile, MEP rough-in, and finishes by licensed crews.',
    services: [
      { slug: 'kitchen_remodel',   label: 'Kitchen Remodel',       priceRange: '$25K–$80K',  typical: '8–16 weeks',  popular: true, href: '/concept?service=kitchen',      image: PHOTO.kitchen,    photoUrl: PHOTO.kitchen,    videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Demo, custom cabinetry, quartz/stone counters, backsplash tile, plumbing & electrical rough-in, lighting, appliances.' },
      { slug: 'bathroom_remodel',  label: 'Bathroom Remodel',      priceRange: '$10K–$40K',  typical: '4–8 weeks',                  href: '/concept?service=bathroom',     image: PHOTO.bathroom,   photoUrl: PHOTO.bathroom,   videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Demo, waterproofing, shower pan & glass, large-format tile, vanity set, fixtures, ventilation & lighting.' },
      { slug: 'whole_home_reno',   label: 'Whole-Home Renovation', priceRange: '$75K–$250K', typical: '16–36 weeks',               href: '/concept?service=whole-house',  image: PHOTO.wholeHouse, photoUrl: PHOTO.wholeHouse, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Full interior re-framing, MEP replacement, insulation, drywall, flooring, kitchen & baths, paint, trim.' },
      { slug: 'interior_painting', label: 'Interior Painting',     priceRange: '$3K–$15K',   typical: '1–2 weeks',                  href: '/concept',                      image: PHOTO.interior,   photoUrl: PHOTO.interior,   videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Surface prep, patching, priming, two-coat finish on walls/ceilings/trim, color consultation.' },
      { slug: 'flooring',          label: 'Flooring',              priceRange: '$8K–$30K',   typical: '1–3 weeks',                  href: '/concept',                      image: PHOTO.interior,   photoUrl: PHOTO.interior,   videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Tear-out, subfloor leveling, hardwood/LVP/tile install, transitions, baseboard & quarter-round.' },
    ],
    trades: ['General Contractor', 'Flooring', 'Painting', 'Drywall', 'Electrician'],
  },
  {
    id: 'exterior',
    label: 'Exterior Upgrades',
    color: '#E8793A',
    bgLight: '#FFF7ED',
    Icon: Wrench,
    fromPrice: '$8K',
    bannerImage: PHOTO.facade,
    blurb: 'Weather-tight envelope work — roofing, siding, openings, and outdoor living.',
    services: [
      { slug: 'roofing',       label: 'Roofing Replacement', priceRange: '$8K–$30K',  typical: '1–2 weeks',   popular: true, href: '/concept',                 image: PHOTO.facade, photoUrl: PHOTO.facade, videoUrl: '/media/service-videos/home-permits-video.mp4', scope: 'Tear-off, deck inspection, ice & water shield, underlayment, architectural shingles, flashing, ridge vent.' },
      { slug: 'siding',        label: 'Siding & Cladding',   priceRange: '$10K–$35K', typical: '2–4 weeks',                  href: '/concept?service=facade',  image: PHOTO.facade, photoUrl: PHOTO.facade, videoUrl: '/media/service-videos/home-permits-video.mp4', scope: 'Old siding removal, house wrap, fiber-cement or vinyl install, trim, caulk & paint, gutter coordination.' },
      { slug: 'windows_doors', label: 'Windows & Doors',     priceRange: '$8K–$25K',  typical: '1–2 weeks',                  href: '/concept',                 image: PHOTO.facade, photoUrl: PHOTO.facade, videoUrl: '/media/service-videos/home-permits-video.mp4', scope: 'Tear-out, flashing & sealing, energy-rated window/door units, interior/exterior trim, weatherproofing.' },
      { slug: 'deck_patio',    label: 'Deck & Patio',        priceRange: '$15K–$50K', typical: '4–8 weeks',                  href: '/concept?service=deck',    image: PHOTO.deck,   photoUrl: PHOTO.deck,   videoUrl: '/media/service-videos/home-permits-video.mp4', scope: 'Footings & framing, composite/wood decking, railings, stairs, paver or stamped-concrete patio, lighting.' },
    ],
    trades: ['General Contractor', 'Roofing', 'Painting', 'Masonry', 'Landscaping'],
  },
  {
    id: 'additions',
    label: 'Additions',
    color: '#2ABFBF',
    bgLight: '#F0FDFD',
    Icon: Plus,
    fromPrice: '$30K',
    bannerImage: PHOTO.addition,
    blurb: 'New square footage — foundation, framing, envelope, and full interior build-out.',
    services: [
      { slug: 'room_addition',   label: 'Room Addition',      priceRange: '$50K–$200K', typical: '12–20 weeks', popular: true, href: '/concept?service=addition', image: PHOTO.addition, photoUrl: PHOTO.addition, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Foundation/footings, framing tie-in, roof integration, MEP extension, insulation, drywall, finishes.' },
      { slug: 'adu_inlaw',       label: 'ADU / In-law Suite', priceRange: '$80K–$250K', typical: '16–28 weeks',               href: '/concept?service=addition', image: PHOTO.addition, photoUrl: PHOTO.addition, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Zoning/setback review, foundation, full framing, kitchen & bath, separate utilities, egress, finishes.' },
      { slug: 'garage_addition', label: 'Garage Addition',    priceRange: '$30K–$80K',  typical: '8–12 weeks',                href: '/concept?service=addition', image: PHOTO.addition, photoUrl: PHOTO.addition, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Slab, framing, roof, garage door, electrical, optional heating/loft, exterior match to home.' },
    ],
    trades: ['General Contractor'],
  },
  {
    id: 'whole-house',
    label: 'Whole House',
    color: '#3B82F6',
    bgLight: '#EFF6FF',
    Icon: LayoutGrid,
    fromPrice: '$40K',
    bannerImage: PHOTO.wholeHouse,
    blurb: 'Down-to-the-studs transformation managed milestone-by-milestone.',
    services: [
      { slug: 'full_gut_rehab', label: 'Full Gut Rehab',      priceRange: '$120K–$400K', typical: '20–40 weeks', popular: true, href: '/concept?service=whole-house', image: PHOTO.wholeHouse, photoUrl: PHOTO.wholeHouse, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Strip to studs, structural repairs, all-new MEP, insulation, drywall, kitchen/baths, flooring, paint.' },
      { slug: 'cosmetic_reno',  label: 'Cosmetic Renovation', priceRange: '$40K–$120K',  typical: '8–16 weeks',                href: '/concept?service=interior',    image: PHOTO.interior,   photoUrl: PHOTO.interior,   videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Surface refresh — paint, flooring, fixtures, cabinet fronts, lighting, hardware, minor layout tweaks.' },
    ],
    trades: ['General Contractor'],
  },
  {
    id: 'new-construction',
    label: 'New Construction',
    color: '#1A2B4A',
    bgLight: '#F0F4FF',
    Icon: Building2,
    fromPrice: '$120K',
    bannerImage: PHOTO.homeBuild,
    blurb: 'Ground-up builds — site work and foundation through certificate of occupancy.',
    services: [
      { slug: 'single_family', label: 'Single-Family Home', priceRange: '$300K–$800K', typical: '10–18 months', popular: true, href: '/new-construction/intake', image: PHOTO.homeBuild, photoUrl: PHOTO.homeBuild, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Site work, foundation, framing, full envelope, MEP, insulation, drywall, finishes, landscaping.' },
      { slug: 'adu_cottage',   label: 'ADU / Cottage',      priceRange: '$120K–$350K', typical: '6–12 months',                href: '/new-construction/intake', image: PHOTO.addition,  photoUrl: PHOTO.addition,  videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Permitting, slab/foundation, framing, compact kitchen & bath, utilities, finishes, exterior.' },
      { slug: 'townhome_build', label: 'Townhome Build',    priceRange: '$250K–$600K', typical: '12–20 months',               href: '/new-construction/intake', image: PHOTO.homeBuild, photoUrl: PHOTO.homeBuild, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Party-wall framing, fire separation, multi-unit MEP, stairs, full interior finishes per unit.' },
    ],
    trades: ['General Contractor', 'Excavation', 'Steel / Structural'],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    color: '#64748B',
    bgLight: '#F8FAFC',
    Icon: Store,
    fromPrice: '$50K',
    bannerImage: PHOTO.homeBuild,
    blurb: 'Tenant fit-outs and build-outs to code, on schedule, minimal downtime.',
    services: [
      { slug: 'office_fitout',   label: 'Office Fit-Out',        priceRange: '$50K–$300K', typical: '8–16 weeks',  popular: true, href: '/contact', image: PHOTO.interior,  photoUrl: PHOTO.interior,  videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Demising walls, ceilings, HVAC zoning, electrical & data, glass fronts, flooring, ADA compliance.' },
      { slug: 'retail_buildout', label: 'Retail Build-Out',      priceRange: '$60K–$250K', typical: '8–14 weeks',                href: '/contact', image: PHOTO.interior,  photoUrl: PHOTO.interior,  videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Storefront, finishes, lighting design, POS/data, restrooms, signage, code & accessibility.' },
      { slug: 'mixed_use',       label: 'Mixed-Use Development',  priceRange: '$1M–$5M+',  typical: '12–24 months',               href: '/contact', image: PHOTO.homeBuild, photoUrl: PHOTO.homeBuild, videoUrl: '/media/service-videos/home-build-video.mp4', scope: 'Structural shell, multi-tenant MEP, parking, residential + retail finishes, life-safety systems.' },
    ],
    trades: ['General Contractor', 'HVAC', 'Roofing', 'Electrician', 'Plumber'],
  },
  {
    id: 'landscaping',
    label: 'Landscaping',
    color: '#38A169',
    bgLight: '#F0FFF4',
    Icon: Flower2,
    fromPrice: '$5K',
    bannerImage: PHOTO.garden,
    blurb: 'Outdoor living — grading, hardscape, planting, and irrigation.',
    services: [
      { slug: 'hardscape_patio', label: 'Hardscape & Patio',     priceRange: '$15K–$60K', typical: '2–4 weeks',  popular: true, href: '/concept?service=garden', image: PHOTO.garden, photoUrl: PHOTO.garden, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Excavation & base prep, paver/stone patio, retaining walls, steps, edging, drainage, lighting.' },
      { slug: 'full_landscape',  label: 'Full Landscape Design', priceRange: '$20K–$80K', typical: '4–8 weeks',                 href: '/concept?service=garden', image: PHOTO.garden, photoUrl: PHOTO.garden, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Grading, planting beds, trees & shrubs, sod/lawn, hardscape integration, lighting, irrigation.' },
      { slug: 'irrigation',      label: 'Irrigation System',     priceRange: '$5K–$20K',  typical: '1–2 weeks',                 href: '/concept?service=garden', image: PHOTO.garden, photoUrl: PHOTO.garden, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Zone design, trenching, sprinkler/drip lines, smart controller, backflow, seasonal programming.' },
    ],
    trades: ['Landscaping', 'Masonry', 'Irrigation'],
  },
  {
    id: 'architects',
    label: 'Architects & Designers',
    color: '#6B46C1',
    bgLight: '#FAF5FF',
    Icon: PenTool,
    fromPrice: 'From $4,999',
    bannerImage: PHOTO.homePermits,
    blurb: 'Stamped, permit-ready documentation from licensed professionals.',
    trades: ['Architect', 'Licensed Designer', 'PE Engineer'],
    services: [
      { slug: 'professional-drawings', label: 'Permit-Ready Drawings',        priceRange: 'From $4,999', typical: '7–14 days', popular: true, href: '/intake/professional_drawings', image: PHOTO.design, photoUrl: PHOTO.design, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Full construction document set — floor plans, elevations, sections, schedules, code notes for permit.' },
      { slug: 'pe-stamp',              label: 'Structural / PE Stamp',        priceRange: '$799–$1,499', typical: '5–10 days',               href: '/intake/professional_drawings', image: PHOTO.design, photoUrl: PHOTO.design, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Structural calcs, framing/beam sizing, foundation review, licensed PE stamp for jurisdiction.' },
      { slug: 'interior-design',       label: 'Interior Design Consultation', priceRange: '$395–$695',   typical: '48–72 hrs',               href: '/intake/kitchen_remodel',       image: PHOTO.design, photoUrl: PHOTO.design, videoUrl: '/media/service-videos/home-design-video.mp4', scope: 'Space planning, finish & material palette, fixture/furniture selections, mood boards, layout options.' },
    ],
  },
]

// ─── "See it built" video band ─────────────────────────────────────────────────
const BUILD_VIDEOS = [
  { tag: 'Design',   title: 'AI Design + Validation',  description: 'See how upload-to-concept works: AI generates layouts, then staff validate zoning, structure, and cost band.', thumb: 'https://rkreqfpkxavqpsqexbfs.supabase.co/storage/v1/object/public/marketing-media/home/design.jpg',   video: '/media/service-videos/home-design-video.mp4' },
  { tag: 'Permits',  title: 'Permits We File & Track', description: 'We prepare the drawing package, submit to the agency, and respond to reviewer comments for you.',         thumb: 'https://rkreqfpkxavqpsqexbfs.supabase.co/storage/v1/object/public/marketing-media/home/permits.jpg', video: '/media/service-videos/home-permits-video.mp4' },
  { tag: 'Estimate', title: 'Documented Cost Planning', description: 'Line-item planning estimates with regional references, scope assumptions, and optional professional review.', thumb: 'https://rkreqfpkxavqpsqexbfs.supabase.co/storage/v1/object/public/marketing-media/home/estimate.jpg', video: '/media/service-videos/home-estimate-video.mp4' },
  { tag: 'Build',    title: 'From Foundation to Final', description: 'Every milestone, payment, document, and site photo tracked end-to-end in your project workspace.',       thumb: 'https://rkreqfpkxavqpsqexbfs.supabase.co/storage/v1/object/public/marketing-media/home/build.jpg',    video: '/media/service-videos/home-build-video.mp4' },
]

function SeeItBuiltBand() {
  const { openModal } = useVideoModal()
  return (
    <div className="bg-[#0f1c30]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Watch the process</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">See it built — design to done</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">Real construction footage of how a Kealee project moves from concept through permits, estimate, and final build.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUILD_VIDEOS.map((v) => (
            <button
              key={v.tag}
              onClick={() => openModal({ tag: v.tag, title: v.title, description: v.description, thumbUrl: v.thumb, videoUrl: v.video })}
              className="group relative flex flex-col overflow-hidden rounded-2xl text-left ring-1 ring-white/10 transition-all hover:ring-white/30 hover:-translate-y-0.5"
            >
              <div className="relative h-40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumb} alt={v.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/40 transition-transform group-hover:scale-110">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <span className="absolute top-3 left-3 rounded-full bg-[#E8724B] px-2.5 py-0.5 text-[11px] font-bold text-white">{v.tag}</span>
              </div>
              <div className="bg-[#152540] p-4 flex-1">
                <h3 className="text-sm font-bold text-white leading-snug mb-1">{v.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{v.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Cross-Category Services ───────────────────────────────────────────────────

const CROSS_SERVICES = [
  { label: 'Design Concept',      price: 'From $149', href: '/concept',                  Icon: Zap,        desc: 'AI renders, materials & layout for your project' },
  { label: 'Contractor Match',    price: '$199',       href: '/intake/contractor_match',  Icon: Users,      desc: 'Request matches from available marketplace professionals' },
  { label: 'Project Estimate',    price: 'From $595',  href: '/estimate',                 Icon: Calculator, desc: 'Detailed cost breakdown for contractor bidding' },
]

// ─── Combo Packages ────────────────────────────────────────────────────────────

const COMBO_PACKAGES = [
  {
    name: 'Design + Build',
    desc: 'Concept design through full construction management',
    price: 'Custom Quote',
    href: '/new-construction/intake',
    color: '#1A2B4A',
    image: PHOTO.homeDesign,
    scope: ['AI concept + stamped drawings', 'Permitting & agency coordination', 'Vetted GC + milestone management'],
  },
  {
    name: 'Kitchen + Bath Bundle',
    desc: 'Combined kitchen and primary bath renovation',
    price: 'From $45K',
    href: '/concept',
    color: '#7C3AED',
    image: PHOTO.kitchen,
    scope: ['Two-room concept & material palette', 'Coordinated plumbing/electrical', 'Single crew, shared timeline'],
  },
  {
    name: 'Full Gut Rehab',
    desc: 'Complete interior gut rehabilitation, all trades',
    price: 'From $85K',
    href: '/contact',
    color: '#3B82F6',
    image: PHOTO.wholeHouse,
    scope: ['Strip-to-studs + structural repair', 'All-new MEP & insulation', 'Full finishes top to bottom'],
  },
  {
    name: 'ADU Complete',
    desc: 'ADU design, permits, and build management end-to-end',
    price: 'From $120K',
    href: '/contact',
    color: '#2ABFBF',
    image: PHOTO.addition,
    scope: ['Zoning & setback feasibility', 'Foundation-to-finish build', 'Separate utilities & egress'],
  },
  {
    name: 'Exterior Refresh',
    desc: 'Roof, siding, windows, and deck all-in-one package',
    price: 'From $35K',
    href: '/concept',
    color: '#E8793A',
    image: PHOTO.facade,
    scope: ['Roof + siding replacement', 'Energy-rated windows & doors', 'Deck or patio add-on'],
  },
]

// ─── Contractors ───────────────────────────────────────────────────────────────

const PROFILE_DEMOS_DO_NOT_PUBLISH: ContractorCardData[] = [
  {
    id: 'c1',
    name: 'Carlos Rivera',
    company: 'Summit Build Group',
    trade: 'General Contractor',
    category: 'residential',
    rating: 4.9,
    reviewCount: 87,
    location: 'Bethesda, MD',
    yearsExperience: 18,
    projectsCompleted: 214,
    isVerified: true,
    isInsured: true,
    responseTime: '< 2hr',
    priceRange: 'mid',
    specialties: ['Kitchen', 'Additions', 'New Construction'],
    bio: 'Specializing in high-end residential renovations and additions across Montgomery County. Known for transparent communication and on-time delivery.',
    initials: 'CR',
    accentColor: '#1A2B4A',
  },
  {
    id: 'c2',
    name: 'Dana Kim',
    company: 'Precision Electric Co',
    trade: 'Electrician',
    category: 'residential',
    rating: 4.8,
    reviewCount: 63,
    location: 'Silver Spring, MD',
    yearsExperience: 12,
    projectsCompleted: 155,
    isVerified: true,
    isInsured: true,
    responseTime: '< 4hr',
    priceRange: 'mid',
    specialties: ['Panel Upgrades', 'EV Charging', 'Remodels'],
    bio: 'Master electrician with expertise in residential panel upgrades, EV charger installation, and whole-home rewires.',
    initials: 'DK',
    accentColor: '#E8793A',
  },
  {
    id: 'c3',
    name: 'Marcus Thompson',
    company: 'Capitol Plumbing Solutions',
    trade: 'Plumber',
    category: 'commercial',
    rating: 4.7,
    reviewCount: 42,
    location: 'Austin, TX',
    yearsExperience: 9,
    projectsCompleted: 98,
    isVerified: true,
    isInsured: true,
    responseTime: '< 6hr',
    priceRange: 'budget',
    specialties: ['Commercial Fit-Out', 'Rough Plumbing', 'Water Heaters'],
    bio: 'Commercial and residential plumber focused on new construction rough-in, tenant fit-outs, and emergency service.',
    initials: 'MT',
    accentColor: '#2ABFBF',
  },
  {
    id: 'c4',
    name: 'Elena Santos',
    company: 'Prestige Interiors',
    trade: 'General Contractor',
    category: 'multifamily',
    rating: 5.0,
    reviewCount: 31,
    location: 'Dallas, TX',
    yearsExperience: 14,
    projectsCompleted: 67,
    isVerified: true,
    isInsured: true,
    responseTime: '< 1hr',
    priceRange: 'premium',
    specialties: ['Luxury Residential', 'Multifamily', 'Historic Renovation'],
    bio: 'Award-winning GC specializing in luxury renovations and multifamily gut rehabs across major metro areas.',
    initials: 'ES',
    accentColor: '#38A169',
  },
  {
    id: 'c5',
    name: 'James Wu',
    company: 'ComfortPro HVAC',
    trade: 'HVAC',
    category: 'residential',
    rating: 4.6,
    reviewCount: 58,
    location: 'Houston, TX',
    yearsExperience: 11,
    projectsCompleted: 189,
    isVerified: true,
    isInsured: false,
    responseTime: '< 8hr',
    priceRange: 'mid',
    specialties: ['Mini-Splits', 'Heat Pumps', 'Commercial HVAC'],
    bio: 'NATE-certified HVAC technician specializing in heat pump and mini-split installations for new construction and retrofits.',
    initials: 'JW',
    accentColor: '#1A2B4A',
  },
  {
    id: 'c6',
    name: 'Priya Patel',
    company: 'Patel Framing Corp',
    trade: 'Framing',
    category: 'multifamily',
    rating: 4.8,
    reviewCount: 24,
    location: 'San Antonio, TX',
    yearsExperience: 16,
    projectsCompleted: 78,
    isVerified: true,
    isInsured: true,
    responseTime: '< 12hr',
    priceRange: 'mid',
    specialties: ['Wood Framing', 'Steel Stud', 'Multifamily'],
    bio: 'Framing specialist with deep experience in multifamily wood-frame construction across major metros.',
    initials: 'PP',
    accentColor: '#E8793A',
  },
  {
    id: 'c7',
    name: 'Sofia Reyes',
    company: 'Reyes Architecture Studio',
    trade: 'Licensed Architect',
    category: 'residential',
    rating: 4.9,
    reviewCount: 46,
    location: 'Bethesda, MD',
    yearsExperience: 14,
    projectsCompleted: 112,
    isVerified: true,
    isInsured: true,
    responseTime: '< 4hr',
    priceRange: 'mid',
    specialties: ['Permit-Ready Drawings', 'ADUs', 'Additions'],
    bio: 'Licensed architect specializing in permit-ready drawing sets for residential renovations, ADUs, and additions across the DMV region.',
    initials: 'SR',
    accentColor: '#6B46C1',
  },
  {
    id: 'c8',
    name: 'David Okafor',
    company: 'Okafor PE Consulting',
    trade: 'Licensed Architect',
    category: 'residential',
    rating: 4.8,
    reviewCount: 31,
    location: 'Washington, DC',
    yearsExperience: 19,
    projectsCompleted: 89,
    isVerified: true,
    isInsured: true,
    responseTime: '< 6hr',
    priceRange: 'premium',
    specialties: ['PE Stamp', 'Structural Drawings', 'Whole-Home Renovation'],
    bio: 'Structural PE with deep residential and light commercial experience. Provides PE stamps, structural drawings, and code compliance review for DMV permits.',
    initials: 'DO',
    accentColor: '#6B46C1',
  },
]

// Public profiles must come from verified production records. Demo people,
// reviews, credentials, and project counts are never customer-facing evidence.
const CONTRACTORS: ContractorCardData[] = []

const DEFAULT_FILTERS: Filters = {
  minRating: 0,
  priceRange: '',
  verifiedOnly: false,
  insuredOnly: false,
  sortBy: 'rating',
}

// ─── Service Card ──────────────────────────────────────────────────────────────

function ServiceCard({ service, color }: { service: ServiceItem; color: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => console.log('Video play interrupted:', err))
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  return (
    <Link
      href={service.href}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ border: `1px solid ${color}25` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Media / Image header */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        <Image
          src={service.image}
          alt={service.label}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {service.videoUrl && (
          <video
            ref={videoRef}
            src={service.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
        
        {service.popular && (
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            Popular
          </span>
        )}
        
        <h3 className="absolute bottom-3 left-3 right-3 text-base font-bold text-white leading-tight drop-shadow">
          {service.label}
        </h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
          What&apos;s involved
        </p>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">{service.scope}</p>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
              {service.priceRange}
            </span>
            <p className="text-[11px] text-gray-400">Typical build: {service.typical}</p>
          </div>
          <span
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity group-hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            Get Started <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Category Section ──────────────────────────────────────────────────────────

function CategorySection({
  cat,
  activeTrade,
  onTradeClick,
}: {
  cat: ServiceCategory
  activeTrade: string
  onTradeClick: (trade: string) => void
}) {
  return (
    <section id={cat.id} className="scroll-mt-16 rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
      {/* ── Cinematic Category Header ───────────────────────────────────── */}
      <div className="relative h-36 sm:h-40 overflow-hidden">
        <Image
          src={cat.bannerImage}
          alt={cat.label}
          fill
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${cat.color}E6 0%, ${cat.color}99 45%, ${cat.color}33 100%)` }}
        />
        <div className="absolute inset-0 flex items-center gap-4 px-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30"
          >
            <cat.Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-white leading-tight drop-shadow">{cat.label}</h2>
            <p className="text-sm text-white/85 mt-0.5 max-w-xl drop-shadow-sm">{cat.blurb}</p>
            <p className="text-xs font-semibold text-white/75 mt-1">
              {cat.services.length} project type{cat.services.length > 1 ? 's' : ''} · from {cat.fromPrice}
            </p>
          </div>
        </div>
      </div>

      {/* ── Service Cards ────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-5">
          {cat.services.map(s => (
            <ServiceCard key={s.slug} service={s} color={cat.color} />
          ))}
        </div>

        {/* ── Contractor Trade Chips ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 mr-1">Find a contractor:</span>
          {cat.trades.map(trade => (
            <button
              key={trade}
              onClick={() => onTradeClick(trade)}
              className="rounded-full border px-3.5 py-1 text-xs font-medium transition-all"
              style={{
                borderColor: activeTrade === trade ? cat.color : '#E5E7EB',
                backgroundColor: activeTrade === trade ? cat.color : '#FFFFFF',
                color: activeTrade === trade ? '#FFFFFF' : '#6B7280',
              }}
            >
              {trade}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState('')
  const [activeTrade, setActiveTrade] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [activeCatId, setActiveCatId] = useState('interior')
  const [stickyVisible, setStickyVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (heroRef.current) obs.observe(heroRef.current)
    return () => obs.disconnect()
  }, [])

  function scrollToCategory(id: string) {
    setActiveCatId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleTradeClick(trade: string) {
    setActiveTrade(prev => (prev === trade ? '' : trade))
    document.getElementById('contractor-directory')?.scrollIntoView({ behavior: 'smooth' })
  }

  const filtered = useMemo(() => {
    let results = [...CONTRACTORS]
    if (activeTrade) results = results.filter(c => c.trade === activeTrade)
    if (activeCategory) results = results.filter(c => c.category === activeCategory)
    if (search) {
      const q = search.toLowerCase()
      results = results.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.trade.toLowerCase().includes(q) ||
          c.specialties.some(s => s.toLowerCase().includes(q))
      )
    }
    if (filters.minRating > 0) results = results.filter(c => c.rating >= filters.minRating)
    if (filters.priceRange) results = results.filter(c => c.priceRange === filters.priceRange)
    if (filters.verifiedOnly) results = results.filter(c => c.isVerified)
    if (filters.insuredOnly) results = results.filter(c => c.isInsured)
    results.sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating
      if (filters.sortBy === 'reviews') return b.reviewCount - a.reviewCount
      if (filters.sortBy === 'experience') return b.yearsExperience - a.yearsExperience
      return 0
    })
    return results
  }, [activeTrade, activeCategory, search, filters])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <MarketplaceTopbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-6 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: '#1A2B4A' }}>
            What are you building?
          </h1>
          <p className="mt-2 text-sm text-gray-500 mb-6">
            Browse project types, request contractor matches, or join the professional marketplace.
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={MARKETPLACE_DIRECTORY_SEARCH_PLACEHOLDER}
              className="w-full rounded-2xl border border-gray-200 py-3.5 pl-12 pr-12 text-sm shadow-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: activeCatId === cat.id ? cat.color : '#E5E7EB',
                  backgroundColor: activeCatId === cat.id ? cat.color : '#FFFFFF',
                  color: activeCatId === cat.id ? '#FFFFFF' : '#374151',
                }}
              >
                <cat.Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-gray-100 bg-gray-50 py-3">
          <div className="mx-auto max-w-3xl px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-500" />
              Credential status shown on profiles
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Payment terms shown before purchase
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-orange-500" />
              AI-powered
            </span>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY NAV ───────────────────────────────────────────── */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 transition-transform duration-200 ${
          stickyVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeCatId === cat.id ? cat.color : 'transparent',
                  color: activeCatId === cat.id ? '#FFFFFF' : '#6B7280',
                }}
              >
                <cat.Icon className="h-3 w-3" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORY SECTIONS ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {SERVICE_CATEGORIES.map(cat => (
          <CategorySection
            key={cat.id}
            cat={cat}
            activeTrade={activeTrade}
            onTradeClick={handleTradeClick}
          />
        ))}
      </div>

      {/* ── SEE IT BUILT — VIDEO MARKETING BAND ──────────────────────────── */}
      <SeeItBuiltBand />

      {/* ── CROSS-CATEGORY STRIP ──────────────────────────────────────────── */}
      <div className="bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Also Available</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {CROSS_SERVICES.map(s => (
              <Link
                key={s.label}
                href={s.href}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-sm hover:border-[#2ABFBF]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  <s.Icon className="h-5 w-5 text-gray-500 group-hover:text-[#2ABFBF] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500 truncate">{s.desc}</p>
                </div>
                <span className="text-sm font-bold text-[#1A2B4A] shrink-0">{s.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMBO PACKAGES ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-2 sm:px-6 lg:px-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Featured Packages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COMBO_PACKAGES.map(pkg => (
            <Link
              key={pkg.name}
              href={pkg.href}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ border: `1px solid ${pkg.color}30` }}
            >
              <div className="relative h-28 overflow-hidden">
                <Image src={pkg.image} alt={pkg.name} fill sizes="(max-width: 1024px) 50vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${pkg.color}E6 100%)` }} />
                <p className="absolute bottom-2 left-3 right-3 text-sm font-bold text-white leading-tight drop-shadow">{pkg.name}</p>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{pkg.desc}</p>
                <ul className="space-y-1.5 mb-4">
                  {pkg.scope.map(s => (
                    <li key={s} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" style={{ color: pkg.color }} />
                      <span className="leading-snug">{s}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{pkg.price}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: pkg.color }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CONTRACTOR DIRECTORY ──────────────────────────────────────────── */}
      <div id="contractor-directory" className="mx-auto max-w-7xl px-4 pt-10 pb-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contractor Directory</h2>
          {activeTrade && (
            <button
              onClick={() => setActiveTrade('')}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {activeTrade} <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>
      </div>

      <MarketplaceNav
        activeTrade={activeTrade}
        activeCategory={activeCategory}
        onTradeChange={(t) => { setActiveTrade(t) }}
        onCategoryChange={setActiveCategory}
      />

      <MarketplaceFilterBar
        filters={filters}
        resultCount={filtered.length}
        onFiltersChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={activeTrade ? `No published ${activeTrade} profiles yet` : 'Marketplace directory is opening soon'}
            description={
              activeTrade
                ? 'Be the first to join our contractor network for this trade.'
                : 'Only real profiles with confirmed business information will be published. Contractors and construction service firms can apply now.'
            }
            action={
              activeTrade
                ? { label: 'Join Our Network', href: '/contractor/register' }
                : { label: 'Apply to Join', href: '/contractor/register' }
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(contractor => (
              <MarketplaceCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
