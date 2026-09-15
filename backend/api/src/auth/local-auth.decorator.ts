import { SetMetadata } from "@nestjs/common";

export const ALLOW_LOCAL_AUTH_KEY = "allowLocalAuth";
export const AllowLocalAuth = () => SetMetadata(ALLOW_LOCAL_AUTH_KEY, true);
