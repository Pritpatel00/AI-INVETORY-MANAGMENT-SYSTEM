import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { Roles } from "../auth/roles.decorator";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { CreateProductDto, UpdateProductDto } from "./dto/manage-product.dto";
import { CreateLocationDto, UpdateLocationDto } from "./dto/manage-location.dto";
import { OpeningBalanceDto } from "./dto/opening-balance.dto";
import { AdjustBalanceDto } from "./dto/adjust-balance.dto";
import { ReviewTransactionDto } from "./dto/review-transaction.dto";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller("inventory")
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Get("products")
  @ApiOkResponse({ description: "Products with their location balances." })
  listProducts() {
    return this.inventoryService.listProducts();
  }

  @Post("products")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Create an inventory product and its reorder rules." })
  createProduct(@Body() input: CreateProductDto) {
    return this.inventoryService.createProduct(input);
  }

  @Patch("products/:id")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Update product details and reorder rules." })
  updateProduct(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(id, input);
  }

  @Delete("products/:id")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Delete a product from the master list (soft delete; audit history is kept)." })
  deactivateProduct(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.inventoryService.deactivateProduct(id);
  }

  @Delete("products/:id/administrator-override")
  @Roles("administrator")
  @ApiOperation({ summary: "Administrator-only product archive, including products that still have stock." })
  administratorDeactivateProduct(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.inventoryService.deactivateProduct(id, true);
  }

  @Get("locations")
  @ApiOkResponse({ description: "Warehouse locations." })
  listLocations() {
    return this.inventoryService.listLocations();
  }

  @Post("locations")
  @Roles("manager", "administrator")
  createLocation(@Body() input: CreateLocationDto) { return this.inventoryService.createLocation(input); }

  @Patch("locations/:id")
  @Roles("manager", "administrator")
  updateLocation(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateLocationDto) { return this.inventoryService.updateLocation(id, input); }

  @Delete("locations/:id")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Delete an unused warehouse location (fails if it has stock, transactions, drafts or tasks)." })
  deleteLocation(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.inventoryService.deleteLocation(id);
  }

  @Get("balances")
  @ApiOkResponse({ description: "Current inventory balances." })
  listBalances() {
    return this.inventoryService.listBalances();
  }

  @Post("opening-balances")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Assign a product to a location with audited opening stock." })
  createOpeningBalance(@Body() input: OpeningBalanceDto, @Req() request: AuthenticatedRequest) {
    return this.inventoryService.createOpeningBalance(input, request.authUser!);
  }

  @Post("balance-adjustments")
  @Roles("administrator")
  @ApiOperation({ summary: "Correct an existing balance with a posted audit record." })
  adjustBalance(@Body() input: AdjustBalanceDto, @Req() request: AuthenticatedRequest) {
    return this.inventoryService.adjustBalance(input, request.authUser!);
  }

  @Delete("default-data")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Remove all default inventory data (products, locations, balances, transactions, reorder drafts, tasks and voice evidence)." })
  @ApiOkResponse({ description: "All default inventory data was removed. Users are preserved." })
  removeDefaultData(@Req() request: AuthenticatedRequest) {
    return this.inventoryService.removeDefaultData(request.authUser!);
  }

  @Get("transactions")
  @ApiOkResponse({ description: "Recent inventory audit transactions." })
  listTransactions(@Req() request: AuthenticatedRequest) {
    return this.inventoryService.listTransactions(request.authUser!);
  }

  @Get("reorder-drafts")
  @Roles("manager", "administrator")
  @ApiOkResponse({ description: "Recent low-stock reorder drafts." })
  listReorderDrafts(@Req() request: AuthenticatedRequest) {
    return this.inventoryService.listReorderDrafts(request.authUser!);
  }

  @Post("reorder-drafts/refresh")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Recheck all balances and refresh reorder drafts." })
  refreshReorderDrafts(@Req() request: AuthenticatedRequest) {
    return this.inventoryService.refreshReorderDrafts(request.authUser!);
  }

  @Get("transactions/:id")
  @ApiOkResponse({ description: "One authorized inventory transaction." })
  getTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.getTransaction(id, request.authUser!);
  }

  @Post("transactions")
  @ApiOperation({ summary: "Create a pending inventory transaction." })
  @ApiCreatedResponse({
    description: "The transaction was validated and saved for confirmation.",
  })
  createTransaction(
    @Body() input: CreateTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.createTransaction(input, request.authUser!);
  }

  @Post("transactions/:id/confirm")
  @ApiOperation({
    summary: "Confirm and safely post or route an inventory transaction.",
  })
  @ApiOkResponse({
    description:
      "Safe movements are posted atomically; risky movements remain pending review.",
  })
  confirmTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.confirmTransaction(id, request.authUser!);
  }

  @Post("transactions/:id/approve")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Approve and post a manager-review transaction." })
  @ApiOkResponse({
    description: "The approved stock adjustment was posted atomically.",
  })
  approveTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReviewTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.approveTransaction(
      id,
      input,
      request.authUser!,
    );
  }

  @Post("transactions/:id/cancel")
  @ApiOperation({
    summary: "Cancel an un-posted transaction before it changes stock.",
  })
  cancelTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReviewTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.cancelTransaction(
      id,
      input,
      request.authUser!,
    );
  }

  @Post("transactions/:id/reject")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Reject a manager-review transaction." })
  rejectTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReviewTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.rejectTransaction(
      id,
      input,
      request.authUser!,
    );
  }

  @Post("transactions/:id/request-recount")
  @Roles("manager", "administrator")
  @ApiOperation({ summary: "Return a transaction to the worker for a recount." })
  requestRecount(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReviewTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryService.requestRecount(
      id,
      input,
      request.authUser!,
    );
  }
}
