
import { useEffect, useRef } from "react";
import { useAppSelector } from "../store/hooks";
import { Outlet, useNavigate, useLocation } from "react-router";
import toast from "react-hot-toast";

export default function IsAuthenticated() {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated and not loading
    if (!isLoading && !isAuthenticated && !user) {
      // Show toast only once per navigation
      // if (!hasShownToast.current) {
      //   toast.error("You must be logged in to access this page", {
      //     duration: 3000,
      //   });
      //   hasShownToast.current = true;
      // }
      
      // Save the current location to redirect back after login
      // navigate("/login", { 
      //   state: { from: location.pathname },
      //   replace: true 
      // });
    }
  }, [isAuthenticated, user, isLoading, navigate, location.pathname]);

  // Reset toast flag when location changes
  useEffect(() => {
    hasShownToast.current = false;
  }, [location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Only render children if authenticated
  if (isAuthenticated && user) {
    return <Outlet />;
  }

  // Return null while redirecting
  return null;
}
