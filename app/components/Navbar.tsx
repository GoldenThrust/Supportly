import { Link } from "react-router";

interface NavbarProps {
  showAuthButtons?: boolean;
  currentUser?: {
    name: string;
    email: string;
  } | null;
}

export function Navbar({ showAuthButtons = true, currentUser = null }: NavbarProps) {
  return (
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
          
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  My Profile
                </Link>
                <Link
                  to="/book-session"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Book Session
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Link
                    to="/logout"
                    className="text-gray-600 hover:text-red-600 text-sm"
                  >
                    Logout
                  </Link>
                </div>
              </>
            ) : showAuthButtons ? (
              <>
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
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
