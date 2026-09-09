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
   🎨 Station Color Palette (Fixed per Station)
================================ */
const STATION_PALETTE: Record<string, string> = {
  CP01: "#38bdf8", // Sky blue
  LS01: "#818cf8", // Indigo
  LS03: "#c084fc", // Purple
  PN01: "#34d399", // Emerald
  SK01: "#fbbf24", // Amber
  SK06: "#fb923c", // Orange
  TP01: "#f472b6", // Pink
  TP04: "#2dd4bf", // Teal
  TP011: "#60a5fa", // Blue
};

const FALLBACK_COLORS = [
  "#38bdf8",
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f472b6",
  "#2dd4bf",
  "#c084fc",
];

type StationSeries = {
  station: string;
  data: TimeSeriesPoint[];
};

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

/* ===============================
   📅 Date Formatting Helpers
================================ */
function formatXAxisTick(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const thaiYearShort = (year + 543) % 100;
    return `${THAI_MONTHS_SHORT[month - 1]} '${thaiYearShort}`;
  }
  return dateStr;
}

function formatTooltipDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    return `${THAI_MONTHS_FULL[month - 1]} พ.ศ. ${year + 543} (${dateStr})`;
  }
  return dateStr;
}

/* ===============================
   🔍 Custom Tooltip Component
================================ */
function CustomTooltip({
  active,
  payload,
  label,
  unit = "",
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const dateText = formatTooltipDate(label || "");

  // Collect unique station entries and deduplicate bridge points
  const displayed: {
    station: string;
    color: string;
    value: string;
    isForecast: boolean;
  }[] = [];
  const seenActual = new Set<string>();

  payload.forEach((item) => {
    if (item.value === undefined || item.value === null) return;
    const isForecast = item.dataKey.endsWith("_forecast");
    const stationName = item.dataKey.replace("_actual", "").replace("_forecast", "");

    if (!isForecast) {
      seenActual.add(stationName);
      displayed.push({
        station: stationName,
        color: item.stroke || item.color,
        value: Number(item.value).toFixed(2),
        isForecast: false,
      });
    }
  });

  payload.forEach((item) => {
    if (item.value === undefined || item.value === null) return;
    const isForecast = item.dataKey.endsWith("_forecast");
    const stationName = item.dataKey.replace("_actual", "").replace("_forecast", "");

    if (isForecast && !seenActual.has(stationName)) {
      displayed.push({
        station: stationName,
        color: item.stroke || item.color,
        value: Number(item.value).toFixed(2),
        isForecast: true,
      });
    }
  });

  if (displayed.length === 0) return null;

  const anyForecast = displayed.some((d) => d.isForecast);

  return (
    <div className="bg-[#0f172a]/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md min-w-[220px] text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5 gap-2">
        <span className="font-semibold text-slate-200">{dateText}</span>
        {anyForecast && (
          <span className="bg-sky-950/80 text-sky-300 border border-sky-600/50 px-2 py-0.5 rounded text-[10px] font-medium shrink-0">
            🔮 พยากรณ์
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayed.map((d) => (
          <div
            key={`${d.station}-${d.isForecast}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-mono font-bold text-slate-200">
                {d.station}
              </span>
              <span className="text-[10px] text-slate-400">
                {d.isForecast ? "(พยากรณ์)" : "(ค่าจริง)"}
              </span>
            </div>
            <span className="font-mono font-bold text-slate-100 shrink-0">
              {d.value} {unit && <span className="text-[10px] font-normal text-slate-400">{unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WaterQualityChart({
  series,
  parameter,
  purpose = "drinking",
  unit = "",
  parameterName = "",
}: {
  series: StationSeries[];
  parameter: WaterParameter;
  purpose?: keyof typeof WATER_QUALITY_CRITERIA;
  unit?: string;
  parameterName?: string;
}) {
  const criterion = WATER_QUALITY_CRITERIA[purpose]?.[parameter];

  /* ===============================
     Merge data by date & bridge gap
  ============================== */
  const mergedData = useMemo(() => {
    const map = new Map<string, any>();

    series.forEach(({ station, data }) => {
      // Find the last index that has actual value
      let lastActualIdx = -1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].actual !== undefined && data[i].actual !== null) {
          lastActualIdx = i;
          break;
        }
      }

      data.forEach((d, idx) => {
        if (!map.has(d.date)) {
          map.set(d.date, { date: d.date });
        }
        const row = map.get(d.date);
        row[`${station}_actual`] = d.actual;
        row[`${station}_forecast`] = d.forecast;

        // Bridge: connect the last actual point to the start of forecast
        if (idx === lastActualIdx && d.actual !== undefined && d.actual !== null) {
          const hasFutureForecast = data.slice(idx + 1).some(
            (p) => p.forecast !== undefined && p.forecast !== null
          );
          if (hasFutureForecast) {
            row[`${station}_forecast`] = d.actual;
          }
        }
      });
    });

    // Sort chronologically by date
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [series]);

  /* ===============================
     Forecast start & end dates (for ReferenceArea shading)
  ============================== */
  const { forecastStart, forecastEnd } = useMemo(() => {
    let start: string | undefined;
    let end: string | undefined;

    for (const row of mergedData) {
      const hasOnlyForecast = series.some((s) => {
        const f = row[`${s.station}_forecast`];
        const a = row[`${s.station}_actual`];
        return f !== undefined && a === undefined;
      });
      if (hasOnlyForecast && !start) {
        start = row.date;
      }
    }

    if (mergedData.length > 0) {
      end = mergedData[mergedData.length - 1].date;
    }

    return { forecastStart: start, forecastEnd: end };
  }, [mergedData, series]);

  if (series.length === 0 || mergedData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-10 text-center text-slate-400 space-y-2">
        <span className="text-3xl block">📊</span>
        <p className="text-sm font-medium">ไม่พบข้อมูลสำหรับแสดงกราฟ</p>
        <p className="text-xs text-slate-500">กรุณาเลือกสถานีตรวจวัดอย่างน้อย 1 สถานีจากแผงควบคุม</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
            <span>📈</span> กราฟแสดงแนวโน้มคุณภาพน้ำ (Water Quality Trends)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            เปรียบเทียบข้อมูลย้อนหลังจริงกับแบบจำลองพยากรณ์ล่วงหน้า
            {parameterName ? ` • ${parameterName}` : ""}
            {unit ? ` (${unit})` : ""}
          </p>
        </div>

        {/* Legend Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3.5 h-0.5 bg-sky-400 inline-block rounded"></span>
            <span>เส้นทึบ: ค่าจริง (Actual)</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-sky-400 inline-block"></span>
            <span>เส้นประ: ค่าพยากรณ์ (Forecast)</span>
          </div>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mergedData}
            margin={{ top: 15, right: 20, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />

            {/* X-Axis with Thai Date Formatting and Spacing */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              stroke="#334155"
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={formatXAxisTick}
              minTickGap={35}
            />

            {/* Y-Axis */}
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              stroke="#334155"
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              domain={["auto", "auto"]}
              width={45}
            />

            {/* Custom Interactive Tooltip */}
            <Tooltip
              content={<CustomTooltip unit={unit} />}
            />

            {/* Station Legend */}
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              wrapperStyle={{
                top: -5,
                right: 0,
                fontSize: "12px",
                paddingBottom: "8px",
              }}
              formatter={(value) => {
                const clean = String(value).replace(" (ค่าจริง)", "");
                return (
                  <span className="text-slate-200 font-mono font-medium mr-2">
                    {clean}
                  </span>
                );
              }}
            />

            {/* Forecast Zone Shading */}
            {forecastStart && forecastEnd && (
              <ReferenceArea
                x1={forecastStart}
                x2={forecastEnd}
                fill="#0284c7"
                fillOpacity={0.07}
                stroke="#0284c7"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
                label={{
                  value: "🔮 โซนพยากรณ์ล่วงหน้า (Forecast)",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#38bdf8",
                  opacity: 0.7,
                }}
              />
            )}

            {/* Station Lines */}
            {series.map((s, i) => {
              const color =
                STATION_PALETTE[s.station] ||
                FALLBACK_COLORS[i % FALLBACK_COLORS.length];

              return (
                <Fragment key={s.station}>
                  {/* Actual Solid Line */}
                  <Line
                    type="monotone"
                    dataKey={`${s.station}_actual`}
                    stroke={color}
                    strokeWidth={2.2}
                    dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 5.5, stroke: "#ffffff", strokeWidth: 2 }}
                    name={`${s.station} (ค่าจริง)`}
                    connectNulls={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />

                  {/* Forecast Dashed Line */}
                  <Line
                    type="monotone"
                    dataKey={`${s.station}_forecast`}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeOpacity={0.8}
                    dot={false}
                    activeDot={{ r: 4.5, stroke: "#ffffff", strokeWidth: 1.5 }}
                    name={`${s.station} (พยากรณ์)`}
                    legendType="none"
                    connectNulls={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </Fragment>
              );
            })}

            {/* Criteria Threshold Reference Lines */}
            {criterion?.min !== undefined && (
              <ReferenceLine
                y={criterion.min}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `เกณฑ์ขั้นต่ำ (Min): ${criterion.min} ${unit}`.trim(),
                  fill: "#fbbf24",
                  fontSize: 10,
                  position: "insideBottomLeft",
                }}
              />
            )}

            {criterion?.max !== undefined && (
              <ReferenceLine
                y={criterion.max}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `เกณฑ์สูงสุด (Max): ${criterion.max} ${unit}`.trim(),
                  fill: "#fb7185",
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
