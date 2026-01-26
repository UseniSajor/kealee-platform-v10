# PERMIT SCRAPING TECHNICAL GUIDE
## Kealee Platform - PermitPro Module

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Jurisdiction Analysis](#2-jurisdiction-analysis)
3. [Technical Architecture](#3-technical-architecture)
4. [Implementation by Jurisdiction](#4-implementation-by-jurisdiction)
5. [Anti-Detection Strategies](#5-anti-detection-strategies)
6. [Data Extraction Patterns](#6-data-extraction-patterns)
7. [Legal Considerations](#7-legal-considerations)
8. [Alternative Approaches](#8-alternative-approaches)

---

# 1. OVERVIEW

## What We're Scraping

| Data Point | Purpose | Update Frequency |
|------------|---------|------------------|
| Application status | Track progress | Daily |
| Plan review comments | Alert PM to respond | Daily |
| Inspection results | Update project status | Daily |
| Fee calculations | Estimate costs | On submission |
| Approval documents | Store in vault | On approval |
| Expiration dates | Renewal alerts | Weekly |

## Scraping vs. API Reality

| Jurisdiction | Has API? | Scraping Required? |
|--------------|----------|-------------------|
| DC DCRA | Partial (SCOUT) | Yes - for details |
| Montgomery County DPS | No | Yes |
| Prince George's DPIE | No | Yes |
| Fairfax County LDS | Partial | Yes - for status |
| Arlington County | No | Yes |
| Baltimore City | No | Yes |
| Howard County | No | Yes |

**Reality: 90%+ of jurisdictions require scraping. APIs are rare and limited.**

---

# 2. JURISDICTION ANALYSIS

## 2.1 DC DCRA (District of Columbia)

**Portal:** https://scout.dcra.dc.gov/

**Technology Stack:**
- Frontend: Angular
- Backend: .NET
- Auth: Session-based cookies
- Anti-bot: reCAPTCHA on some forms

**Available Data:**
- Permit applications
- Plan review status
- Inspection scheduling
- Violation history
- Certificate of Occupancy status

**Access Method:**
```
Public search: No login required for basic lookup
Detailed view: Requires permit number or address
Document download: Some require login
```

**URL Patterns:**
```
Search: https://scout.dcra.dc.gov/permits?address={address}
Detail: https://scout.dcra.dc.gov/permits/{permit_number}
Inspections: https://scout.dcra.dc.gov/permits/{permit_number}/inspections
```

---

## 2.2 Montgomery County DPS

**Portal:** https://www.montgomerycountymd.gov/DPS/

**Technology Stack:**
- Frontend: Custom ASP.NET
- Database: Oracle backend
- Auth: Session cookies
- Anti-bot: Basic rate limiting

**Access Method:**
```
ePlans Portal: https://eplans.montgomerycountymd.gov/
Public search available
PDF plan reviews require account
```

**Challenges:**
- Multiple systems (ePlans, legacy)
- Inconsistent data formats
- Session timeouts

---

## 2.3 Prince George's County DPIE

**Portal:** https://www.princegeorgescountymd.gov/925/Permits-Inspections-Enforcement

**Technology Stack:**
- Accela Citizen Access (common platform)
- Frontend: ASP.NET WebForms
- Anti-bot: CAPTCHA on search

**URL Patterns:**
```
Search: https://aca-prod.accela.com/PGCOUNTY/
Detail: Application-specific URLs with session tokens
```

---

## 2.4 Fairfax County LDS

**Portal:** https://www.fairfaxcounty.gov/land-development-services/

**Technology Stack:**
- PLUS Portal (Accela-based)
- Modern React frontend
- API endpoints available (undocumented)

**URL Patterns:**
```
Search: https://plus.fairfaxcounty.gov/citizenaccess/
Has some JSON endpoints that can be discovered
```

---

# 3. TECHNICAL ARCHITECTURE

## 3.1 System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERMIT SCRAPING SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Scheduler  │────▶│  Job Queue   │────▶│   Workers    │    │
│  │   (Cron)     │     │  (BullMQ)    │     │  (Puppeteer) │    │
│  └──────────────┘     └──────────────┘     └──────┬───────┘    │
│                                                    │            │
│                                           ┌────────▼────────┐   │
│                                           │  Proxy Rotator  │   │
│                                           │  (Residential)  │   │
│                                           └────────┬────────┘   │
│                                                    │            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    JURISDICTION ADAPTERS                  │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │DC DCRA │ │ MoCo   │ │  PG    │ │Fairfax │ │ Other  │ │  │
│  │  │Adapter │ │Adapter │ │Adapter │ │Adapter │ │Adapters│ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                │                                │
│                    ┌───────────▼───────────┐                   │
│                    │    Data Normalizer    │                   │
│                    │  (Common Schema)      │                   │
│                    └───────────┬───────────┘                   │
│                                │                                │
│                    ┌───────────▼───────────┐                   │
│                    │      Database         │                   │
│                    │    (Supabase)         │                   │
│                    └───────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 Core Components

### Scraper Worker (Puppeteer-based)

```typescript
// packages/automation/apps/permit-tracker/src/scraper/base-scraper.ts

import puppeteer, { Browser, Page } from 'puppeteer';
import { ProxyRotator } from '../proxy/rotator';

export interface PermitData {
  permitNumber: string;
  address: string;
  type: string;
  status: string;
  appliedDate: Date;
  approvedDate?: Date;
  expiresDate?: Date;
  fees: {
    total: number;
    paid: number;
    due: number;
  };
  reviews: PlanReview[];
  inspections: Inspection[];
  documents: Document[];
  rawHtml?: string; // For debugging
}

export interface PlanReview {
  reviewer: string;
  department: string;
  status: 'PENDING' | 'APPROVED' | 'CORRECTIONS_REQUIRED';
  comments?: string;
  submittedDate: Date;
  reviewedDate?: Date;
}

export interface Inspection {
  type: string;
  status: 'SCHEDULED' | 'PASSED' | 'FAILED' | 'CANCELLED';
  scheduledDate?: Date;
  completedDate?: Date;
  inspector?: string;
  notes?: string;
}

export abstract class BasePermitScraper {
  protected browser: Browser | null = null;
  protected proxyRotator: ProxyRotator;
  protected jurisdiction: string;

  constructor(jurisdiction: string, proxyRotator: ProxyRotator) {
    this.jurisdiction = jurisdiction;
    this.proxyRotator = proxyRotator;
  }

  async init(): Promise<void> {
    const proxy = await this.proxyRotator.getProxy();
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxy.host}:${proxy.port}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async createPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(this.getRandomUserAgent());
    
    // Add stealth measures
    await page.evaluateOnNewDocument(() => {
      // Override webdriver detection
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    return page;
  }

  protected getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Abstract methods each jurisdiction must implement
  abstract searchByAddress(address: string): Promise<PermitData[]>;
  abstract getPermitDetails(permitNumber: string): Promise<PermitData>;
  abstract getPermitStatus(permitNumber: string): Promise<string>;
  abstract getPlanReviewComments(permitNumber: string): Promise<PlanReview[]>;
  abstract getInspections(permitNumber: string): Promise<Inspection[]>;
}
```

---

# 4. IMPLEMENTATION BY JURISDICTION

## 4.1 DC DCRA Scraper

```typescript
// packages/automation/apps/permit-tracker/src/scrapers/dc-dcra.ts

import { BasePermitScraper, PermitData, PlanReview, Inspection } from './base-scraper';
import { Page } from 'puppeteer';

export class DCDCRAScraper extends BasePermitScraper {
  private readonly BASE_URL = 'https://scout.dcra.dc.gov';

  async searchByAddress(address: string): Promise<PermitData[]> {
    const page = await this.createPage();
    
    try {
      // Navigate to search page
      await page.goto(`${this.BASE_URL}/permits`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay();

      // Enter address in search box
      await page.waitForSelector('input[placeholder*="address"]', { timeout: 10000 });
      await page.type('input[placeholder*="address"]', address, { delay: 50 });
      
      await this.randomDelay(500, 1000);

      // Click search button
      await page.click('button[type="submit"]');
      
      // Wait for results
      await page.waitForSelector('.permit-result, .no-results', { timeout: 15000 });

      // Check for no results
      const noResults = await page.$('.no-results');
      if (noResults) {
        return [];
      }

      // Extract permit list
      const permits = await page.evaluate(() => {
        const results: any[] = [];
        const rows = document.querySelectorAll('.permit-result');
        
        rows.forEach(row => {
          results.push({
            permitNumber: row.querySelector('.permit-number')?.textContent?.trim(),
            address: row.querySelector('.address')?.textContent?.trim(),
            type: row.querySelector('.permit-type')?.textContent?.trim(),
            status: row.querySelector('.status')?.textContent?.trim(),
            appliedDate: row.querySelector('.applied-date')?.textContent?.trim(),
          });
        });
        
        return results;
      });

      // Convert dates and return
      return permits.map(p => ({
        ...p,
        appliedDate: new Date(p.appliedDate),
        reviews: [],
        inspections: [],
        documents: [],
        fees: { total: 0, paid: 0, due: 0 },
      }));

    } finally {
      await page.close();
    }
  }

  async getPermitDetails(permitNumber: string): Promise<PermitData> {
    const page = await this.createPage();
    
    try {
      // Navigate directly to permit detail page
      await page.goto(`${this.BASE_URL}/permits/${permitNumber}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay();

      // Wait for content to load
      await page.waitForSelector('.permit-details', { timeout: 10000 });

      // Extract all permit data
      const permitData = await page.evaluate(() => {
        const getValue = (selector: string): string => {
          return document.querySelector(selector)?.textContent?.trim() || '';
        };

        const getTableData = (tableSelector: string): any[] => {
          const rows: any[] = [];
          document.querySelectorAll(`${tableSelector} tbody tr`).forEach(row => {
            const cells = row.querySelectorAll('td');
            rows.push({
              col1: cells[0]?.textContent?.trim(),
              col2: cells[1]?.textContent?.trim(),
              col3: cells[2]?.textContent?.trim(),
              col4: cells[3]?.textContent?.trim(),
              col5: cells[4]?.textContent?.trim(),
            });
          });
          return rows;
        };

        return {
          permitNumber: getValue('.permit-number'),
          address: getValue('.property-address'),
          type: getValue('.permit-type'),
          status: getValue('.permit-status'),
          appliedDate: getValue('.applied-date'),
          approvedDate: getValue('.approved-date'),
          expiresDate: getValue('.expiration-date'),
          fees: {
            total: getValue('.fee-total'),
            paid: getValue('.fee-paid'),
            due: getValue('.fee-due'),
          },
          reviewsRaw: getTableData('.plan-reviews-table'),
          inspectionsRaw: getTableData('.inspections-table'),
        };
      });

      // Parse and normalize the data
      return this.normalizePermitData(permitData);

    } finally {
      await page.close();
    }
  }

  async getPermitStatus(permitNumber: string): Promise<string> {
    const page = await this.createPage();
    
    try {
      await page.goto(`${this.BASE_URL}/permits/${permitNumber}`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await page.waitForSelector('.permit-status', { timeout: 10000 });
      
      const status = await page.$eval('.permit-status', el => el.textContent?.trim() || '');
      return this.normalizeStatus(status);

    } finally {
      await page.close();
    }
  }

  async getPlanReviewComments(permitNumber: string): Promise<PlanReview[]> {
    const page = await this.createPage();
    
    try {
      await page.goto(`${this.BASE_URL}/permits/${permitNumber}/reviews`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay();

      // Check if there's a reviews section
      const hasReviews = await page.$('.plan-reviews');
      if (!hasReviews) return [];

      const reviews = await page.evaluate(() => {
        const results: any[] = [];
        
        document.querySelectorAll('.review-item').forEach(item => {
          results.push({
            reviewer: item.querySelector('.reviewer-name')?.textContent?.trim(),
            department: item.querySelector('.department')?.textContent?.trim(),
            status: item.querySelector('.review-status')?.textContent?.trim(),
            comments: item.querySelector('.review-comments')?.textContent?.trim(),
            submittedDate: item.querySelector('.submitted-date')?.textContent?.trim(),
            reviewedDate: item.querySelector('.reviewed-date')?.textContent?.trim(),
          });
        });
        
        return results;
      });

      return reviews.map(r => ({
        ...r,
        status: this.normalizeReviewStatus(r.status),
        submittedDate: new Date(r.submittedDate),
        reviewedDate: r.reviewedDate ? new Date(r.reviewedDate) : undefined,
      }));

    } finally {
      await page.close();
    }
  }

  async getInspections(permitNumber: string): Promise<Inspection[]> {
    const page = await this.createPage();
    
    try {
      await page.goto(`${this.BASE_URL}/permits/${permitNumber}/inspections`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay();

      const inspections = await page.evaluate(() => {
        const results: any[] = [];
        
        document.querySelectorAll('.inspection-row').forEach(row => {
          results.push({
            type: row.querySelector('.inspection-type')?.textContent?.trim(),
            status: row.querySelector('.inspection-status')?.textContent?.trim(),
            scheduledDate: row.querySelector('.scheduled-date')?.textContent?.trim(),
            completedDate: row.querySelector('.completed-date')?.textContent?.trim(),
            inspector: row.querySelector('.inspector-name')?.textContent?.trim(),
            notes: row.querySelector('.inspection-notes')?.textContent?.trim(),
          });
        });
        
        return results;
      });

      return inspections.map(i => ({
        ...i,
        status: this.normalizeInspectionStatus(i.status),
        scheduledDate: i.scheduledDate ? new Date(i.scheduledDate) : undefined,
        completedDate: i.completedDate ? new Date(i.completedDate) : undefined,
      }));

    } finally {
      await page.close();
    }
  }

  // Normalization helpers
  private normalizePermitData(raw: any): PermitData {
    return {
      permitNumber: raw.permitNumber,
      address: raw.address,
      type: this.normalizePermitType(raw.type),
      status: this.normalizeStatus(raw.status),
      appliedDate: new Date(raw.appliedDate),
      approvedDate: raw.approvedDate ? new Date(raw.approvedDate) : undefined,
      expiresDate: raw.expiresDate ? new Date(raw.expiresDate) : undefined,
      fees: {
        total: this.parseCurrency(raw.fees.total),
        paid: this.parseCurrency(raw.fees.paid),
        due: this.parseCurrency(raw.fees.due),
      },
      reviews: raw.reviewsRaw.map((r: any) => this.parseReview(r)),
      inspections: raw.inspectionsRaw.map((i: any) => this.parseInspection(i)),
      documents: [],
    };
  }

  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'application submitted': 'SUBMITTED',
      'in review': 'IN_REVIEW',
      'corrections required': 'REVISIONS_REQUIRED',
      'approved': 'APPROVED',
      'issued': 'APPROVED',
      'expired': 'EXPIRED',
      'cancelled': 'CANCELLED',
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private normalizePermitType(type: string): string {
    const typeMap: Record<string, string> = {
      'building': 'BUILDING',
      'electrical': 'ELECTRICAL',
      'plumbing': 'PLUMBING',
      'mechanical': 'MECHANICAL',
      'hvac': 'MECHANICAL',
    };
    return typeMap[type.toLowerCase()] || type.toUpperCase();
  }

  private normalizeReviewStatus(status: string): 'PENDING' | 'APPROVED' | 'CORRECTIONS_REQUIRED' {
    if (status.toLowerCase().includes('approved')) return 'APPROVED';
    if (status.toLowerCase().includes('correction') || status.toLowerCase().includes('revision')) {
      return 'CORRECTIONS_REQUIRED';
    }
    return 'PENDING';
  }

  private normalizeInspectionStatus(status: string): 'SCHEDULED' | 'PASSED' | 'FAILED' | 'CANCELLED' {
    const s = status.toLowerCase();
    if (s.includes('pass') || s.includes('approved')) return 'PASSED';
    if (s.includes('fail') || s.includes('rejected')) return 'FAILED';
    if (s.includes('cancel')) return 'CANCELLED';
    return 'SCHEDULED';
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  }

  private parseReview(raw: any): PlanReview {
    return {
      reviewer: raw.col1 || '',
      department: raw.col2 || '',
      status: this.normalizeReviewStatus(raw.col3 || ''),
      comments: raw.col4,
      submittedDate: new Date(raw.col5),
    };
  }

  private parseInspection(raw: any): Inspection {
    return {
      type: raw.col1 || '',
      status: this.normalizeInspectionStatus(raw.col2 || ''),
      scheduledDate: raw.col3 ? new Date(raw.col3) : undefined,
      completedDate: raw.col4 ? new Date(raw.col4) : undefined,
      notes: raw.col5,
    };
  }
}
```

## 4.2 Montgomery County Scraper

```typescript
// packages/automation/apps/permit-tracker/src/scrapers/montgomery-county.ts

import { BasePermitScraper, PermitData } from './base-scraper';

export class MontgomeryCountyScraper extends BasePermitScraper {
  private readonly BASE_URL = 'https://eplans.montgomerycountymd.gov';

  async searchByAddress(address: string): Promise<PermitData[]> {
    const page = await this.createPage();
    
    try {
      // Montgomery County uses Accela Citizen Access
      await page.goto(`${this.BASE_URL}/citizenaccess/`, {
        waitUntil: 'networkidle2',
      });

      await this.randomDelay();

      // Navigate to permit search
      await page.click('a[href*="PermitSearch"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Fill address field
      await page.waitForSelector('#txtAddress');
      await page.type('#txtAddress', address, { delay: 75 });

      await this.randomDelay();

      // Submit search
      await page.click('#btnSearch');
      
      // Wait for results or CAPTCHA
      const result = await Promise.race([
        page.waitForSelector('.ACA_Table_Odd, .ACA_Table_Even', { timeout: 15000 }),
        page.waitForSelector('.g-recaptcha', { timeout: 15000 }),
      ]);

      // Handle CAPTCHA if present
      if (await page.$('.g-recaptcha')) {
        throw new Error('CAPTCHA_REQUIRED');
      }

      // Extract results
      const permits = await page.evaluate(() => {
        const results: any[] = [];
        
        document.querySelectorAll('.ACA_Table_Odd, .ACA_Table_Even').forEach(row => {
          const cells = row.querySelectorAll('td');
          results.push({
            permitNumber: cells[0]?.textContent?.trim(),
            type: cells[1]?.textContent?.trim(),
            address: cells[2]?.textContent?.trim(),
            status: cells[3]?.textContent?.trim(),
            appliedDate: cells[4]?.textContent?.trim(),
          });
        });
        
        return results;
      });

      return permits.map(p => ({
        ...p,
        appliedDate: new Date(p.appliedDate),
        reviews: [],
        inspections: [],
        documents: [],
        fees: { total: 0, paid: 0, due: 0 },
      }));

    } finally {
      await page.close();
    }
  }

  // ... similar implementation for other methods
  async getPermitDetails(permitNumber: string): Promise<PermitData> {
    // Implementation follows same pattern
    throw new Error('Not implemented');
  }

  async getPermitStatus(permitNumber: string): Promise<string> {
    throw new Error('Not implemented');
  }

  async getPlanReviewComments(permitNumber: string): Promise<any[]> {
    throw new Error('Not implemented');
  }

  async getInspections(permitNumber: string): Promise<any[]> {
    throw new Error('Not implemented');
  }
}
```

---

# 5. ANTI-DETECTION STRATEGIES

## 5.1 Proxy Rotation

```typescript
// packages/automation/apps/permit-tracker/src/proxy/rotator.ts

export interface Proxy {
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: 'residential' | 'datacenter';
  location?: string;
}

export class ProxyRotator {
  private proxies: Proxy[] = [];
  private currentIndex = 0;
  private failedProxies: Set<string> = new Set();

  constructor(proxyList: Proxy[]) {
    this.proxies = proxyList;
  }

  async getProxy(): Promise<Proxy> {
    // Filter out failed proxies
    const available = this.proxies.filter(
      p => !this.failedProxies.has(`${p.host}:${p.port}`)
    );

    if (available.length === 0) {
      // Reset failed list and try again
      this.failedProxies.clear();
      return this.proxies[0];
    }

    // Round-robin selection
    const proxy = available[this.currentIndex % available.length];
    this.currentIndex++;
    
    return proxy;
  }

  markFailed(proxy: Proxy): void {
    this.failedProxies.add(`${proxy.host}:${proxy.port}`);
  }

  markSuccess(proxy: Proxy): void {
    this.failedProxies.delete(`${proxy.host}:${proxy.port}`);
  }
}

// Recommended proxy providers for government sites:
// 1. Bright Data (Luminati) - Best residential proxies
// 2. Oxylabs - Good for US government sites
// 3. Smartproxy - Budget option
// 4. IPRoyal - Static residential

// Cost estimate: $15-50/GB for residential proxies
// Monthly usage estimate: 5-20 GB depending on volume
```

## 5.2 Request Timing

```typescript
// packages/automation/apps/permit-tracker/src/utils/timing.ts

export class RequestThrottler {
  private lastRequestTime: Map<string, number> = new Map();
  private readonly MIN_DELAY = 2000; // 2 seconds minimum between requests
  private readonly MAX_DELAY = 5000; // 5 seconds maximum

  async waitForSlot(jurisdiction: string): Promise<void> {
    const lastRequest = this.lastRequestTime.get(jurisdiction) || 0;
    const elapsed = Date.now() - lastRequest;
    
    if (elapsed < this.MIN_DELAY) {
      const waitTime = this.MIN_DELAY - elapsed + this.randomJitter();
      await this.sleep(waitTime);
    }

    this.lastRequestTime.set(jurisdiction, Date.now());
  }

  private randomJitter(): number {
    return Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Rate limits by jurisdiction (requests per hour):
// DC DCRA: ~100/hour
// Montgomery County: ~50/hour
// Prince George's: ~30/hour (strict)
// Fairfax: ~100/hour
```

## 5.3 Browser Fingerprint Randomization

```typescript
// packages/automation/apps/permit-tracker/src/utils/fingerprint.ts

export async function randomizeFingerprint(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    // Randomize canvas fingerprint
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {
      if (type === 'image/png' && this.width === 220 && this.height === 30) {
        // This is likely a fingerprint canvas
        const context = this.getContext('2d');
        const imageData = context!.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] ^= Math.floor(Math.random() * 10);
        }
        context!.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.apply(this, arguments as any);
    };

    // Randomize WebGL fingerprint
    const getParameterProxyHandler = {
      apply: function(target: any, ctx: any, args: any[]) {
        const param = args[0];
        const result = Reflect.apply(target, ctx, args);
        if (param === 37445) { // UNMASKED_VENDOR_WEBGL
          return 'Intel Inc.';
        }
        if (param === 37446) { // UNMASKED_RENDERER_WEBGL
          return 'Intel Iris OpenGL Engine';
        }
        return result;
      }
    };

    // Override navigator properties
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 4 + Math.floor(Math.random() * 4),
    });

    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => [4, 8, 16][Math.floor(Math.random() * 3)],
    });
  });
}
```

---

# 6. DATA EXTRACTION PATTERNS

## 6.1 Common Selectors by Platform

### Accela Citizen Access (Used by PG County, many others)

```typescript
const ACCELA_SELECTORS = {
  searchInput: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSPermitNumber',
  addressInput: '#ctl00_PlaceHolderMain_generalSearchForm_txtGSAddress',
  searchButton: '#ctl00_PlaceHolderMain_btnNewSearch',
  resultsTable: '.ACA_Grid_OverFlow table',
  resultRow: 'tr.ACA_TabRow_Odd, tr.ACA_TabRow_Even',
  permitNumber: 'td:nth-child(2) a',
  status: 'td:nth-child(6)',
  detailLink: 'a[href*="Cap/CapDetail"]',
};
```

### Custom ASP.NET (DC DCRA)

```typescript
const DCRA_SELECTORS = {
  searchInput: 'input[name="q"], input[placeholder*="address"]',
  searchButton: 'button[type="submit"]',
  resultsContainer: '.search-results, .permit-list',
  permitCard: '.permit-card, .permit-item',
  permitNumber: '.permit-number, [data-field="permitNumber"]',
  status: '.status, .permit-status',
  detailsTab: {
    general: '#tab-general',
    reviews: '#tab-reviews',
    inspections: '#tab-inspections',
    fees: '#tab-fees',
  },
};
```

## 6.2 Data Normalization Schema

```typescript
// packages/automation/apps/permit-tracker/src/schema/permit.ts

export interface NormalizedPermit {
  // Identifiers
  id: string;                    // Internal UUID
  externalId: string;            // Jurisdiction permit number
  jurisdiction: string;          // e.g., 'DC_DCRA', 'MONTGOMERY_DPS'
  
  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    parcel?: string;
  };
  
  // Classification
  type: PermitType;
  subType?: string;
  workDescription: string;
  
  // Status
  status: PermitStatus;
  statusHistory: StatusChange[];
  
  // Dates
  appliedAt: Date;
  acceptedAt?: Date;
  approvedAt?: Date;
  issuedAt?: Date;
  expiresAt?: Date;
  
  // Financials
  estimatedCost?: number;
  fees: {
    application: number;
    plan_review: number;
    permit: number;
    other: number;
    total: number;
    paid: number;
    balance: number;
  };
  
  // Reviews
  reviews: Review[];
  
  // Inspections
  inspections: InspectionRecord[];
  
  // Documents
  documents: PermitDocument[];
  
  // Metadata
  scrapedAt: Date;
  rawData?: any;
}

export enum PermitType {
  BUILDING = 'BUILDING',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  MECHANICAL = 'MECHANICAL',
  FIRE = 'FIRE',
  ZONING = 'ZONING',
  DEMOLITION = 'DEMOLITION',
  OTHER = 'OTHER',
}

export enum PermitStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  REVISIONS_REQUIRED = 'REVISIONS_REQUIRED',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  ACTIVE = 'ACTIVE',
  INSPECTION_HOLD = 'INSPECTION_HOLD',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}
```

---

# 7. LEGAL CONSIDERATIONS

## 7.1 Terms of Service Review

| Jurisdiction | TOS Allows Scraping? | Notes |
|--------------|---------------------|-------|
| DC DCRA | No explicit prohibition | Public records, proceed carefully |
| Montgomery County | No explicit prohibition | Rate limit strictly |
| Prince George's | Prohibits automated access | Higher risk |
| Fairfax | No explicit prohibition | Has some API endpoints |

## 7.2 Risk Mitigation

1. **Public Records Doctrine**
   - Permit data is public record
   - You're accessing what any citizen can access
   - Not circumventing authentication

2. **Rate Limiting**
   - Never hammer servers
   - Respect robots.txt where present
   - Act like a human user

3. **No Authentication Bypass**
   - Only access publicly available data
   - Don't crack passwords or bypass CAPTCHAs with paid services
   - Document download may require manual step

4. **Data Usage**
   - Only use data for legitimate business purposes
   - Don't resell raw permit data
   - Add value through analysis/presentation

## 7.3 CAPTCHA Handling

```typescript
// Options for CAPTCHA handling:

// 1. AVOID - Reduce requests to not trigger
// 2. QUEUE - Flag for manual resolution
// 3. SERVICE - Use solving service (legal gray area)

export class CaptchaHandler {
  async handle(page: Page): Promise<boolean> {
    const hasCaptcha = await page.$('.g-recaptcha, .h-captcha');
    
    if (!hasCaptcha) return true;

    // Option 1: Queue for manual resolution
    await this.queueForManualReview(page.url());
    return false;

    // Option 2: Use solving service (not recommended for gov sites)
    // const token = await this.solvingService.solve(siteKey);
    // await page.evaluate((token) => {
    //   document.getElementById('g-recaptcha-response').innerHTML = token;
    // }, token);
  }

  private async queueForManualReview(url: string): Promise<void> {
    // Add to manual review queue
    await prisma.scrapingQueue.create({
      data: {
        url,
        status: 'CAPTCHA_REQUIRED',
        requiresManual: true,
      },
    });
  }
}
```

---

# 8. ALTERNATIVE APPROACHES

## 8.1 Official Data Sources

| Source | Data Available | Access |
|--------|---------------|--------|
| DC Open Data | Permit records (delayed) | Free API |
| Maryland Open Data | Some permit data | Free API |
| Socrata (many cities) | Historical permits | Free API |

```typescript
// DC Open Data API example
const DC_OPEN_DATA = 'https://opendata.dc.gov/api/3/action/';

async function getPermitsFromOpenData(address: string) {
  const response = await fetch(
    `${DC_OPEN_DATA}datastore_search?` +
    `resource_id=building_permits&` +
    `q=${encodeURIComponent(address)}`
  );
  return response.json();
}
```

## 8.2 Email Notification Parsing

Many jurisdictions offer email notifications. Parse these instead of scraping:

```typescript
// Set up email listener for permit updates
// Use: Gmail API, SendGrid Inbound, or custom SMTP

async function parsePermitEmail(email: ParsedEmail): Promise<PermitUpdate> {
  // Extract permit number from subject
  const permitMatch = email.subject.match(/Permit #?(\w+-?\d+)/i);
  
  // Extract status from body
  const statusMatch = email.body.match(
    /status.*?(approved|rejected|corrections|issued)/i
  );

  return {
    permitNumber: permitMatch?.[1],
    newStatus: statusMatch?.[1],
    timestamp: email.date,
  };
}
```

## 8.3 Partnership Approach

**Best long-term solution:**

1. Contact jurisdiction IT departments
2. Propose data sharing agreement
3. Offer to build their notification system
4. Get official API access

**Template outreach:**

```
Subject: Data Integration Partnership Proposal - Kealee Construction Platform

Dear [Department] IT Director,

We're building a construction management platform that helps contractors 
track permit status. Rather than scraping your public portal, we'd like 
to propose a partnership:

- We can build a contractor notification system for you (free)
- In exchange, we get API access to permit status data
- This reduces load on your public portal
- Improves contractor experience with your department

Would you be open to a 30-minute call to discuss?
```

---

# SUMMARY

## Recommended Approach by Priority

| Priority | Approach | Jurisdictions |
|----------|----------|---------------|
| 1 | Official APIs | DC Open Data (supplemental) |
| 2 | Light scraping | DC DCRA, Fairfax (have JSON endpoints) |
| 3 | Full scraping | Montgomery, PG County |
| 4 | Email parsing | All (as backup) |
| 5 | Partnership outreach | All (long-term) |

## Cost Estimates

| Item | Monthly Cost |
|------|--------------|
| Residential proxies | $100-300 |
| CAPTCHA solving (if used) | $50-200 |
| Server (scraping workers) | $50-100 |
| Monitoring/alerts | $20-50 |
| **Total** | **$220-650/mo** |

## Timeline to Production

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| DC DCRA adapter | 2 weeks | Full scraping for DC |
| Montgomery adapter | 2 weeks | Full scraping for MoCo |
| PG County adapter | 2 weeks | Full scraping for PG |
| Fairfax adapter | 1 week | API + light scraping |
| Monitoring & alerts | 1 week | Failure detection |
| **Total** | **8 weeks** | 4 jurisdictions live |
