import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rangeReturn } from "./returns";

describe("rangeReturn", () => {
  it("is value minus baseline when nothing was deposited", () => {
    assert.deepEqual(rangeReturn({ value: 1100, baseline: 1000, deposits: [] }), { change: 100, pct: 0.1 });
  });

  it("doesn't count a deposit as a gain", () => {
    const r = rangeReturn({ value: 8500, baseline: 5000, deposits: [{ time: 50, amount: 3500 }] });
    assert.deepEqual(r, { change: 0, pct: 0 });
  });

  it("measures percent against baseline plus deposits", () => {
    const r = rangeReturn({ value: 2200, baseline: 1000, deposits: [{ time: 50, amount: 1000 }] });
    assert.deepEqual(r, { change: 200, pct: 0.1 });
  });

  it("only counts deposits made up to the hovered time", () => {
    const deposits = [{ time: 50, amount: 500 }, { time: 150, amount: 500 }];
    const r = rangeReturn({ value: 1600, baseline: 1000, deposits, at: 100 });
    assert.deepEqual(r, { change: 100, pct: 100 / 1500 });
  });

  it("returns no percent for an empty starting point", () => {
    assert.deepEqual(rangeReturn({ value: 0, baseline: 0, deposits: [] }), { change: 0, pct: 0 });
  });
});
