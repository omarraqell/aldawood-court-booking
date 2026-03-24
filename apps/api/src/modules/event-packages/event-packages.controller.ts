import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
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

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.eventPackagesService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.eventPackagesService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.eventPackagesService.remove(id);
  }
}
