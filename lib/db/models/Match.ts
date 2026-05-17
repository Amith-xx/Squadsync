import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IMatch, MatchStatus } from "@/types";

export interface MatchDocument extends Omit<IMatch, "_id">, Document {}

const ScoreReportSchema = new Schema(
  {
    goalsA: { type: Number, required: true },
    goalsB: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PlayerRatingSchema = new Schema(
  {
    raterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ratedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    thumbsUp: { type: Boolean, required: true },
  },
  { _id: false }
);

const MatchSchema = new Schema<MatchDocument>(
  {
    lobbyId: { type: Schema.Types.ObjectId, ref: "Lobby", required: true, index: true },
    turfId: { type: Schema.Types.ObjectId, ref: "Turf", default: null },
    teamA: [{ type: Schema.Types.ObjectId, ref: "User" }],
    teamB: [{ type: Schema.Types.ObjectId, ref: "User" }],
    captainA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    captainB: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scoreReportA: { type: ScoreReportSchema, default: null },
    scoreReportB: { type: ScoreReportSchema, default: null },
    finalScore: {
      type: new Schema(
        { teamA: Number, teamB: Number },
        { _id: false }
      ),
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending_reports",
        "confirmed",
        "disputed",
      ] satisfies MatchStatus[],
      default: "pending_reports",
      index: true,
    },
    playerRatings: { type: [PlayerRatingSchema], default: [] },
    attendanceConfirmed: [{ type: Schema.Types.ObjectId, ref: "User" }],
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

const Match: Model<MatchDocument> =
  mongoose.models.Match ?? mongoose.model<MatchDocument>("Match", MatchSchema);

export default Match;
