import { Body, Controller, Post } from "@nestjs/common";
import { InternalAgentService } from "./internal-agent.service";

@Controller("internal/agent")
export class InternalAgentController {
  constructor(private readonly internalAgentService: InternalAgentService) {}

  @Post("context")
  getContext(@Body() body: Record<string, unknown>) {
    return this.internalAgentService.getContext(body);
  }

  @Post("booking/check")
  checkBooking(@Body() body: Record<string, unknown>) {
    return this.internalAgentService.checkBooking(body);
  }

  @Post("booking/create")
  createBooking(@Body() body: Record<string, unknown>) {
    return this.internalAgentService.createBooking(body);
  }

  @Post("booking/modify")
  modifyBooking(@Body() body: Record<string, unknown>) {
    return this.internalAgentService.modifyBooking(body);
  }

  @Post("booking/cancel")
  cancelBooking(@Body() body: Record<string, unknown>) {
    return this.internalAgentService.cancelBooking(body);
  }
}

