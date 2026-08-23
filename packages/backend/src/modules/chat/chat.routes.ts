import { Router } from "express";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  deleteMessage,
  pinMessage,
  sendChatRequest,
  getChatRequests,
  acceptChatRequest,
  rejectChatRequest,
  reportChat,
} from "./chat.controller";

const router = Router();

router.get("/conversations", getConversations);
router.get("/conversations/:id/messages", getConversationMessages);
router.post("/messages", sendMessage);
router.delete("/messages/:id", deleteMessage);
router.patch("/messages/:id/pin", pinMessage);
router.post("/chat-requests", sendChatRequest);
router.get("/chat-requests", getChatRequests);
router.post("/chat-requests/:id/accept", acceptChatRequest);
router.post("/chat-requests/:id/reject", rejectChatRequest);
router.post("/reports", reportChat);

export default router;
