import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditActorType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.courtUnavailability.findMany({
      include: {
        court: true,
        createdByAdmin: true
      },
      orderBy: { startTime: "asc" }
    });

    return serialize({ items });
  }

  async create(payload: Record<string, unknown>) {
    const item = await this.prisma.courtUnavailability.create({
      data: {
        courtId: payload.courtId === undefined ? null : String(payload.courtId),
        createdByAdminId:
          payload.createdByAdminId === undefined ? null : String(payload.createdByAdminId),
        reason: String(payload.reason ?? "Unavailable"),
        startTime: new Date(String(payload.startTime)),
        endTime: new Date(String(payload.endTime))
      },
      include: {
        court: true,
        createdByAdmin: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.createdByAdminId),
        actorId: this.asString(payload.createdByAdminId),
        entityType: "court_unavailability",
        entityId: item.id,
        action: "court_unavailability_created",
        afterJson: serialize(item) as Prisma.InputJsonValue
      }
    });

    return serialize(item);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const item = await this.prisma.courtUnavailability.update({
      where: { id },
      data: {
        courtId: payload.courtId === undefined ? undefined : String(payload.courtId),
        createdByAdminId:
          payload.createdByAdminId === undefined ? undefined : String(payload.createdByAdminId),
        reason: payload.reason === undefined ? undefined : String(payload.reason),
        startTime:
          payload.startTime === undefined ? undefined : new Date(String(payload.startTime)),
        endTime: payload.endTime === undefined ? undefined : new Date(String(payload.endTime))
      },
      include: {
        court: true,
        createdByAdmin: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.createdByAdminId),
        actorId: this.asString(payload.createdByAdminId),
        entityType: "court_unavailability",
        entityId: item.id,
        action: "court_unavailability_updated",
        afterJson: serialize(item) as Prisma.InputJsonValue
      }
    });

    return serialize(item);
  }

  async remove(id: string) {
    const existing = await this.prisma.courtUnavailability.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Court unavailability block ${id} not found.`);
    }

    await this.prisma.courtUnavailability.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(existing.createdByAdminId),
        actorId: existing.createdByAdminId ?? undefined,
        entityType: "court_unavailability",
        entityId: id,
        action: "court_unavailability_deleted",
        afterJson: serialize(existing) as Prisma.InputJsonValue
      }
    });
    return { deleted: true, id };
  }

  private auditActorType(actorAdminId: unknown) {
    return this.asString(actorAdminId) ? AuditActorType.admin : AuditActorType.system;
  }

  private asString(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    return String(value);
  }
}
