import { Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../auth/roles.decorator";
import type { AuthenticatedRequest } from "../auth/auth-user";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Roles("worker", "manager", "administrator")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the signed-in user's in-app notifications." })
  @ApiOkResponse({ description: "Notifications newest first." })
  list(@Req() request: AuthenticatedRequest) {
    return this.notifications.list(request.authUser!);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Unread notification count for the signed-in user." })
  @ApiOkResponse({ description: "Unread notification count." })
  unreadCount(@Req() request: AuthenticatedRequest) {
    return this.notifications.unreadCount(request.authUser!);
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark one notification as read." })
  @ApiOkResponse({ description: "The notification was marked read." })
  markRead(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.notifications.markRead(id, request.authUser!);
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all of the user's notifications as read." })
  @ApiOkResponse({ description: "All notifications were marked read." })
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notifications.markAllRead(request.authUser!);
  }
}
