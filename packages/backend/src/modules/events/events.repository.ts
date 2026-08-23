import { PrismaClient, Event, EventAttendee } from "@prisma/client";

export class EventsRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    title: string;
    description?: string;
    organizerId: string;
    communityId?: string;
    location?: string;
    startTime: Date;
    endTime?: Date;
    capacity?: number;
    status: string;
  }): Promise<Event> {
    return this.prisma.event.create({ data });
  }

  async findById(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, fullName: true, avatarUrl: true } } },
    }) as Promise<Event | null>;
  }

  async findAll(params: { page: number; limit: number; status?: string; communityId?: string }): Promise<{ events: Event[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (params.status) where["status"] = params.status;
    if (params.communityId) where["communityId"] = params.communityId;
    const skip = (params.page - 1) * params.limit;
    const [events, total] = await Promise.all([
      this.prisma.event.findMany({ where, skip, take: params.limit, orderBy: { startTime: "asc" } }),
      this.prisma.event.count({ where }),
    ]);
    return { events, total };
  }

  async update(id: string, data: { title?: string; description?: string; location?: string; startTime?: Date; endTime?: Date; capacity?: number; status?: string }): Promise<Event> {
    return this.prisma.event.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Event> {
    return this.prisma.event.delete({ where: { id } });
  }

  async registerAttendee(eventId: string, userId: string): Promise<EventAttendee> {
    const attendee = await this.prisma.eventAttendee.create({
      data: { eventId, userId, status: "REGISTERED" },
    });
    await this.prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: { increment: 1 } },
    });
    return attendee;
  }

  async getAttendee(eventId: string, userId: string): Promise<EventAttendee | null> {
    return this.prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  async checkinAttendee(eventId: string, userId: string): Promise<EventAttendee> {
    return this.prisma.eventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
  }

  async cancelRegistration(eventId: string, userId: string): Promise<EventAttendee> {
    const attendee = await this.prisma.eventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status: "CANCELLED" },
    });
    await this.prisma.event.update({
      where: { id: eventId },
      data: { attendeeCount: { decrement: 1 } },
    });
    return attendee;
  }

  async getAttendeeStats(eventId: string): Promise<{ total: number; checkedIn: number; cancelled: number }> {
    const [total, checkedIn, cancelled] = await Promise.all([
      this.prisma.eventAttendee.count({ where: { eventId, status: "REGISTERED" } }),
      this.prisma.eventAttendee.count({ where: { eventId, status: "CHECKED_IN" } }),
      this.prisma.eventAttendee.count({ where: { eventId, status: "CANCELLED" } }),
    ]);
    return { total, checkedIn, cancelled };
  }
}
