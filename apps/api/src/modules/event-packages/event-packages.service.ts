import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class EventPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.eventPackage.findMany({
      where: { isActive: true },
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
}
