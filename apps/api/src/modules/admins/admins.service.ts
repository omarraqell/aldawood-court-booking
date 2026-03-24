import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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

  async get(id: string) {
    const item = await this.prisma.adminUser.findUnique({
      where: { id },
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

    if (!item) {
      throw new NotFoundException(`Admin ${id} not found.`);
    }

    return serialize(item);
  }

  async create(payload: Record<string, unknown>) {
    const email = String(payload.email ?? "").trim().toLowerCase();

    const existing = await this.prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`An admin with email "${email}" already exists.`);
    }

    const item = await this.prisma.adminUser.create({
      data: {
        email,
        passwordHash: String(payload.password ?? ""),
        name: String(payload.name ?? ""),
        role: this.parseRole(payload.role),
        isActive: true
      },
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

    return serialize(item);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const existing = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Admin ${id} not found.`);
    }

    const data: Prisma.AdminUserUpdateInput = {};
    if (payload.name !== undefined) data.name = String(payload.name);
    if (payload.role !== undefined) data.role = this.parseRole(payload.role);
    if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);
    if (payload.password !== undefined && String(payload.password).length > 0) {
      data.passwordHash = String(payload.password);
    }

    if (payload.email !== undefined) {
      const newEmail = String(payload.email).trim().toLowerCase();
      if (newEmail !== existing.email) {
        const conflict = await this.prisma.adminUser.findUnique({ where: { email: newEmail } });
        if (conflict) {
          throw new ConflictException(`An admin with email "${newEmail}" already exists.`);
        }
        data.email = newEmail;
      }
    }

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data,
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

    return serialize(updated);
  }

  async deactivate(id: string) {
    const existing = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Admin ${id} not found.`);
    }

    await this.prisma.adminUser.update({
      where: { id },
      data: { isActive: false }
    });

    return { deleted: true };
  }

  private parseRole(value: unknown): "owner" | "manager" | "staff" {
    if (value === "owner") return "owner";
    if (value === "manager") return "manager";
    return "staff";
  }
}
