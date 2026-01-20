#!/bin/bash

# SEO Optimization Script
# Optimizes SEO for all apps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SEO]${NC} $1"
}

log "Optimizing SEO..."
echo ""

# Create SEO checklist
cat > SEO_CHECKLIST.md <<'EOF'
# SEO Optimization Checklist

## On-Page SEO

### Meta Tags
- [ ] Title tags optimized (50-60 characters)
- [ ] Meta descriptions written (150-160 characters)
- [ ] Open Graph tags configured
- [ ] Twitter Card tags configured
- [ ] Canonical URLs set
- [ ] Robots meta tags configured

### Content
- [ ] H1 tags on every page
- [ ] Proper heading hierarchy (H1-H6)
- [ ] Alt text on all images
- [ ] Internal linking structure
- [ ] Keyword optimization
- [ ] Content quality and relevance

### Technical SEO
- [ ] XML sitemap generated
- [ ] robots.txt configured
- [ ] SSL certificate installed
- [ ] Mobile responsive design
- [ ] Page speed optimized
- [ ] Structured data (Schema.org)

## Off-Page SEO

- [ ] Google Search Console set up
- [ ] Google Analytics configured
- [ ] Bing Webmaster Tools set up
- [ ] Backlink strategy planned
- [ ] Social media profiles optimized
- [ ] Local SEO (if applicable)

## Keywords

### Primary Keywords
- Construction project management
- Permit application software
- Building inspection scheduling
- Construction payment processing

### Long-Tail Keywords
- Online permit application system
- Construction project collaboration platform
- Building inspection management software
EOF

log "✅ SEO checklist created: SEO_CHECKLIST.md"
echo ""

# Create sitemap generator script
cat > scripts/generate-sitemap.js <<'EOF'
// Generate XML Sitemap
const fs = require('fs');

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketplace.kealee.com';

const pages = [
  '',
  '/about',
  '/features',
  '/pricing',
  '/contact',
  '/blog',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync('public/sitemap.xml', sitemap);
console.log('Sitemap generated: public/sitemap.xml');
EOF

log "✅ Sitemap generator created: scripts/generate-sitemap.js"
echo ""

# Create robots.txt template
cat > public/robots.txt <<'EOF'
User-agent: *
Allow: /

# Sitemap
Sitemap: https://marketplace.kealee.com/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
EOF

log "✅ robots.txt created: public/robots.txt"
echo ""

log "SEO optimization complete!"
log ""
log "Next steps:"
log "1. Review SEO_CHECKLIST.md"
log "2. Optimize all meta tags"
log "3. Generate sitemap: node scripts/generate-sitemap.js"
log "4. Submit sitemap to Google Search Console"
log "5. Monitor SEO performance"
