import { describe, it, expect } from "vitest";
import { money, addMoney, subMoney, mulMoney, allocate, formatMoney } from "./money";

describe("money()", () => {
  it("carries integer cents and a currency", () => {
    const m = money(1999);
    expect(m.amountCents).toBe(1999);
    expect(m.currency).toBe("USD");
  });

  it("rejects a non-integer amount — a float can never enter the system", () => {
    expect(() => money(19.99)).toThrow(/integer cents/);
  });
});

describe("arithmetic stays in integers", () => {
  it("adds and subtracts", () => {
    expect(addMoney(money(1999), money(1)).amountCents).toBe(2000);
    expect(subMoney(money(2000), money(1)).amountCents).toBe(1999);
  });

  it("multiplies by an integer quantity", () => {
    expect(mulMoney(money(1450), 3).amountCents).toBe(4350);
  });

  it("rejects mixing currencies and non-integer quantities", () => {
    expect(() => mulMoney(money(100), 1.5)).toThrow(/integer quantity/);
  });

  it("never accumulates float error — the 0.1 + 0.2 trap, in cents", () => {
    // 10¢ + 20¢ is exactly 30¢. (0.1 + 0.2 in floats is 0.30000000000000004.)
    expect(addMoney(money(10), money(20)).amountCents).toBe(30);
  });
});

describe("allocate() — largest-remainder, no penny lost or conjured", () => {
  it("splits 1000 across three equal weights as [334, 333, 333]", () => {
    const shares = allocate(money(1000), [1, 1, 1]).map((m) => m.amountCents);
    expect(shares).toEqual([334, 333, 333]);
    expect(shares.reduce((s, c) => s + c, 0)).toBe(1000);
  });

  it("shares always sum to the whole, for an awkward split", () => {
    const shares = allocate(money(999), [3, 1, 1, 1]).map((m) => m.amountCents);
    expect(shares.reduce((s, c) => s + c, 0)).toBe(999);
  });
});

describe("formatMoney() — the single edge where cents becomes a string", () => {
  it("formats USD cents as a currency string", () => {
    expect(formatMoney(money(1999))).toBe("$19.99");
    expect(formatMoney(money(1450))).toBe("$14.50");
    expect(formatMoney(money(0))).toBe("$0.00");
  });
});
