/**
 * Lightweight, zero-dependency in-memory sliding window rate limiter.
 * Limits requests per client IP within a configurable time window.
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000, // 1 minute default
  max = 60, // 60 requests per minute
  message = "Too many requests. Please try again later.",
}) => {
  const requests = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const active = timestamps.filter((time) => now - time < windowMs);
      if (active.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, active);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Get client IP address
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown-ip";

    const now = Date.now();
    const timestamps = requests.get(ip) || [];
    const recent = timestamps.filter((time) => now - time < windowMs);

    if (recent.length >= max) {
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    recent.push(now);
    requests.set(ip, recent);
    next();
  };
};
