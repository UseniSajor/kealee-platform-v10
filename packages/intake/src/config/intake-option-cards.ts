import type { ProjectPath } from "./project-path-config";

export interface IntakeOptionCard {
  path: ProjectPath;
  title: string;
  subtitle: string;
  cta: string;
}

export const INTAKE_OPTION_CARDS: IntakeOptionCard[] = [
  {
    path: "exterior_concept",
    title: "Exterior Concept",
    subtitle: "Facade, curb appeal, landscape, and exterior design direction.",
    cta: "Start Exterior Intake",
  },
  {
    path: "interior_renovation",
    title: "Interior Renovation",
    subtitle: "Room-by-room renovation planning for interior upgrades and redesign.",
    cta: "Start Interior Intake",
  },
  {
    path: "whole_home_remodel",
    title: "Whole-Home Remodel",
    subtitle: "Major renovation, luxury remodel, full-property transformation, and design direction.",
    cta: "Start Whole-Home Intake",
  },
  {
    path: "addition_expansion",
    title: "Addition / Expansion",
    subtitle: "Rear, side, vertical, and garage additions with structured project intake.",
    cta: "Start Addition Intake",
  },
  {
    path: "design_build",
    title: "Design + Build",
    subtitle: "Integrated project intake for design, permitting, and execution planning.",
    cta: "Start Design-Build Intake",
  },
  {
    path: "permit_path_only",
    title: "Permit Path",
    subtitle: "Get your project organized for a path-to-approval review.",
    cta: "Start Permit Intake",
  },
  {
    path: "capture_site_concept",
    title: "Capture Site",
    subtitle: "Mobile-guided full property capture to build your digital twin. No payment required.",
    cta: "Start Site Capture",
  },
];
