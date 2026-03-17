import { Injectable, NotFoundException } from "@nestjs/common";
import { Channel, ConversationStatus, Intent, MessageRole, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { serialize } from "../../common/serialize";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const conversations = await this.prisma.conversation.findMany({
      include: {
        customer: true
      },
      orderBy: { startedAt: "desc" }
    });

    return serialize({ items: conversations });
  }

  async create(payload: Record<string, unknown>) {
    const conversation = await this.prisma.conversation.create({
      data: {
        customerId: this.asOptionalString(payload.customerId),
        channel: this.parseChannel(payload.channel),
        status: this.parseConversationStatus(payload.status),
        intent: this.parseIntent(payload.intent),
        summary: this.asOptionalString(payload.summary),
        resolved: payload.resolved === undefined ? false : Boolean(payload.resolved),
        lastMessageAt: new Date()
      }
    });

    return serialize(conversation);
  }

  async get(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        booking: {
          include: {
            court: true,
            eventExtras: true
          }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found.`);
    }

    return serialize(conversation);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: {
        customerId: payload.customerId === undefined ? undefined : this.asOptionalString(payload.customerId),
        channel: payload.channel === undefined ? undefined : this.parseChannel(payload.channel),
        status:
          payload.status === undefined ? undefined : this.parseConversationStatus(payload.status),
        intent: payload.intent === undefined ? undefined : this.parseIntent(payload.intent),
        summary: payload.summary === undefined ? undefined : this.asOptionalString(payload.summary),
        resolved: payload.resolved === undefined ? undefined : Boolean(payload.resolved),
        lastMessageAt: payload.lastMessageAt === undefined ? new Date() : new Date(String(payload.lastMessageAt)),
        endedAt:
          payload.endedAt === undefined
            ? undefined
            : payload.endedAt === null
              ? null
              : new Date(String(payload.endedAt))
      }
    });

    return serialize(conversation);
  }

  async appendMessage(id: string, payload: Record<string, unknown>) {
    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId: id,
        role: this.parseMessageRole(payload.role),
        content: String(payload.content ?? ""),
        contentJson:
          payload.contentJson === undefined
            ? undefined
            : payload.contentJson === null
              ? Prisma.JsonNull
              : (payload.contentJson as Prisma.InputJsonValue),
        toolName: this.asOptionalString(payload.toolName)
      }
    });

    await this.prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: message.createdAt
      }
    });

    return serialize(message);
  }

  async getMessages(id: string) {
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" }
    });

    return serialize({ conversationId: id, items: messages });
  }

  async close(id: string) {
    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: {
        status: ConversationStatus.completed,
        resolved: true,
        endedAt: new Date()
      }
    });

    return serialize(conversation);
  }

  private parseChannel(value: unknown): Channel {
    if (value === Channel.whatsapp || value === "whatsapp") return Channel.whatsapp;
    if (value === Channel.voice || value === "voice") return Channel.voice;
    return Channel.web_test;
  }

  private parseConversationStatus(value: unknown): ConversationStatus {
    if (value === ConversationStatus.waiting_customer || value === "waiting_customer") {
      return ConversationStatus.waiting_customer;
    }
    if (value === ConversationStatus.waiting_system || value === "waiting_system") {
      return ConversationStatus.waiting_system;
    }
    if (value === ConversationStatus.completed || value === "completed") {
      return ConversationStatus.completed;
    }
    if (value === ConversationStatus.abandoned || value === "abandoned") {
      return ConversationStatus.abandoned;
    }
    return ConversationStatus.active;
  }

  private parseIntent(value: unknown): Intent | undefined {
    const validIntents = new Set<Intent>(Object.values(Intent));
    if (typeof value === "string" && validIntents.has(value as Intent)) {
      return value as Intent;
    }

    return undefined;
  }

  private parseMessageRole(value: unknown): MessageRole {
    if (value === MessageRole.assistant || value === "assistant") return MessageRole.assistant;
    if (value === MessageRole.system || value === "system") return MessageRole.system;
    if (value === MessageRole.tool || value === "tool") return MessageRole.tool;
    return MessageRole.user;
  }

  private asOptionalString(value: unknown) {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return String(value);
  }
}
