import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IUser, Position, BanType } from "@/types";

export interface UserDocument extends Omit<IUser, "_id">, Document {}

const AttributesSchema = new Schema(
  {
    pace:      { type: Number, min: 40, max: 100 },
    shooting:  { type: Number, min: 40, max: 100 },
    passing:   { type: Number, min: 40, max: 100 },
    defending: { type: Number, min: 40, max: 100 },
    diving:    { type: Number, min: 40, max: 100 },
    reflex:    { type: Number, min: 40, max: 100 },
    speed:     { type: Number, min: 40, max: 100 },
    handling:  { type: Number, min: 40, max: 100 },
    physical:  { type: Number, min: 40, max: 100 },
  },
  { _id: false }
);

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: "" },
    position: {
      type: String,
      enum: ["GK", "DEF", "MID", "FWD"] satisfies Position[],
    },
    attributes: { type: AttributesSchema, default: () => ({}) },
    karmaScore: { type: Number, default: 70, min: 0, max: 100, index: true },
    matchesPlayed: { type: Number, default: 0 },
    matchesCompleted: { type: Number, default: 0 },
    noShows: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    banType: {
      type: String,
      enum: ["shadow", "hard", null] satisfies (BanType | null)[],
      default: null,
    },
    onboardingComplete: { type: Boolean, default: false, index: true },
    region: { type: String, index: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", UserSchema);

export default User;
