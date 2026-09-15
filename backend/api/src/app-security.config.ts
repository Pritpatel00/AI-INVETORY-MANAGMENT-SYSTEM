export function getWebAppOrigin(environment: NodeJS.ProcessEnv = process.env) {
  const configuredOrigin = (environment.WEB_APP_ORIGIN ?? "http://localhost:3000")
    .trim()
    .replace(/^['"]|['"]$/g, "");
  if (
    environment.NODE_ENV?.trim().toLowerCase() === "production" &&
    (!environment.WEB_APP_ORIGIN?.trim() || configuredOrigin === "*")
  ) {
    throw new Error(
      "WEB_APP_ORIGIN must be set to the exact deployed frontend origin in production.",
    );
  }
  if (configuredOrigin === "*") {
    throw new Error("WEB_APP_ORIGIN cannot be a wildcard when credentials are enabled.");
  }
  return configuredOrigin;
}

export function getCorsOptions(environment: NodeJS.ProcessEnv = process.env) {
  return {
    origin: getWebAppOrigin(environment),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  };
}
