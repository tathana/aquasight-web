"use client";

import { exportToCSV } from "@/lib/export";
import { StationResult } from "@/types/station";

export default function ExportPanel({
  rows,
}: {
  rows: StationResult[];
}) {
  return (
    <div className="flex justify-end pt-4 border-t border-white/5">
      <button
        onClick={() =>
          exportToCSV("aquasight_water_quality.csv", rows)
        }
        className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
            border border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]
            hover:bg-[var(--color-accent-cyan)] hover:text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]
            transition-all duration-300
        "
      >
        <span>📥</span> Export CSV Report
      </button>
    </div>
  );
}
