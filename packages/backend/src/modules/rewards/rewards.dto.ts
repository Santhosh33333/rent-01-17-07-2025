import { z } from "zod";

export const LeaderboardQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  period: z.enum(["daily", "weekly", "monthly", "all-time"]).default("all-time"),
});

export const ClaimRewardDto = z.object({
  rewardType: z.enum(["DAILY", "MILESTONE", "REFERRAL", "BONUS"]),
});

export type LeaderboardQueryDtoType = z.infer<typeof LeaderboardQueryDto>;
export type ClaimRewardDtoType = z.infer<typeof ClaimRewardDto>;
