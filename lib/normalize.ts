// lib/normalize.ts
import { TimeseriesResponse, TimeSeriesPoint } from "@/types/water";

export function normalizeTimeseries(
  res: TimeseriesResponse
): TimeSeriesPoint[] {
  const map = new Map<string, TimeSeriesPoint>();

  res.actual.forEach((p) => {
    map.set(p.date, {
      date: p.date,
      actual: p.value,
    });
  });

  res.forecast.forEach((p) => {
    const existing = map.get(p.date);
    if (existing) {
      existing.forecast = p.value;
    } else {
      map.set(p.date, {
        date: p.date,
        forecast: p.value,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
