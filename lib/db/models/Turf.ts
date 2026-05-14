import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ITurf } from "@/types";

export interface TurfDocument extends Omit<ITurf, "_id">, Document {}

const TurfSlotSchema = new Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    bookedByLobbyId: {
      type: Schema.Types.ObjectId,
      ref: "Lobby",
      default: null,
    },
  },
  { _id: false }
);

const TurfSchema = new Schema<TurfDocument>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  slots: { type: [TurfSlotSchema], default: [] },
  pricePerHour: { type: Number, required: true },
  contactNumber: { type: String, default: "" },
  images: { type: [String], default: [] },
  region: { type: String, required: true, index: true },
});

// 2dsphere index for proximity queries (nearby turfs)
TurfSchema.index({ location: "2dsphere" });

const Turf: Model<TurfDocument> =
  mongoose.models.Turf ?? mongoose.model<TurfDocument>("Turf", TurfSchema);

export default Turf;
