import { 
  DollarSign, 
  Clock, 
  Shield, 
  Users, 
  TrendingUp, 
  CheckCircle 
} from 'lucide-react';
import Link from 'next/link';

export function Benefits() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Save 40% on PM Costs',
      description: 'Professional project management at a fraction of traditional consulting fees',
      stat: '$50K+ avg. savings',
    },
    {
      icon: Clock,
      title: 'Deliver 25% Faster',
      description: 'Streamlined workflows and automation eliminate delays and bottlenecks',
      stat: '21 days avg. faster',
    },
    {
      icon: Shield,
      title: 'Reduce Risk by 60%',
      description: 'AI-powered review catches issues before they become expensive problems',
      stat: '85% first-try pass rate',
    },
    {
      icon: Users,
      title: 'Scale Your Team',
      description: 'Access licensed architects, engineers, and PMs on-demand without hiring',
      stat: '100+ professionals',
    },
    {
      icon: TrendingUp,
      title: 'Increase Capacity 3x',
      description: 'Manage more projects simultaneously with better organization and tools',
      stat: '3x more projects',
    },
    {
      icon: CheckCircle,
      title: '94% On-Time Delivery',
      description: 'Real-time tracking and proactive PM keeps projects on schedule',
      stat: 'Industry leading',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Why Construction Teams Choose Kealee
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real results from real construction projects. Join 500+ teams saving time and money.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="
                bg-white rounded-2xl p-8
                border-2 border-gray-200
                hover:border-blue-500 hover:shadow-xl
                transition-all duration-300
                group
              "
            >
              {/* Icon */}
              <div className="
                w-14 h-14 mb-6
                bg-blue-100 group-hover:bg-blue-600
                rounded-xl
                flex items-center justify-center
                transition-colors duration-300
              ">
                <benefit.icon className="text-blue-600 group-hover:text-white transition-colors" size={28} />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4">
                {benefit.description}
              </p>

              {/* Stat */}
              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-blue-600">
                  {benefit.stat}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="https://app.kealee.com/signup"
            className="
              inline-block
              px-8 py-4
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold text-lg
              rounded-xl
              shadow-lg hover:shadow-xl
              transition-all duration-200
              transform hover:scale-105
            "
          >
            Start Your Free Trial
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

