import { Router } from "express";
import {
  listCommunities,
  createCommunity,
  getCommunity,
  updateCommunity,
  joinCommunity,
  removeMember,
  updateMemberRole,
  muteMember,
  getCommunityMembers,
} from "./communities.controller";

const router = Router();

router.get("/", listCommunities);
router.post("/", createCommunity);
router.get("/:id", getCommunity);
router.patch("/:id", updateCommunity);
router.post("/:id/join", joinCommunity);
router.get("/:id/members", getCommunityMembers);
router.delete("/:id/members/:userId", removeMember);
router.patch("/:id/members/:userId/role", updateMemberRole);
router.patch("/:id/members/:userId/mute", muteMember);

export default router;
