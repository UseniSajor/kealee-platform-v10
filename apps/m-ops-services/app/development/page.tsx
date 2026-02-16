import Link from 'next/link';

export const metadata = {
  title: 'Development Services | Kealee Operations',
  description: 'End-to-end construction operations and project management services for the DC-Baltimore corridor.',
};

const stats = [
  { value: '500+', label: 'Projects Completed' },
  { value: '98%', label: 'On-Time Delivery' },
  { value: '3,000+', label: 'Jurisdictions Covered' },
  { value: '15+', label: 'Years Experience' },
];

const services = [
  { name: 'Site Assessment', desc: 'Comprehensive pre-construction site evaluations and feasibility studies.', price: '$350' },
  { name: 'Subcontractor Management', desc: 'Vet, hire, and coordinate specialty contractors for your project.', price: '$750' },
  { name: 'Quality Control', desc: 'Multi-point inspection protocols ensuring workmanship standards.', price: '$500' },
  { name: 'Safety Management', desc: 'OSHA-compliant safety programs and site monitoring.', price: '$450' },
  { name: 'Schedule Coordination', desc: 'Critical path scheduling and milestone tracking across all trades.', price: '$600' },
  { name: 'Document Control', desc: 'Drawing management, RFI tracking, and submittal workflows.', price: '$400' },
];

export default function DevelopmentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2B4A] to-[#2a3f6a] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-3">Kealee Operations</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Development Services</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Professional construction operations management for the DC-Baltimore corridor.
            From site assessment through closeout, we handle the complexity so you can focus on building.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/development/services" className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
              View All Services
            </Link>
            <Link href="/development/contact" className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-[#1A2B4A]">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Services Preview */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A2B4A] text-center mb-4">Our Core Services</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Choose individual services or combine them into a comprehensive operations package tailored to your project.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.name} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-[#1A2B4A]">{service.name}</h3>
                  <span className="text-sm font-mono font-bold text-[#F97316]">{service.price}</span>
                </div>
                <p className="text-sm text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/development/services" className="text-[#F97316] font-semibold hover:underline">
              View all 11 services →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A2B4A] text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Tell Us About Your Project', desc: 'Share your project details, timeline, and requirements.' },
              { step: '02', title: 'We Build Your Ops Plan', desc: 'Our team creates a tailored operations plan with the right services.' },
              { step: '03', title: 'We Manage, You Build', desc: 'We handle coordination remotely while you focus on construction.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-[#F97316] text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#1A2B4A] text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/development/how-it-works" className="text-[#F97316] font-semibold hover:underline">
              Learn more about our process →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#1A2B4A] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Operations?</h2>
          <p className="text-gray-300 mb-8">
            Contact our team to discuss your project needs and get a customized operations plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/development/contact" className="px-8 py-3 bg-[#F97316] text-white rounded-lg font-semibold hover:bg-orange-600 transition">
              Contact Us
            </Link>
            <Link href="/development/experience" className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              See Our Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
