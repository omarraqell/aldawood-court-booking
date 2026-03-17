import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CourtsService } from "./courts.service";

@Controller("courts")
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get()
  listCourts() {
    return this.courtsService.list();
  }

  @Get(":id")
  getCourt(@Param("id") id: string) {
    return this.courtsService.get(id);
  }

  @Post()
  createCourt(@Body() body: Record<string, unknown>) {
    return this.courtsService.create(body);
  }

  @Patch(":id")
  updateCourt(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.courtsService.update(id, body);
  }
}

