import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Target, Users, Award, Heart, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Customer First',
      description: 'Every decision we make starts with how it benefits our customers',
    },
    {
      icon: Heart,
      title: 'Build with Care',
      description: 'Quality construction requires attention to detail - we bring that same care to our platform',
    },
    {
      icon: TrendingUp,
      title: 'Always Improving',
      description: 'We iterate, learn, and improve based on real user feedback',
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'No hidden fees, no surprises - just honest pricing and clear communication',
    },
  ];

  const team = [
    {
      name: 'Tim Chamberlain',
      role: 'Founder & CEO',
      bio: '20+ years in construction. Built Kealee to solve problems he faced every day.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Building the Future of Construction Management
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Kealee was founded by construction professionals who were frustrated with expensive, complicated project management tools. We built the platform we wished existed - simple, affordable, and actually useful.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-12 text-center">
              <p className="text-2xl text-gray-900 font-medium leading-relaxed">
                "Make professional-grade project management accessible to every construction team, regardless of size or budget."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              These principles guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((value, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <value.icon className="text-blue-600" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">$50M+</div>
              <div className="text-gray-600">Managed Budget</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">94%</div>
              <div className="text-gray-600">On-Time Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet the Team
            </h2>
            <p className="text-xl text-gray-600">
              Construction veterans building better tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-blue-600">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-blue-600 font-semibold mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-blue-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Join 500+ Construction Teams
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start managing your projects better today
            </p>
            
            <Link
              href="https://app.kealee.com/signup"
              className="
                inline-block
                px-8 py-4
                bg-white text-blue-600
                font-semibold text-lg
                rounded-xl
                shadow-lg hover:shadow-xl
                transition-all duration-200
                transform hover:scale-105
              "
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


