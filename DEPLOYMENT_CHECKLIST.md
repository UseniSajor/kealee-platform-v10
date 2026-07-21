# Deployment Checklist - Complete

## Pre-Deployment Checklist

### Infrastructure
- [ ] S3/R2 storage bucket created
- [ ] Bucket policy configured
- [ ] CORS configured
- [ ] SSL certificates valid for all domains
- [ ] DNS records configured
- [ ] Backend API deployed and accessible

### Environment Variables
- [ ] Backend API environment variables set
- [ ] m-marketplace environment variables set
- [ ] os-admin environment variables set
- [ ] os-pm environment variables set
- [ ] m-ops-services environment variables set
- [ ] m-project-owner environment variables set
- [ ] m-architect environment variables set
- [ ] m-permits-inspections environment variables set

### Vercel Setup
- [ ] All 7 projects added to Vercel
- [ ] All domains configured
- [ ] DNS records pointing to Vercel
- [ ] Environment variables set in Vercel
- [ ] Build settings configured

### Monitoring
- [ ] Sentry projects created for all apps
- [ ] Sentry DSNs added to environment variables
- [ ] LogRocket projects created
- [ ] LogRocket app IDs added
- [ ] Datadog RUM configured
- [ ] UptimeRobot monitors created
- [ ] Alert notifications configured

---

## Phase 1: Critical Infrastructure

### Stripe Webhook Handler
- [ ] `STRIPE_WEBHOOK_SECRET` configured in backend API
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] All event types selected
- [ ] Test webhook with Stripe CLI
- [ ] Verify webhook processing in logs
- [ ] Test `checkout.session.completed` event
- [ ] Test `invoice.payment_failed` event
- [ ] Test `customer.subscription.updated` event
- [ ] Verify database sync

### m-marketplace Landing Page
- [ ] Deploy to staging
- [ ] Verify analytics tracking (GA4, Facebook Pixel, GTM)
- [ ] Test SEO meta tags
- [ ] Verify PerformanceMonitor active
- [ ] Test error tracking (Sentry)
- [ ] Deploy to production

### SSL Certificates
- [ ] Run SSL test script
- [ ] Fix any certificate issues
- [ ] Verify all subdomains have valid certificates
- [ ] Set up automatic renewal
- [ ] Test all domains

---

## Phase 2: API Integration & Payments

### os-admin API Integration
- [ ] Verify API service is being used
- [ ] Replace all mock data with API calls
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all API endpoints
- [ ] Deploy to staging
- [ ] Test in staging environment

### os-pm API Integration
- [ ] Verify API client is being used
- [ ] Replace all mock data with API calls
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test all API endpoints
- [ ] Deploy to staging
- [ ] Test in staging environment

### Payment Processing
- [ ] Complete Stripe UI integration
- [ ] Test subscription checkout flow
- [ ] Test one-time payment flow
- [ ] Test payment method management
- [ ] Verify webhook processing
- [ ] Test payment history
- [ ] Deploy to staging
- [ ] Test end-to-end payment flow

---

## Phase 3: App-Specific Deployments

### m-architect File Upload
- [ ] Set up S3/R2 storage bucket
- [ ] Configure bucket policy
- [ ] Configure CORS
- [ ] Set environment variables
- [ ] Verify file upload components connected
- [ ] Test small file upload (< 10MB)
- [ ] Test large file upload (> 100MB)
- [ ] Test version control
- [ ] Test file download
- [ ] Test collaboration features
- [ ] Verify file encryption
- [ ] Deploy to staging
- [ ] Test in staging

### m-permits-inspections
- [ ] Replace permit-application-form placeholders
- [ ] Implement business-rules-editor
- [ ] Implement calendar-manager
- [ ] Implement inspector-zone-manager
- [ ] Implement review-discipline-config
- [ ] Implement permit-type-config
- [ ] Connect to permit API
- [ ] Connect to inspection API
- [ ] Remove all mock data
- [ ] Test permit application flow
- [ ] Test inspection scheduling
- [ ] Deploy to staging
- [ ] Test in staging

### m-project-owner
- [ ] Complete DocuSign UI integration
- [ ] Complete payment UI integration
- [ ] Test contract creation
- [ ] Test contract signing flow
- [ ] Test payment processing
- [ ] Test end-to-end workflow (Contract → Sign → Pay)
- [ ] Test milestone payments
- [ ] Deploy to staging
- [ ] Test in staging

---

## Phase 4: Vercel & Monitoring

### Vercel Projects
- [ ] Add all 7 projects to Vercel
- [ ] Configure all domains
- [ ] Set up DNS records
- [ ] Configure build settings
- [ ] Set up Git integration
- [ ] Configure preview deployments

### Environment Variables
- [ ] Set common variables for all apps
- [ ] Set app-specific variables
- [ ] Verify variables for Production
- [ ] Verify variables for Preview
- [ ] Verify variables for Development
- [ ] Test configuration

### Monitoring
- [ ] Set up Sentry for all apps
- [ ] Set up LogRocket for all apps
- [ ] Set up Datadog RUM
- [ ] Create UptimeRobot monitors
- [ ] Configure alert notifications
- [ ] Test error tracking
- [ ] Test session replay
- [ ] Test performance monitoring

---

## Testing Checklist

### API Connectivity
- [ ] All apps can connect to backend API
- [ ] Authentication works
- [ ] CORS configured correctly
- [ ] API responses are correct

### File Uploads
- [ ] Small files upload successfully
- [ ] Large files upload successfully
- [ ] File type validation works
- [ ] File encryption enabled
- [ ] Version control works
- [ ] Collaboration features work

### Payments
- [ ] Subscription checkout works
- [ ] One-time payments work
- [ ] Payment methods can be added
- [ ] Payment methods can be deleted
- [ ] Webhooks are processed
- [ ] Database syncs correctly

### Permits
- [ ] Permit applications can be submitted
- [ ] Inspections can be scheduled
- [ ] All placeholders removed
- [ ] API integration works

### Contracts & Payments
- [ ] Contracts can be created
- [ ] DocuSign integration works
- [ ] Contracts can be signed
- [ ] Payments can be processed
- [ ] End-to-end workflow works

---

## Post-Deployment

### Verification
- [ ] All apps accessible at their domains
- [ ] SSL certificates valid
- [ ] No console errors
- [ ] No API errors
- [ ] Monitoring working
- [ ] Alerts configured

### Performance
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] File upload speeds acceptable
- [ ] No memory leaks
- [ ] No performance regressions

### Security
- [ ] Authentication working
- [ ] Authorization working
- [ ] File uploads secure
- [ ] API endpoints protected
- [ ] Environment variables secure
- [ ] No sensitive data exposed

---

## Rollback Plan

### If Deployment Fails
1. Identify the failing component
2. Check deployment logs
3. Rollback using Vercel Dashboard
4. Or use rollback script: `./scripts/rollback.sh production`
5. Fix issues
6. Redeploy

### If Critical Issues Found
1. Immediately rollback affected app
2. Notify team
3. Investigate issue
4. Fix in staging
5. Test thoroughly
6. Redeploy

---

## Success Criteria

### All Apps
- ✅ Accessible at their domains
- ✅ SSL certificates valid
- ✅ No critical errors
- ✅ Monitoring active
- ✅ Performance acceptable

### Backend API
- ✅ All endpoints working
- ✅ Webhooks processing
- ✅ Database syncing
- ✅ File storage working

### Integrations
- ✅ Stripe working
- ✅ DocuSign working
- ✅ File uploads working
- ✅ API connectivity working

---

## Next Steps After Deployment

1. Monitor all apps for 24-48 hours
2. Review error logs daily
3. Check performance metrics
4. Gather user feedback
5. Fix any issues found
6. Optimize performance
7. Plan next iteration
