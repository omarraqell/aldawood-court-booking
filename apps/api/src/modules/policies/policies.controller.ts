import { Body, Controller, Get, Patch } from "@nestjs/common";
import { PoliciesService } from "./policies.service";

@Controller("policies")
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  getPolicies() {
    return this.policiesService.getCurrent();
  }

  @Patch()
  updatePolicies(@Body() body: Record<string, unknown>) {
    return this.policiesService.update(body);
  }
}

