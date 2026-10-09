import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHistory } from "./history";

const prices = {
  AAPL: [
    { time: 100, price: 10 },
    { time: 200, price: 12 },
    { time: 300, price: 15 },
  ],
};

describe("buildHistory", () => {
  it("is a flat line of cash when nothing was ever bought", () => {
    const { points } = buildHistory({
      timeline: [100, 200, 300],
      cashNow: 500,
      holdingsNow: {},
      events: [],
      prices: {},
    });
    assert.deepEqual(points.map((p) => p.price), [500, 500, 500]);
  });

  it("values current holdings at each historical price", () => {
    const { points } = buildHistory({
      timeline: [100, 200, 300],
      cashNow: 0,
      holdingsNow: { AAPL: 2 },
      events: [],
      prices,
    });
    assert.deepEqual(points.map((p) => p.price), [20, 24, 30]);
  });

  it("undoes a buy that happened mid-range", () => {
    // Started with $100 cash, bought 2 AAPL at t=250 for $24 (price 12).
    const { points, start } = buildHistory({
      timeline: [100, 200, 300],
      cashNow: 76,
      holdingsNow: { AAPL: 2 },
      events: [{ time: 250, cashDelta: -24, symbol: "AAPL", qtyDelta: 2 }],
      prices,
    });
    assert.deepEqual(points.map((p) => p.price), [100, 100, 106]);
    assert.deepEqual(start, { cash: 100, holdings: { AAPL: 0 } });
  });

  it("undoes a sell and an admin deposit", () => {
    // Had 1 AAPL and $0. Sold it at t=150 for $11, admin added $50 at t=250.
    const { points } = buildHistory({
      timeline: [100, 200, 300],
      cashNow: 61,
      holdingsNow: {},
      events: [
        { time: 150, cashDelta: 11, symbol: "AAPL", qtyDelta: -1 },
        { time: 250, cashDelta: 50 },
      ],
      prices,
    });
    assert.deepEqual(points.map((p) => p.price), [10, 11, 61]);
  });

  it("carries the last known price forward between bars", () => {
    const { points } = buildHistory({
      timeline: [100, 150, 200],
      cashNow: 0,
      holdingsNow: { AAPL: 1 },
      events: [],
      prices,
    });
    assert.deepEqual(points.map((p) => p.price), [10, 10, 12]);
  });

  it("uses the first known price before a stock's history starts", () => {
    const { points } = buildHistory({
      timeline: [50, 100],
      cashNow: 0,
      holdingsNow: { AAPL: 1 },
      events: [],
      prices,
    });
    assert.deepEqual(points.map((p) => p.price), [10, 10]);
  });
});
