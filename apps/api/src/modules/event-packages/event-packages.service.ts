import { Injectable, NotFoundException } from "@nestjs/common";
import { EventType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class EventPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.eventPackage.findMany({
      orderBy: { createdAt: "asc" }
    });

    return serialize({ items });
  }

  async get(id: string) {
    const item = await this.prisma.eventPackage.findUnique({
      where: { id }
    });

    if (!item) {
      throw new NotFoundException(`Event package ${id} not found.`);
    }

    return serialize(item);
  }

  async create(payload: Record<string, unknown>) {
    const item = await this.prisma.eventPackage.create({
      data: {
        name: String(payload.name ?? ""),
        nameAr: String(payload.nameAr ?? ""),
        type: this.parseEventType(payload.type),
        description: payload.description ? String(payload.description) : null,
        descriptionAr: payload.descriptionAr ? String(payload.descriptionAr) : null,
        basePrice: Number(payload.basePrice ?? 0),
        maxGuests: payload.maxGuests ? Number(payload.maxGuests) : null,
        includesDecorations: Boolean(payload.includesDecorations),
        includesCatering: Boolean(payload.includesCatering),
        durationMins: Number(payload.durationMins ?? 60),
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true
      }
    });

    return serialize(item);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.eventPackage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Event package ${id} not found.`);
    }

    const data: Prisma.EventPackageUpdateInput = {};
    if (payload.name !== undefined) data.name = String(payload.name);
    if (payload.nameAr !== undefined) data.nameAr = String(payload.nameAr);
    if (payload.type !== undefined) data.type = this.parseEventType(payload.type);
    if (payload.description !== undefined) data.description = payload.description ? String(payload.description) : null;
    if (payload.descriptionAr !== undefined) data.descriptionAr = payload.descriptionAr ? String(payload.descriptionAr) : null;
    if (payload.basePrice !== undefined) data.basePrice = Number(payload.basePrice);
    if (payload.maxGuests !== undefined) data.maxGuests = payload.maxGuests ? Number(payload.maxGuests) : null;
    if (payload.includesDecorations !== undefined) data.includesDecorations = Boolean(payload.includesDecorations);
    if (payload.includesCatering !== undefined) data.includesCatering = Boolean(payload.includesCatering);
    if (payload.durationMins !== undefined) data.durationMins = Number(payload.durationMins);
    if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

    const updated = await this.prisma.eventPackage.update({
      where: { id },
      data
    });

    return serialize(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.eventPackage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Event package ${id} not found.`);
    }

    await this.prisma.eventPackage.update({
      where: { id },
      data: { isActive: false }
    });

    return { deleted: true };
  }

  private parseEventType(value: unknown): EventType {
    if (value === "birthday" || value === EventType.birthday) return EventType.birthday;
    if (value === "corporate" || value === EventType.corporate) return EventType.corporate;
    if (value === "tournament" || value === EventType.tournament) return EventType.tournament;
    return EventType.private_event;
  }
}
