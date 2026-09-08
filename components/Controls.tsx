"use client";

import { useState } from "react";
import { WATER_QUALITY_CRITERIA, WaterParameter } from "@/lib/criteria";

/* ===============================
   📍 Stations
================================ */
const STATIONS = [
  { value: "CP01", label: "CP01 – แม่น้ำชุมพร (Chumphon)" },
  { value: "LS01", label: "LS01 – แม่น้ำหลังสวน ตอนล่าง (Lang Suan)" },
  { value: "LS03", label: "LS03 – แม่น้ำหลังสวน ตอนบน (Lang Suan)" },
  { value: "PN01", label: "PN01 – แม่น้ำปากพนัง (Phanang)" },
  { value: "SK01", label: "SK01 – ชายฝั่งสุราษฎร์ธานี (Surat Coast)" },
  { value: "SK06", label: "SK06 – ชายฝั่งสุราษฎร์ธานี (Surat Coast)" },
  { value: "TP01", label: "TP01 – แม่น้ำตาปี ตอนล่าง (Tha Phang)" },
  { value: "TP04", label: "TP04 – แม่น้ำพุมดวง (Tha Phang)" },
  { value: "TP011", label: "TP011 – แม่น้ำตาปี ตอนบน (Tha Phang)" },
];

/* ===============================
   🧪 Parameters
================================ */
const PARAMETERS: { value: WaterParameter; label: string }[] = [
  { value: "do", label: "Dissolved Oxygen (DO - ออกซิเจนละลาย mg/L)" },
  { value: "chlorophyll_a", label: "Chlorophyll-a (คลอโรฟิลล์-เอ - µg/L)" },
  { value: "tsi", label: "Trophic State Index (TSI - ดัชนีสารอาหาร)" },
  { value: "secchi", label: "Secchi Depth (ความโปร่งใสของน้ำ - m)" },
  { value: "turbidity", label: "Turbidity (ความขุ่นของน้ำ - NTU)" },
  { value: "salinity", label: "Salinity (ความเค็มของน้ำ - ppt)" },
  { value: "ph", label: "pH (ความเป็นกรด-ด่าง)" },
];

/* ===============================
   🎯 Purpose labels
================================ */
const PURPOSE_LABELS: Record<string, string> = {
  drinking: "🧊 น้ำดื่ม / อุปโภคบริโภค (Drinking)",
  agriculture: "🪴 การเกษตร / ทำสวน (Agriculture)",
  aquaculture: "🐠 การเพาะเลี้ยงสัตว์น้ำ (Aquaculture)",
  shrimp: "🦐 การเลี้ยงกุ้ง (Shrimp Farming)",
  industry: "🏭 อุตสาหกรรม (Industry)",
  recreation: "🏖️ นันทนาการ / ท่องเที่ยว (Recreation)",
  ecosystem: "🪶 รักษาระบบนิเวศ (Ecosystem)",
  reuse: "🚰 น้ำบำบัด / นำกลับมาใช้ (Water Reuse)",
};

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
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
          <span>🎛️</span> แผงควบคุมและเลือกเกณฑ์การวิเคราะห์ (Control Panel)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          กำหนดสถานีตรวจวัด ตัวชี้วัดคุณภาพน้ำ และเลือกเกณฑ์การประเมินเพื่อเปรียบเทียบมาตรฐาน
        </p>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ---------- Stations Selector ---------- */}
        <div className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <span>📍</span> สถานีตรวจวัด ({stations.length} สถานี)
          </label>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`
              w-full px-4 py-3 text-left text-sm rounded-xl border transition-all font-medium flex items-center justify-between
              ${open
                ? 'border-sky-500 ring-2 ring-sky-500/20 bg-[#1e293b] text-white'
                : 'border-slate-700 bg-[#1e293b] text-slate-200 hover:border-slate-500'}
            `}
          >
            <span>{stations.length > 0 ? `เลือกแล้ว ${stations.length} สถานี` : "เลือกสถานีตรวจวัด"}</span>
            <span className="text-xs text-sky-400 font-bold">{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div className="
              absolute z-50 mt-2 w-full
              bg-[#0f172a] border border-slate-700
              rounded-xl shadow-2xl shadow-black/80
              max-h-72 overflow-y-auto p-2 space-y-1
            ">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 flex justify-between items-center">
                <span>คลิกเพื่อเลือก/ยกเลิกสถานี</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sky-400 hover:text-white"
                >
                  ปิด ✕
                </button>
              </div>

              {STATIONS.map((s) => (
                <label
                  key={s.value}
                  className="
                    flex items-center gap-3 px-3 py-2.5
                    hover:bg-slate-800/80 rounded-lg cursor-pointer
                    transition-colors
                  "
                >
                  <input
                    type="checkbox"
                    checked={stations.includes(s.value)}
                    onChange={() => toggleStation(s.value)}
                    className="
                      accent-sky-500 w-4 h-4 rounded border-slate-600 bg-transparent
                    "
                  />
                  <span className={`text-xs ${stations.includes(s.value) ? 'text-sky-300 font-bold' : 'text-slate-300'}`}>
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Selected Station Badges */}
          {stations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {stations.map((s) => (
                <span
                  key={s}
                  className="
                    text-[11px] bg-sky-950/80 border border-sky-600/50 text-sky-300
                    px-2.5 py-1 rounded-full
                    flex items-center gap-1.5 font-bold
                  "
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setStations(stations.filter((x) => x !== s))
                    }
                    className="hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Water Parameter Selector ---------- */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <span>🧪</span> ตัวชี้วัดคุณภาพน้ำ (Parameter)
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none px-4 py-3 text-xs rounded-xl border
                border-slate-700 bg-[#1e293b] text-white font-medium
                focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
                focus:outline-none transition-all cursor-pointer
              "
              value={parameter}
              onChange={(e) =>
                setParameter(e.target.value as WaterParameter)
              }
            >
              {PARAMETERS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#0f172a] text-slate-100 py-2">
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-sky-400 text-xs font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* ---------- Purpose Selector ---------- */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
            <span>🎯</span> เกณฑ์อ้างอิงการใช้งาน (Criteria)
          </label>
          <div className="relative">
            <select
              className="
                w-full appearance-none px-4 py-3 text-xs rounded-xl border
                border-slate-700 bg-[#1e293b] text-white font-medium
                focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
                focus:outline-none transition-all cursor-pointer
              "
              value={purpose}
              onChange={(e) =>
                setPurpose(
                  e.target.value as keyof typeof WATER_QUALITY_CRITERIA
                )
              }
            >
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value} className="bg-[#0f172a] text-slate-100 py-2">
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-sky-400 text-xs font-bold">
              ▼
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
