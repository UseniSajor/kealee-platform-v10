-- Seed data for packages A-D and a la carte items

-- Service Packages
insert into service_packages (code, name, description, price_range, features, display_order) values
('PACKAGE_A', 'Package A – Field-First Starter', 'PM Assistant, Vendor/sub list setup, Weekly reporting', '$1,750–$2,750 / month', 
 '["PM Assistant", "Vendor/sub list setup", "Weekly reporting"]'::jsonb, 1),

('PACKAGE_B', 'Package B – Schedule & Paperwork Control', 'PM Assistant, Scheduler, Admin & Compliance, Vendor onboarding', '$3,750–$5,500 / month',
 '["PM Assistant", "Scheduler", "Admin & Compliance", "Vendor onboarding"]'::jsonb, 2),

('PACKAGE_C', 'Package C – Bid-to-Build Execution', 'Roles 1–4, Bid package support, Permit tracking (lite), Full warranty execution', '$6,500–$9,500 / month',
 '["PM Assistant", "Scheduler", "Admin & Compliance", "Estimator Support", "Bid package support", "Permit tracking (lite)", "Full warranty execution"]'::jsonb, 3),

('PACKAGE_D', 'Package D – Full Back Office + Growth', 'All Roles (1–5), Full vendor & bid management, Permit tracking, CRM & follow-ups, Priority platform access', '$10,500–$16,500 / month',
 '["PM Assistant", "Scheduler", "Admin & Compliance", "Estimator Support", "Sales / CRM", "Full vendor & bid management", "Permit tracking", "CRM & follow-ups", "Priority platform access"]'::jsonb, 4);

-- A La Carte Service Items
insert into service_items (code, name, description, price_range, category, display_order) values
('PM_ASSISTANT', 'PM Assistant', 'Remote project management assistant', '$1,750–$4,000', 'STAFFING', 1),
('SCHEDULER', 'Scheduler', 'Schedule coordination and updates', '$1,250–$3,500', 'STAFFING', 2),
('ESTIMATOR', 'Estimator Support', 'Bid support and estimation assistance', '$1,500–$4,500', 'STAFFING', 3),
('ADMIN_COMPLIANCE', 'Admin & Compliance', 'Administrative and compliance support', '$1,250–$3,500', 'STAFFING', 4),
('SALES_CRM', 'Sales / CRM', 'Sales and CRM support', '$1,250–$3,500', 'STAFFING', 5),
('BID_PACKAGES', 'Bid Packages', 'Bid package creation and tracking', '$750–$2,500 per project', 'SERVICES', 6),
('PERMIT_TRACKING', 'Permit Tracking', 'Permit submission and approval tracking', '$500–$1,500 per project', 'SERVICES', 7);

-- Create Kealee organization (for internal users)
insert into orgs (id, name, org_type, email, status) values
(gen_random_uuid(), 'Kealee', 'KEALEE', 'admin@kealee.com', 'ACTIVE')
on conflict do nothing;

