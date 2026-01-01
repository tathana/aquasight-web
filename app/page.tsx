"use client";

import { useEffect, useState } from "react";

import Controls from "@/components/Controls";
import WaterQualityChart from "@/components/WaterQualityChart";
import StatusSummary from "@/components/StatusSummary";
import InsightPanel from "@/components/InsightPanel";
import ComparisonTable from "@/components/ComparisonTable";
import ExportPanel from "@/components/ExportPanel";

import { WaterParameter, WATER_QUALITY_CRITERIA } from "@/lib/criteria";
import { fetchTimeseries } from "@/lib/api";
import { normalizeTimeseries } from "@/lib/normalize";
import { evaluateWaterQuality, explainResult } from "@/lib/evaluate";

import { StationResult } from "@/types/station";

/* ===============================
   Types (เฉพาะหน้า Page)
================================ */
type StationSeries = {
  station: string;
  data: any[];
};

export default function Page() {
  /* ===============================
     State
  ============================== */
  const [stations, setStations] = useState<string[]>(["CP01"]);
  const [parameter, setParameter] = useState<WaterParameter>("secchi");
  const [purpose, setPurpose] =
    useState<keyof typeof WATER_QUALITY_CRITERIA>("drinking");

  const [series, setSeries] = useState<StationSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ===============================
     Load data (SAFE)
  ============================== */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);

      const results: StationSeries[] = [];

      for (const station of stations) {
        try {
          const raw = await fetchTimeseries(station, parameter, 12);
          const data = normalizeTimeseries(raw);

          if (data && data.length > 0) {
            results.push({ station, data });
          }
        } catch (err) {
          console.warn(`No data for ${station}`);
        }
      }

      if (results.length === 0) {
        setErrorMsg("ยังไม่มีข้อมูลสำหรับพารามิเตอร์นี้ในสถานีที่เลือก");
      }

      setSeries(results);
      setLoading(false);
    }

    if (stations.length > 0) {
      load();
    }
  }, [stations, parameter]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-ocean-dark)] text-[var(--color-accent-cyan)] font-mono space-y-4">
        <div className="text-4xl animate-ocean-pulse">🌊</div>
        <div className="text-sm tracking-widest uppercase opacity-80 animate-pulse">
          Initializing Ocean Data Link...
        </div>
      </div>
    );
  }

  /* ===============================
     Evaluation (SAFE + CLEAN)
  ============================== */
  const results: StationResult[] = series.map((s) => {
    const r = evaluateWaterQuality(s.data, parameter, purpose);

    return {
      station: s.station,
      latest: Number.isFinite(r.latest) ? r.latest : undefined,
      forecastAvg: Number.isFinite(r.forecastAvg) ? r.forecastAvg : undefined,
      status: r.status,
    };
  });

  const worstStatus = results.some((r) => r.status === "fail")
    ? "fail"
    : results.some((r) => r.status === "warning")
      ? "warning"
      : "pass";

  const primary = results[0];
  const criterion = WATER_QUALITY_CRITERIA[purpose]?.[parameter];

  const reason =
    primary && criterion && primary.forecastAvg !== undefined
      ? explainResult(primary.status, primary.forecastAvg, criterion)
      : "";

  /* ===============================
     Render
  ============================== */
  return (
    <main className="min-h-screen bg-[var(--color-ocean-dark)] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent text-[var(--color-ocean-light)] relative overflow-hidden">

      {/* 
        🎨 ATMOSPHERIC LAYER: Abstract Marine Background 
        - Whale Silhouette & Deep Sea Currents
        - Extremely low opacity (3%) for subtle texture
        - Pointer events disabled
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Deep Sea Vignette for Focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.4)_100%)] z-10" />

        <svg
          className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] opacity-[0.05] text-[var(--color-accent-cyan)] mix-blend-screen blur-[1px]"
          viewBox="0 0 1440 800"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Abstract Ocean Currents */}
          <path
            fill="currentColor"
            d="M0,256L60,245.3C120,235,240,213,360,218.7C480,224,600,256,720,266.7C840,277,960,267,1080,240C1200,213,1320,171,1380,149.3L1440,128L1440,800L1380,800C1320,800,1200,800,1080,800C960,800,840,800,720,800C600,800,480,800,360,800C240,800,120,800,60,800L0,800Z"
          />
          {/* Whale Silhouette (Abstract) */}
          <path
            fill="currentColor"
            transform="translate(800, 100) scale(1.5)"
            d="M149.2,85.6c-4.6-2.5-12.8-5.3-21.6-4.9c-15.6,0.6-29.4,9.6-43.1,18.5c-11.4,7.4-23,15.1-36.8,16.2
            c-13.2,1.1-23.7-5.8-29.3-10.3c-2.3-1.8-4.5-3.4-6.3-3.9c-3.1-0.9-6.3,1.3-7.2,4.4c-0.9,3.1,1.3,6.3,4.4,7.2
            c1.3,0.4,4,2.3,6.8,4.5c6.6,5.3,19.3,13.9,37.3,12.4c17.5-1.4,31.7-10.7,46.1-20.1c11.7-7.6,22.8-14.8,32.3-16.1
            c16.4-2.2,27.1,5.3,31.5,8.9c0.9,0.7,2,1.1,3,1.1c1.5,0,3-0.8,3.9-2.1C172,99.7,171.2,95.5,167.3,93
            C163.6,90.6,155.1,88.8,149.2,85.6z"
          />
          <circle cx="200" cy="200" r="100" fill="url(#grad1)" opacity="0.6" />
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: 'rgb(6,182,212)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgb(2,6,23)', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10 animate-fade-in-up">
        {/* Header */}
        <header className="space-y-1 py-4 border-b border-white/5">
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="text-3xl">🌊</span>
            <span className="text-[var(--color-accent-cyan)]">AquaSight</span>
            <span className="text-2xl font-light opacity-50">|</span>
            <span className="text-2xl font-light text-slate-400">Coastal Monitor</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest pl-12 flex items-center gap-2">
            <span className="text-[var(--color-accent-cyan)]">🛰️</span> Real-time Coastal Water Quality Monitoring & Forecast System
          </p>
        </header>

        <section className="animate-fade-in-up delay-100 relative z-30">
          <Controls
            stations={stations}
            setStations={setStations}
            parameter={parameter}
            setParameter={setParameter}
            purpose={purpose}
            setPurpose={setPurpose}
          />
        </section>

        {errorMsg && (
          <div className="rounded-lg border border-[var(--color-status-warning)] bg-[var(--color-status-warning)]/10 p-4 text-[var(--color-status-warning)] text-sm flex items-center gap-3 animate-fade-in-up">
            <span className="text-xl">⚠️</span> {errorMsg}
          </div>
        )}

        {results.length > 0 && (
          <div className="animate-fade-in-up delay-200">
            <StatusSummary
              overallStatus={worstStatus}
              unit="m"
              reason={reason}
              stations={results}
            />
          </div>
        )}

        {series.length > 0 && (
          <section className="rounded-xl border border-slate-800 bg-[var(--color-ocean-card)] p-6 shadow-xl animate-fade-in-up delay-200 overflow-hidden">
            <WaterQualityChart
              series={series}
              parameter={parameter}
              purpose={purpose}
            />
          </section>
        )}

        <div className="animate-fade-in-up delay-300">
          <InsightPanel
            status={worstStatus}
            failedStations={results
              .filter((r) => r.status === "fail")
              .map((r) => r.station)}
            parameterLabel="Secchi Depth (m)" // Note: This might need to be dynamic later, but keeping as is for safety
            purposeLabel={purpose}
          />
        </div>

        <section className="rounded-xl border border-slate-800 bg-[var(--color-ocean-card)] p-6 shadow-xl overflow-hidden animate-fade-in-up delay-300">
          <ComparisonTable
            unit="m"
            rows={results}
            thresholdLabel={
              criterion
                ? (criterion.min !== undefined && criterion.max !== undefined)
                  ? `${criterion.min} – ${criterion.max}`
                  : criterion.min !== undefined
                    ? `≥ ${criterion.min}`
                    : criterion.max !== undefined
                      ? `≤ ${criterion.max}`
                      : "-"
                : "-"
            }
          />
        </section>

        <div className="animate-fade-in-up delay-300">
          <ExportPanel rows={results} />
        </div>

        <footer className="text-xs text-slate-600 text-center py-8 border-t border-white/5 mt-8 space-y-2 animate-fade-in-up delay-300">
          <div className="flex justify-center gap-4 opacity-70">
            <span>🌊 AquaSight · Coastal Monitoring System</span>
            <span>•</span>
            <span>🛰️ Data-driven marine intelligence</span>
          </div>
          <p className="opacity-50">
            Solid Line: Actual Data • Dashed Line: Forecast • Reference Line: Standard Criteria
          </p>
        </footer>
      </div>
    </main>
  );
}
