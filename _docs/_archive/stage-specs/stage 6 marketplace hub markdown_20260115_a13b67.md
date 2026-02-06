# MARKETPLACE HUB - Complete Build Prompts
## Stage 6: Weeks 15-17 | Revenue Stream: $400K-$1.1M Year 1

### INTEGRATION DEPENDENCIES
- **Requires**: Project Owner Hub (Stage 4), Finance & Trust Hub (Stage 5)
- **Integrates With**: m-permits-inspections (verified contractors), os-admin (approvals)
- **Data Models**: MarketplaceProfile, Portfolio, Lead, Quote, User

---

## WEEK 15: PUBLIC DIRECTORY & CONTRACTOR PROFILES

### Day 1-2: Public-Facing Directory
**Prompt 1.1**: Build public contractor directory:
- Search interface with filters (specialty, location, rating, availability)
- Map view integration (Google Maps/Mapbox)
- Pagination with infinite scroll option
- Sorting options (rating, projects completed, proximity)
- SEO-optimized URLs for each contractor
- Performance optimization for large datasets

**Prompt 1.2**: Create contractor profile pages:
- Public view (for homeowners)
- Private edit view (for contractors)
- Portfolio gallery with project details
- Reviews and ratings system
- Verification badges display
- Contact form with lead tracking
- Social media sharing integration

**Prompt 1.3**: Implement search functionality:
- Full-text search across profiles and portfolios
- Location-based search with radius selector
- Specialty filtering with multi-select
- Price range filtering (for quote history)
- Availability filtering (current workload)
- Saved search functionality for users

### Day 3-4: Profile Management System
**Prompt 1.4**: Build contractor onboarding:
- Step-by-step profile completion wizard
- Business information collection (name, license, insurance)
- Service area definition (zip codes, counties, radius)
- Specialty selection with subcategories
- Portfolio project upload with descriptions
- Bank account setup for payments (Stripe Connect)

**Prompt 1.5**: Create verification system:
- License verification (API integration with state databases)
- Insurance certificate upload and validation
- Background check integration (optional premium feature)
- Work history verification via references
- Identity verification (ID upload + selfie match)
- Badge system (Verified, Premium, Top Rated)

**Prompt 1.6**: Implement portfolio management:
- Project gallery with before/after photos
- Project details (scope, budget, timeline)
- Client testimonials with permission tracking
- Category tagging for searchability
- Featured projects highlighting
- Bulk upload and organization tools

### Day 5: Testing & Optimization
**Prompt 1.7**: Performance testing:
- Load test directory with 10,000+ contractor profiles
- Test search response times under heavy load
- Optimize image loading (lazy load, WebP conversion)
- Implement caching strategy for public pages
- Test mobile performance on 3G/4G networks

**Prompt 1.8**: SEO optimization:
- Generate sitemap with all contractor profiles
- Implement structured data (Schema.org for LocalBusiness)
- Optimize page titles and meta descriptions
- Create location-based landing pages
- Build internal linking structure
- Monitor search console integration

---

## WEEK 16: LEAD DISTRIBUTION & QUOTE WORKFLOWS

### Day 1-2: Lead Generation System
**Prompt 2.1**: Build lead creation interface:
- Project details collection (scope, budget, timeline)
- Location mapping with address validation
- Photo upload for existing conditions
- Privacy controls (public vs. private leads)
- Automatic contractor matching suggestions
- Lead fee calculation based on project value

**Prompt 2.2**: Create smart lead distribution:
- Algorithmic matching based on:
  - Specialty alignment
  - Geographic proximity
  - Past performance on similar projects
  - Current availability
  - Customer ratings
- Configurable distribution rules (max contractors per lead)
- Priority routing for premium subscribers
- Manual assignment option for admins

**Prompt 2.3**: Implement lead management dashboard:
- Incoming leads view for contractors
- Lead status tracking (NEW, VIEWED, QUOTED, AWARDED)
- Response time tracking and scoring
- Lead expiration with reminders
- Archive and analytics for past leads
- Integration with calendar for follow-ups

### Day 3-4: Quote & Proposal System
**Prompt 2.4**: Build quote creation workflow:
- Template system for common project types
- Line-item breakdown with cost calculation
- Materials list with sourcing options
- Timeline visualization with milestones
- Terms and conditions inclusion
- Digital signature integration for acceptance

**Prompt 2.5**: Create quote comparison interface:
- Side-by-side comparison for homeowners
- Scorecard system (price, timeline, ratings, inclusions)
- Chat functionality with contractors
- Question/answer section per quote
- Favorite/shortlist functionality
- Award workflow with single click

**Prompt 2.6**: Implement negotiation system:
- Counter-offer functionality
- Revision tracking with version history
- Private messaging between parties
- Document attachment for clarifications
- Deadline management with reminders
- Automatic conversion to contract upon acceptance

### Day 5: Testing & Analytics
**Prompt 2.7**: Lead distribution testing:
- Test matching algorithm with varied scenarios
- Test distribution limits and priority rules
- Test notification delivery (email, SMS, in-app)
- Test contractor response tracking
- Test lead expiration and cleanup

**Prompt 2.8**: Analytics implementation:
- Lead-to-quote conversion rates
- Quote-to-award conversion rates
- Average response times by contractor
- Geographic heat maps of lead demand
- Seasonal trend analysis
- ROI calculation for subscription tiers

---

## WEEK 17: SUBSCRIPTION TIERS & PERFORMANCE SCORING

### Day 1-2: Subscription Management
**Prompt 3.1**: Build tiered subscription system:
- Free tier: Basic profile, limited leads per month
- Professional tier ($49/month): More leads, featured placement
- Business tier ($149/month): Premium matching, analytics
- Enterprise tier ($399/month): Dedicated support, API access
- Stripe integration for recurring billing
- Tier upgrade/downgrade workflow

**Prompt 3.2**: Create subscription features matrix:
- Lead credits allocation per tier
- Profile visibility enhancements
- Analytics dashboard access levels
- Support response time guarantees
- Custom branding options
- API rate limits per tier

**Prompt 3.3**: Implement billing and invoices:
- Monthly invoice generation
- Usage-based overage charges
- Proration for mid-cycle changes
- Payment failure handling and dunning
- Tax calculation and inclusion
- Export for accounting integration

### Day 3-4: Performance Scoring & Reputation
**Prompt 3.4**: Build performance scoring algorithm:
- Response time score (weight: 25%)
- Quote acceptance rate (weight: 25%)
- Project completion rating (weight: 30%)
- On-time delivery history (weight: 15%)
- Communication quality (weight: 5%)
- Daily recalculation with trend analysis

**Prompt 3.5**: Create review and rating system:
- Multi-dimensional ratings (quality, communication, timeliness, cleanliness)
- Photo verification for project completion
- Response to reviews (contractor rebuttal)
- Fraud detection for fake reviews
- Review moderation workflow
- Impact on search ranking and matching

**Prompt 3.6**: Implement badge and achievement system:
- Automatic badges (Fast Responder, Highly Rated, Top Performer)
- Milestone achievements (50 projects, 5 years on platform)
- Specialization badges (Kitchen Expert, Bathroom Specialist)
- Verification badges (License Verified, Insured, Background Checked)
- Display logic for profile enhancement

### Day 5: Integration Finalization
**Prompt 3.7**: Complete Project Owner Hub integration:
- Test contractor selection from marketplace
- Test automatic contract creation from awarded quotes
- Test performance scoring updates from project completion
- Test payment integration for marketplace fees
- Test permit requirement checking for contractor licenses

**Prompt 3.8**: Build admin moderation interface:
- Profile approval workflow
- Dispute resolution between homeowners/contractors
- Review moderation tools
- Performance score adjustments (with audit trail)
- Bulk operations for seasonal updates
- Reporting on marketplace health metrics

### Day 6: Launch Preparation
**Prompt 3.9**: Marketplace liquidity planning:
- Onboard initial contractor base (target: 100+ in launch market)
- Create seed leads to stimulate activity
- Implement contractor referral program
- Set up co-marketing with trade associations
- Develop content strategy for SEO lead generation

**Prompt 3.10**: Performance and security finalization:
- Load testing with simulated marketplace activity
- Security audit for user-generated content
- Spam prevention measures
- Fraud detection for fake profiles
- Backup strategy for marketplace data
- Rollout plan with feature flags

---

## ACCESSIBILITY REQUIREMENTS (All Components)

**Marketplace Accessibility:**
- All search filters must be keyboard navigable
- Contractor cards must have proper ARIA labels
- Map interfaces must have text alternatives
- Rating stars must be screen reader friendly
- Comparison tables must be accessible
- File upload must work with screen readers

**Mobile Experience:**
- Touch-friendly contractor cards
- Swipe gestures for portfolio galleries
- Offline support for saved contractors
- Camera integration for lead photos
- Location services for proximity search
- Push notifications for lead alerts

## PERFORMANCE TARGETS

**Directory Performance:**
- Page load: < 2 seconds for search results
- Search response: < 500ms for 10,000 records
- Image loading: Progressive JPEGs with placeholders
- Map rendering: < 1 second for 100 markers
- Mobile performance: < 3-second load on 4G

**Scalability:**
- Support 10,000+ contractor profiles
- Handle 1,000+ concurrent searches
- Process 500+ leads per hour during peak
- Support 100+ simultaneous quote creations
- Maintain performance during geographic expansion

**Reliability:**
- 99.9% uptime for marketplace functions
- Real-time synchronization for lead status
- Zero data loss for quotes and negotiations
- Automatic failover for search infrastructure
- 24/7 monitoring with 5-minute detection SLA

## SECURITY REQUIREMENTS

**User Data Protection:**
- Encrypt all personal contact information
- Secure file upload with virus scanning
- Rate limiting for contact forms to prevent spam
- Privacy controls for contractor contact information
- Data retention policies with automatic cleanup

**Fraud Prevention:**
- Identity verification for contractor claims
- Duplicate profile detection
- Fake review detection algorithms
- Lead fraud prevention (fake project detection)
- Payment fraud monitoring

**Compliance:**
- ADA compliance for public directory
- GDPR/CCPA compliance for user data
- FCRA compliance for background checks (when used)
- Truth in advertising compliance for claims
- State contractor licensing law compliance

## MONITORING & ANALYTICS

**Key Metrics to Track:**
- Monthly Active Contractors (MAC)
- Monthly Active Homeowners (MAH)
- Lead-to-Quote Conversion Rate
- Quote-to-Award Conversion Rate
- Average Response Time
- Customer Satisfaction Score (CSAT)
- Net Promoter Score (NPS)
- Monthly Recurring Revenue (MRR)
- Churn Rate by subscription tier

**Alerting Requirements:**
- Unusual spike in lead creation
- System performance degradation
- Fraud pattern detection
- Subscription payment failures
- Review spam detection
- Geographic expansion opportunities

---

## INTEGRATION CHECKLIST

Before Week 17 completion, verify:
✅ Contractor profiles integrate with Project Owner contractor selection
✅ Lead distribution connects to contractor availability and specialties
✅ Quote acceptance automatically creates contracts in Project Owner
✅ Performance scoring updates from project completion data
✅ Subscription billing integrates with Finance & Trust payment processing
✅ Verification system checks integrate with permit requirements
✅ All marketplace data accessible in os-admin for moderation
✅ Mobile experience works seamlessly on all devices
✅ Accessibility audit completed with all issues resolved
✅ Performance targets achieved under simulated load
✅ Security measures implemented for user-generated content

---

## WEEK 17 LAUNCH DELIVERABLES

1. **Full-Featured Marketplace Hub** with directory, leads, and quotes
2. **Subscription Management System** with tiered pricing
3. **Performance Scoring Engine** with algorithm documentation
4. **Verification System** for contractor credentials
5. **Admin Moderation Tools** for marketplace management
6. **Analytics Dashboard** for marketplace health monitoring
7. **Integration Test Suite** covering all marketplace scenarios
8. **Launch Marketing Package** for contractor acquisition
9. **First 100 Contractor Profiles** onboarded and verified
10. **Initial Lead Generation Strategy** with SEO and partnerships

---

**Next Step**: After Marketplace Hub launch, continue to Architect Hub (Week 18) to complete the design-to-permit workflow integration.