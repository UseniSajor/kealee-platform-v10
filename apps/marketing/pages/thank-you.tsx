export default function ThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-6">✓</div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Thank You!
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          We have received your request and will contact you within 24 hours.
        </p>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-lg text-gray-700 mb-4">
            Need immediate assistance?
          </p>
          <a 
            href="tel:+12404673388"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-blue-700"
          >
            Call (240) 467-3388
          </a>
        </div>
      </div>
    </div>
  );
}