"use client";

import { WaterStatus } from "@/lib/evaluate";

/* ===============================
   🎨 Ocean Status Meta
================================ */
const STATUS_META: Record<
  WaterStatus,
  {
    icon: string;
    title: string;
    bg: string;
    border: string;
    text: string;
  }
> = {
  pass: {
    icon: "🌊",
    title: "Water Quality is Within Criteria",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  warning: {
    icon: "⚠️",
    title: "Potential Risk Detected",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
  fail: {
    icon: "☣️", // Biohazard/Pollution vibe for Fail in insights
    title: "Water Quality Criteria Not Met",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    text: "text-orange-400",
  },
};

export default function InsightPanel({
  status,
  failedStations,
  parameterLabel,
  purposeLabel,
}: {
  status: WaterStatus;
  failedStations: string[];
  parameterLabel: string;
  purposeLabel: string;
}) {
  const meta = STATUS_META[status];

  return (
    <div
      className={`
        rounded-2xl border p-6 space-y-4
        ${meta.bg} ${meta.border} backdrop-blur-md shadow-lg
      `}
    >
      {/* ===============================
          Header
      ============================== */}
      <div className={`flex items-center gap-3 ${meta.text}`}>
        <span className="text-2xl drop-shadow-sm">{meta.icon}</span>
        <h3 className="font-semibold text-lg tracking-wide">
          {meta.title}
        </h3>
      </div>

      {/* ===============================
          Description
      ============================== */}
      {status === "pass" ? (
        <p className="text-sm text-slate-300 leading-relaxed">
          Based on <b>{parameterLabel}</b> data evaluation, all stations remain within acceptable ranges for{" "}
          <b className="text-[var(--color-accent-cyan)]">{purposeLabel}</b>.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-300 leading-relaxed">
            Analysis of <b>{parameterLabel}</b> indicates that water quality in some areas may be unsuitable for{" "}
            <b className="text-[var(--color-accent-cyan)]">{purposeLabel}</b>.
          </p>

          {/* ===============================
              Failed Stations
          ============================== */}
          {failedStations.length > 0 && (
            <div className="text-sm text-slate-300 bg-black/20 p-4 rounded-lg border border-white/5">
              <div className="font-semibold mb-2 text-white">
                Affected Stations:
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {failedStations.map((s) => (
                  <li key={s} className="font-mono text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-fail)]"></span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ===============================
              Recommendations
          ============================== */}
          <div className="text-sm text-slate-300">
            <div className="font-semibold mb-2 text-[var(--color-accent-glow)]">
              Recommendations:
            </div>
            <ul className="list-disc ml-5 space-y-1 opacity-90">
              <li>
                Increase monitoring frequency in affected zones.
              </li>
              <li>
                Investigate potential pollution sources or environmental factors.
              </li>
              <li>
                Consider temporary restrictions for{" "}
                <b>{purposeLabel}</b> usage.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
