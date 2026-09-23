import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";

import { Roles } from "../auth/roles.decorator";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { SpeechService } from "./speech.service";

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "video/webm",
]);

const audioUploadInterceptor = () =>
  FileInterceptor("audio", {
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    fileFilter: (_request, file, callback) => {
      const mediaType = file.mimetype.toLowerCase().split(";", 1)[0].trim();
      if (allowedAudioTypes.has(mediaType)) {
        callback(null, true);
      } else {
        callback(
          new BadRequestException(`Unsupported audio type: ${file.mimetype}.`),
          false,
        );
      }
    },
  });

@ApiTags("speech")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller("speech")
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Post("transcribe")
  @UseInterceptors(audioUploadInterceptor())
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["audio"],
      properties: {
        audio: { type: "string", format: "binary" },
        language: {
          type: "string",
          example: "en",
          description: "Optional language hint for short recordings.",
        },
      },
    },
  })
  @ApiOkResponse({ description: "Whisper transcript and language information." })
  transcribe(
    @UploadedFile() audio: Express.Multer.File | undefined,
    @Body("language") language: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!audio) throw new BadRequestException("An audio file is required.");
    if (language && !/^[a-z]{2}$/i.test(language)) {
      throw new BadRequestException(
        "Language must be a two-letter code such as 'en'.",
      );
    }
    return this.speechService.transcribe(
      audio,
      request.authUser!,
      language?.toLowerCase(),
    );
  }

  @Post("preview")
  @UseInterceptors(audioUploadInterceptor())
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["audio"],
      properties: {
        audio: { type: "string", format: "binary" },
        language: {
          type: "string",
          example: "en",
          description: "Optional language hint for the live preview.",
        },
      },
    },
  })
  @ApiOkResponse({ description: "Non-persistent Whisper preview transcript." })
  preview(
    @UploadedFile() audio: Express.Multer.File | undefined,
    @Body("language") language: string | undefined,
  ) {
    if (!audio) throw new BadRequestException("An audio file is required.");
    if (language && !/^[a-z]{2}$/i.test(language)) {
      throw new BadRequestException(
        "Language must be a two-letter code such as 'en'.",
      );
    }
    return this.speechService.preview(audio, language?.toLowerCase());
  }
}
