export type TimeSeriesPoint = {
  date: string;
  actual?: number | null;
  forecast?: number | null;
};

export type TimeseriesResponse = {
  station: string;
  parameter: string;
  actual: { date: string; value: number }[];
  forecast: { date: string; value: number }[];
};
