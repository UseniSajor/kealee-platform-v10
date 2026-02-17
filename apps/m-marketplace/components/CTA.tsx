import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Projects?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join 500+ successful projects using Kealee. Get started today with
            a free consultation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://app.kealee.com/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition font-semibold text-lg flex items-center justify-center group"
            >
              Start Free Trial
              <ArrowRight
                className="ml-2 group-hover:translate-x-1 transition"
                size={20}
              />
            </Link>
            <a
              href="mailto:contact@kealee.com"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition font-semibold text-lg text-center"
            >
              Contact Sales
            </a>
          </div>

          <p className="mt-6 text-blue-100 text-sm">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
