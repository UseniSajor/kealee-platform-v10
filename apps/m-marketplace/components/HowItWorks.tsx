export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Choose Your Service',
      description:
        'Select from PM services, project tracking, architect tools, or permit processing based on your needs.',
    },
    {
      number: '02',
      title: 'Get Started',
      description:
        "Sign up in minutes and connect with our team. We'll guide you through setup and onboarding.",
    },
    {
      number: '03',
      title: 'Manage & Track',
      description:
        'Use our platform to manage projects, track progress, and collaborate with your team in real-time.',
    },
    {
      number: '04',
      title: 'Deliver Success',
      description:
        'Complete projects on time and under budget with our tools, support, and expert guidance.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started in 4 simple steps and transform how you manage
            projects
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line (not on last item) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-blue-200 z-0"
                  style={{ width: 'calc(100% - 3rem)' }}
                />
              )}

              {/* Step Number */}
              <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 relative z-10">
                {step.number}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
