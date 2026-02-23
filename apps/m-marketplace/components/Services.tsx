import Link from 'next/link';
import { Building2, Users, Pencil, FileCheck, ArrowRight } from 'lucide-react';

type ServiceColor = 'blue' | 'orange' | 'green' | 'purple';

export function Services() {
  const services: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    pricing: string;
    features: string[];
    link: string;
    color: ServiceColor;
  }> = [
    {
      icon: <Building2 size={40} />,
      title: 'Ops Services',
      description:
        'Full-service project management with dedicated PM support',
      pricing: 'From $1,750/month',
      features: [
        '5-40+ hours/week PM time',
        'Multiple project tiers',
        'Weekly progress reports',
        '24/7 priority support',
      ],
      link: '/ops',
      color: 'blue',
    },
    {
      icon: <Users size={40} />,
      title: 'Project Owner Portal',
      description:
        'Track milestones, approve payments, and manage your projects',
      pricing: 'Fees shown at checkout',
      features: [
        'Real-time project tracking',
        'Milestone approval workflow',
        'Contractor management',
        'Payment processing',
      ],
      link: '/owner',
      color: 'orange',
    },
    {
      icon: <Pencil size={40} />,
      title: 'Architect Services',
      description:
        'Professional design and permit-ready plans from licensed architects',
      pricing: 'From $3,500',
      features: [
        'Permit-ready drawings',
        '3D renderings included',
        'Licensed architects',
        'Unlimited revisions',
      ],
      link: '/architect',
      color: 'green',
    },
    {
      icon: <FileCheck size={40} />,
      title: 'Permits & Inspections',
      description: 'AI-powered permit review and fast-track approval',
      pricing: 'From $50/permit',
      features: [
        'AI review in 5 minutes',
        '3,000+ jurisdictions',
        'Inspection scheduling',
        '85% first-try pass rate',
      ],
      link: '/permits',
      color: 'purple',
    },
  ];

  const colorClasses: Record<ServiceColor, string> = {
    blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600',
    orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-600',
    green: 'bg-green-100 text-green-600 group-hover:bg-green-600',
    purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600',
  };

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Project Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage your project from start
            to finish, all in one platform
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.link}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-transparent"
            >
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl ${colorClasses[service.color]} flex items-center justify-center mb-6 transition-colors group-hover:text-white`}
              >
                {service.icon}
              </div>

              {/* Title & Description */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">{service.description}</p>

              {/* Pricing */}
              <div className="text-lg font-semibold text-blue-600 mb-6">
                {service.pricing}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start text-gray-700">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Learn More
                <ArrowRight
                  className="ml-2 group-hover:translate-x-1 transition"
                  size={20}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
