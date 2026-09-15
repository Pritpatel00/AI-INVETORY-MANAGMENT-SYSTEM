import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes passwords with Argon2id and verifies them", async () => {
    const passwordHash = await service.hash("correct horse battery staple");

    expect(passwordHash).toMatch(/^\$argon2id\$/);
    await expect(
      service.verify(passwordHash, "correct horse battery staple"),
    ).resolves.toBe(true);
    await expect(service.verify(passwordHash, "wrong password")).resolves.toBe(
      false,
    );
  }, 15_000);

  it("uses a unique salt for each password hash", async () => {
    const first = await service.hash("same password");
    const second = await service.hash("same password");

    expect(first).not.toBe(second);
  }, 15_000);

  it("treats malformed hashes as failed verification", async () => {
    await expect(service.verify("not-a-password-hash", "password")).resolves.toBe(
      false,
    );
  });
});
