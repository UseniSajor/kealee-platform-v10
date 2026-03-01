import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-base font-semibold text-sky-600">404</p>
        <h1 className="mt-2 text-4xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-4 text-lg text-gray-600">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
