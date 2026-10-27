export const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";
export const CLIENT_URL =
  import.meta.env.VITE_CLIENT_URL ||
  (typeof window !== "undefined" && window.location.origin ? window.location.origin : "http://localhost:5173");

