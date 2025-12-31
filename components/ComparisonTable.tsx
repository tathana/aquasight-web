"use client";

import { StationResult } from "@/types/station";

export default function ComparisonTable({
  rows,
  unit,
  thresholdLabel = "-",
}: {
  unit: string;
  rows: StationResult[];
  thresholdLabel?: string;
}) {
  return (
    <div className="bg-[var(--color-ocean-card)] rounded-xl border border-slate-800 p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-[var(--color-accent-glow)] flex items-center gap-2">
        <span className="opacity-80">📊</span> Station Comparison
      </h3>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-slate-400 uppercase text-xs tracking-wider">
              <th className="text-left py-3 px-4 font-medium">📍 Station</th>
              <th className="text-right py-3 px-4 font-medium">🔍 Latest Value</th>
              <th className="text-right py-3 px-4 font-medium">🔮 Forecast (Avg)</th>
              <th className="text-center py-3 px-4 font-medium min-w-[100px]">📏 Standard</th>
              <th className="text-center py-3 px-4 font-medium">🚦 Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr
                key={r.station}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 font-mono text-slate-300">
                  {r.station}
                </td>

                <td className="py-3 px-4 text-right text-slate-300">
                  {r.latest !== undefined
                    ? r.latest.toFixed(2)
                    : "–"}{" "}
                  {unit}
                </td>

                <td className="py-3 px-4 text-right text-slate-300">
                  {r.forecastAvg !== undefined
                    ? r.forecastAvg.toFixed(2)
                    : "–"}{" "}
                  {unit}
                </td>

                <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                  {thresholdLabel}
                </td>

                <td className="py-3 px-4 text-center">
                  <span
                    className={`
                      px-2.5 py-1 rounded-full text-xs font-medium border
                      ${r.status === "pass"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : r.status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }
                    `}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
