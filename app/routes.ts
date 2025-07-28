import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./auth/authprovider.tsx", [
    index("routes/home.tsx"),
    layout("./auth/isAuthenticated.tsx", [
      route("book-session", "routes/book-session.tsx"),
      route("booking-confirmation", "routes/booking-confirmation.tsx"),
      route("dashboard", "routes/dashboard.tsx"),
      route("profile", "routes/profile.tsx"),
      route("video-call/:sessionId", "routes/video-call.$sessionId.tsx"),
      route("logout", "routes/auth/logout.tsx"),
    ]),
    layout("routes/auth/layout.tsx", [
      route("login", "routes/auth/login.tsx"),
      route("signup", "routes/auth/signup.tsx"),
      route("forgot-password", "routes/auth/forgot-password.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
