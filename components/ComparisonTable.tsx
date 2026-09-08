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
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
      <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
        <span>📊</span> เปรียบเทียบข้อมูลระหว่างสถานีตรวจวัด (Station Comparison)
      </h3>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm border-collapse bg-[#1e293b]/40">
          <thead>
            <tr className="bg-[#1e293b] border-b border-slate-700 text-slate-300 uppercase text-[11px] font-bold tracking-wider">
              <th className="text-left py-3.5 px-4">📍 สถานีตรวจวัด (Station)</th>
              <th className="text-right py-3.5 px-4">🔍 ค่าตรวจวัดล่าสุด (Latest)</th>
              <th className="text-right py-3.5 px-4">🔮 ค่าพยากรณ์เฉลี่ย (Forecast)</th>
              <th className="text-center py-3.5 px-4 min-w-[120px]">📏 เกณฑ์อ้างอิง (Standard)</th>
              <th className="text-center py-3.5 px-4">🚦 สถานะการประเมิน (Status)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr
                key={r.station}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-3 px-4 font-bold text-slate-100 font-mono">
                  {r.station}
                </td>

                <td className="py-3 px-4 text-right text-slate-200 font-medium">
                  {r.latest !== undefined
                    ? r.latest.toFixed(2)
                    : "–"}{" "}
                  <span className="text-xs text-slate-400 font-normal">{unit}</span>
                </td>

                <td className="py-3 px-4 text-right text-slate-200 font-medium">
                  {r.forecastAvg !== undefined
                    ? r.forecastAvg.toFixed(2)
                    : "–"}{" "}
                  <span className="text-xs text-slate-400 font-normal">{unit}</span>
                </td>

                <td className="py-3 px-4 text-center text-sky-300 font-mono text-xs font-semibold">
                  {thresholdLabel}
                </td>

                <td className="py-3 px-4 text-center">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5
                      ${r.status === "pass"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                        : r.status === "warning"
                          ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                          : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                      }
                    `}
                  >
                    {r.status === "pass" ? "✅ ผ่านเกณฑ์มาตรฐาน" : r.status === "warning" ? "⚠️ เฝ้าระวัง" : "⛔ ไม่อยู่ในเกณฑ์"}
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
