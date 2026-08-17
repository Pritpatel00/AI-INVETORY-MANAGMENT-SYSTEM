import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/auth-user";
import { Roles } from "../auth/roles.decorator";
import { CreateSetupAssignmentDto } from "./dto/create-setup-assignment.dto";
import { CreateSetupOpeningStockDto } from "./dto/create-setup-opening-stock.dto";
import { AssignWorkerDto } from "./dto/assign-worker.dto";
import { SetupService } from "./setup.service";

@ApiTags("setup")
@ApiBearerAuth()
@Roles("manager")
@Controller("setup")
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Get("status")
  @ApiOperation({ summary: "First-time inventory setup progress computed from real database records." })
  status() {
    return this.setup.getStatus();
  }

  @Get("summary")
  @ApiOperation({ summary: "Master data summary for the setup review step." })
  summary() {
    return this.setup.getSummary();
  }

  @Post("assignments")
  @ApiOperation({ summary: "Assign a product to a location without entering stock yet." })
  createAssignment(@Body() input: CreateSetupAssignmentDto) {
    return this.setup.createAssignment(input);
  }

  @Post("opening-stock")
  @ApiOperation({ summary: "Enter audited opening stock for an existing product-location assignment." })
  createOpeningStock(
    @Body() input: CreateSetupOpeningStockDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.setup.createOpeningStock(input, request.authUser!);
  }

  @Post("worker-assignments")
  @ApiOperation({ summary: "Assign a Warehouse Executive's shift and warehouse zone." })
  assignWorker(
    @Body() input: AssignWorkerDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.setup.assignWorker(input, request.authUser!);
  }
}
