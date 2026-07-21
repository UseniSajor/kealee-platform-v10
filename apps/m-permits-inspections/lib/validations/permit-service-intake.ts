import { z } from "zod";

export const permitServiceIntakeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  company: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum([
    "Owner",
    "Project Manager",
    "Foreman",
    "Estimator",
    "Developer",
    "Property Owner",
    "Other"
  ]),
  
  // Contractor Business Details
  contractorType: z.enum([
    "General Contractor",
    "Electrical Contractor",
    "Plumbing Contractor",
    "HVAC Contractor",
    "Framing Contractor",
    "Roofing Contractor",
    "Developer",
    "Property Owner",
    "Homeowner",
    "Other Specialty"
  ]),
  licenseNumber: z.string().optional(),
  yearsInBusiness: z.enum([
    "< 1 year",
    "1-3 years",
    "3-10 years",
    "10-20 years",
    "20+ years"
  ]),
  jurisdictions: z.array(z.string()).min(1, "Select at least one jurisdiction"),
  permitsPerMonth: z.enum([
    "1-5 permits",
    "6-15 permits",
    "16-30 permits",
    "30+ permits"
  ]),
  
  // Service Needs
  servicesNeeded: z.array(z.string()).min(1, "Select at least one service"),
  urgency: z.enum([
    "No rush - planning ahead",
    "Need within 2 weeks",
    "Need within 1 week",
    "Urgent - ASAP"
  ]),
  
  message: z.string().min(10, "Please tell us about your needs (minimum 10 characters)"),
  consent: z.boolean().refine(val => val === true, {
    message: "You must accept the terms"
  }),
  
  // Honeypot and spam prevention
  website: z.string().max(0).optional(),
  submittedAt: z.number()
});

export type PermitServiceIntakeFormData = z.infer<typeof permitServiceIntakeSchema>;
