import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { Roles } from "../auth/roles.decorator";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { ListDiscrepanciesDto } from "./dto/list-discrepancies.dto";
import { DiscrepanciesService } from "./discrepancies.service";
import {
  ApproveDiscrepancyDto,
  RejectDiscrepancyDto,
  RequestRecountDto,
  ResolveTransferDto,
} from "./dto/discrepancy-decision.dto";

@ApiTags("discrepancies")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller("discrepancies")
export class DiscrepanciesController {
  constructor(private readonly discrepancies: DiscrepanciesService) {}

  @Get()
  @ApiOperation({
    summary:
      "List discrepancy cases with pagination, filtering and sorting. Workers see only their own cases.",
  })
  @ApiOkResponse({ description: "Paginated discrepancy cases." })
  list(
    @Query() query: ListDiscrepanciesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.list(request.authUser!, query);
  }

  @Get("summary")
  @ApiOperation({ summary: "Discrepancy totals grouped by severity and status." })
  @ApiOkResponse({ description: "Discrepancy summary counts." })
  summary(@Req() request: AuthenticatedRequest) {
    return this.discrepancies.summary(request.authUser!);
  }

  @Get("reports")
  @Roles("manager")
  @ApiOperation({
    summary:
      "Manager-only discrepancy reports (by product, location, worker, severity, resolution time and stock-accuracy trend) computed from real records.",
  })
  @ApiOkResponse({ description: "Discrepancy report data." })
  reports(@Req() request: AuthenticatedRequest) {
    return this.discrepancies.reports(request.authUser!);
  }

  @Get("export.csv")
  @ApiOperation({
    summary:
      "Export the currently filtered discrepancy cases as a CSV file. Worker exports are limited to their own cases.",
  })
  @Header("Content-Type", "text/csv; charset=utf-8")
  async exportCsv(
    @Query() query: ListDiscrepanciesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const result = await this.discrepancies.exportCsv(
      request.authUser!,
      query,
    );
    return result.csv;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one discrepancy case with visibility rules." })
  @ApiOkResponse({ description: "One discrepancy case." })
  findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.findOne(id, request.authUser!);
  }

  @Get(":id/audit")
  @ApiOperation({
    summary: "Append-only audit history for one discrepancy case.",
  })
  @ApiOkResponse({ description: "Audit events for the case, oldest first." })
  audit(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.audit(id, request.authUser!);
  }

  @Post(":id/approve")
  @Roles("manager")
  @ApiOperation({
    summary:
      "Approve the physical count: balance is set to the counted quantity, the ledger entry posts, and the case is closed atomically.",
  })
  @ApiCreatedResponse({ description: "The approved discrepancy case." })
  approve(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ApproveDiscrepancyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.approve(id, input, request.authUser!);
  }

  @Post(":id/request-recount")
  @Roles("manager")
  @ApiOperation({
    summary:
      "Request a physical recount. Creates a linked RECOUNT task; stock is never changed.",
  })
  @ApiCreatedResponse({ description: "The recount-requested discrepancy case." })
  requestRecount(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: RequestRecountDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.requestRecount(id, input, request.authUser!);
  }

  @Post(":id/reject")
  @Roles("manager")
  @ApiOperation({
    summary: "Reject the count. Stock stays unchanged and history is preserved.",
  })
  @ApiCreatedResponse({ description: "The rejected discrepancy case." })
  reject(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: RejectDiscrepancyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.reject(id, input, request.authUser!);
  }

  @Post(":id/resolve-transfer")
  @Roles("manager")
  @ApiOperation({
    summary:
      "Resolve a misplaced-stock case by moving the difference between two locations in one posted, atomic transfer.",
  })
  @ApiCreatedResponse({ description: "The resolved discrepancy case." })
  resolveTransfer(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ResolveTransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.discrepancies.resolveTransfer(id, input, request.authUser!);
  }
}
