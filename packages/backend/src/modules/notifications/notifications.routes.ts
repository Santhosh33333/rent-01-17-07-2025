import { Router } from "express";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  getPreferences,
  updatePreferences,
} from "./notifications.controller";

const router = Router();

router.get("/", getNotifications);
router.post("/mark-read", markAllRead);
router.patch("/:id/read", markOneRead);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

export default router;
