import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    bookingDate: {
      type: String, // YYYY-MM-DD (business local date)
      required: true,
      trim: true,
      index: true,
    },
    slotId: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String, // HH:mm
      required: true,
      trim: true,
    },
    endTime: {
      type: String, // HH:mm
      required: true,
      trim: true,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
    },
    allocatedCapacity: {
      type: Number, // Number of tables claimed
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled", "no_show"],
      default: "confirmed",
      index: true,
    },
    cancellationHash: {
      type: String, // SHA-256 hex digest of the bearer cancellation token
      required: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for performant business queries and status filtering
bookingSchema.index({ businessId: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ businessId: 1, createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
