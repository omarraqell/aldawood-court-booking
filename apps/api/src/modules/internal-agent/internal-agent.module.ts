import { Module } from "@nestjs/common";
import { InternalAgentController } from "./internal-agent.controller";
import { InternalAgentService } from "./internal-agent.service";
import { BookingsModule } from "../bookings/bookings.module";
import { ConversationsModule } from "../conversations/conversations.module";
import { CustomersModule } from "../customers/customers.module";
import { EventPackagesModule } from "../event-packages/event-packages.module";
import { PoliciesModule } from "../policies/policies.module";

@Module({
  imports: [
    BookingsModule,
    ConversationsModule,
    CustomersModule,
    PoliciesModule,
    EventPackagesModule
  ],
  controllers: [InternalAgentController],
  providers: [InternalAgentService]
})
export class InternalAgentModule {}
