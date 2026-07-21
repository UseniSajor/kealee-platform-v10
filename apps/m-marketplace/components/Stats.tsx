export function Stats() {
  const stats = [
    { value: '500+', label: 'Active Projects' },
    { value: '$50M+', label: 'Managed Budget' },
    { value: '94%', label: 'On-Time Delivery' },
    { value: '4.9/5', label: 'Customer Rating' },
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
