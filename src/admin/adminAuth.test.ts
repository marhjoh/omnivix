import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAdminAuth } from "./adminAuth";

function request(authorization?: string) {
  return new Request("http://localhost/admin", {
    headers: authorization ? { authorization } : {},
  });
}

function basic(credentials: string) {
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

afterEach(() => vi.unstubAllEnvs());

describe("checkAdminAuth", () => {
  it("hides the page when no password is set", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(checkAdminAuth(request(basic("admin:")))?.status).toBe(404);
  });

  it.each([
    ["no credentials", undefined],
    ["the wrong password", basic("admin:guess")],
  ])("asks for the password with %s", (_, authorization) => {
    vi.stubEnv("ADMIN_PASSWORD", "s3cret:pass");
    const response = checkAdminAuth(request(authorization));
    expect(response?.status).toBe(401);
    expect(response?.headers.get("WWW-Authenticate")).toMatch(/^Basic /);
  });

  it("lets the right password through with any username", () => {
    vi.stubEnv("ADMIN_PASSWORD", "s3cret:pass");
    expect(checkAdminAuth(request(basic("anyone:s3cret:pass")))).toBeNull();
  });
});
