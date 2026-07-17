import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { sanitizeInput, validateRequest } from "../middleware/validation";
import * as messageController from "../controllers/messageController";

const router = Router();

router.use(authenticateToken);

router.post(
  "/",
  [body("receiverId").notEmpty().withMessage("Receiver is required"), body("content").notEmpty().withMessage("Message content is required")],
  sanitizeInput,
  validateRequest,
  messageController.sendMessage
);
router.get("/conversations", messageController.getConversations);
router.get("/:conversationId", messageController.getMessages);
router.post("/:id/read", messageController.markAsRead);
router.delete("/:id", messageController.deleteMessage);

export default router;
