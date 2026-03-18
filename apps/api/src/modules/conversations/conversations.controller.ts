import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";

@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  listConversations() {
    return this.conversationsService.list();
  }

  @Post()
  createConversation(@Body() body: Record<string, unknown>) {
    return this.conversationsService.create(body);
  }

  @Get(":id")
  getConversation(@Param("id") id: string) {
    return this.conversationsService.get(id);
  }

  @Patch(":id")
  updateConversation(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.conversationsService.update(id, body);
  }

  @Post(":id/messages")
  appendMessage(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.conversationsService.appendMessage(id, body);
  }

  @Get(":id/messages")
  getMessages(@Param("id") id: string) {
    return this.conversationsService.getMessages(id);
  }

  @Post(":id/close")
  closeConversation(@Param("id") id: string) {
    return this.conversationsService.close(id);
  }
}
