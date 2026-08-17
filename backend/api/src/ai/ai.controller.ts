import { Body, Controller, Post, Req } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import type { AuthenticatedRequest } from "../auth/auth-user";
import { Roles } from "../auth/roles.decorator";
import { AiService } from "./ai.service";
import { ExtractInventoryDto } from "./dto/extract-inventory.dto";

@ApiTags("ai")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("extract-inventory")
  @ApiOperation({
    summary: "Extract controlled inventory fields from a reviewed transcript.",
  })
  @ApiOkResponse({
    description:
      "Validated inventory fields and clarification questions. Stock is not changed.",
  })
  extractInventory(
    @Body() input: ExtractInventoryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.aiService.extractInventory(input, request.authUser!);
  }
}
