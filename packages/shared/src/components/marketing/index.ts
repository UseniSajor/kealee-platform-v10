// Marketing Components Index
// Export all marketing landing pages, navigation, and dashboard components

// Landing Pages
export { default as DeveloperPortalLanding } from './landing-pages/DeveloperPortalLanding';
export { default as OwnerPortalLanding } from './landing-pages/OwnerPortalLanding';

// Dashboard
export { default as PortalDashboard } from './dashboard/PortalDashboard';
export {
  DashboardTopbar,
  ServicesMegaMenu as DashboardServicesMegaMenu,
  StatCard,
  ProjectCardComponent,
  PageHeader,
} from './dashboard/PortalDashboard';

// Navigation
export { default as ServicesMegaMenu } from './navigation/ServicesMegaMenu';
export {
  ServicesMenuStandalone,
  ServicesMobileMenu,
} from './navigation/ServicesMegaMenu';
export type { ServiceItem, ServiceSection } from './navigation/ServicesMegaMenu';
