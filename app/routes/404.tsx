import { Link } from "react-router";

export function meta() {
  return [
    { title: "Page Not Found - Supportly" },
    { name: "description", content: "The page you're looking for doesn't exist" },
  ];
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600" style={{
                fontFamily: "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
                fontVariantCaps: "small-caps",
              }}>
                Supportly
              </h1>
            </Link>
          </div>
        </div>
      </nav>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Sorry, we couldn't find the page you're looking for. 
              The page might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Go Back Home
            </Link>
            
            <Link
              to="/book-session"
              className="block w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium"
            >
              Book a Support Session
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@supportly.com"
                className="text-indigo-600 hover:text-indigo-800"
              >
                support@supportly.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
