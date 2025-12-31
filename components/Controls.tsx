"use client";

import { useState } from "react";
import { WATER_QUALITY_CRITERIA, WaterParameter } from "@/lib/criteria";

/* ===============================
   📍 Stations
================================ */
const STATIONS = [
  { value: "CP01", label: "CP01 – Chumphon" },
  { value: "LS01", label: "LS01 – Lang Suan" },
  { value: "LS03", label: "LS03 – Lang Suan" },
  { value: "PN01", label: "PN01 – Phanang" },
  { value: "SK01", label: "SK01 – Surat Coast" },
  { value: "SK06", label: "SK06 – Surat Coast" },
  { value: "TP01", label: "TP01 – Tha Phang" },
  { value: "TP04", label: "TP04 – Tha Phang" },
  { value: "TP011", label: "TP011 – Tha Phang" },
];

/* ===============================
   🧪 Parameters (ตรง backend)
================================ */
const PARAMETERS: { value: WaterParameter; label: string }[] = [
  { value: "secchi", label: "Secchi Depth (m)" },
  { value: "chlorophyll_a", label: "Chlorophyll-a (µg/L)" },
  { value: "tsi", label: "Trophic State Index (TSI)" },
  { value: "turbidity", label: "Turbidity (NTU)" },
  { value: "salinity", label: "Salinity (ppt)" },
  { value: "do", label: "Dissolved Oxygen (mg/L)" },
  { value: "ph", label: "pH" },
];

/* ===============================
   🎯 Purpose labels
================================ */
const PURPOSE_LABELS: Record<string, string> = {
  drinking: "น้ำดื่ม / Drinking",
  agriculture: "เกษตร / Agriculture",
  aquaculture: "เพาะเลี้ยงสัตว์น้ำ / Aquaculture",
  shrimp: "เลี้ยงกุ้ง / Shrimp Farming",
  industry: "อุตสาหกรรม / Industry",
  recreation: "นันทนาการ / Recreation",
  ecosystem: "ระบบนิเวศ / Ecosystem",
  reuse: "น้ำบำบัด / Reuse",
};

/* ===============================
   🌊 Component
================================ */
export default function Controls({
  stations,
  setStations,
  parameter,
  setParameter,
  purpose,
  setPurpose,
}: {
  stations: string[];
  setStations: (v: string[]) => void;
  parameter: WaterParameter;
  setParameter: (v: WaterParameter) => void;
  purpose: keyof typeof WATER_QUALITY_CRITERIA;
  setPurpose: (v: keyof typeof WATER_QUALITY_CRITERIA) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleStation = (value: string) => {
    setStations(
      stations.includes(value)
        ? stations.filter((s) => s !== value)
        : [...stations, value]
    );
  };

  const PURPOSE_OPTIONS = Object.keys(WATER_QUALITY_CRITERIA).map(
    (key) => ({
      value: key,
      label: PURPOSE_LABELS[key] ?? key,
    })
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[var(--color-ocean-card)] p-6 shadow-2xl space-y-6">
      {/* ===============================
          Header
      ============================== */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-accent-glow)] flex items-center gap-2">
          <span className="opacity-80">🎛️</span> Control Panel
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure stations, parameters, and analysis criteria.
        </p>
      </div>

      {/* ===============================
          Controls Grid
      ============================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ---------- Stations ---------- */}
        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <span>📍</span> Monitoring Stations
          </label>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`
              w-full px-4 py-3 text-left text-sm rounded-lg border transition-all
              ${open
                ? 'border-[var(--color-accent-cyan)] ring-1 ring-[var(--color-accent-cyan)] bg-[var(--color-ocean-dark)] text-white'
                : 'border-slate-700 bg-[var(--color-ocean-dark)] text-slate-300 hover:border-slate-500'}
            `}
          >
            {stations.length > 0
              ? `${stations.length} Selected`
              : "Select Stations"}
          </button>

          {open && (
            <div className="
              absolute z-50 mt-2 w-full
              bg-[#020617] border border-slate-700
              rounded-xl shadow-2xl shadow-black
              max-h-64 overflow-y-auto
            ">
              {STATIONS.map((s) => (
                <label
                  key={s.value}
                  className="
                    flex items-center gap-3 px-4 py-3
                    hover:bg-[var(--color-ocean-dark)] cursor-pointer
                    border-b border-white/5 last:border-0
                    transition-colors
                  "
                >
                  <input
                    type="checkbox"
                    checked={stations.includes(s.value)}
                    onChange={() => toggleStation(s.value)}
                    className="
                      accent-[var(--color-accent-cyan)]
                      w-4 h-4 rounded border-slate-600 bg-transparent
                    "
                  />
                  <span className={`text-sm ${stations.includes(s.value) ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Selected stations */}
          {stations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stations.map((s) => (
                <span
                  key={s}
                  className="
                    text-xs bg-slate-800/80 border border-slate-700 text-[var(--color-accent-cyan)]
                    px-2.5 py-1 rounded-full
                    flex items-center gap-1.5 font-medium
                  "
                >
                  {s}
                  <button
                    onClick={() =>
                      setStations(stations.filter((x) => x !== s))
                    }
                    className="hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Parameter ---------- */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <span>🧪</span> Water Parameter
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none px-4 py-3 text-sm rounded-lg border
                border-slate-700 bg-[var(--color-ocean-dark)] text-white
                focus:border-[var(--color-accent-cyan)] focus:ring-1 focus:ring-[var(--color-accent-cyan)]
                focus:outline-none transition-all
              "
              value={parameter}
              onChange={(e) =>
                setParameter(e.target.value as WaterParameter)
              }
            >
              {PARAMETERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>

        {/* ---------- Purpose ---------- */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <span>🎯</span> Usage Criteria
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none px-4 py-3 text-sm rounded-lg border
                border-slate-700 bg-[var(--color-ocean-dark)] text-white
                focus:border-[var(--color-accent-cyan)] focus:ring-1 focus:ring-[var(--color-accent-cyan)]
                focus:outline-none transition-all
              "
              value={purpose}
              onChange={(e) =>
                setPurpose(
                  e.target.value as keyof typeof WATER_QUALITY_CRITERIA
                )
              }
            >
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
