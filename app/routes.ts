import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), layout("routes/auth/layout.tsx", [
  route("login", "routes/auth/login.tsx"),
  route('signup', "routes/auth/signup.tsx"),
//   index("routes/auth/forgot-password.tsx"),
//   index("routes/auth/reset-password.tsx"),
//   index("routes/auth/verify-email.tsx"),
//   index("routes/auth/change-password.tsx"),
])] satisfies RouteConfig;
