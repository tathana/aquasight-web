import { TimeseriesResponse } from "@/types/water";

const BASE_URL = "https://predictvalue-api.onrender.com";

export async function fetchTimeseries(
  station: string,
  parameter: string,
  horizon = 12
): Promise<TimeseriesResponse> {
  const res = await fetch(
    `${BASE_URL}/forecast/timeseries?station=${station}&parameter=${parameter}&horizon=${horizon}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch timeseries");
  }

  return res.json();
}
