import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { Roles } from "../auth/roles.decorator";
import { CreateStockRequestDto, PrepareShipmentDto, ReleaseReservationDto, ReservationReasonDto } from "./reservation.dto";
import { ReservationsService } from "./reservations.service";

@ApiTags("reservations")
@ApiBearerAuth()
@Roles("manager", "administrator")
@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get("stock-requests")
  listRequests() {
    return this.reservations.listRequests();
  }

  @Get("stock-requests/next-number")
  nextRequestNumber() {
    return this.reservations.previewNextRequestNumber();
  }

  @Post("stock-requests")
  createRequest(@Body() input: CreateStockRequestDto, @Req() request: AuthenticatedRequest) {
    return this.reservations.createRequest(input, request.authUser!);
  }

  @Get("stock-requests/:id/availability")
  availability(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.reservations.getAvailability(id);
  }

  @Post("stock-requests/:id/reserve-recommended")
  reserveRecommended(@Param("id", new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.reservations.reserveRecommended(id, request.authUser!);
  }

  @Post("stock-requests/:id/cancel")
  cancelRequest(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReservationReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservations.cancelRequest(id, input.reason, request.authUser!);
  }

  @Post("expire-due")
  expireDue(@Req() request: AuthenticatedRequest) {
    return this.reservations.expireDue(request.authUser!);
  }

  @Get()
  listReservations() {
    return this.reservations.listReservations();
  }

  @Post(":id/release")
  release(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReleaseReservationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservations.release(id, input.reason, request.authUser!);
  }

  @Post(":id/shipments")
  prepareShipment(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: PrepareShipmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservations.prepareShipment(id, input, request.authUser!);
  }

  @Post(":id/fulfil")
  fulfil(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() input: ReservationReasonDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservations.fulfil(id, input.reason, request.authUser!);
  }
}
