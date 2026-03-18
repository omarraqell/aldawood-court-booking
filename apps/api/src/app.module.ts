import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminsModule } from "./modules/admins/admins.module";
import { CourtsModule } from "./modules/courts/courts.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { AvailabilityModule } from "./modules/availability/availability.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { EventPackagesModule } from "./modules/event-packages/event-packages.module";
import { PoliciesModule } from "./modules/policies/policies.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { InternalAgentModule } from "./modules/internal-agent/internal-agent.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    AdminsModule,
    CourtsModule,
    CustomersModule,
    BookingsModule,
    PricingModule,
    AvailabilityModule,
    ConversationsModule,
    EventPackagesModule,
    PoliciesModule,
    AuditLogsModule,
    InternalAgentModule
  ]
})
export class AppModule {}
