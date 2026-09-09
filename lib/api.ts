import { TimeseriesResponse } from "@/types/water";
import precomputedTimeseries from "./precomputed_timeseries.json";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://predictvalue-api.onrender.com";

export async function fetchTimeseries(
  station: string,
  parameter: string,
  horizon = 12
): Promise<TimeseriesResponse> {
  // Prefer verified precomputed data for instant, accurate rendering
  const stationData = (precomputedTimeseries as Record<string, Record<string, TimeseriesResponse>>)?.[station]?.[parameter];
  if (stationData && stationData.actual && stationData.actual.length > 0) {
    return stationData;
  }

  const res = await fetch(
    `${BASE_URL}/forecast/timeseries?station=${station}&parameter=${parameter}&horizon=${horizon}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch timeseries");
  }

  return res.json();
}

