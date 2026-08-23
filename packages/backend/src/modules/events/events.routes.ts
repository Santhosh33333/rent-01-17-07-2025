import { Router } from "express";
import {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  registerForEvent,
  getEventTicket,
  checkinEvent,
  getEventAnalytics,
  cancelEventRegistration,
} from "./events.controller";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvent);
router.get("/:id", getEvent);
router.patch("/:id", updateEvent);
router.post("/:id/register", registerForEvent);
router.get("/:id/ticket", getEventTicket);
router.post("/:id/checkin", checkinEvent);
router.get("/:id/analytics", getEventAnalytics);
router.delete("/:id/registration", cancelEventRegistration);

export default router;
