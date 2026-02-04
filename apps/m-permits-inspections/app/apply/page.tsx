// apps/m-permits-inspections/app/apply/page.tsx
// Permit Application Wizard Page

import type { Metadata } from 'next';
import { PermitApplicationWizard } from '../../components/PermitApplicationWizard';

export const metadata: Metadata = {
  title: 'New Permit Application | Kealee Permits',
  description:
    'Start your building permit application with AI-powered review. Get approved faster with our guided application process.',
};

export default function ApplyPage() {
  return <PermitApplicationWizard />;
}
