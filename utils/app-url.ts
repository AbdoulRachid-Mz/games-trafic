// @/utils/app-url.ts

//url env return the base url of the app
export const getAppUrlEnv = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NODE_ENV !== "development" && process.env.APP_URL) {
    return process.env.APP_URL;
  }
  return "http://localhost:3000";
};