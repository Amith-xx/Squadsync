import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IMemory } from "@/types";

export interface MemoryDocument extends Omit<IMemory, "_id">, Document {}

const MemorySchema = new Schema<MemoryDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamA:          { type: String, required: true, maxlength: 80 },
    teamB:          { type: String, required: true, maxlength: 80 },
    scoreA:         { type: Number, required: true, min: 0, max: 99 },
    scoreB:         { type: Number, required: true, min: 0, max: 99 },
    playerOfMatch:  { type: String, default: "", maxlength: 80 },
    competition:    { type: String, default: "", maxlength: 100 },
    matchDate:      { type: Date, default: null },
    favoriteMoment: { type: String, required: true, maxlength: 500 },
    note:           { type: String, default: "", maxlength: 1000 },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

const Memory: Model<MemoryDocument> =
  mongoose.models.Memory ?? mongoose.model<MemoryDocument>("Memory", MemorySchema);

export default Memory;
