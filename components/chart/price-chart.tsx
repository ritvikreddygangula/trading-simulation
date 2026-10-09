"use client";

import {
  ColorType,
  createChart,
  CrosshairMode,
  LastPriceAnimationMode,
  LineSeries,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineData,
  type MouseEventParams,
  type UTCTimestamp,
  type WhitespaceData,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Direction } from "@/lib/format";
import type { PricePoint, Range } from "@/lib/market/types";

const SESSION_MINUTES = 390; // 9:30 to 16:00 ET
const FIVE_MIN = 300;

interface PriceChartProps {
  points: PricePoint[];
  range: Range;
  baseline: number;
  direction: Direction;
  /** Latest trade. On the 1D chart it extends the line in real time. */
  livePrice?: number;
  liveOpen?: boolean;
  onHover: (point: PricePoint | null) => void;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Pads an in-progress 1D session to 4 PM so the line grows left to right like Robinhood's. */
function withSessionPadding(points: PricePoint[], range: Range) {
  const data: Array<LineData | WhitespaceData> = points.map((p) => ({
    time: p.time as UTCTimestamp,
    value: p.price,
  }));
  if (range !== "1D" || points.length === 0) return data;

  const lastBar = points[0].time + (SESSION_MINUTES - 5) * 60;
  for (let t = points[points.length - 1].time + FIVE_MIN; t <= lastBar; t += FIVE_MIN) {
    data.push({ time: t as UTCTimestamp });
  }
  return data;
}

export function PriceChart({
  points,
  range,
  baseline,
  direction,
  livePrice,
  liveOpen,
  onHover,
}: PriceChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Line"> | null>(null);
  const baseLine = useRef<IPriceLine | null>(null);
  const hover = useRef(onHover);

  useEffect(() => {
    hover.current = onHover;
  }, [onHover]);

  // Create the chart once.
  useEffect(() => {
    if (!container.current) return;
    const c = createChart(container.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: cssVar("--muted"),
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false, scaleMargins: { top: 0.12, bottom: 0.12 } },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, fixLeftEdge: true, fixRightEdge: true, lockVisibleTimeRangeOnResize: true },
      crosshair: {
        mode: CrosshairMode.Magnet,
        horzLine: { visible: false, labelVisible: false },
        vertLine: { color: cssVar("--faint"), width: 1, style: LineStyle.Solid, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const s = c.addSeries(LineSeries, {
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderWidth: 0,
      lastPriceAnimation: LastPriceAnimationMode.OnDataUpdate,
    });

    const onMove = (param: MouseEventParams) => {
      const data = param.time ? (param.seriesData.get(s) as LineData | undefined) : undefined;
      hover.current(
        data && "value" in data ? { time: data.time as number, price: data.value } : null,
      );
    };
    c.subscribeCrosshairMove(onMove);

    chart.current = c;
    series.current = s;
    return () => {
      c.unsubscribeCrosshairMove(onMove);
      c.remove();
      chart.current = null;
      series.current = null;
      baseLine.current = null;
    };
  }, []);

  // Data, color, and the dashed previous-close line.
  useEffect(() => {
    const s = series.current;
    if (!s) return;
    const color = cssVar(direction === "down" ? "--loss" : "--gain");
    s.applyOptions({ color, crosshairMarkerBackgroundColor: color });
    s.setData(withSessionPadding(points, range));

    if (baseLine.current) s.removePriceLine(baseLine.current);
    baseLine.current =
      range === "1D"
        ? s.createPriceLine({
            price: baseline,
            color: cssVar("--faint"),
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
          })
        : null;
    chart.current?.timeScale().fitContent();
  }, [points, range, baseline, direction]);

  // Live ticks extend today's line into the current 5-minute bucket.
  useEffect(() => {
    const s = series.current;
    if (!s || range !== "1D" || !liveOpen || livePrice == null || points.length === 0) return;
    const bucket = Math.floor(Date.now() / 1000 / FIVE_MIN) * FIVE_MIN;
    const last = points[points.length - 1].time;
    const sessionEnd = points[0].time + (SESSION_MINUTES - 5) * 60;
    if (bucket < last || bucket > sessionEnd) return;
    s.update({ time: bucket as UTCTimestamp, value: livePrice });
  }, [livePrice, liveOpen, range, points]);

  return (
    <div
      ref={container}
      className="h-72 w-full sm:h-80"
      onMouseLeave={() => hover.current(null)}
      role="img"
      aria-label="Price chart"
    />
  );
}
