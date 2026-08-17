import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";

import { Roles } from "../auth/roles.decorator";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { EvidenceService } from "./evidence.service";

const allowedPhotoTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

@ApiTags("evidence")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller()
export class EvidenceController {
  constructor(private readonly evidence: EvidenceService) {}

  @Post("discrepancies/:id/evidence")
  @UseInterceptors(
    FileInterceptor("photo", {
      limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (allowedPhotoTypes.has(file.mimetype.toLowerCase())) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Unsupported image type: ${file.mimetype}. Only JPEG, PNG and WebP are accepted.`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["photo"],
      properties: {
        photo: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOkResponse({ description: "Stored evidence metadata." })
  uploadDiscrepancy(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!photo) throw new BadRequestException("A photo file is required.");
    return this.evidence.uploadForDiscrepancy(id, photo, request.authUser!);
  }

  @Get("discrepancies/:id/evidence")
  @ApiOperation({ summary: "List photo evidence for one discrepancy case." })
  @ApiOkResponse({ description: "Evidence metadata for the case." })
  listDiscrepancy(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.evidence.listForDiscrepancy(id, request.authUser!);
  }

  @Get("transactions/:id/evidence")
  @ApiOperation({
    summary:
      "List photo evidence for one inventory transaction. Managers, administrators and the transaction creator may view it; the physical storage path is never exposed.",
  })
  @ApiOkResponse({ description: "Evidence metadata for the transaction." })
  listTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.evidence.listForTransaction(id, request.authUser!);
  }

  @Post("transactions/:id/evidence")
  @UseInterceptors(
    FileInterceptor("photo", {
      limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (allowedPhotoTypes.has(file.mimetype.toLowerCase())) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              `Unsupported image type: ${file.mimetype}. Only JPEG, PNG and WebP are accepted.`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["photo"],
      properties: {
        photo: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOkResponse({ description: "Stored evidence metadata." })
  uploadTransaction(
    @Param("id", new ParseUUIDPipe()) id: string,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!photo) throw new BadRequestException("A photo file is required.");
    return this.evidence.uploadForTransaction(id, photo, request.authUser!);
  }

  @Get("evidence/:id/file")
  @ApiOperation({
    summary:
      "Download an evidence photo. Only the case worker, the transaction creator and managers may access it.",
  })
  @ApiOkResponse({ description: "The stored image file as an attachment." })
  async file(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const evidence = await this.evidence.getFile(id, request.authUser!);
    response.set({
      "Content-Type": evidence.mimeType,
      "Content-Length": String(evidence.sizeBytes),
      "Content-Disposition": `attachment; filename="${evidence.originalFilename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });
    response.send(evidence.buffer);
  }
}
