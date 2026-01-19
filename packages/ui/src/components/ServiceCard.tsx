export interface ServiceCardProps {
  title: string
  description: string
  pricing: string
  icon: string
  link: string
  features: string[]
}

export function ServiceCard({
  title,
  description,
  pricing,
  icon,
  link,
  features,
}: ServiceCardProps) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-lg font-semibold text-blue-600 mb-4">{pricing}</p>

      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={link}
        className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Learn More →
      </a>
    </div>
  )
}
