import { SosAlert } from "@prisma/client";
import { SafetyRepository } from "./safety.repository";
import { ISafetyTimer } from "./safety.types";
import type { SosTriggerDtoType, AddContactDtoType, SafetyTimerDtoType, IncidentReportDtoType } from "./safety.dto";

export class SafetyService {
  constructor(private repo: SafetyRepository) {}

  async triggerSos(userId: string, data: SosTriggerDtoType): Promise<SosAlert> {
    return this.repo.createSosAlert({
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      message: data.message,
    });
  }

  async resolveSos(sosId: string, _resolvedBy: string): Promise<SosAlert> {
    const alert = await this.repo.findSosAlertById(sosId);
    if (!alert) throw new Error("SOS alert not found");
    if (alert.status !== "ACTIVE") throw new Error("SOS alert is not active");
    return this.repo.resolveSosAlert(sosId);
  }

  async getEmergencyContacts(userId: string): Promise<{ name: string; phone: string; relation: string }[]> {
    return this.repo.getEmergencyContacts(userId);
  }

  async addEmergencyContact(userId: string, data: AddContactDtoType): Promise<{ name: string; phone: string; relation: string }> {
    await this.repo.updateEmergencyContact(userId, data);
    return data;
  }

  async removeEmergencyContact(userId: string, _contactId: string): Promise<void> {
    // For single-contact model — clear the emergency contact
    await this.repo.updateEmergencyContact(userId, { name: "", phone: "", relation: "" });
  }

  async startSafetyTimer(_userId: string, data: SafetyTimerDtoType): Promise<ISafetyTimer> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + data.durationMinutes * 60 * 1000);
    return { startedAt: now, expiresAt, checkInRequired: data.checkInRequired };
  }

  async checkInTimer(_userId: string): Promise<{ message: string; checkedInAt: Date }> {
    return { message: "Check-in recorded", checkedInAt: new Date() };
  }

  async reportIncident(userId: string, data: IncidentReportDtoType): Promise<unknown> {
    return this.repo.createIncident({
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      message: data.message,
      severity: data.severity,
      status: "ACTIVE",
    });
  }
}
