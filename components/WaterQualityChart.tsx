"use client";

import React, { Fragment, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
  CartesianGrid,
} from "recharts";

import { TimeSeriesPoint } from "@/types/water";
import { WATER_QUALITY_CRITERIA, WaterParameter } from "@/lib/criteria";

/* ===============================
   🎨 Ocean Color Palette (Neon/Dark)
================================ */
const STATION_COLORS = [
  "#22d3ee", // cyan-400
  "#818cf8", // indigo-400
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#fbbf24", // amber-400
];

type StationSeries = {
  station: string;
  data: TimeSeriesPoint[];
};

export default function WaterQualityChart({
  series,
  parameter,
  purpose = "drinking",
}: {
  series: StationSeries[];
  parameter: WaterParameter;
  purpose?: keyof typeof WATER_QUALITY_CRITERIA;
}) {
  const criterion = WATER_QUALITY_CRITERIA[purpose]?.[parameter];

  /* ===============================
     Merge data by date
     { date, CP01_actual, CP01_forecast, ... }
  ============================== */
  const mergedData = useMemo(() => {
    const map = new Map<string, any>();

    series.forEach(({ station, data }) => {
      data.forEach((d) => {
        if (!map.has(d.date)) {
          map.set(d.date, { date: d.date });
        }
        const row = map.get(d.date);
        row[`${station}_actual`] = d.actual;
        row[`${station}_forecast`] = d.forecast;
      });
    });

    return Array.from(map.values());
  }, [series]);

  /* ===============================
     Forecast start date (for shading)
  ============================== */
  const forecastStart = useMemo(() => {
    for (const row of mergedData) {
      const hasForecast = series.some(
        (s) => row[`${s.station}_forecast`] !== undefined
      );
      if (hasForecast) return row.date;
    }
    return undefined;
  }, [mergedData, series]);

  return (
    <div className="w-full h-[440px] p-2 pb-9 md:pb-2 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-accent-glow)] flex items-center gap-2">
            <span>📈</span> Water Quality Trends
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Historical Data vs. Forecast Model
          </p>
        </div>
        <div className="flex gap-4 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1" title="Recorded field data">
            <span className="w-3 h-0.5 bg-[var(--color-accent-cyan)]"></span> 🔍 Actual
          </span>
          <span className="flex items-center gap-1" title="AI Prediction model">
            <span className="w-3 h-0.5 border-t border-dashed border-[var(--color-accent-cyan)] opacity-60"></span> 🔮 Forecast
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mergedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          {/* ===============================
              Axes & Grid
          ============================== */}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            stroke="#334155"
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            stroke="#334155"
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#1e293b",
              color: "#e2e8f0",
              fontSize: "12px",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
            itemStyle={{ color: "#cbd5e1" }}
            labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            wrapperStyle={{
              top: -5,
              right: 0,
              fontSize: "11px",
              opacity: 0.8,
              paddingBottom: "10px"
            }}
          />

          {/* ===============================
              Forecast Shading (2025+)
          ============================== */}
          {forecastStart && (
            <ReferenceArea
              x1={forecastStart}
              fill="#22d3ee"
              fillOpacity={0.05}
              label={{
                value: "Forecast Zone",
                position: "insideTopRight",
                fontSize: 10,
                fill: "#22d3ee",
                opacity: 0.5,
              }}
            />
          )}

          {/* ===============================
              Station Lines
          ============================== */}
          {series.map((s, i) => {
            const color = STATION_COLORS[i % STATION_COLORS.length];

            return (
              <Fragment key={s.station}>
                {/* Actual */}
                <Line
                  type="monotone"
                  dataKey={`${s.station}_actual`}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  name={s.station}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />

                {/* Forecast */}
                <Line
                  type="monotone"
                  dataKey={`${s.station}_forecast`}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name={`${s.station} (Forecast)`}
                  legendType="none" // Hide forecast duplicate in legend
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
              </Fragment>
            );
          })}

          {/* ===============================
              Criteria Lines (Soft colors)
          ============================== */}
          {criterion?.min !== undefined && (
            <ReferenceLine
              y={criterion.min}
              stroke="var(--color-status-warning)"
              strokeDasharray="3 3"
              label={{
                value: `MIN ${criterion.min}`,
                fill: "#f59e0b",
                fontSize: 10,
                position: "right",
              }}
            />
          )}

          {criterion?.max !== undefined && (
            <ReferenceLine
              y={criterion.max}
              stroke="var(--color-status-fail)"
              strokeDasharray="3 3"
              label={{
                value: `MAX ${criterion.max}`,
                fill: "#f97316",
                fontSize: 10,
                position: "right",
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
