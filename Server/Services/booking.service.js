import crypto from "crypto";
import Booking from "../Models/booking.model.js";
import SlotCapacity from "../Models/slotCapacity.model.js";
import User from "../Models/user.model.js";

/**
 * Normalizes phone numbers (removes spaces, hyphens, brackets).
 * Validates length between 7 and 15 digits, allowing leading +.
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== "string") {
    throw new Error("Phone number is required");
  }
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(cleaned)) {
    throw new Error("Invalid phone number format. Provide 7-15 digits with optional country code.");
  }
  return cleaned;
};

/**
 * Validates HH:mm 24-hour time strings.
 */
export const isValidTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return false;
  const match = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return Boolean(match);
};

/**
 * Converts "HH:mm" (24-hour) to 12-hour format with AM/PM (e.g., "08:00 PM").
 */
export const format12Hour = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return timeStr || "";
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

/**
 * Converts "HH:mm" to minutes since midnight for easy comparison.
 */
export const timeToMinutes = (timeStr) => {
  const [hours, mins] = timeStr.split(":").map(Number);
  return hours * 60 + mins;
};

/**
 * Validates booking configuration settings for a business.
 */
export const validateBookingSettings = (settings) => {
  const errors = [];
  if (!settings) {
    return { valid: false, errors: ["Settings object is required"] };
  }

  if (settings.maxPartySize !== undefined && (typeof settings.maxPartySize !== "number" || settings.maxPartySize < 1)) {
    errors.push("maxPartySize must be a positive integer");
  }

  if (settings.advanceDaysLimit !== undefined && (typeof settings.advanceDaysLimit !== "number" || settings.advanceDaysLimit < 1)) {
    errors.push("advanceDaysLimit must be a positive integer");
  }

  if (settings.minNoticeMinutes !== undefined && (typeof settings.minNoticeMinutes !== "number" || settings.minNoticeMinutes < 0)) {
    errors.push("minNoticeMinutes must be a non-negative integer");
  }

  const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  if (Array.isArray(settings.workingDays)) {
    for (const day of settings.workingDays) {
      if (!validDays.includes(String(day).toLowerCase())) {
        errors.push(`Invalid working day: ${day}`);
      }
    }
  }

  // Validate slots
  if (Array.isArray(settings.slots)) {
    const slotTimes = [];
    for (let i = 0; i < settings.slots.length; i++) {
      const slot = settings.slots[i];
      if (!slot.startTime || !isValidTime(slot.startTime)) {
        errors.push(`Slot ${i + 1}: Invalid startTime (${slot.startTime})`);
        continue;
      }
      if (!slot.endTime || !isValidTime(slot.endTime)) {
        errors.push(`Slot ${i + 1}: Invalid endTime (${slot.endTime})`);
        continue;
      }

      const startMin = timeToMinutes(slot.startTime);
      const endMin = timeToMinutes(slot.endTime);
      if (startMin >= endMin) {
        errors.push(`Slot ${i + 1}: startTime (${slot.startTime}) must be strictly earlier than endTime (${slot.endTime})`);
        continue;
      }

      if (typeof slot.capacity !== "number" || slot.capacity < 1) {
        errors.push(`Slot ${i + 1}: capacity must be a positive number`);
      }

      slotTimes.push({ index: i + 1, startMin, endMin });
    }

    // Check for overlapping slots
    slotTimes.sort((a, b) => a.startMin - b.startMin);
    for (let i = 0; i < slotTimes.length - 1; i++) {
      const current = slotTimes[i];
      const next = slotTimes[i + 1];
      if (current.endMin > next.startMin) {
        errors.push(`Slots ${current.index} and ${next.index} overlap in time.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Returns date components in the specified business timezone.
 */
export const getNowInTimezone = (timezone = "UTC") => {
  const validTimezone = timezone || "UTC";
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: validTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });

  const parts = formatter.formatToParts(now);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const dateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const timeStr = `${partMap.hour}:${partMap.minute}`;
  const dayOfWeek = (partMap.weekday || "").toLowerCase();

  return {
    dateStr,
    timeStr,
    dayOfWeek,
    totalMinutesToday: timeToMinutes(timeStr),
  };
};

/**
 * Calculates day of week for a given YYYY-MM-DD string.
 */
export const getDayOfWeekForDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Month is 0-indexed in JS Date
  const date = new Date(Date.UTC(year, month - 1, day));
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getUTCDay()];
};

/**
 * Computes difference in calendar days between two YYYY-MM-DD strings.
 */
export const calendarDaysDifference = (fromYmd, toYmd) => {
  const [y1, m1, d1] = fromYmd.split("-").map(Number);
  const [y2, m2, d2] = toYmd.split("-").map(Number);
  const date1 = Date.UTC(y1, m1 - 1, d1);
  const date2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((date2 - date1) / msPerDay);
};

/**
 * Generates an alphanumeric booking reference.
 */
export const generateBookingReference = () => {
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `BK-${randomPart}`;
};

/**
 * Generates a cryptographically secure cancellation bearer token and its SHA-256 hash.
 */
export const generateCancellationCredentials = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hash };
};

/**
 * Verifies a provided cancellation token against a stored SHA-256 hash.
 */
export const verifyCancellationCredentials = (rawToken, storedHash) => {
  if (!rawToken || !storedHash || typeof rawToken !== "string") return false;
  const computedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
};

/**
 * Calculates number of tables required for a party.
 */
export const calculateRequiredTables = (partySize, seatsPerTable = 4) => {
  const seats = Math.max(1, seatsPerTable);
  return Math.max(1, Math.ceil(partySize / seats));
};

/**
 * Retrieves availability for a specific date and party size.
 */
export const getAvailableSlots = async ({ businessId, date, partySize = 2, userDoc = null }) => {
  const user = userDoc || (await User.findById(businessId));
  if (!user) {
    throw new Error("Business not found");
  }

  const settings = user.bookingSettings || {};
  if (!settings.bookingEnabled) {
    return {
      bookingEnabled: false,
      message: "Online reservations are currently not enabled for this business.",
      slots: [],
    };
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD.");
  }

  const nowInfo = getNowInTimezone(settings.timezone || "Asia/Kolkata");
  const diffDays = calendarDaysDifference(nowInfo.dateStr, date);

  if (diffDays < 0) {
    return {
      bookingEnabled: true,
      message: "Cannot check availability or book dates in the past.",
      slots: [],
    };
  }

  const advanceLimit = settings.advanceDaysLimit || 30;
  if (diffDays > advanceLimit) {
    return {
      bookingEnabled: true,
      message: `Reservations are only accepted up to ${advanceLimit} days in advance.`,
      slots: [],
    };
  }

  const targetDayOfWeek = getDayOfWeekForDate(date);
  const workingDays = (settings.workingDays || []).map((d) => d.toLowerCase());
  if (workingDays.length > 0 && !workingDays.includes(targetDayOfWeek)) {
    return {
      bookingEnabled: true,
      message: `The restaurant is closed on ${targetDayOfWeek}s.`,
      slots: [],
    };
  }

  const maxParty = settings.maxPartySize || 12;
  if (partySize > maxParty) {
    return {
      bookingEnabled: true,
      message: `Maximum party size for online reservations is ${maxParty} people. Please contact the restaurant directly for larger parties.`,
      slots: [],
    };
  }

  const requiredTables = calculateRequiredTables(partySize, settings.seatsPerTable || 4);
  const minNoticeMinutes = settings.minNoticeMinutes || 60;
  const configuredSlots = settings.slots || [];

  // Query existing capacity records for this business and date
  const capacityRecords = await SlotCapacity.find({
    businessId: user._id,
    date,
  });

  const capacityMap = new Map();
  for (const cap of capacityRecords) {
    capacityMap.set(cap.slotId, cap);
  }

  const evaluatedSlots = configuredSlots.map((slot) => {
    const slotStartMin = timeToMinutes(slot.startTime);
    let isPastNotice = false;

    // Check if slot has already passed or is within minimum notice window for today
    if (diffDays === 0) {
      if (slotStartMin <= nowInfo.totalMinutesToday + minNoticeMinutes) {
        isPastNotice = true;
      }
    }

    const capDoc = capacityMap.get(slot.slotId);
    const booked = capDoc ? capDoc.bookedCapacity : 0;
    const maxCap = slot.capacity;
    const availableTables = Math.max(0, maxCap - booked);
    const hasEnoughCapacity = availableTables >= requiredTables;

    const isAvailable = !isPastNotice && hasEnoughCapacity;
    let reason = "Available";
    if (isPastNotice) {
      reason = "Slot time has passed or is within minimum notice period.";
    } else if (!hasEnoughCapacity) {
      reason = "Fully booked for requested party size.";
    }

    return {
      slotId: slot.slotId,
      name:
        slot.name && !/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/.test(slot.name)
          ? slot.name
          : `${format12Hour(slot.startTime)} - ${format12Hour(slot.endTime)}`,
      formattedTime: `${format12Hour(slot.startTime)} - ${format12Hour(slot.endTime)}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startTime12: format12Hour(slot.startTime),
      endTime12: format12Hour(slot.endTime),
      capacity: maxCap,
      bookedTables: booked,
      availableTables,
      requiredTables,
      isAvailable,
      reason,
    };
  });

  return {
    bookingEnabled: true,
    businessName: user.businessName || "Restaurant",
    date,
    partySize,
    requiredTables,
    slots: evaluatedSlots,
  };
};

/**
 * Atomically reserves slot capacity.
 * Uses atomic conditional update ($inc with $lte check) to guarantee zero overbooking.
 */
export const atomicClaimCapacity = async ({ businessId, date, slotId, requiredTables, maxCapacity }) => {
  // Ensure the document exists
  await SlotCapacity.updateOne(
    { businessId, date, slotId },
    {
      $setOnInsert: {
        businessId,
        date,
        slotId,
        maxCapacity,
        bookedCapacity: 0,
      },
    },
    { upsert: true }
  );

  // Atomically claim capacity if and only if bookedCapacity + requiredTables <= maxCapacity
  const updated = await SlotCapacity.findOneAndUpdate(
    {
      businessId,
      date,
      slotId,
      $expr: {
        $lte: [{ $add: ["$bookedCapacity", requiredTables] }, "$maxCapacity"],
      },
    },
    {
      $inc: { bookedCapacity: requiredTables },
    },
    { new: true }
  );

  if (!updated) {
    return {
      success: false,
      reason: "Capacity exceeded — table is no longer available.",
    };
  }

  return {
    success: true,
    slotCapacity: updated,
  };
};

/**
 * Atomically releases slot capacity (used during cancellation or compensation).
 */
export const atomicReleaseCapacity = async ({ businessId, date, slotId, tablesToRelease }) => {
  if (tablesToRelease <= 0) return;
  await SlotCapacity.findOneAndUpdate(
    { businessId, date, slotId },
    {
      $inc: { bookedCapacity: -tablesToRelease },
    }
  );
};

/**
 * Creates a confirmed reservation.
 */
export const createBooking = async ({
  businessId,
  customerName,
  customerPhone,
  date,
  slotId,
  partySize,
  idempotencyKey = null,
  notes = "",
}) => {
  if (!customerName || !customerName.trim()) {
    throw new Error("Customer name is required.");
  }
  const normalizedPhone = normalizePhoneNumber(customerPhone);
  const numParty = Number(partySize);
  if (!numParty || numParty < 1) {
    throw new Error("Party size must be at least 1.");
  }

  // Idempotency check: return existing booking if already processed with this key
  if (idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey, businessId });
    if (existing) {
      return {
        booking: existing,
        cancellationToken: null, // Token only exposed on original creation
        isDuplicate: true,
      };
    }
  }

  const user = await User.findById(businessId);
  if (!user) {
    throw new Error("Business not found.");
  }

  const settings = user.bookingSettings || {};
  if (!settings.bookingEnabled) {
    throw new Error("Reservations are not currently enabled for this business.");
  }

  const maxParty = settings.maxPartySize || 12;
  if (numParty > maxParty) {
    throw new Error(`Party size cannot exceed maximum limit of ${maxParty}.`);
  }

  const slot = (settings.slots || []).find((s) => {
    if (s.slotId === slotId || s.startTime === slotId || s.name === slotId) return true;
    if (!slotId) return false;
    const s12 = format12Hour(s.startTime);
    const e12 = format12Hour(s.endTime);
    const s12Range = `${s12} - ${e12}`;
    const cleanSlotId = String(slotId).trim().toUpperCase();
    return (
      cleanSlotId === s12 ||
      cleanSlotId === s12Range ||
      cleanSlotId.replace(/\s+/g, "") === s12.replace(/\s+/g, "") ||
      cleanSlotId.replace(/\s+/g, "") === s12Range.replace(/\s+/g, "") ||
      String(slotId).includes(s.startTime) ||
      (s.name && String(slotId).includes(s.name)) ||
      (s12 && cleanSlotId.includes(s12))
    );
  });
  if (!slot) {
    throw new Error(`Requested time slot '${slotId}' does not exist.`);
  }

  const canonicalSlotId = slot.slotId;
  const slotStartTime = slot.startTime;
  const slotEndTime = slot.endTime;

  // Validate date constraints
  const nowInfo = getNowInTimezone(settings.timezone || "Asia/Kolkata");
  const diffDays = calendarDaysDifference(nowInfo.dateStr, date);
  if (diffDays < 0) {
    throw new Error("Cannot book dates in the past.");
  }
  if (diffDays > (settings.advanceDaysLimit || 30)) {
    throw new Error(`Cannot book more than ${settings.advanceDaysLimit || 30} days in advance.`);
  }

  const targetDayOfWeek = getDayOfWeekForDate(date);
  const workingDays = (settings.workingDays || []).map((d) => d.toLowerCase());
  if (workingDays.length > 0 && !workingDays.includes(targetDayOfWeek)) {
    throw new Error(`Restaurant is closed on ${targetDayOfWeek}s.`);
  }

  // Check notice period for today
  if (diffDays === 0) {
    const slotStartMin = timeToMinutes(slot.startTime);
    const minNotice = settings.minNoticeMinutes || 60;
    if (slotStartMin <= nowInfo.totalMinutesToday + minNotice) {
      throw new Error("Requested slot is past the minimum advance notice window.");
    }
  }

  const requiredTables = calculateRequiredTables(numParty, settings.seatsPerTable || 4);

  // 1. Atomically claim capacity
  const claimResult = await atomicClaimCapacity({
    businessId: user._id,
    date,
    slotId: canonicalSlotId,
    requiredTables,
    maxCapacity: slot.capacity,
  });

  if (!claimResult.success) {
    throw new Error(claimResult.reason);
  }

  // 2. Generate credentials and booking reference
  const { rawToken, hash } = generateCancellationCredentials();
  const bookingReference = generateBookingReference();

  try {
    const booking = await Booking.create({
      businessId: user._id,
      bookingReference,
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      bookingDate: date,
      slotId: slot.slotId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      partySize: numParty,
      allocatedCapacity: requiredTables,
      status: "confirmed",
      cancellationHash: hash,
      idempotencyKey: idempotencyKey || undefined,
      notes: notes ? notes.trim() : "",
    });

    return {
      booking,
      cancellationToken: rawToken,
      isDuplicate: false,
    };
  } catch (persistError) {
    // Compensation: release capacity if document insertion fails
    await atomicReleaseCapacity({
      businessId: user._id,
      date,
      slotId,
      tablesToRelease: requiredTables,
    });
    throw persistError;
  }
};

/**
 * Cancels a booking using customer-provided bearer token.
 */
export const cancelBookingByCustomer = async ({ bookingReference, cancellationToken }) => {
  if (!bookingReference || !cancellationToken) {
    throw new Error("Booking reference and cancellation token are required.");
  }

  const booking = await Booking.findOne({
    bookingReference: bookingReference.toUpperCase().trim(),
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.status === "cancelled") {
    return { booking, alreadyCancelled: true };
  }

  if (booking.status !== "confirmed") {
    throw new Error(`Cannot cancel reservation in '${booking.status}' status.`);
  }

  const isValidToken = verifyCancellationCredentials(cancellationToken, booking.cancellationHash);
  if (!isValidToken) {
    throw new Error("Invalid cancellation token.");
  }

  booking.status = "cancelled";
  await booking.save();

  // Release capacity
  await atomicReleaseCapacity({
    businessId: booking.businessId,
    date: booking.bookingDate,
    slotId: booking.slotId,
    tablesToRelease: booking.allocatedCapacity,
  });

  return { booking, alreadyCancelled: false };
};

/**
 * Updates booking status by authenticated business owner.
 */
export const updateBookingStatusByOwner = async ({ businessId, bookingId, newStatus }) => {
  const allowedStatuses = ["completed", "cancelled", "no_show"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid status transition. Allowed: ${allowedStatuses.join(", ")}`);
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    businessId,
  });

  if (!booking) {
    throw new Error("Booking not found or unauthorized.");
  }

  const previousStatus = booking.status;
  if (previousStatus === newStatus) {
    return booking;
  }

  booking.status = newStatus;
  await booking.save();

  // If transitioning from confirmed to cancelled, release capacity
  if (previousStatus === "confirmed" && newStatus === "cancelled") {
    await atomicReleaseCapacity({
      businessId: booking.businessId,
      date: booking.bookingDate,
      slotId: booking.slotId,
      tablesToRelease: booking.allocatedCapacity,
    });
  }

  return booking;
};
