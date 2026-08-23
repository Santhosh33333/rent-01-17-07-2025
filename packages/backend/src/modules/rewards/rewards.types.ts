export enum PartnerLevel {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
}

export enum RewardType {
  DAILY = "DAILY",
  MILESTONE = "MILESTONE",
  REFERRAL = "REFERRAL",
  BONUS = "BONUS",
}

export interface IReward {
  id: string;
  userId: string;
  type: RewardType;
  points: number;
  description?: string | null;
  claimedAt: Date;
  expiresAt?: Date | null;
}

export interface IPartnerLevelInfo {
  userId: string;
  level: PartnerLevel;
  points: number;
  nextLevelPoints: number;
  priorityRequests: boolean;
  platformFeeDiscount: number;
  incentiveMultiplier: number;
  fastWithdrawal: boolean;
  specialBadge?: string | null;
}

export interface ILeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  points: number;
  level: PartnerLevel;
  completedJobs: number;
}

export interface IBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}
