// apps/m-marketplace/app/not-found.tsx
// Custom 404 Page for Marketplace

import { NotFoundPage } from '@kealee/ui';

export default function NotFound() {
  return (
    <NotFoundPage
      homeUrl="/"
      servicesUrl="/services"
      permitsUrl="https://permits.kealee.com"
      contactUrl="/contact"
    />
  );
}
