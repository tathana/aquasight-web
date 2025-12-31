import { WaterStatus } from "@/lib/evaluate";

export type StationResult = {
  station: string;
  latest?: number;       // ✅ undefined only
  forecastAvg?: number;  // ✅ undefined only
  status: WaterStatus;
};
