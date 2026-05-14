import type { Types } from "mongoose";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Position = "GK" | "DEF" | "MID" | "FWD";
export type BanType = "shadow" | "hard" | null;
export type LobbyStatus =
  | "waiting"
  | "ready_check"
  | "voting"
  | "confirmed"
  | "active"
  | "completed"
  | "expired";
export type MatchStatus = "pending_reports" | "confirmed" | "disputed";
export type Team = "A" | "B";

// ─── Attribute Block ──────────────────────────────────────────────────────────

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  image: string;
  position?: Position;
  attributes: PlayerAttributes;
  karmaScore: number;
  matchesPlayed: number;
  matchesCompleted: number;
  noShows: number;
  isBanned: boolean;
  banType: BanType;
  onboardingComplete: boolean;
  createdAt: Date;
}

export type PublicUser = Pick<
  IUser,
  "_id" | "name" | "image" | "position" | "attributes" | "karmaScore"
>;

// ─── Lobby Player Slot ────────────────────────────────────────────────────────

export interface LobbyPlayer {
  userId: Types.ObjectId;
  joinedAt: Date;
  isReady: boolean;
  team: Team | null;
}

// ─── Turf Vote ────────────────────────────────────────────────────────────────

export interface TurfVote {
  userId: Types.ObjectId;
  turfId: Types.ObjectId;
}

// ─── Lobby ───────────────────────────────────────────────────────────────────

export interface ILobby {
  _id: Types.ObjectId;
  status: LobbyStatus;
  region: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  players: LobbyPlayer[];
  teamA: Types.ObjectId[];
  teamB: Types.ObjectId[];
  captainA: Types.ObjectId | null;
  captainB: Types.ObjectId | null;
  turfVotes: TurfVote[];
  selectedTurf: Types.ObjectId | null;
  scheduledAt: Date | null;
  expiresAt?: Date;
  createdAt: Date;
}

// ─── Score Report ─────────────────────────────────────────────────────────────

export interface ScoreReport {
  goalsA: number;
  goalsB: number;
  submittedAt: Date;
}

// ─── Player Rating ────────────────────────────────────────────────────────────

export interface PlayerRating {
  raterId: Types.ObjectId;
  ratedId: Types.ObjectId;
  thumbsUp: boolean;
}

// ─── Match ───────────────────────────────────────────────────────────────────

export interface IMatch {
  _id: Types.ObjectId;
  lobbyId: Types.ObjectId;
  teamA: Types.ObjectId[];
  teamB: Types.ObjectId[];
  captainA: Types.ObjectId;
  captainB: Types.ObjectId;
  scoreReportA: ScoreReport | null;
  scoreReportB: ScoreReport | null;
  finalScore: { teamA: number; teamB: number } | null;
  status: MatchStatus;
  playerRatings: PlayerRating[];
  attendanceConfirmed: Types.ObjectId[];
  createdAt: Date;
  completedAt: Date | null;
}

// ─── Turf Slot ────────────────────────────────────────────────────────────────

export interface TurfSlot {
  date: Date;
  time: string;
  isBooked: boolean;
  bookedByLobbyId: Types.ObjectId | null;
}

// ─── Turf ────────────────────────────────────────────────────────────────────

export interface ITurf {
  _id: Types.ObjectId;
  name: string;
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  slots: TurfSlot[];
  pricePerHour: number;
  contactNumber: string;
  images: string[];
  region: string;
}

// ─── Pusher Event Payloads ────────────────────────────────────────────────────

export interface PusherPlayerJoinedPayload {
  userId: string;
  name: string;
  image: string;
  karmaScore: number;
}

export interface PusherPlayerLeftPayload {
  userId: string;
}

export interface PusherPlayerReadyPayload {
  userId: string;
  isReady: boolean;
}

export interface PusherChatMessagePayload {
  userId: string;
  name: string;
  image: string;
  message: string;
  sentAt: string;
}

export interface PusherTeamsFormedPayload {
  teamA: string[];
  teamB: string[];
  captainA: string;
  captainB: string;
}

export interface PusherVoteCastPayload {
  userId: string;
  turfId: string;
  voteCounts: Record<string, number>;
}

export interface PusherScoreSubmittedPayload {
  captainId: string;
  team: Team;
}

// ─── Karma Engine Inputs ──────────────────────────────────────────────────────

export interface KarmaUpdateInput {
  currentKarma: number;
  matchCompleted: boolean;
  noShow: boolean;
  positiveRatingsReceived: number;
  negativeRatingsReceived: number;
}

// ─── Team Balancer Inputs ─────────────────────────────────────────────────────

export interface PlayerWithAttributes {
  userId: string;
  attributes: PlayerAttributes;
  karmaScore: number;
}

export interface BalancedTeams {
  teamA: string[];
  teamB: string[];
  teamAPowerAvg: number;
  teamBPowerAvg: number;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Next Auth Session Extension ─────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
    };
  }
}
