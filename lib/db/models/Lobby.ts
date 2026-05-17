import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ILobby, LobbyStatus } from "@/types";

export interface LobbyDocument extends Omit<ILobby, "_id">, Document {}

const LobbyPlayerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    isReady: { type: Boolean, default: false },
    team: { type: String, enum: ["A", "B", null], default: null },
  },
  { _id: false }
);

const TurfVoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    turfId: { type: Schema.Types.ObjectId, ref: "Turf", required: true },
  },
  { _id: false }
);

const LobbySchema = new Schema<LobbyDocument>(
  {
    status: {
      type: String,
      enum: [
        "waiting",
        "ready_check",
        "voting",
        "confirmed",
        "active",
        "completed",
        "expired",
      ] satisfies LobbyStatus[],
      default: "waiting",
      index: true,
    },
    region: { type: String, required: true, index: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    players: { type: [LobbyPlayerSchema], default: [] },
    teamA: [{ type: Schema.Types.ObjectId, ref: "User" }],
    teamB: [{ type: Schema.Types.ObjectId, ref: "User" }],
    captainA: { type: Schema.Types.ObjectId, ref: "User", default: null },
    captainB: { type: Schema.Types.ObjectId, ref: "User", default: null },
    turfVotes: { type: [TurfVoteSchema], default: [] },
    selectedTurf: {
      type: Schema.Types.ObjectId,
      ref: "Turf",
      default: null,
    },
    candidateTurfIds: [{ type: Schema.Types.ObjectId, ref: "Turf" }],
    votingDeadline: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    // TTL index: MongoDB auto-deletes documents when expiresAt is reached.
    // Must be UNSET ($unset) when lobby advances beyond 'waiting' status.
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  }
);

// 2dsphere index for geospatial lobby queries
LobbySchema.index({ location: "2dsphere" });

const Lobby: Model<LobbyDocument> =
  mongoose.models.Lobby ?? mongoose.model<LobbyDocument>("Lobby", LobbySchema);

export default Lobby;
