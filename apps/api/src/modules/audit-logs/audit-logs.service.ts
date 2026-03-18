import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return serialize({ items });
  }
}
