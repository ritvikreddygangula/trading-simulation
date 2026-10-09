import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planOrder, type OrderContext } from "./order";

const ctx: OrderContext = { symbol: "AAPL", price: 200, cash: 1000, held: 0, fractionable: true };

describe("planOrder: buying", () => {
  it("converts dollars to a fractional quantity, rounded down to 8 places", () => {
    const plan = planOrder({ side: "buy", mode: "dollars", amount: 50 }, ctx);
    assert.deepEqual(plan, { ok: true, quantity: 0.25, notional: 50 });
  });

  it("never spends more than the dollar amount asked for", () => {
    const plan = planOrder({ side: "buy", mode: "dollars", amount: 10 }, { ...ctx, price: 3 });
    assert.ok(plan.ok);
    assert.equal(plan.quantity, 3.33333333);
    assert.ok(plan.notional <= 10);
  });

  it("buys whole shares by quantity", () => {
    const plan = planOrder({ side: "buy", mode: "shares", amount: 2 }, ctx);
    assert.deepEqual(plan, { ok: true, quantity: 2, notional: 400 });
  });

  it("rejects orders over buying power", () => {
    const plan = planOrder({ side: "buy", mode: "shares", amount: 6 }, ctx);
    assert.equal(plan.ok, false);
    assert.match(!plan.ok ? plan.error : "", /buying power/);
  });

  it("rejects dollar orders under $1", () => {
    const plan = planOrder({ side: "buy", mode: "dollars", amount: 0.5 }, ctx);
    assert.equal(plan.ok, false);
  });

  it("rejects fractional orders for whole-share-only stocks", () => {
    const whole = { ...ctx, fractionable: false };
    assert.equal(planOrder({ side: "buy", mode: "shares", amount: 1.5 }, whole).ok, false);
    assert.equal(planOrder({ side: "buy", mode: "dollars", amount: 50 }, whole).ok, false);
    assert.equal(planOrder({ side: "buy", mode: "shares", amount: 1 }, whole).ok, true);
  });

  it("rejects zero, negative, and non-numeric amounts", () => {
    for (const amount of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(planOrder({ side: "buy", mode: "shares", amount }, ctx).ok, false);
    }
  });
});

describe("planOrder: selling", () => {
  const holding = { ...ctx, held: 1.5 };

  it("sells part of a position by shares", () => {
    const plan = planOrder({ side: "sell", mode: "shares", amount: 0.5 }, holding);
    assert.deepEqual(plan, { ok: true, quantity: 0.5, notional: 100 });
  });

  it("rejects selling more than you hold", () => {
    const plan = planOrder({ side: "sell", mode: "shares", amount: 2 }, holding);
    assert.equal(plan.ok, false);
    assert.match(!plan.ok ? plan.error : "", /1\.5 shares/);
  });

  it("treats a dollar sell for the full market value as selling everything", () => {
    // 1.5 shares × $200 = $300. Rounding must not leave dust or overshoot.
    const plan = planOrder({ side: "sell", mode: "dollars", amount: 300 }, holding);
    assert.deepEqual(plan, { ok: true, quantity: 1.5, notional: 300 });
  });

  it("clamps a tiny rounding overshoot to the shares held", () => {
    const odd = { ...holding, held: 0.33333333, price: 3 };
    const plan = planOrder({ side: "sell", mode: "dollars", amount: 1 }, odd);
    assert.ok(plan.ok);
    assert.equal(plan.quantity, 0.33333333);
  });

  it("rejects selling a stock you don't own", () => {
    assert.equal(planOrder({ side: "sell", mode: "shares", amount: 1 }, ctx).ok, false);
  });
});
