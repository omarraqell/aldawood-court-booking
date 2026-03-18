import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { PricingService } from "./pricing.service";

@Controller()
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get("courts/:courtId/pricing-rules")
  listByCourt(@Param("courtId") courtId: string) {
    return this.pricingService.listByCourt(courtId);
  }

  @Post("courts/:courtId/pricing-rules")
  create(@Param("courtId") courtId: string, @Body() body: Record<string, unknown>) {
    return this.pricingService.create(courtId, body);
  }

  @Patch("pricing-rules/:id")
  update(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.pricingService.update(id, body);
  }

  @Delete("pricing-rules/:id")
  remove(@Param("id") id: string) {
    return this.pricingService.remove(id);
  }
}

