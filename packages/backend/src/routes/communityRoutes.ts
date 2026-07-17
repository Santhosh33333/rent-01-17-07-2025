import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as communityController from "../controllers/communityController";

const router = Router();

router.use(authenticateToken);

router.post(
  "/",
  [body("name").notEmpty(), body("description").optional().isString(), body("privacy").optional().isIn(["PUBLIC", "PRIVATE"]), body("city").optional().isString()],
  sanitizeInput,
  validateRequest,
  communityController.createCommunity
);
router.get("/", communityController.getCommunities);
router.get("/:id", communityController.getCommunityById);
router.post("/:id/join", communityController.joinCommunity);
router.post("/:id/leave", communityController.leaveCommunity);
router.get("/:id/members", communityController.getCommunityMembers);

export default router;
