import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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

  async update(id: string, payload: { name?: string; phone?: string; email?: string }) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found.`);
    }

    // If updating phone, check if another customer already has that number
    if (payload.phone && payload.phone !== customer.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { phone: payload.phone }
      });
      if (existing && existing.id !== id) {
        // Another customer has this phone — merge: update the existing one
        // and delete the Telegram-based record
        const merged = await this.prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: payload.name || existing.name,
            email: payload.email || existing.email,
            lastContact: new Date(),
          },
        });
        // Move any conversations/bookings from the temp customer to the real one
        await this.prisma.conversation.updateMany({
          where: { customerId: id },
          data: { customerId: existing.id },
        });
        await this.prisma.booking.updateMany({
          where: { customerId: id },
          data: { customerId: existing.id },
        });
        // Delete the temporary (tg_) customer
        await this.prisma.customer.delete({ where: { id } });
        return serialize(merged);
      }
    }

    const data: Record<string, unknown> = { lastContact: new Date() };
    if (payload.name) data.name = payload.name;
    if (payload.phone) data.phone = payload.phone;
    if (payload.email) data.email = payload.email;

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });

    return serialize(updated);
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
