import { Injectable } from "@nestjs/common";
import { AuditActorType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent() {
    const policy = await this.prisma.bookingPolicy.findFirst({
      orderBy: { createdAt: "asc" }
    });

    return serialize(policy);
  }

  async update(payload: Record<string, unknown>) {
    const currentPolicy = await this.prisma.bookingPolicy.findFirst({
      orderBy: { createdAt: "asc" }
    });

    if (!currentPolicy) {
      const created = await this.prisma.bookingPolicy.create({
        data: {
          timezone: String(payload.timezone ?? "Asia/Amman"),
          slotIntervalMins: Number(payload.slotIntervalMins ?? 60),
          minBookingDurationMins: Number(payload.minBookingDurationMins ?? 60),
          maxBookingDurationMins: Number(payload.maxBookingDurationMins ?? 180),
          minLeadTimeMins: Number(payload.minLeadTimeMins ?? 120),
          cancellationCutoffMins: Number(payload.cancellationCutoffMins ?? 180),
          modificationCutoffMins: Number(payload.modificationCutoffMins ?? 180),
          openingTime: String(payload.openingTime ?? "16:00"),
          closingTime: String(payload.closingTime ?? "01:00")
        }
      });

      await this.prisma.auditLog.create({
        data: {
          actorType: this.auditActorType(payload.actorAdminId),
          actorId: this.asString(payload.actorAdminId),
          entityType: "booking_policy",
          entityId: created.id,
          action: "policy_created",
          afterJson: serialize(created) as Prisma.InputJsonValue
        }
      });

      return serialize(created);
    }

    const updated = await this.prisma.bookingPolicy.update({
      where: { id: currentPolicy.id },
      data: {
        timezone: payload.timezone === undefined ? undefined : String(payload.timezone),
        slotIntervalMins:
          payload.slotIntervalMins === undefined ? undefined : Number(payload.slotIntervalMins),
        minBookingDurationMins:
          payload.minBookingDurationMins === undefined
            ? undefined
            : Number(payload.minBookingDurationMins),
        maxBookingDurationMins:
          payload.maxBookingDurationMins === undefined
            ? undefined
            : Number(payload.maxBookingDurationMins),
        minLeadTimeMins:
          payload.minLeadTimeMins === undefined ? undefined : Number(payload.minLeadTimeMins),
        cancellationCutoffMins:
          payload.cancellationCutoffMins === undefined
            ? undefined
            : Number(payload.cancellationCutoffMins),
        modificationCutoffMins:
          payload.modificationCutoffMins === undefined
            ? undefined
            : Number(payload.modificationCutoffMins),
        openingTime: payload.openingTime === undefined ? undefined : String(payload.openingTime),
        closingTime: payload.closingTime === undefined ? undefined : String(payload.closingTime)
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "booking_policy",
        entityId: updated.id,
        action: "policy_updated",
        afterJson: serialize(updated) as Prisma.InputJsonValue
      }
    });

    return serialize(updated);
  }

  private auditActorType(actorAdminId: unknown) {
    return this.asString(actorAdminId) ? AuditActorType.admin : AuditActorType.system;
  }

  private asString(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  }
}
