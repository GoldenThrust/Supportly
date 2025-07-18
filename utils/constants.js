import "dotenv/config";

export const DEV = process.env.NODE_ENV === "development" ? true : false;