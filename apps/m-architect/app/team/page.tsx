import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Architecture Team | Kealee',
  description: 'Meet the licensed architects and design professionals behind Kealee architecture services.',
};

const teamMembers = [
  {
    name: 'David Chen, AIA',
    role: 'Lead Architect',
    bio: 'David brings over 18 years of experience in residential and mixed-use design. He leads our design team with a focus on sustainable, code-compliant solutions that balance aesthetics with buildability.',
    specialties: ['Residential Design', 'Sustainable Architecture', 'Historic Renovation'],
    initials: 'DC',
  },
  {
    name: 'Sarah Mitchell, RA',
    role: 'Senior Design Architect',
    bio: 'Sarah specializes in commercial interiors and adaptive reuse projects. With a background in both architecture and interior design, she ensures every space is functional, accessible, and visually compelling.',
    specialties: ['Commercial Buildouts', 'Adaptive Reuse', 'Interior Architecture'],
    initials: 'SM',
  },
  {
    name: 'Marcus Rivera, AIA',
    role: 'Construction Documents Lead',
    bio: 'Marcus oversees the production of permit-ready construction documents. His meticulous attention to detail and deep knowledge of building codes ensures smooth permit approvals across jurisdictions.',
    specialties: ['Construction Documents', 'Code Compliance', 'Permit Coordination'],
    initials: 'MR',
  },
  {
    name: 'Priya Patel',
    role: 'Design Technology Manager',
    bio: 'Priya manages our 3D modeling and BIM workflows. She bridges the gap between design intent and digital delivery, ensuring clients receive accurate models and clear visualizations at every project phase.',
    specialties: ['3D Modeling', 'BIM Coordination', 'Design Visualization'],
    initials: 'PP',
  },
];

const teamValues = [
  {
    title: 'Design Excellence',
    description:
      'We hold every project to the highest standard of architectural quality, regardless of size or scope. Good design solves problems and creates lasting value.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
  },
  {
    title: 'Clear Communication',
    description:
      'We believe in keeping clients informed at every step. From initial concept through permit submission, you will always know where your project stands and what comes next.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
  {
    title: 'Code Compliance',
    description:
      'Our architects maintain current knowledge of local and national building codes. We design with permit approval in mind so your project stays on schedule.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Collaborative Process',
    description:
      'Architecture is a partnership. We work closely with project owners, contractors, and permitting authorities to deliver designs that meet everyone\'s needs.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#1A2B4A' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 px-4" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#2DD4BF' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Our Architecture Team
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Licensed architects and design professionals dedicated to delivering exceptional construction design services.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Team Members */}
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#1A2B4A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Meet the Team
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
                      {member.name}
                    </h3>
                    <p className="text-sm font-medium" style={{ color: '#2DD4BF' }}>
                      {member.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {member.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#2DD4BF15', color: '#1A2B4A' }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Values */}
        <section className="mb-16">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#1A2B4A', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            What Drives Us
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {teamValues.map((value) => (
              <div key={value.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A2B4A' }}>
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#1A2B4A' }}
        >
          <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ready to start your project?
          </h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Our team is ready to bring your vision to life. Get a personalized design quote in 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#F97316', color: 'white' }}
            >
              Get a Quote
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <a
              href="mailto:support@kealee.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border border-white/30 text-white transition-colors hover:bg-white/10"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Kealee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
