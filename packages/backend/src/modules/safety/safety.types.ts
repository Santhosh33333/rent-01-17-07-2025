export enum SosStatus {
  ACTIVE = "ACTIVE",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

export enum IncidentSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface ISosAlert {
  id: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  message?: string | null;
  status: SosStatus;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface ISafetyTimer {
  startedAt: Date;
  expiresAt: Date;
  checkInRequired: boolean;
}

export interface IIncidentReport {
  userId: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  message: string;
  severity: IncidentSeverity;
}

export interface ISosTriggerPayload {
  latitude?: number;
  longitude?: number;
  message?: string;
}
