import { Controller, Get } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list() {
    return this.auditLogsService.list();
  }
}
