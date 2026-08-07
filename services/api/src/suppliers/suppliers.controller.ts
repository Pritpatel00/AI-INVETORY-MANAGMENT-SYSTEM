import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/roles.decorator";
import { CreateSupplierDto, UpdateSupplierDto } from "./dto/manage-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@ApiTags("suppliers") @ApiBearerAuth() @Roles("manager", "administrator") @Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}
  @Get() list() { return this.suppliers.list(); }
  @Post() @ApiOperation({ summary: "Create a supplier." }) create(@Body() input: CreateSupplierDto) { return this.suppliers.create(input); }
  @Patch(":id") @ApiOperation({ summary: "Update or activate/deactivate a supplier." }) update(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateSupplierDto) { return this.suppliers.update(id, input); }
  @Delete(":id") @ApiOperation({ summary: "Delete a supplier (soft delete; supplier codes can be reused)." }) deactivate(@Param("id", new ParseUUIDPipe()) id: string) { return this.suppliers.deactivate(id); }
}
