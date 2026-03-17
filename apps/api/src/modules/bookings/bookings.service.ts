import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AuditActorType,
  BookingSource,
  BookingStatus,
  BookingType,
  CourtType,
  CustomerSegment,
  EventType,
  Prisma
} from "@prisma/client";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";
import { PoliciesService } from "../policies/policies.service";

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policiesService: PoliciesService
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        include: {
          customer: true,
          court: true,
          eventExtras: true
        },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.booking.count()
    ]);

    return serialize({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }

  async get(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        court: true,
        eventExtras: {
          include: {
            package: true
          }
        },
        conversation: true
      }
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found.`);
    }

    return serialize(booking);
  }

  async checkAvailability(payload: Record<string, unknown>) {
    const request = await this.buildAvailabilityRequest(payload);
    const candidates = await this.findCandidateCourts(request);

    return serialize({
      available: candidates.length > 0,
      requested: {
        startTime: request.startTime,
        endTime: request.endTime,
        durationMins: request.durationMins,
        courtId: request.courtId,
        courtType: request.courtType,
        bookingType: request.bookingType,
        eventType: request.eventType
      },
      options: candidates.slice(0, 5)
    });
  }

  async getAlternatives(payload: Record<string, unknown>) {
    const request = await this.buildAvailabilityRequest(payload);
    const policy = await this.requirePolicy();
    const options: Array<Record<string, unknown>> = [];

    for (let step = 0; step < 12 && options.length < 5; step += 1) {
      const startTime = new Date(request.startTime);
      startTime.setMinutes(startTime.getMinutes() + policy.slotIntervalMins * step);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + request.durationMins);

      const candidates = await this.findCandidateCourts({
        ...request,
        startTime,
        endTime
      });

      options.push(...candidates);
    }

    return serialize({
      requested: {
        startTime: request.startTime,
        endTime: request.endTime,
        durationMins: request.durationMins,
        courtId: request.courtId,
        courtType: request.courtType,
        bookingType: request.bookingType,
        eventType: request.eventType
      },
      options: options.slice(0, 5)
    });
  }

  async create(payload: Record<string, unknown>) {
    const request = await this.buildAvailabilityRequest(payload);
    const courtId = this.asString(payload.courtId);
    const customerId = await this.resolveCustomerId(payload);
    const bookingType = this.parseBookingType(payload.bookingType);
    const selectedCourtId = courtId ?? (await this.pickFirstAvailableCourtId(request));

    if (!selectedCourtId) {
      throw new ConflictException("No available court for the requested slot.");
    }

    const selectedOption = await this.checkAvailability({
      ...payload,
      courtId: selectedCourtId,
      startTime: request.startTime.toISOString(),
      endTime: request.endTime.toISOString()
    });

    if (!selectedOption.available) {
      throw new ConflictException("Requested slot is no longer available.");
    }

    const price = await this.calculatePrice(selectedCourtId, request.startTime);

    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        courtId: selectedCourtId,
        createdByConversationId: this.asString(payload.conversationId),
        bookingType,
        source: this.parseBookingSource(payload.source),
        status: this.parseBookingStatus(payload.status) ?? BookingStatus.confirmed,
        startTime: request.startTime,
        endTime: request.endTime,
        durationMins: request.durationMins,
        price,
        discount: this.asNumber(payload.discount) ?? 0,
        confirmedAt: new Date(),
        cancelToken: this.asString(payload.cancelToken) ?? cryptoToken("cancel"),
        modifyToken: this.asString(payload.modifyToken) ?? cryptoToken("modify")
      },
      include: {
        customer: true,
        court: true,
        eventExtras: true
      }
    });

    if (payload.eventExtra && typeof payload.eventExtra === "object") {
      await this.prisma.eventExtra.create({
        data: {
          bookingId: booking.id,
          packageId: this.asString((payload.eventExtra as Record<string, unknown>).packageId),
          eventType: this.parseEventType((payload.eventExtra as Record<string, unknown>).eventType),
          guestCount: this.asNumber((payload.eventExtra as Record<string, unknown>).guestCount),
          decorations: Boolean((payload.eventExtra as Record<string, unknown>).decorations),
          catering: Boolean((payload.eventExtra as Record<string, unknown>).catering),
          specialRequests: this.asString(
            (payload.eventExtra as Record<string, unknown>).specialRequests
          ),
          packageName: this.asString((payload.eventExtra as Record<string, unknown>).packageName),
          packagePrice: this.asNumber((payload.eventExtra as Record<string, unknown>).packagePrice)
        }
      });
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalBookings: { increment: 1 },
        totalSpent: { increment: price },
        lastContact: new Date(),
        segment: await this.deriveCustomerSegment(customerId)
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "booking",
        entityId: booking.id,
        action: "booking_created",
        afterJson: serialize(booking) as Prisma.InputJsonValue
      }
    });

    return this.get(booking.id);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.booking.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException(`Booking ${id} not found.`);
    }

    let nextWindow:
      | {
          startTime: Date;
          endTime: Date;
          durationMins: number;
        }
      | undefined;

    if (payload.startTime !== undefined || payload.endTime !== undefined || payload.date !== undefined) {
      const request = await this.buildAvailabilityRequest({
        ...existing,
        ...payload
      });

      nextWindow = {
        startTime: request.startTime,
        endTime: request.endTime,
        durationMins: request.durationMins
      };

      const selectedCourtId = this.asString(payload.courtId) ?? existing.courtId;
      const availability = await this.checkAvailability({
        courtId: selectedCourtId,
        startTime: request.startTime.toISOString(),
        endTime: request.endTime.toISOString(),
        durationMins: request.durationMins,
        excludeBookingId: id
      });

      if (!availability.available) {
        throw new ConflictException("The updated booking slot is unavailable.");
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        courtId: this.asString(payload.courtId) ?? undefined,
        bookingType:
          payload.bookingType === undefined ? undefined : this.parseBookingType(payload.bookingType),
        status:
          payload.status === undefined ? undefined : this.parseBookingStatus(payload.status),
        startTime: nextWindow?.startTime,
        endTime: nextWindow?.endTime,
        durationMins: nextWindow?.durationMins,
        price:
          nextWindow && (this.asString(payload.courtId) ?? existing.courtId)
            ? await this.calculatePrice(
                this.asString(payload.courtId) ?? existing.courtId,
                nextWindow.startTime
              )
            : undefined,
        discount: payload.discount === undefined ? undefined : this.asNumber(payload.discount),
        cancelReason:
          payload.cancelReason === undefined ? undefined : this.asString(payload.cancelReason)
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "booking",
        entityId: updated.id,
        action: "booking_updated",
        afterJson: serialize(updated) as Prisma.InputJsonValue
      }
    });

    return this.get(updated.id);
  }

  async cancel(id: string, payload: Record<string, unknown>) {
    const booking = await this.prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found.`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.cancelled,
        cancelledAt: new Date(),
        cancelReason: this.asString(payload.reason) ?? this.asString(payload.cancelReason)
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "booking",
        entityId: updated.id,
        action: "booking_cancelled",
        afterJson: serialize(updated) as Prisma.InputJsonValue
      }
    });

    return this.get(updated.id);
  }

  async confirm(id: string, payload: Record<string, unknown> = {}) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.confirmed,
        confirmedAt: new Date()
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "booking",
        entityId: booking.id,
        action: "booking_confirmed",
        afterJson: serialize(booking) as Prisma.InputJsonValue
      }
    });

    return serialize(booking);
  }

  async getSummary(id: string) {
    const booking = await this.get(id);
    return serialize({
      id: booking.id,
      bookingType: booking.bookingType,
      customerName: booking.customer?.name,
      customerPhone: booking.customer?.phone,
      courtName: booking.court?.name,
      courtNameAr: booking.court?.nameAr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMins: booking.durationMins,
      price: booking.price,
      status: booking.status,
      packageId: booking.eventExtras?.packageId,
      packageName: booking.eventExtras?.packageName ?? booking.eventExtras?.package?.name,
      packageNameAr: booking.eventExtras?.package?.nameAr,
      packagePrice: booking.eventExtras?.packagePrice ?? booking.eventExtras?.package?.basePrice,
      eventType: booking.eventExtras?.eventType,
      mapsLink: booking.court?.mapsLink,
      cancelToken: booking.cancelToken,
      modifyToken: booking.modifyToken
    });
  }

  private async buildAvailabilityRequest(payload: Record<string, unknown>) {
    const policy = await this.requirePolicy();
    const durationMins =
      this.asNumber(payload.durationMins) ?? policy.minBookingDurationMins ?? 60;

    let startTime: Date | undefined;
    const startValue = this.asString(payload.startTime);
    const dateValue = this.asString(payload.date);

    if (startValue && startValue.includes("T")) {
      startTime = new Date(startValue);
    } else if (dateValue && startValue) {
      startTime = new Date(`${dateValue}T${startValue}:00+03:00`);
    } else if (dateValue) {
      startTime = new Date(`${dateValue}T16:00:00+03:00`);
    }

    if (!startTime || Number.isNaN(startTime.getTime())) {
      throw new BadRequestException("A valid booking date and startTime are required.");
    }

    const endTimeValue = this.asString(payload.endTime);
    const endTime = endTimeValue
      ? new Date(endTimeValue)
      : new Date(startTime.getTime() + durationMins * 60_000);

    if (Number.isNaN(endTime.getTime()) || endTime <= startTime) {
      throw new BadRequestException("A valid booking window is required.");
    }

    return {
      startTime,
      endTime,
      durationMins,
      courtId: this.asString(payload.courtId),
      courtType: this.parseCourtType(payload.courtType),
      bookingType: this.parseBookingType(payload.bookingType),
      eventType: this.parseOptionalEventType(payload.eventType),
      packageId: this.asString(payload.packageId),
      excludeBookingId: this.asString(payload.excludeBookingId)
    };
  }

  private async findCandidateCourts(request: {
    startTime: Date;
    endTime: Date;
    durationMins: number;
    courtId?: string;
    courtType?: CourtType;
    bookingType: BookingType;
    eventType?: EventType;
    packageId?: string;
    excludeBookingId?: string;
  }) {
    const constraints = this.resolveCourtConstraints(request);
    const allowedTypes = constraints.allowedTypes;
    const preferredTypes = constraints.preferredTypes;

    if (request.courtType && allowedTypes && !allowedTypes.includes(request.courtType)) {
      return [];
    }

    const where: Prisma.CourtWhereInput = {
      isActive: true,
      id: request.courtId ?? undefined,
      type: request.courtType
        ? request.courtType
        : allowedTypes
          ? { in: allowedTypes }
          : undefined,
      bookings: {
        none: {
          id: request.excludeBookingId ? { not: request.excludeBookingId } : undefined,
          status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
          startTime: { lt: request.endTime },
          endTime: { gt: request.startTime }
        }
      },
      blocks: {
        none: {
          startTime: { lt: request.endTime },
          endTime: { gt: request.startTime }
        }
      }
    };

    const courts = await this.prisma.court.findMany({
      where
    });

    const options = await Promise.all(
      courts.map(async (court) => ({
        courtId: court.id,
        courtName: court.name,
        courtNameAr: court.nameAr,
        courtType: court.type,
        startTime: request.startTime,
        endTime: request.endTime,
        durationMins: request.durationMins,
        price: await this.calculatePrice(court.id, request.startTime)
      }))
    );

    return options.sort((left, right) =>
      comparePackageAwareOptions(left, right, preferredTypes)
    );
  }

  private async pickFirstAvailableCourtId(request: {
    startTime: Date;
    endTime: Date;
    durationMins: number;
    courtType?: CourtType;
    bookingType: BookingType;
    eventType?: EventType;
    packageId?: string;
    excludeBookingId?: string;
  }) {
    const options = await this.findCandidateCourts(request);
    return options[0]?.courtId;
  }

  private resolveCourtConstraints(request: {
    bookingType: BookingType;
    eventType?: EventType;
  }): {
    allowedTypes?: CourtType[];
    preferredTypes?: CourtType[];
  } {
    if (request.eventType === EventType.corporate || request.eventType === EventType.tournament) {
      return {
        allowedTypes: [CourtType.V11],
        preferredTypes: [CourtType.V11]
      };
    }

    if (request.bookingType === BookingType.birthday || request.eventType === EventType.birthday) {
      return {
        allowedTypes: [CourtType.V7, CourtType.V11],
        preferredTypes: [CourtType.V7, CourtType.V11]
      };
    }

    if (
      request.bookingType === BookingType.private_event ||
      request.eventType === EventType.private_event
    ) {
      return {
        allowedTypes: [CourtType.V7, CourtType.V11],
        preferredTypes: [CourtType.V11, CourtType.V7]
      };
    }

    return {
      allowedTypes: undefined,
      preferredTypes: undefined
    };
  }

  private async calculatePrice(courtId: string, startTime: Date) {
    const court = await this.prisma.court.findUnique({ where: { id: courtId } });
    if (!court) {
      throw new NotFoundException(`Court ${courtId} not found.`);
    }

    const policy = await this.requirePolicy();
    const { dayOfWeek, hour } = getLocalBookingParts(startTime, policy.timezone);

    const matchingRule = await this.prisma.pricingRule.findFirst({
      where: {
        courtId,
        isActive: true,
        OR: [{ dayOfWeek }, { dayOfWeek: null }],
        startHour: { lte: hour },
        endHour: { gt: hour }
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
    });

    return matchingRule?.price ?? (hour >= 19 ? court.peakRate : court.hourlyRate);
  }

  private async deriveCustomerSegment(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return CustomerSegment.new;
    }

    const totalBookings = customer.totalBookings + 1;

    if (totalBookings >= 12) return CustomerSegment.vip;
    if (totalBookings >= 6) return CustomerSegment.regular;
    if (totalBookings >= 2) return CustomerSegment.occasional;
    return CustomerSegment.new;
  }

  private async resolveCustomerId(payload: Record<string, unknown>) {
    const customerId = this.asString(payload.customerId);
    if (customerId) {
      return customerId;
    }

    const phone = this.asString(payload.phone);
    if (!phone) {
      throw new BadRequestException("customerId or phone is required to create a booking.");
    }

    const customer = await this.prisma.customer.upsert({
      where: { phone },
      update: {
        name: this.asString(payload.customerName) ?? undefined,
        lastContact: new Date()
      },
      create: {
        phone,
        name: this.asString(payload.customerName) ?? undefined
      }
    });

    return customer.id;
  }

  private async requirePolicy() {
    const policy = await this.policiesService.getCurrent();
    if (!policy) {
      throw new NotFoundException("Booking policy is not configured.");
    }

    return policy;
  }

  private parseCourtType(value: unknown): CourtType | undefined {
    if (value === "V5" || value === CourtType.V5) return CourtType.V5;
    if (value === "V7" || value === CourtType.V7) return CourtType.V7;
    if (value === "V11" || value === CourtType.V11) return CourtType.V11;
    return undefined;
  }

  private parseBookingType(value: unknown): BookingType {
    if (value === "birthday" || value === BookingType.birthday) return BookingType.birthday;
    if (value === "private_event" || value === BookingType.private_event) {
      return BookingType.private_event;
    }

    return BookingType.regular;
  }

  private parseBookingStatus(value: unknown): BookingStatus | undefined {
    if (value === undefined) return undefined;
    if (value === "cancelled" || value === BookingStatus.cancelled) return BookingStatus.cancelled;
    if (value === "completed" || value === BookingStatus.completed) return BookingStatus.completed;
    if (value === "no_show" || value === BookingStatus.no_show) return BookingStatus.no_show;
    return BookingStatus.confirmed;
  }

  private parseBookingSource(value: unknown) {
    if (value === BookingSource.admin || value === "admin") return BookingSource.admin;
    if (value === BookingSource.web_test || value === "web_test") return BookingSource.web_test;
    return BookingSource.agent;
  }

  private parseEventType(value: unknown) {
    if (value === EventType.birthday || value === "birthday") return EventType.birthday;
    if (value === EventType.corporate || value === "corporate") return EventType.corporate;
    if (value === EventType.tournament || value === "tournament") return EventType.tournament;
    return EventType.private_event;
  }

  private parseOptionalEventType(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    return this.parseEventType(value);
  }

  private auditActorType(actorAdminId: unknown) {
    return this.asString(actorAdminId) ? AuditActorType.admin : AuditActorType.system;
  }

  private asString(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  }

  private asNumber(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}

function getLocalBookingParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23"
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");

  return {
    dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday),
    hour
  };
}

function cryptoToken(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

function comparePackageAwareOptions(
  left: { courtType: CourtType; courtName: string; price: unknown },
  right: { courtType: CourtType; courtName: string; price: unknown },
  preferredTypes?: CourtType[]
) {
  const leftRank = getCourtTypeRank(left.courtType, preferredTypes);
  const rightRank = getCourtTypeRank(right.courtType, preferredTypes);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftPrice = Number(left.price);
  const rightPrice = Number(right.price);
  if (!Number.isNaN(leftPrice) && !Number.isNaN(rightPrice) && leftPrice !== rightPrice) {
    return leftPrice - rightPrice;
  }

  return left.courtName.localeCompare(right.courtName);
}

function getCourtTypeRank(type: CourtType, preferredTypes?: CourtType[]) {
  if (!preferredTypes || preferredTypes.length === 0) {
    return {
      [CourtType.V5]: 0,
      [CourtType.V7]: 1,
      [CourtType.V11]: 2
    }[type];
  }

  const matchedIndex = preferredTypes.indexOf(type);
  return matchedIndex >= 0 ? matchedIndex : preferredTypes.length + 10;
}
