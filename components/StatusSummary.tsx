"use client";

import { WaterStatus } from "@/lib/evaluate";
import { StationResult } from "@/types/station";

const STATUS_META = {
  pass: {
    label: "Pass (Normal)",
    icon: "✅",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  warning: {
    label: "Warning",
    icon: "⚠️",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  fail: {
    label: "Non-Compliant",
    icon: "⛔",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
} as const;

export default function StatusSummary({
  overallStatus,
  unit = "",
  reason,
  stations,
}: {
  overallStatus: WaterStatus;
  reason?: string;
  stations: StationResult[];
  unit?: string;
}) {
  const meta = STATUS_META[overallStatus];

  // Worst-case stations
  const worstStations = stations.filter(
    (s) => s.status === overallStatus
  );

  return (
    <div className={`rounded-xl p-6 border ${meta.border} ${meta.bg} space-y-4 shadow-lg backdrop-blur-sm`}>
      {/* 🔹 Overall Summary */}
      <div
        className={`flex items-center gap-3 font-semibold text-lg ${meta.color}`}
      >
        <span className="text-2xl drop-shadow-md">{meta.icon}</span>
        Overall Status: {meta.label}
      </div>

      {reason && (
        <div className="text-sm text-slate-300 italic border-l-2 border-white/20 pl-3">
          {reason}
        </div>
      )}

      {/* 🔹 Per-Station Breakdown */}
      <div className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <span>📍</span> Station Breakdown
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Station</th>
                <th className="px-4 py-3 text-right font-medium">Latest</th>
                <th className="px-4 py-3 text-right font-medium">
                  Forecast (Avg)
                </th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {stations.map((s) => {
                const m = STATUS_META[s.status];
                const isWorst = worstStations.some(
                  (w) => w.station === s.station
                );

                return (
                  <tr
                    key={s.station}
                    className={`
                      transition-colors hover:bg-white/5
                      ${isWorst ? "bg-white/5" : ""}
                    `}
                  >
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {s.station}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      {s.latest !== undefined
                        ? s.latest.toFixed(2)
                        : "–"}{" "}
                      {unit}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-300">
                      {s.forecastAvg !== undefined
                        ? s.forecastAvg.toFixed(2)
                        : "–"}{" "}
                      {unit}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`
                          text-xs px-2.5 py-1 rounded-full font-medium border
                          ${m.bg} ${m.color} ${m.border}
                        `}
                      >
                        {m.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
