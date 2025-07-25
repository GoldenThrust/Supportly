import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAppSelector } from "~/store/hooks";

export default function AuthLayout() {
    const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
  
    useEffect(() => {
      if (isAuthenticated) {
        navigate('/dashboard');
      }
    }, [isAuthenticated, navigate]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Auth Card Container */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          <Outlet />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-xl animate-pulse delay-1000"></div>
    </div>
  );
}
