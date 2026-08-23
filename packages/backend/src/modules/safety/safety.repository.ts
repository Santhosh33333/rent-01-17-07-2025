import { PrismaClient, SosAlert, SosIncident } from "@prisma/client";

export class SafetyRepository {
  constructor(private prisma: PrismaClient) {}

  async createSosAlert(data: { userId: string; latitude?: number; longitude?: number; message?: string }): Promise<SosAlert> {
    return this.prisma.sosAlert.create({ data: { ...data, status: "ACTIVE" } });
  }

  async findSosAlertById(id: string): Promise<SosAlert | null> {
    return this.prisma.sosAlert.findUnique({ where: { id } });
  }

  async resolveSosAlert(id: string): Promise<SosAlert> {
    return this.prisma.sosAlert.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  async getUserSosAlerts(userId: string): Promise<SosAlert[]> {
    return this.prisma.sosAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createIncident(data: {
    userId: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    message?: string;
    severity: string;
    status: string;
  }): Promise<SosIncident> {
    return this.prisma.sosIncident.create({ data });
  }

  async getEmergencyContacts(userId: string): Promise<{ name: string; phone: string; relation: string }[]> {
    // Emergency contacts stored in Verification model
    const verification = await this.prisma.verification.findUnique({ where: { userId } });
    if (!verification || !verification.emergencyContactName) return [];
    return [
      {
        name: verification.emergencyContactName ?? "",
        phone: verification.emergencyContactPhone ?? "",
        relation: verification.emergencyContactRelation ?? "",
      },
    ];
  }

  async updateEmergencyContact(userId: string, contact: { name: string; phone: string; relation: string }): Promise<void> {
    await this.prisma.verification.upsert({
      where: { userId },
      create: {
        userId,
        emergencyContactName: contact.name,
        emergencyContactPhone: contact.phone,
        emergencyContactRelation: contact.relation,
        status: "NOT_STARTED",
      },
      update: {
        emergencyContactName: contact.name,
        emergencyContactPhone: contact.phone,
        emergencyContactRelation: contact.relation,
      },
    });
  }
}
