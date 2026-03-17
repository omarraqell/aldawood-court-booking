import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";

@Controller("court-unavailability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  list() {
    return this.availabilityService.list();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.availabilityService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.availabilityService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.availabilityService.remove(id);
  }
}

