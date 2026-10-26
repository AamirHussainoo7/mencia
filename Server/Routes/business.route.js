import express from "express";
import { isAuth } from "../Middleware/isAuth.js";
import {
  getBusinessBookings,
  updateBusinessBookingStatus,
} from "../Controllers/booking.controller.js";

const businessRouter = express.Router();

// All business routes require authenticated owner session
businessRouter.use(isAuth);

businessRouter.get("/bookings", getBusinessBookings);
businessRouter.patch("/bookings/:id/status", updateBusinessBookingStatus);

export default businessRouter;
