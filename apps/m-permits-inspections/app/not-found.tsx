// apps/m-permits-inspections/app/not-found.tsx
// Custom 404 Page for Permits

import { NotFoundPage } from '@kealee/ui';

export default function NotFound() {
  return (
    <NotFoundPage
      homeUrl="/"
      servicesUrl="https://ops.kealee.com/services"
      permitsUrl="/dashboard"
      contactUrl="/contact"
    />
  );
}
