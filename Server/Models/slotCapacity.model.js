import mongoose from "mongoose";

const slotCapacitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    slotId: {
      type: String,
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedCapacity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Guarantee a single capacity record per business, date, and slot
slotCapacitySchema.index(
  { businessId: 1, date: 1, slotId: 1 },
  { unique: true }
);

const SlotCapacity = mongoose.model("SlotCapacity", slotCapacitySchema);

export default SlotCapacity;
