import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="h-screen">
      <div className="h-screen w-full">
        <img
          src="/auth-bg.png"
          alt="Supportly Logo"
          className="w-full"
        />
      </div>

      <div className="h-screen absolute inset-0  max-w-full max-h-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}
