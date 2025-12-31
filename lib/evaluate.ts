import { WATER_QUALITY_CRITERIA } from "./criteria";
import { TimeSeriesPoint } from "@/types/water";
import { WaterParameter } from "./criteria";

export type WaterStatus = "pass" | "warning" | "fail";

export function evaluateWaterQuality(
  data: TimeSeriesPoint[],
  parameter: WaterParameter,
  purpose: keyof typeof WATER_QUALITY_CRITERIA
): {
  status: WaterStatus;
  latest?: number;
  forecastAvg?: number;
} {
  const criterion = WATER_QUALITY_CRITERIA[purpose]?.[parameter];

  // ❌ ไม่มีเกณฑ์ → ไม่ประเมิน
  if (!criterion) {
    return { status: "pass" };
  }

  const actualValues = data
    .map(d => d.actual)
    .filter((v): v is number => typeof v === "number");

  const forecastValues = data
    .map(d => d.forecast)
    .filter((v): v is number => typeof v === "number");

  const latest =
    actualValues.length > 0
      ? actualValues[actualValues.length - 1]
      : undefined;

  const forecastAvg =
    forecastValues.length > 0
      ? forecastValues.reduce((a, b) => a + b, 0) /
        forecastValues.length
      : undefined;

  // ❌ ไม่มี forecast → ประเมินไม่ได้
  if (forecastAvg === undefined) {
    return { status: "pass", latest };
  }

  const violatesMin =
    criterion.min !== undefined && forecastAvg < criterion.min;

  const violatesMax =
    criterion.max !== undefined && forecastAvg > criterion.max;

  if (violatesMin || violatesMax) {
    return { status: "fail", latest, forecastAvg };
  }

  // ⚠️ เข้าใกล้ขอบ ±10%
  const nearMin =
    criterion.min !== undefined &&
    forecastAvg < criterion.min * 1.1;

  const nearMax =
    criterion.max !== undefined &&
    forecastAvg > criterion.max * 0.9;

  if (nearMin || nearMax) {
    return { status: "warning", latest, forecastAvg };
  }

  return { status: "pass", latest, forecastAvg };
}

export function explainResult(
  status: WaterStatus,
  forecastAvg: number | undefined,
  criterion: { min?: number; max?: number }
): string {
  if (forecastAvg === undefined) {
    return "ไม่มีข้อมูลคาดการณ์เพียงพอสำหรับการประเมิน";
  }

  if (status === "pass") {
    return "ค่าคาดการณ์อยู่ภายในช่วงเกณฑ์มาตรฐาน";
  }

  if (status === "fail") {
    if (criterion.min !== undefined && forecastAvg < criterion.min) {
      return `ค่าคาดการณ์ต่ำกว่าเกณฑ์ขั้นต่ำ (${criterion.min})`;
    }
    if (criterion.max !== undefined && forecastAvg > criterion.max) {
      return `ค่าคาดการณ์สูงกว่าเกณฑ์สูงสุด (${criterion.max})`;
    }
  }

  return "ค่าคาดการณ์เข้าใกล้ขอบเขตเกณฑ์ ควรเฝ้าระวัง";
}
