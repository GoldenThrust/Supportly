export const DEV = process.env.NODE_ENV === "development" ? true : false;
export const apiUrl = process.env.API_URL || "http://localhost:3000";
export const clientUrl = process.env.CLIENT_URL || apiUrl;
export const COOKIE_NAME = "supportly_auth_token";
export const domain = (new URL(apiUrl)).hostname