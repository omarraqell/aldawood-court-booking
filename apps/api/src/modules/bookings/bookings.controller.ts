import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  listBookings(@Query() query: PaginationQueryDto & { courtId?: string; date?: string }) {
    return this.bookingsService.list(query);
  }

  @Get(":id")
  getBooking(@Param("id") id: string) {
    return this.bookingsService.get(id);
  }

  @Get(":id/summary")
  getBookingSummary(@Param("id") id: string) {
    return this.bookingsService.getSummary(id);
  }

  @Post("check-availability")
  checkAvailability(@Body() body: Record<string, unknown>) {
    return this.bookingsService.checkAvailability(body);
  }

  @Post("alternatives")
  listAlternatives(@Body() body: Record<string, unknown>) {
    return this.bookingsService.getAlternatives(body);
  }

  @Post()
  createBooking(@Body() body: Record<string, unknown>) {
    return this.bookingsService.create(body);
  }

  @Patch(":id")
  updateBooking(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.bookingsService.update(id, body);
  }

  @Post(":id/cancel")
  cancelBooking(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.bookingsService.cancel(id, body);
  }

  @Post(":id/confirm")
  confirmBooking(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.bookingsService.confirm(id, body);
  }
}
