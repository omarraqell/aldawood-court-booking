import { Controller, Get, Param } from "@nestjs/common";
import { EventPackagesService } from "./event-packages.service";

@Controller("event-packages")
export class EventPackagesController {
  constructor(private readonly eventPackagesService: EventPackagesService) {}

  @Get()
  list() {
    return this.eventPackagesService.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.eventPackagesService.get(id);
  }
}

