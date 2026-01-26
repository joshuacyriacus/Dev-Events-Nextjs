import mongoose, { type HydratedDocument, type Model, type Types } from "mongoose";

import { Event } from "./event.model";

export interface Booking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

type BookingDocument = HydratedDocument<Booking>;

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const email = value.trim().toLowerCase();
  // Pragmatic email validation suitable for API input checks.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const BookingSchema = new mongoose.Schema<Booking>(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: "Invalid email",
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

BookingSchema.index({ eventId: 1 });

BookingSchema.pre("save", async function preSave(this: BookingDocument) {
  // Ensure the booking references an existing event (guards against dangling ObjectIds).
  if (this.isModified("eventId")) {
    const exists = await Event.exists({ _id: this.eventId });
    if (!exists) throw new Error("Referenced event does not exist");
  }
});

export const Booking: Model<Booking> =
  (mongoose.models.Booking as Model<Booking> | undefined) ??
  mongoose.model<Booking>("Booking", BookingSchema);
