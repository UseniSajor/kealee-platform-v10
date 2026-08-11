"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { KealeeNavIcon } from "@/components/brand/KealeeNavIcon";
import { KealeeLogo } from "@/components/KealeeLogo";
import { isAgencyPartnerShellPath } from "@/lib/agency-partner-shell";

// Navigation is organized around the five questions a visitor actually
// arrives with, not internal service-catalog terminology. Every href below
// is a live, verified route (checked against the deployed site, not guessed).
interface NavDropdownItem {
  label: string;
  href: string;
  detail: string;
}

interface NavSection {
  label: string;
  href: string;
  hoverColor: string;
  activeColor: string;
  dropdown?: NavDropdownItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Ideas & Projects",
    href: "/inspiration",
    hoverColor: "hover:text-orange-500",
    activeColor: "text-orange-500 border-b-2 border-orange-500",
  },
  {
    label: "Site Plans & Feasibility",
    href: "/site-plans",
    hoverColor: "hover:text-teal-600",
    activeColor: "text-teal-700 border-b-2 border-teal-600",
    dropdown: [
      {
        label: "Preliminary Site Plan",
        href: "/products/preliminary_site_plan",
        detail: "Parcel, setbacks, buildable area",
      },
      {
        label: "Verified Site Feasibility",
        href: "/products/verified_site_feasibility",
        detail: "Verified zoning + constraints",
      },
      {
        label: "Developer Feasibility",
        href: "/products/developer_feasibility",
        detail: "Yield, parking, massing, NOI",
      },
    ],
  },
  {
    label: "Design My Project",
    href: "/concept",
    hoverColor: "hover:text-orange-500",
    activeColor: "text-orange-500 border-b-2 border-orange-500",
    dropdown: [
      {
        label: "Kitchen Remodel",
        href: "/products/kitchen-remodel",
        detail: "Layout, materials, permit scope",
      },
      {
        label: "Bathroom Remodel",
        href: "/products/bath-remodel",
        detail: "Fixtures, layout, permit scope",
      },
      {
        label: "Exterior Design",
        href: "/concept-engine/exterior",
        detail: "Facade, curb appeal, landscaping",
      },
      {
        label: "Garden & Farming",
        href: "/concept-engine/garden",
        detail: "Raised beds, irrigation, greenhouse",
      },
      {
        label: "Whole Home Renovation",
        href: "/concept-engine/whole-home",
        detail: "Full floor plan redesign",
      },
      {
        label: "Interior Reno & Addition",
        href: "/concept-engine/interior-reno",
        detail: "Additions, ADUs, layout changes",
      },
    ],
  },
  {
    label: "What Will It Cost?",
    href: "/estimate",
    hoverColor: "hover:text-blue-500",
    activeColor: "text-blue-500 border-b-2 border-blue-500",
    dropdown: [
      {
        label: "Detailed Estimate",
        href: "/products/detailed_estimate",
        detail: "Trade-by-trade planning estimate",
      },
      {
        label: "Professionally Reviewed Estimate",
        href: "/products/certified_estimate",
        detail: "Review and sign-off only as identified in the written package",
      },
    ],
  },
  {
    label: "Permits & Plans",
    href: "/permits",
    hoverColor: "hover:text-green-600",
    activeColor: "text-green-600 border-b-2 border-green-600",
    dropdown: [
      {
        label: "Permit Assessment",
        href: "/products/permit_assessment",
        detail: "Requirements + jurisdiction review",
      },
      {
        label: "Permit Coordination",
        href: "/products/permit_coordination",
        detail: "Submission, tracking, response",
      },
      {
        label: "Survey-Based Permit Site Plan",
        href: "/products/permit_site_plan",
        detail: "Sealed, submission-ready",
      },
      {
        label: "Professional Drawings",
        href: "/products/professional_design",
        detail: "Architect-stamped construction docs",
      },
    ],
  },
];

function NavSectionMenu({ section }: { section: NavSection }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active =
    pathname === section.href || pathname?.startsWith(section.href + "/");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!section.dropdown) {
    return (
      <Link
        href={section.href}
        className={`whitespace-nowrap px-3 py-1 font-medium text-sm transition-colors ${
          active
            ? section.activeColor
            : `text-slate-600 ${section.hoverColor} hover:underline`
        }`}
      >
        {section.label}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`flex items-center gap-1 whitespace-nowrap px-3 py-1 font-medium text-sm transition-colors ${
          active ? section.activeColor : `text-slate-600 ${section.hoverColor}`
        }`}
      >
        {section.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50">
          <ul className="space-y-0.5">
            {section.dropdown.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <span className="font-semibold block">{item.label}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    {item.detail}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <Link
              href={section.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavAccordion({
  section,
  onClose,
}: {
  section: NavSection;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!section.dropdown) {
    return (
      <Link
        href={section.href}
        onClick={onClose}
        className="block rounded-lg px-3 py-2.5 font-medium text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
      >
        {section.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        {section.label}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-2">
          {section.dropdown.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={section.href}
            onClick={onClose}
            className="block rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isAgencyPartnerShellPath(pathname)) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#10233e]/10 bg-white/95 shadow-[0_8px_30px_rgba(16,35,62,.05)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">
          {/* LEFT: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex shrink-0 items-center">
              <KealeeLogo />
              <span className="sr-only">Kealee Construction — home</span>
            </Link>

            {/* Build button — desktop left section */}
            <Link
              href="/build"
              className="hidden items-center rounded-xl bg-[#e8f2fa] px-4 py-2 text-sm font-bold text-[#147d92] transition hover:bg-[#d7eaf5] lg:flex"
            >
              Build
            </Link>

            {/* Desktop tabs — the five questions a visitor arrives with */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_SECTIONS.map((section) => (
                <NavSectionMenu key={section.href} section={section} />
              ))}
            </div>
          </div>

          {/* RIGHT: Divider + Account */}
          <div className="flex items-center gap-4">
            {/* Divider (desktop only) */}
            <div className="hidden lg:block w-px h-6 bg-gray-300" />

            <Link
              href="/signin"
              className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 font-medium transition whitespace-nowrap"
            >
              Sign in
            </Link>

            <Link
              href="/products/home-project-readiness-review"
              className="hidden items-center rounded-xl bg-[#f36b2b] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#df581f] hover:shadow-md sm:flex"
            >
              Get Project Clarity
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <KealeeNavIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {NAV_SECTIONS.map((section) => (
              <MobileNavAccordion
                key={section.href}
                section={section}
                onClose={() => setMobileMenuOpen(false)}
              />
            ))}

            {/* Account */}
            <div className="border-t border-slate-200 mt-3 pt-3 space-y-2">
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Sign in
              </Link>
              <Link
                href="/build"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 block w-full rounded-xl bg-[#2563EB] py-3 text-center text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                Build
              </Link>
              <Link
                href="/products/home-project-readiness-review"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full rounded-xl bg-[#f36b2b] py-3.5 text-center text-base font-extrabold text-white transition hover:bg-[#df581f]"
              >
                Start Your Project
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
