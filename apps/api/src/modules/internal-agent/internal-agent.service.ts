import { Injectable, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";
import { BookingsService } from "../bookings/bookings.service";
import { ConversationsService } from "../conversations/conversations.service";
import { CustomersService } from "../customers/customers.service";
import { EventPackagesService } from "../event-packages/event-packages.service";
import { PoliciesService } from "../policies/policies.service";

@Injectable()
export class InternalAgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly conversationsService: ConversationsService,
    private readonly customersService: CustomersService,
    private readonly policiesService: PoliciesService,
    private readonly eventPackagesService: EventPackagesService
  ) {}

  async getContext(payload: Record<string, unknown>) {
    const phone =
      typeof payload.phone === "string" && payload.phone.length > 0 ? payload.phone : "unknown";
    const conversationId =
      typeof payload.conversationId === "string" ? payload.conversationId : undefined;

    let customer: Record<string, unknown>;
    let conversation: Record<string, unknown>;

    if (conversationId) {
      // Existing conversation — load it and use its customer (who may have updated their phone)
      try {
        conversation = await this.conversationsService.get(conversationId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Conversation was deleted — start fresh
          customer = await this.customersService.findOrCreate({ phone });
          conversation = await this.conversationsService.create({
            channel: "web_test",
            customerId: (customer as any).id,
            intent: payload.intent
          });
          return this.buildContextResponse(payload, customer, conversation);
        }
        throw error;
      }
      const convCustomerId = (conversation as any).customerId ?? (conversation as any).customer?.id;
      if (convCustomerId) {
        try {
          customer = await this.customersService.get(convCustomerId);
        } catch (error) {
          if (error instanceof NotFoundException) {
            // Customer was deleted (e.g. after merge) — fall back to phone lookup
            customer = await this.customersService.findOrCreate({ phone });
          } else {
            throw error;
          }
        }
      } else {
        customer = await this.customersService.findOrCreate({ phone });
      }
    } else {
      // New conversation — find or create customer by phone
      customer = await this.customersService.findOrCreate({
        phone,
        name: typeof payload.customerName === "string" ? payload.customerName : undefined,
        preferredLang: typeof payload.preferredLang === "string" ? payload.preferredLang : undefined
      });
      conversation = await this.conversationsService.create({
        channel: "web_test",
        customerId: (customer as any).id,
        intent: payload.intent
      });
    }

    return this.buildContextResponse(payload, customer, conversation);
  }

  private async buildContextResponse(
    payload: Record<string, unknown>,
    customer: Record<string, unknown>,
    conversation: Record<string, unknown>
  ) {
    const customerId = (customer as any).id;

    return {
      payload,
      policies: await this.policiesService.getCurrent(),
      customer,
      conversation,
      activeBookings: serialize(
        await this.prisma.booking.findMany({
          where: {
            customerId,
            status: BookingStatus.confirmed,
            startTime: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          include: {
            court: true,
            eventExtras: true
          },
          orderBy: {
            startTime: "asc"
          },
          take: 10
        })
      ),
      packages: await this.eventPackagesService.list()
    };
  }

  async checkBooking(payload: Record<string, unknown>) {
    return this.bookingsService.checkAvailability(payload);
  }

  async createBooking(payload: Record<string, unknown>) {
    return this.bookingsService.create(payload);
  }

  async modifyBooking(payload: Record<string, unknown>) {
    const bookingId =
      typeof payload.bookingId === "string" ? payload.bookingId : "stub-booking-id";
    return this.bookingsService.update(bookingId, payload);
  }

  async cancelBooking(payload: Record<string, unknown>) {
    const bookingId =
      typeof payload.bookingId === "string" ? payload.bookingId : "stub-booking-id";
    return this.bookingsService.cancel(bookingId, payload);
  }
}
