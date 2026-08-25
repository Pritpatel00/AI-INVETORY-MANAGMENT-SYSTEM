import { InventoryAction, LocationSource } from "@prisma/client";
import { validate } from "class-validator";
import { CreateTransactionDto } from "./create-transaction.dto";

describe("CreateTransactionDto", () => {
  it("accepts the assigned task as the source of a cycle-count location", async () => {
    const dto = Object.assign(new CreateTransactionDto(), {
      action: InventoryAction.CYCLE_COUNT,
      productId: "11111111-1111-4111-8111-111111111111",
      quantity: 100,
      sourceLocationId: "22222222-2222-4222-8222-222222222222",
      sourceLocationSource: LocationSource.ASSIGNED_TASK,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
