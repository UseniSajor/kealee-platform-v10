// packages/ui/src/components/marketing/index.ts
// Kealee Platform - Marketing Component Library

// Brand & Design Tokens (namespaced to avoid conflict with ../tokens)
export {
  brand,
  appAccents,
  fonts as marketingFonts,
  shadows as marketingShadows,
  animations as marketingAnimations,
} from './brand';

// Utility Components
export * from './SectionLabel';
export * from './TrustBar';
export { Badge as MarketingBadge } from './Badge';
export type { BadgeProps as MarketingBadgeProps } from './Badge';
export * from './PriceDisplay';

// Layout Components
export * from './MarketingSidebar';
export { MarketingTopBar } from './MarketingTopBar';
export type { MarketingTopBarProps } from './MarketingTopBar';
export type { BreadcrumbItem as MarketingBreadcrumbItem } from './MarketingTopBar';
export * from './MarketingLayout';
export * from './MarketingFooter';

// Section Components
export * from './HeroSection';
export * from './ModuleShowcaseCard';
export * from './PricingTierCard';
export * from './ServiceCard';
export * from './StatsBar';
export * from './TestimonialCard';
export * from './FeatureCard';
export * from './ProcessSteps';
export * from './ComparisonSection';
export * from './PlatformFlowDiagram';
export * from './FAQAccordion';
export * from './SplitCTA';
export * from './NetworkProfileCard';
