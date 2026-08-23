import { z } from "zod";

export const SosTriggerDto = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  message: z.string().max(500).optional(),
});

export const AddContactDto = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10).max(15),
  relation: z.string().min(1).max(50),
});

export const SafetyTimerDto = z.object({
  durationMinutes: z.number().int().min(1).max(480),
  checkInRequired: z.boolean().default(true),
});

export const IncidentReportDto = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
  message: z.string().min(1, "Incident description is required").max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export type SosTriggerDtoType = z.infer<typeof SosTriggerDto>;
export type AddContactDtoType = z.infer<typeof AddContactDto>;
export type SafetyTimerDtoType = z.infer<typeof SafetyTimerDto>;
export type IncidentReportDtoType = z.infer<typeof IncidentReportDto>;
