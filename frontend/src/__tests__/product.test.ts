import { describe, expect, it } from "vitest";

describe("Product calculations", () => {
  it("calculates cart total correctly", () => {
    const cart = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 },
    ];

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    expect(total).toBe(350);
  });
});