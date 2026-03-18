import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return serialize({ items });
  }
}
