/* ===============================
   Water Quality Criteria
   Units:
   - TSI: dimensionless
   - Chl-a: µg/L
   - Salinity: ppt
   - Secchi: m
   - pH: -
   - Turbidity: NTU
   - DO: mg/L
================================ */

export type WaterParameter =
  | "tsi"
  | "chlorophyll_a"
  | "salinity"
  | "secchi"
  | "ph"
  | "turbidity"
  | "do";

type Criterion = {
  min?: number;
  max?: number;
};

export const WATER_QUALITY_CRITERIA: Record<
  string,
  Partial<Record<WaterParameter, Criterion>>
> = {
  /* 🧊 น้ำดื่ม / อุปโภคบริโภค */
  drinking: {
    tsi: { max: 40 },
    chlorophyll_a: { max: 5 },
    salinity: { max: 0.5 },
    secchi: { min: 2.0 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { max: 5 },
    do: { min: 6 },
  },

  /* 🪴 การเกษตร */
  agriculture: {
    tsi: { max: 50 },
    chlorophyll_a: { max: 15 },
    salinity: { max: 2.0 },
    secchi: { min: 1.0 },
    ph: { min: 6.0, max: 8.5 },
    turbidity: { max: 10 },
    do: { min: 5 },
  },

  /* 🐠 เพาะเลี้ยงปลา */
  aquaculture: {
    tsi: { min: 40, max: 60 },
    chlorophyll_a: { max: 20 },
    salinity: { min: 1.0, max: 15.0 },
    secchi: { min: 0.5, max: 1.5 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { min: 10, max: 50 },
    do: { min: 5 },
  },

  /* 🦐 เลี้ยงกุ้ง */
  shrimp: {
    tsi: { min: 40, max: 55 },
    chlorophyll_a: { max: 15 },
    salinity: { min: 10.0, max: 30.0 },
    secchi: { min: 0.6, max: 1.2 },
    ph: { min: 7.5, max: 8.5 },
    turbidity: { min: 20, max: 40 },
    do: { min: 5 },
  },

  /* 🏭 อุตสาหกรรม */
  industry: {
    tsi: { max: 45 },
    chlorophyll_a: { max: 10 },
    salinity: { max: 1.0 },
    secchi: { min: 1.5 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { max: 10 },
    do: { min: 4 },
  },

  /* 🏖️ นันทนาการ / ท่องเที่ยว */
  recreation: {
    tsi: { max: 50 },
    chlorophyll_a: { max: 10 },
    salinity: { max: 35.0 },
    secchi: { min: 1.0 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { max: 25 },
    do: { min: 5 },
  },

  /* 🪶 ระบบนิเวศ / อนุรักษ์ */
  ecosystem: {
    tsi: { max: 50 },
    chlorophyll_a: { max: 15 },
    // salinity: ตามธรรมชาติ → ไม่กำหนด
    secchi: { min: 0.8 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { max: 25 },
    do: { min: 5 },
  },

  /* 🚰 น้ำบำบัด / Reuse */
  reuse: {
    tsi: { max: 60 },
    chlorophyll_a: { max: 25 },
    salinity: { max: 2.0 },
    secchi: { min: 0.5 },
    ph: { min: 6.0, max: 9.0 },
    turbidity: { max: 30 },
    do: { min: 2 },
  },
};
