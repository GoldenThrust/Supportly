import { useEffect } from "react";
import { Link } from "react-router";

export default function Logout() {
  useEffect(() => {
    // Handle logout logic here
    // Clear any authentication tokens, session data, etc.
    console.log("User logged out");
    
    // In a real app, you might want to:
    // - Clear localStorage/sessionStorage
    // - Make an API call to invalidate the session
    // - Redirect after a delay
    
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-50 w-1/2 text-slate-800 rounded-2xl flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-extrabold text-2xl pb-2 text-indigo-700" style={{
        fontFamily: "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
        fontVariantCaps: "small-caps",
      }}>Successfully Logged Out</h1>
      <p className="text-sm text-center mb-6">
        You have been successfully logged out of <strong>Supportly</strong>. 
        Thank you for using our service!
      </p>
      
      <div className="flex flex-col space-y-3 w-full max-w-11/12">
        <Link
          to="/login"
          className="bg-cyan-900 text-white p-2 rounded-2xl text-center"
        >
          Sign In Again
        </Link>
        <Link
          to="/"
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 p-2 rounded-2xl text-center"
        >
          Go to Homepage
        </Link>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        You will be automatically redirected to the homepage in a few seconds...
      </p>
    </div>
  );
}
