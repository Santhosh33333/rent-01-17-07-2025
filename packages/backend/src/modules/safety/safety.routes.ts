import { Router } from "express";
import {
  triggerSos,
  resolveSos,
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  startSafetyTimer,
  checkInTimer,
  reportIncident,
} from "./safety.controller";

const router = Router();

router.post("/sos", triggerSos);
router.post("/sos/:id/resolve", resolveSos);
router.get("/contacts", getEmergencyContacts);
router.post("/contacts", addEmergencyContact);
router.delete("/contacts/:id", removeEmergencyContact);
router.post("/timer", startSafetyTimer);
router.post("/timer/checkin", checkInTimer);
router.post("/incident", reportIncident);

export default router;
