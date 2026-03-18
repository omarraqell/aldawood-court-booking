import { Injectable, NotFoundException } from "@nestjs/common";
import { CourtType, SurfaceType } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const courts = await this.prisma.court.findMany({
      include: {
        pricingRules: {
          where: { isActive: true },
          orderBy: [{ priority: "asc" }, { startHour: "asc" }]
        },
        blocks: {
          orderBy: { startTime: "asc" },
          take: 10
        }
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }]
    });

    return serialize({ items: courts });
  }

  async get(id: string) {
    const court = await this.prisma.court.findUnique({
      where: { id },
      include: {
        pricingRules: {
          orderBy: [{ priority: "asc" }, { startHour: "asc" }]
        },
        blocks: {
          orderBy: { startTime: "asc" }
        }
      }
    });

    if (!court) {
      throw new NotFoundException(`Court ${id} not found.`);
    }

    return serialize(court);
  }

  async create(payload: Record<string, unknown>) {
    const created = await this.prisma.court.create({
      data: {
        name: String(payload.name),
        nameAr: String(payload.nameAr ?? payload.name),
        type: this.parseCourtType(payload.type),
        surface: this.parseSurfaceType(payload.surface),
        capacity: Number(payload.capacity ?? 10),
        hourlyRate: Number(payload.hourlyRate ?? 0),
        peakRate: Number(payload.peakRate ?? payload.hourlyRate ?? 0),
        googleCalId:
          payload.googleCalId === undefined ? undefined : String(payload.googleCalId),
        locationLat: payload.locationLat === undefined ? undefined : Number(payload.locationLat),
        locationLng: payload.locationLng === undefined ? undefined : Number(payload.locationLng),
        mapsLink: payload.mapsLink === undefined ? undefined : String(payload.mapsLink),
        isActive: payload.isActive === undefined ? true : Boolean(payload.isActive)
      }
    });

    return serialize(created);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const updated = await this.prisma.court.update({
      where: { id },
      data: {
        name: payload.name === undefined ? undefined : String(payload.name),
        nameAr: payload.nameAr === undefined ? undefined : String(payload.nameAr),
        type: payload.type === undefined ? undefined : this.parseCourtType(payload.type),
        surface:
          payload.surface === undefined ? undefined : this.parseSurfaceType(payload.surface),
        capacity: payload.capacity === undefined ? undefined : Number(payload.capacity),
        hourlyRate: payload.hourlyRate === undefined ? undefined : Number(payload.hourlyRate),
        peakRate: payload.peakRate === undefined ? undefined : Number(payload.peakRate),
        googleCalId:
          payload.googleCalId === undefined ? undefined : String(payload.googleCalId),
        locationLat: payload.locationLat === undefined ? undefined : Number(payload.locationLat),
        locationLng: payload.locationLng === undefined ? undefined : Number(payload.locationLng),
        mapsLink: payload.mapsLink === undefined ? undefined : String(payload.mapsLink),
        isActive: payload.isActive === undefined ? undefined : Boolean(payload.isActive)
      }
    });

    return serialize(updated);
  }

  private parseCourtType(value: unknown): CourtType {
    if (value === CourtType.V5 || value === "V5") return CourtType.V5;
    if (value === CourtType.V7 || value === "V7") return CourtType.V7;
    if (value === CourtType.V11 || value === "V11") return CourtType.V11;
    return CourtType.V5;
  }

  private parseSurfaceType(value: unknown): SurfaceType {
    if (value === SurfaceType.natural_grass || value === "natural_grass") {
      return SurfaceType.natural_grass;
    }

    return SurfaceType.artificial_grass;
  }
}
