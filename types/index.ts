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

export interface OutfieldAttributes {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
}

export interface GKAttributes {
  diving: number;
  reflex: number;
  speed: number;
  handling: number;
  physical: number;
}

export type PlayerAttributes = OutfieldAttributes | GKAttributes;

export function isGKAttributes(a: PlayerAttributes): a is GKAttributes {
  return "diving" in a;
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
  region?: string;
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
  candidateTurfIds: Types.ObjectId[];
  votingDeadline: Date | null;
  scheduledAt: Date | null;
  expiresAt?: Date;
  createdAt: Date;
}

// ─── Client-safe Lobby Types (serialized for API responses) ───────────────────

export interface LobbyPlayerClient {
  userId: string;
  name: string;
  image: string;
  karmaScore: number;
  position: Position | null;
  isReady: boolean;
  team: Team | null;
  joinedAt: string;
}

export interface LobbyClient {
  id: string;
  status: LobbyStatus;
  region: string;
  players: LobbyPlayerClient[];
  teamA: string[];
  teamB: string[];
  captainA: string | null;
  captainB: string | null;
  turfVotes: { turfId: string; userId: string }[];
  selectedTurfId: string | null;
  candidateTurfs: TurfClient[];
  votingDeadline: string | null;
  matchId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface LobbyListItem {
  id: string;
  status: LobbyStatus;
  region: string;
  playerCount: number;
  expiresAt: string | null;
  createdAt: string;
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
  turfId: Types.ObjectId | null;
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

// ─── Turf (serializable for client) ──────────────────────────────────────────

export interface TurfClient {
  id: string;
  name: string;
  address: string;
  region: string;
  images: string[];
  pricePerHour: number;
  contactNumber: string;
}

// ─── Match (client-safe serialized) ──────────────────────────────────────────

export interface MatchScoreReportClient {
  goalsA: number;
  goalsB: number;
  submittedAt: string;
}

export interface MatchPlayerClient {
  userId: string;
  name: string;
  image: string;
  position: Position | null;
  team: Team;
  karmaScore: number;
}

export interface MatchClient {
  id: string;
  lobbyId: string;
  turfId: string | null;
  teamA: string[];
  teamB: string[];
  captainA: string;
  captainB: string;
  scoreReportA: MatchScoreReportClient | null;
  scoreReportB: MatchScoreReportClient | null;
  finalScore: { teamA: number; teamB: number } | null;
  status: MatchStatus;
  attendanceConfirmed: string[];
  myRatings: string[];
  createdAt: string;
  completedAt: string | null;
}

export interface MatchHistoryItem {
  id: string;
  status: MatchStatus;
  finalScore: { teamA: number; teamB: number } | null;
  team: Team | null;
  createdAt: string;
  completedAt: string | null;
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
  messageId: string;
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
  goalsA: number;
  goalsB: number;
}

export interface PusherMatchReadyPayload {
  matchId: string;
}

export interface PusherKarmaUpdatedPayload {
  userId: string;
  newKarma: number;
}

export interface PusherLobbyStatusChangedPayload {
  status: LobbyStatus;
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

// ─── Football Memory Vault ────────────────────────────────────────────────────

export interface IMemory {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  playerOfMatch: string;
  competition: string;
  matchDate: Date | null;
  favoriteMoment: string;
  note: string;
  createdAt: Date;
}

export interface MemoryClient {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  playerOfMatch: string;
  competition: string;
  matchDate: string | null;
  favoriteMoment: string;
  note: string;
  createdAt: string;
}

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
