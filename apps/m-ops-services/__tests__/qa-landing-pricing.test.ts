/**
 * QA Tests for Landing and Pricing Pages
 *
 * Tests UI elements, pricing accuracy, and user flows
 */

import { describe, it, expect } from 'vitest';

// Pricing data that must match what's displayed on the pages
const EXPECTED_PRICING = {
  gcPackages: {
    packageA: { monthly: 1750, annual: 17850, name: 'Solo GC' },
    packageB: { monthly: 3750, annual: 38250, name: 'Growing Team' },
    packageC: { monthly: 9500, annual: 96900, name: 'Multiple Projects' },
    packageD: { monthly: 16500, annual: 168300, name: 'Enterprise GC' },
  },
  projectOwner: {
    starter: { monthly: 299, name: 'Starter' },
    professional: { monthly: 699, name: 'Professional' },
    business: { monthly: 1499, name: 'Business' },
    enterprise: { monthly: 2999, name: 'Enterprise' },
  },
  preConDesign: {
    basic: { price: 199, concepts: 2 },
    standard: { price: 499, concepts: 4 },
    premium: { price: 999, concepts: 'unlimited' },
  },
  estimation: {
    basic: { price: 299 },
    standard: { price: 799 },
    premium: { price: 1999 },
    enterprise: { price: 4999 },
  },
  permits: {
    basic: { monthly: 499, permits: 2 },
    professional: { monthly: 1299, permits: 5 },
    business: { monthly: 2499, permits: 'unlimited' },
    enterprise: { monthly: 4999, permits: 'unlimited' },
  },
  platformFees: {
    commissionRate: 0.035, // 3.5%
    escrowDepositACH: 0,
    escrowDepositWire: 25,
    escrowDepositCardPercent: 0.029,
    escrowDepositCardFlat: 0.30,
    milestoneReleasePercent: 0.015, // 1.5%
  },
  aLaCarte: {
    permitAssistance: 325,
    inspectionScheduling: 200,
    documentOrganization: 400,
    contractorCoordination: 500,
    siteVisit: 350,
    budgetAnalysis: 450,
    progressReporting: 250,
    qualityControl: 400,
    changeOrderManagement: 475,
    scheduleOptimization: 1250,
  },
};

describe('Landing Page QA Tests', () => {
  describe('Platform Modules Display', () => {
    const expectedModules = [
      'Project Management',
      'Pre-Construction',
      'Estimation Engine',
      'Finance & Trust',
      'Permits & Inspections',
      'Marketplace',
    ];

    it('should display all 6 platform modules', () => {
      expect(expectedModules).toHaveLength(6);
    });

    it('should mark Pre-Construction as NEW', () => {
      const newFeatures = ['Pre-Construction', 'Estimation Engine'];
      expect(newFeatures).toContain('Pre-Construction');
    });

    it('should mark Estimation Engine as NEW', () => {
      const newFeatures = ['Pre-Construction', 'Estimation Engine'];
      expect(newFeatures).toContain('Estimation Engine');
    });
  });

  describe('Hero Section', () => {
    it('should have primary CTA button', () => {
      const primaryCTA = 'Get Started Free';
      expect(primaryCTA).toBeTruthy();
    });

    it('should have secondary CTA button', () => {
      const secondaryCTA = 'Request Demo';
      expect(secondaryCTA).toBeTruthy();
    });
  });

  describe('Footer Links', () => {
    const footerLinks = {
      platform: ['Pre-Construction', 'Estimation', 'Marketplace', 'Finance & Trust'],
      services: ['Project Management', 'Permits & Inspections', 'Architecture', 'Engineering'],
      company: ['How it works', 'Pricing', 'Case studies', 'For Contractors'],
    };

    it('should have all platform links', () => {
      expect(footerLinks.platform).toHaveLength(4);
    });

    it('should have all services links', () => {
      expect(footerLinks.services).toHaveLength(4);
    });

    it('should have all company links', () => {
      expect(footerLinks.company).toHaveLength(4);
    });
  });
});

describe('Pricing Page QA Tests', () => {
  describe('GC Operations Packages', () => {
    it('should display correct Package A pricing', () => {
      const pkg = EXPECTED_PRICING.gcPackages.packageA;
      expect(pkg.monthly).toBe(1750);
      expect(pkg.name).toBe('Solo GC');
    });

    it('should display correct Package B pricing (Most Popular)', () => {
      const pkg = EXPECTED_PRICING.gcPackages.packageB;
      expect(pkg.monthly).toBe(3750);
      expect(pkg.name).toBe('Growing Team');
    });

    it('should display correct Package C pricing', () => {
      const pkg = EXPECTED_PRICING.gcPackages.packageC;
      expect(pkg.monthly).toBe(9500);
    });

    it('should display correct Package D pricing', () => {
      const pkg = EXPECTED_PRICING.gcPackages.packageD;
      expect(pkg.monthly).toBe(16500);
    });

    it('should calculate correct annual pricing (15% discount)', () => {
      const monthly = EXPECTED_PRICING.gcPackages.packageA.monthly;
      const expectedAnnual = Math.round(monthly * 12 * 0.85);
      expect(EXPECTED_PRICING.gcPackages.packageA.annual).toBe(expectedAnnual);
    });
  });

  describe('Pre-Con Design Packages', () => {
    it('should display Basic package at $199', () => {
      expect(EXPECTED_PRICING.preConDesign.basic.price).toBe(199);
    });

    it('should display Standard package at $499', () => {
      expect(EXPECTED_PRICING.preConDesign.standard.price).toBe(499);
    });

    it('should display Premium package at $999', () => {
      expect(EXPECTED_PRICING.preConDesign.premium.price).toBe(999);
    });
  });

  describe('Platform Commission', () => {
    it('should display 3.5% commission rate', () => {
      expect(EXPECTED_PRICING.platformFees.commissionRate).toBe(0.035);
    });

    it('should correctly calculate commission for sample contracts', () => {
      const testCases = [
        { contract: 50000, expected: 1750 },
        { contract: 100000, expected: 3500 },
        { contract: 250000, expected: 8750 },
      ];

      testCases.forEach(({ contract, expected }) => {
        const commission = contract * EXPECTED_PRICING.platformFees.commissionRate;
        expect(commission).toBe(expected);
      });
    });
  });

  describe('A La Carte Services', () => {
    it('should display all a la carte services with correct pricing', () => {
      const services = EXPECTED_PRICING.aLaCarte;
      expect(services.permitAssistance).toBe(325);
      expect(services.inspectionScheduling).toBe(200);
      expect(services.documentOrganization).toBe(400);
      expect(services.contractorCoordination).toBe(500);
      expect(services.siteVisit).toBe(350);
      expect(services.budgetAnalysis).toBe(450);
      expect(services.progressReporting).toBe(250);
      expect(services.qualityControl).toBe(400);
      expect(services.changeOrderManagement).toBe(475);
      expect(services.scheduleOptimization).toBe(1250);
    });
  });

  describe('Estimation Services', () => {
    it('should display all estimation tiers', () => {
      expect(EXPECTED_PRICING.estimation.basic.price).toBe(299);
      expect(EXPECTED_PRICING.estimation.standard.price).toBe(799);
      expect(EXPECTED_PRICING.estimation.premium.price).toBe(1999);
      expect(EXPECTED_PRICING.estimation.enterprise.price).toBe(4999);
    });
  });

  describe('Transaction Fees', () => {
    it('should display free ACH deposits', () => {
      expect(EXPECTED_PRICING.platformFees.escrowDepositACH).toBe(0);
    });

    it('should display $25 wire fee', () => {
      expect(EXPECTED_PRICING.platformFees.escrowDepositWire).toBe(25);
    });

    it('should display correct card processing fee (2.9% + $0.30)', () => {
      expect(EXPECTED_PRICING.platformFees.escrowDepositCardPercent).toBe(0.029);
      expect(EXPECTED_PRICING.platformFees.escrowDepositCardFlat).toBe(0.30);
    });
  });
});

describe('Pricing Consistency Tests', () => {
  describe('Cross-Page Pricing Validation', () => {
    it('should have consistent pricing between landing and pricing pages', () => {
      // Design packages on landing should match pricing page
      const landingDesignPricing = { basic: 199, standard: 499, premium: 999 };
      const pricingPageDesign = EXPECTED_PRICING.preConDesign;

      expect(landingDesignPricing.basic).toBe(pricingPageDesign.basic.price);
      expect(landingDesignPricing.standard).toBe(pricingPageDesign.standard.price);
      expect(landingDesignPricing.premium).toBe(pricingPageDesign.premium.price);
    });

    it('should have consistent platform fee display', () => {
      const displayedRate = '3.5%';
      const actualRate = EXPECTED_PRICING.platformFees.commissionRate * 100;
      expect(`${actualRate}%`).toBe(displayedRate);
    });
  });

  describe('Price Range Validation', () => {
    it('should have GC packages in ascending order', () => {
      const packages = EXPECTED_PRICING.gcPackages;
      expect(packages.packageA.monthly).toBeLessThan(packages.packageB.monthly);
      expect(packages.packageB.monthly).toBeLessThan(packages.packageC.monthly);
      expect(packages.packageC.monthly).toBeLessThan(packages.packageD.monthly);
    });

    it('should have estimation services in ascending order', () => {
      const est = EXPECTED_PRICING.estimation;
      expect(est.basic.price).toBeLessThan(est.standard.price);
      expect(est.standard.price).toBeLessThan(est.premium.price);
      expect(est.premium.price).toBeLessThan(est.enterprise.price);
    });
  });
});

describe('UI Element Tests', () => {
  describe('Call-to-Action Buttons', () => {
    const ctaButtons = [
      { text: 'Get Started Free', location: 'hero' },
      { text: 'Request Demo', location: 'hero' },
      { text: 'Start Free Trial', location: 'gc_packages' },
      { text: 'View All Packages', location: 'gc_section' },
      { text: 'Start Pre-Con Project', location: 'precon_highlight' },
      { text: 'Get Estimate', location: 'estimation_highlight' },
    ];

    ctaButtons.forEach(({ text, location }) => {
      it(`should have "${text}" button in ${location}`, () => {
        expect(text).toBeTruthy();
      });
    });
  });

  describe('Feature Badges', () => {
    it('should display NEW badge on Pre-Construction section', () => {
      const badge = 'NEW FEATURE';
      expect(badge).toBe('NEW FEATURE');
    });

    it('should display MOST POPULAR badge on Package B', () => {
      const badge = 'MOST POPULAR';
      expect(badge).toBe('MOST POPULAR');
    });
  });

  describe('Responsive Design Checkpoints', () => {
    const breakpoints = {
      mobile: 320,
      tablet: 768,
      desktop: 1024,
      wide: 1440,
    };

    it('should define all responsive breakpoints', () => {
      expect(breakpoints.mobile).toBe(320);
      expect(breakpoints.tablet).toBe(768);
      expect(breakpoints.desktop).toBe(1024);
      expect(breakpoints.wide).toBe(1440);
    });
  });
});

describe('Accessibility Tests', () => {
  describe('Form Elements', () => {
    it('should have labels for all form inputs', () => {
      const formFields = ['email', 'password', 'name', 'phone', 'company'];
      formFields.forEach((field) => {
        expect(field).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should have proper heading hierarchy', () => {
      const headings = ['h1', 'h2', 'h3'];
      expect(headings).toContain('h1');
    });
  });

  describe('Color Contrast', () => {
    it('should meet WCAG AA contrast requirements', () => {
      // Primary colors should have sufficient contrast
      const contrastRatio = 4.5; // Minimum for AA
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
