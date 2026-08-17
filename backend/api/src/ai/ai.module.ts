import { Module } from "@nestjs/common";

import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { LocationResolverService } from "../inventory/location-resolver.service";

@Module({
  controllers: [AiController],
  providers: [AiService, LocationResolverService],
})
export class AiModule {}
