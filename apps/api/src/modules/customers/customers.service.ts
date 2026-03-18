import { Injectable, NotFoundException } from "@nestjs/common";
import { Language } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const customers = await this.prisma.customer.findMany({
      orderBy: { lastContact: "desc" }
    });

    return serialize({ items: customers });
  }

  async get(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { court: true },
          orderBy: { startTime: "desc" },
          take: 10
        },
        conversations: {
          orderBy: { startedAt: "desc" },
          take: 10
        }
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }

    return serialize(customer);
  }

  async getByPhone(phone: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { phone }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with phone ${phone} not found.`);
    }

    return serialize(customer);
  }

  async findOrCreate(payload: { phone: string; name?: string; preferredLang?: string }) {
    const phone = payload.phone.trim();

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phone }
    });

    if (existingCustomer) {
      const updated = await this.prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: payload.name ?? existingCustomer.name,
          preferredLang:
            payload.preferredLang === "en" || payload.preferredLang === "ar"
              ? (payload.preferredLang as Language)
              : existingCustomer.preferredLang,
          lastContact: new Date()
        }
      });

      return serialize(updated);
    }

    const created = await this.prisma.customer.create({
      data: {
        phone,
        name: payload.name,
        preferredLang:
          payload.preferredLang === "en" || payload.preferredLang === "ar"
            ? (payload.preferredLang as Language)
            : Language.ar
      }
    });

    return serialize(created);
  }
}
