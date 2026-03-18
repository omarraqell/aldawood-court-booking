import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  listCustomers() {
    return this.customersService.list();
  }

  @Get("by-phone/:phone")
  getByPhone(@Param("phone") phone: string) {
    return this.customersService.getByPhone(phone);
  }

  @Get(":id")
  getCustomer(@Param("id") id: string) {
    return this.customersService.get(id);
  }

  @Post("find-or-create")
  findOrCreate(@Body() body: { phone: string; name?: string; preferredLang?: string }) {
    return this.customersService.findOrCreate(body);
  }

  @Patch(":id")
  updateCustomer(@Param("id") id: string, @Body() body: { name?: string; phone?: string; email?: string }) {
    return this.customersService.update(id, body);
  }
}
