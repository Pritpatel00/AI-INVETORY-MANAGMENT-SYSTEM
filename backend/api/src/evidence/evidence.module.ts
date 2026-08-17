import { Module } from "@nestjs/common";

import { EvidenceController } from "./evidence.controller";
import { EvidenceService } from "./evidence.service";
import { DiscrepanciesModule } from "../discrepancies/discrepancies.module";

@Module({
  imports: [DiscrepanciesModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
