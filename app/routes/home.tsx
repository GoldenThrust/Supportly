import { useAppSelector } from "~/store/hooks";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { selectAuth } from "~/store/selectors";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Supportly: Home" },
    { name: "description", content: "Welcome to Supportly!" },
  ];
}

export default function Home() {
  const { isAuthenticated, user } = useAppSelector(selectAuth);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600" style={{
                fontFamily: "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
                fontVariantCaps: "small-caps",
              }}>
                Supportly
              </h1>
            </div>
            {!isAuthenticated ? (<div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>) : (
              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-indigo-600 px-3 py-2 text-sm font-medium flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600"
                >
                  {user?.name[0] || "Profile"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Video Support Made
              <span className="text-indigo-600"> Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect your customers with your support team through seamless video calls. 
              Schedule meetings, resolve issues faster, and provide exceptional customer service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/book-session"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
              >
                Book a Support Session
              </Link>
              <Link
                to="/dashboard"
                className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg text-lg font-medium"
              >
                Support Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Supportly?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to provide exceptional video support
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Video Calls</h3>
              <p className="text-gray-600">
                High-quality video calls with screen sharing and recording capabilities
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Flexible scheduling system that works with your team's availability
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Issue Resolution</h3>
              <p className="text-gray-600">
                Track and resolve customer issues efficiently with integrated tools
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Support?
              </h2>
              <p className="text-xl text-indigo-200 mb-8">
                Join thousands of companies providing better customer support with video calls
              </p>
              <Link
                to="/signup"
                className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-3 rounded-lg text-lg font-medium"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Supportly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
