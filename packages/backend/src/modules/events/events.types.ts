export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum EventAttendeeStatus {
  REGISTERED = "REGISTERED",
  CANCELLED = "CANCELLED",
  CHECKED_IN = "CHECKED_IN",
}

export interface IEvent {
  id: string;
  title: string;
  description?: string | null;
  organizerId: string;
  communityId?: string | null;
  location?: string | null;
  startTime: Date;
  endTime?: Date | null;
  capacity?: number | null;
  attendeeCount: number;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventAttendee {
  id: string;
  eventId: string;
  userId: string;
  status: EventAttendeeStatus;
  checkedInAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateEventPayload {
  title: string;
  description?: string;
  communityId?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  capacity?: number;
}

export interface IEventAnalytics {
  eventId: string;
  totalRegistered: number;
  totalCheckedIn: number;
  totalCancelled: number;
  capacityUtilization: number;
}
