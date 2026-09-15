import { getCorsOptions, getWebAppOrigin } from "./app-security.config";

describe("application security configuration", () => {
  it("uses the exact configured frontend origin with credentialed CSRF headers", () => {
    const environment = {
      NODE_ENV: "production",
      WEB_APP_ORIGIN: "https://inventory.example.com",
    };
    expect(getWebAppOrigin(environment)).toBe("https://inventory.example.com");
    expect(getCorsOptions(environment)).toEqual({
      origin: "https://inventory.example.com",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    });
  });

  it("rejects missing or wildcard origins in production", () => {
    expect(() => getWebAppOrigin({ NODE_ENV: "production" })).toThrow(
      "WEB_APP_ORIGIN must be set",
    );
    expect(() => getWebAppOrigin({ NODE_ENV: "production", WEB_APP_ORIGIN: "*" })).toThrow(
      "WEB_APP_ORIGIN must be set",
    );
  });

  it("keeps local development explicit and non-wildcard", () => {
    expect(getCorsOptions({ NODE_ENV: "development" })).toMatchObject({
      origin: "http://localhost:3000",
      credentials: true,
    });
    expect(() => getWebAppOrigin({ NODE_ENV: "development", WEB_APP_ORIGIN: "*" })).toThrow(
      "wildcard",
    );
  });
});
