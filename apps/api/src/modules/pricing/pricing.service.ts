import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditActorType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCourt(courtId: string) {
    const rules = await this.prisma.pricingRule.findMany({
      where: { courtId },
      orderBy: [{ priority: "asc" }, { startHour: "asc" }]
    });

    return serialize({ items: rules });
  }

  async create(courtId: string, payload: Record<string, unknown>) {
    const rule = await this.prisma.pricingRule.create({
      data: {
        courtId,
        name: String(payload.name ?? "Custom rule"),
        priority: Number(payload.priority ?? 100),
        dayOfWeek: payload.dayOfWeek === undefined ? null : Number(payload.dayOfWeek),
        startHour: Number(payload.startHour ?? 16),
        endHour: Number(payload.endHour ?? 17),
        price: Number(payload.price ?? 0),
        isPeak: payload.isPeak === undefined ? false : Boolean(payload.isPeak),
        isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
        validFrom:
          payload.validFrom === undefined ? undefined : new Date(String(payload.validFrom)),
        validUntil:
          payload.validUntil === undefined ? undefined : new Date(String(payload.validUntil))
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "pricing_rule",
        entityId: rule.id,
        action: "pricing_rule_created",
        afterJson: serialize(rule) as Prisma.InputJsonValue
      }
    });

    return serialize(rule);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const rule = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        name: payload.name === undefined ? undefined : String(payload.name),
        priority: payload.priority === undefined ? undefined : Number(payload.priority),
        dayOfWeek: payload.dayOfWeek === undefined ? undefined : Number(payload.dayOfWeek),
        startHour: payload.startHour === undefined ? undefined : Number(payload.startHour),
        endHour: payload.endHour === undefined ? undefined : Number(payload.endHour),
        price: payload.price === undefined ? undefined : Number(payload.price),
        isPeak: payload.isPeak === undefined ? undefined : Boolean(payload.isPeak),
        isActive: payload.isActive === undefined ? undefined : Boolean(payload.isActive),
        validFrom:
          payload.validFrom === undefined
            ? undefined
            : payload.validFrom === null
              ? null
              : new Date(String(payload.validFrom)),
        validUntil:
          payload.validUntil === undefined
            ? undefined
            : payload.validUntil === null
              ? null
              : new Date(String(payload.validUntil))
      }
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: this.auditActorType(payload.actorAdminId),
        actorId: this.asString(payload.actorAdminId),
        entityType: "pricing_rule",
        entityId: rule.id,
        action: "pricing_rule_updated",
        afterJson: serialize(rule) as Prisma.InputJsonValue
      }
    });

    return serialize(rule);
  }

  async remove(id: string) {
    const existing = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Pricing rule ${id} not found.`);
    }

    await this.prisma.pricingRule.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: {
        actorType: AuditActorType.system,
        entityType: "pricing_rule",
        entityId: id,
        action: "pricing_rule_deleted",
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
