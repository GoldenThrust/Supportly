import { type RouteConfig, index, layout, prefix } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), layout("routes/auth/layout.tsx", [
  index("routes/auth/login.tsx"),
  index("routes/auth/register.tsx"),
//   index("routes/auth/forgot-password.tsx"),
//   index("routes/auth/reset-password.tsx"),
//   index("routes/auth/verify-email.tsx"),
//   index("routes/auth/change-password.tsx"),
])] satisfies RouteConfig;
