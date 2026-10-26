import express from "express";
import {
  getAvailability,
  createCustomerBooking,
  cancelCustomerBooking,
} from "../Controllers/booking.controller.js";
import { createRateLimiter } from "../Middleware/rateLimiter.js";

const bookingRouter = express.Router();

// Apply rate limiting: 60 requests per minute per IP for public booking operations
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many booking requests from this network. Please wait a moment and try again.",
});

bookingRouter.use(bookingLimiter);

bookingRouter.get("/availability", getAvailability);
bookingRouter.post("/create", createCustomerBooking);
bookingRouter.post("/cancel", cancelCustomerBooking);

export default bookingRouter;
