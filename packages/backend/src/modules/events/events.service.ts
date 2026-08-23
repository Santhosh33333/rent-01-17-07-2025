import { Event, EventAttendee } from "@prisma/client";
import { EventsRepository } from "./events.repository";
import { IEventAnalytics } from "./events.types";
import type { CreateEventDtoType, UpdateEventDtoType, EventListQueryDtoType, CheckinDtoType } from "./events.dto";

export class EventsService {
  constructor(private repo: EventsRepository) {}

  async create(organizerId: string, data: CreateEventDtoType): Promise<Event> {
    return this.repo.create({
      ...data,
      organizerId,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      status: "PUBLISHED",
    });
  }

  async getById(id: string): Promise<Event> {
    const event = await this.repo.findById(id);
    if (!event) throw new Error("Event not found");
    return event;
  }

  async list(params: EventListQueryDtoType): Promise<{ events: Event[]; total: number }> {
    return this.repo.findAll(params);
  }

  async update(id: string, userId: string, data: UpdateEventDtoType): Promise<Event> {
    const event = await this.getById(id);
    if (event.organizerId !== userId) throw new Error("Not authorized to update this event");
    return this.repo.update(id, {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const event = await this.getById(id);
    if (event.organizerId !== userId) throw new Error("Not authorized to delete this event");
    await this.repo.delete(id);
  }

  async register(eventId: string, userId: string): Promise<EventAttendee> {
    const event = await this.getById(eventId);
    if (event.status !== "PUBLISHED") throw new Error("Event is not open for registration");
    if (event.capacity && event.attendeeCount >= event.capacity) {
      throw new Error("Event is at full capacity");
    }
    const existing = await this.repo.getAttendee(eventId, userId);
    if (existing && existing.status === "REGISTERED") throw new Error("Already registered");
    return this.repo.registerAttendee(eventId, userId);
  }

  async getTicket(eventId: string, userId: string): Promise<EventAttendee> {
    const attendee = await this.repo.getAttendee(eventId, userId);
    if (!attendee) throw new Error("No registration found for this event");
    return attendee;
  }

  async checkin(eventId: string, data: CheckinDtoType): Promise<EventAttendee> {
    const attendee = await this.repo.getAttendee(eventId, data.userId);
    if (!attendee || attendee.status !== "REGISTERED") {
      throw new Error("User is not registered for this event");
    }
    return this.repo.checkinAttendee(eventId, data.userId);
  }

  async getAnalytics(eventId: string, organizerId: string): Promise<IEventAnalytics> {
    const event = await this.getById(eventId);
    if (event.organizerId !== organizerId) throw new Error("Not authorized");
    const stats = await this.repo.getAttendeeStats(eventId);
    const totalRegistered = stats.total + stats.checkedIn;
    return {
      eventId,
      totalRegistered,
      totalCheckedIn: stats.checkedIn,
      totalCancelled: stats.cancelled,
      capacityUtilization: event.capacity ? (totalRegistered / event.capacity) * 100 : 0,
    };
  }

  async cancelRegistration(eventId: string, userId: string): Promise<EventAttendee> {
    const attendee = await this.repo.getAttendee(eventId, userId);
    if (!attendee || attendee.status !== "REGISTERED") {
      throw new Error("No active registration found");
    }
    return this.repo.cancelRegistration(eventId, userId);
  }
}
