import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AdminsService } from "./admins.service";

@Controller("admins")
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  list() {
    return this.adminsService.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.adminsService.get(id);
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.adminsService.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.adminsService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.adminsService.deactivate(id);
  }
}
