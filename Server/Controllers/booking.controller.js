import mongoose from "mongoose";
import Booking from "../Models/booking.model.js";
import User from "../Models/user.model.js";
import {
  getAvailableSlots,
  createBooking,
  cancelBookingByCustomer,
  updateBookingStatusByOwner,
  validateBookingSettings,
} from "../Services/booking.service.js";

/**
 * Public endpoint: Checks slot availability for a business, date, and party size.
 * GET /api/booking/availability
 */
export const getAvailability = async (req, res) => {
  try {
    const { businessId, date, partySize } = req.query;

    if (!businessId || !date) {
      return res.status(400).json({
        success: false,
        message: "businessId and date (YYYY-MM-DD) are required parameters.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid businessId format.",
      });
    }

    const numParty = partySize ? Number(partySize) : 2;
    if (isNaN(numParty) || numParty < 1) {
      return res.status(400).json({
        success: false,
        message: "partySize must be a positive number.",
      });
    }

    const result = await getAvailableSlots({
      businessId,
      date,
      partySize: numParty,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Availability error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to check availability.",
    });
  }
};

/**
 * Public endpoint: Creates a confirmed reservation.
 * POST /api/booking/create
 */
export const createCustomerBooking = async (req, res) => {
  try {
    const {
      businessId,
      customerName,
      customerPhone,
      date,
      slotId,
      partySize,
      idempotencyKey,
      notes,
      confirmationAcknowledged,
    } = req.body;

    if (!confirmationAcknowledged) {
      return res.status(400).json({
        success: false,
        message: "Explicit customer confirmation is required to finalize booking.",
      });
    }

    if (!businessId || !customerName || !customerPhone || !date || !slotId || !partySize) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking details (businessId, customerName, customerPhone, date, slotId, partySize).",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid businessId format.",
      });
    }

    const { booking, cancellationToken, isDuplicate } = await createBooking({
      businessId,
      customerName,
      customerPhone,
      date,
      slotId,
      partySize,
      idempotencyKey,
      notes,
    });

    // Exclude cancellationHash from the returned customer payload
    const bookingJson = booking.toObject ? booking.toObject() : { ...booking };
    delete bookingJson.cancellationHash;

    return res.status(isDuplicate ? 200 : 201).json({
      success: true,
      message: isDuplicate ? "Booking already confirmed." : "Reservation successfully confirmed!",
      booking: bookingJson,
      cancellationToken, // Disclosed to the customer for subsequent authorized cancellation
    });
  } catch (error) {
    console.error("Create booking error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create reservation.",
    });
  }
};

/**
 * Public endpoint: Cancels a reservation using booking reference and bearer token.
 * POST /api/booking/cancel
 */
export const cancelCustomerBooking = async (req, res) => {
  try {
    const { bookingReference, cancellationToken } = req.body;

    if (!bookingReference || !cancellationToken) {
      return res.status(400).json({
        success: false,
        message: "bookingReference and cancellationToken are required.",
      });
    }

    const { booking, alreadyCancelled } = await cancelBookingByCustomer({
      bookingReference,
      cancellationToken,
    });

    const bookingJson = booking.toObject ? booking.toObject() : { ...booking };
    delete bookingJson.cancellationHash;

    return res.status(200).json({
      success: true,
      message: alreadyCancelled
        ? "This reservation was already cancelled."
        : "Reservation successfully cancelled.",
      booking: bookingJson,
    });
  } catch (error) {
    console.error("Cancel booking error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel reservation.",
    });
  }
};

/**
 * Owner endpoint: Lists bookings for the authenticated business.
 * GET /api/business/bookings
 */
export const getBusinessBookings = async (req, res) => {
  try {
    const businessId = req.userId;
    const { date, status, page = 1, limit = 20 } = req.query;

    const query = { businessId };

    if (date) {
      query.bookingDate = date;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .select("-cancellationHash") // Never expose cancellation hash in list queries
        .sort({ bookingDate: -1, startTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        bookings,
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Fetch business bookings error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings.",
    });
  }
};

/**
 * Owner endpoint: Updates status of a booking (complete, cancel, no_show).
 * PATCH /api/business/bookings/:id/status
 */
export const updateBusinessBookingStatus = async (req, res) => {
  try {
    const businessId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (completed, cancelled, no_show).",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const updated = await updateBookingStatusByOwner({
      businessId,
      bookingId: id,
      newStatus: status,
    });

    const bookingJson = updated.toObject ? updated.toObject() : { ...updated };
    delete bookingJson.cancellationHash;

    return res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking: bookingJson,
    });
  } catch (error) {
    console.error("Update booking status error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update booking status.",
    });
  }
};

/**
 * Owner endpoint: Updates and validates booking settings for authenticated business.
 * PATCH /api/user/booking-settings
 */
export const updateBookingSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Business owner not found.",
      });
    }

    const {
      bookingEnabled,
      location,
      timezone,
      workingDays,
      openingTime,
      closingTime,
      slots,
      seatsPerTable,
      maxPartySize,
      advanceDaysLimit,
      minNoticeMinutes,
      cancellationPolicy,
    } = req.body;

    const validation = validateBookingSettings({
      slots,
      workingDays,
      maxPartySize,
      advanceDaysLimit,
      minNoticeMinutes,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking configuration.",
        errors: validation.errors,
      });
    }

    const currentSettings = user.bookingSettings || {};

    user.bookingSettings = {
      bookingEnabled: bookingEnabled !== undefined ? Boolean(bookingEnabled) : currentSettings.bookingEnabled,
      location: location !== undefined ? String(location).trim() : currentSettings.location,
      timezone: timezone || currentSettings.timezone || "Asia/Kolkata",
      workingDays: Array.isArray(workingDays) ? workingDays : currentSettings.workingDays,
      openingTime: openingTime || currentSettings.openingTime || "10:00",
      closingTime: closingTime || currentSettings.closingTime || "22:00",
      slots: Array.isArray(slots)
        ? slots.map((s) => ({
            slotId: s.slotId || new mongoose.Types.ObjectId().toString(),
            name: s.name || `${s.startTime} - ${s.endTime}`,
            startTime: s.startTime,
            endTime: s.endTime,
            capacity: Number(s.capacity) || 5,
            seatsPerTable: Number(s.seatsPerTable) || 4,
          }))
        : currentSettings.slots,
      seatsPerTable: seatsPerTable !== undefined ? Number(seatsPerTable) : currentSettings.seatsPerTable,
      maxPartySize: maxPartySize !== undefined ? Number(maxPartySize) : currentSettings.maxPartySize,
      advanceDaysLimit: advanceDaysLimit !== undefined ? Number(advanceDaysLimit) : currentSettings.advanceDaysLimit,
      minNoticeMinutes: minNoticeMinutes !== undefined ? Number(minNoticeMinutes) : currentSettings.minNoticeMinutes,
      cancellationPolicy:
        cancellationPolicy !== undefined ? String(cancellationPolicy).trim() : currentSettings.cancellationPolicy,
    };

    // Notice: Do NOT touch user.geminiStatus or other assistant fields here!
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Booking settings updated successfully.",
      bookingSettings: user.bookingSettings,
    });
  } catch (error) {
    console.error("Update booking settings error:", error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to update booking settings: ${error.message}`,
    });
  }
};
