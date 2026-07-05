export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to AruStore
        </h1>
        <p className="text-gray-600">Premium E-commerce Platform</p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/api" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            API Docs
          </a>
          <a href="/admin" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            Admin Panel
          </a>
        </div>
      </div>
    </div>
  )
}
