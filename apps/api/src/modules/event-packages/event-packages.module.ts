import { Module } from "@nestjs/common";
import { EventPackagesController } from "./event-packages.controller";
import { EventPackagesService } from "./event-packages.service";

@Module({
  controllers: [EventPackagesController],
  providers: [EventPackagesService],
  exports: [EventPackagesService]
})
export class EventPackagesModule {}

