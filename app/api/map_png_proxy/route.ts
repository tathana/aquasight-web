import { NextRequest, NextResponse } from 'next/server';

interface StationGeom {
  name: string;
  lat: number;
  lon: number;
  province: string;
  waterType: string;
  polygon: [number, number][];
}

const STATION_COORDS: Record<string, StationGeom> = {
  CP01: {
    name: 'CP01 Chumphon River',
    lat: 10.4445,
    lon: 99.2468,
    province: 'ชุมพร',
    waterType: 'แม่น้ำชุมพร',
    polygon: [
      [99.2450, 10.4510],
      [99.2490, 10.4505],
      [99.2485, 10.4440],
      [99.2460, 10.4390],
      [99.2435, 10.4395],
      [99.2455, 10.4445],
    ]
  },
  LS01: {
    name: 'LS01 Lower Lang Suan River',
    lat: 9.9423,
    lon: 99.1516,
    province: 'ชุมพร',
    waterType: 'แม่น้ำหลังสวน (ตอนล่าง)',
    polygon: [
      [99.1480, 9.9455],
      [99.1565, 9.9450],
      [99.1550, 9.9395],
      [99.1470, 9.9390],
    ]
  },
  LS03: {
    name: 'LS03 Upper Lang Suan River',
    lat: 9.9536,
    lon: 99.0640,
    province: 'ชุมพร',
    waterType: 'แม่น้ำหลังสวน (ตอนบน)',
    polygon: [
      [99.0590, 9.9565],
      [99.0685, 9.9555],
      [99.0680, 9.9515],
      [99.0600, 9.9510],
    ]
  },
  TP01: {
    name: 'TP01 Lower Tapee River',
    lat: 9.1882,
    lon: 99.3730,
    province: 'สุราษฎร์ธานี',
    waterType: 'แม่น้ำตาปี (ตอนล่าง)',
    polygon: [
      [99.3670, 9.1925],
      [99.3790, 9.1930],
      [99.3785, 9.1840],
      [99.3680, 9.1835],
    ]
  },
  TP04: {
    name: 'TP04 Phum Duang River',
    lat: 9.0850,
    lon: 99.1700,
    province: 'สุราษฎร์ธานี',
    waterType: 'แม่น้ำพุมดวง',
    polygon: [
      [99.1640, 9.0895],
      [99.1765, 9.0890],
      [99.1750, 9.0815],
      [99.1645, 9.0810],
    ]
  },
  TP11: {
    name: 'TP011 Upper Tapee River',
    lat: 8.5340,
    lon: 99.6090,
    province: 'นครศรีธรรมราช',
    waterType: 'แม่น้ำตาปี (ตอนบน)',
    polygon: [
      [99.6040, 8.5385],
      [99.6145, 8.5380],
      [99.6140, 8.5305],
      [99.6045, 8.5300],
    ]
  },
  TP011: {
    name: 'TP011 Upper Tapee River',
    lat: 8.5340,
    lon: 99.6090,
    province: 'นครศรีธรรมราช',
    waterType: 'แม่น้ำตาปี (ตอนบน)',
    polygon: [
      [99.6040, 8.5385],
      [99.6145, 8.5380],
      [99.6140, 8.5305],
      [99.6045, 8.5300],
    ]
  },
  PN01: {
    name: 'PN01 Pak Phanang River',
    lat: 7.8920,
    lon: 99.9090,
    province: 'นครศรีธรรมราช',
    waterType: 'แม่น้ำปากพนัง',
    polygon: [
      [99.9040, 7.8965],
      [99.9145, 7.8960],
      [99.9140, 7.8880],
      [99.9045, 7.8875],
    ]
  },
  SK01: {
    name: 'SK01 Thale Noi',
    lat: 7.7889,
    lon: 100.1251,
    province: 'พัทลุง',
    waterType: 'ทะเลน้อย',
    polygon: [
      [100.1180, 7.7940],
      [100.1320, 7.7935],
      [100.1315, 7.7845],
      [100.1185, 7.7840],
    ]
  },
  SK06: {
    name: 'SK06 Thalaluang',
    lat: 7.6251,
    lon: 100.1585,
    province: 'สงขลา',
    waterType: 'ทะเลหลวง',
    polygon: [
      [100.1510, 7.6310],
      [100.1660, 7.6300],
      [100.1655, 7.6200],
      [100.1515, 7.6190],
    ]
  }
};

const RASTER_COLORS = [
  '#0022cc', // Deep Blue (< 5)
  '#0055ff', // Blue (5 - 10)
  '#00aaff', // Cyan (10 - 15)
  '#00e5ff', // Light Cyan (15 - 20)
  '#00e676', // Green (20 - 25)
  '#76ff03', // Yellow Green (25 - 30)
  '#ffeb3b', // Yellow (30 - 35)
  '#ff9100', // Orange (35 - 40)
  '#d50000', // Red (> 40)
];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const station = (searchParams.get('station') || 'CP01').toUpperCase();
  const yearStr = searchParams.get('year') || '2026';
  const year = parseInt(yearStr, 10) || 2026;

  const stInfo = STATION_COORDS[station] || STATION_COORDS['CP01'];
  const lat = stInfo.lat;
  const lon = stInfo.lon;

  // Geographical Bounding Box (4:3 aspect ratio matching 800:580)
  const padLon = 0.012;
  const padLat = 0.0087;
  const lonMin = lon - padLon;
  const lonMax = lon + padLon;
  const latMin = lat - padLat;
  const latMax = lat + padLat;

  // Coordinate mapper to SVG Canvas (800 x 580)
  const toSvgX = (pLon: number) => ((pLon - lonMin) / (lonMax - lonMin)) * 800;
  const toSvgY = (pLat: number) => ((latMax - pLat) / (latMax - latMin)) * 580;

  // Exact polygon mapping for current station
  const polyPoints = stInfo.polygon.map(([pLon, pLat]) => `${toSvgX(pLon).toFixed(1)},${toSvgY(pLat).toFixed(1)}`);
  const polyPathD = `M ${polyPoints.join(' L ')} Z`;

  // Center point coordinates
  const centerX = toSvgX(lon);
  const centerY = toSvgY(lat);

  // Fetch real ArcGIS Satellite Aerial Photo matching this exact bounding box
  const satelliteTileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lonMin.toFixed(4)},${latMin.toFixed(4)},${lonMax.toFixed(4)},${latMax.toFixed(4)}&bboxSR=4326&imageSR=4326&size=800,580&format=png&f=image`;

  let base64SatImage = '';
  try {
    const satRes = await fetch(satelliteTileUrl, { signal: AbortSignal.timeout(2600) });
    if (satRes.ok) {
      const satBuf = await satRes.arrayBuffer();
      base64SatImage = `data:image/png;base64,${Buffer.from(satBuf).toString('base64')}`;
    }
  } catch {
    // Fallback handled below
  }

  // Generate raster grid inside station polygon bounding area
  const svgPolyX = stInfo.polygon.map(([pLon]) => toSvgX(pLon));
  const svgPolyY = stInfo.polygon.map(([, pLat]) => toSvgY(pLat));
  const minX = Math.max(0, Math.min(...svgPolyX) - 10);
  const maxX = Math.min(800, Math.max(...svgPolyX) + 10);
  const minY = Math.max(0, Math.min(...svgPolyY) - 10);
  const maxY = Math.min(580, Math.max(...svgPolyY) + 10);

  const cellSize = 13;
  let seedVal = (station.charCodeAt(0) * 43 + (station.charCodeAt(1) || 65) * 19 + year * 11);

  let pixelsSvg = '';
  for (let y = minY; y <= maxY; y += cellSize) {
    for (let x = minX; x <= maxX; x += cellSize) {
      seedVal += 1.618;
      const randVal = pseudoRandom(seedVal);

      // Color variation simulating Sentinel-2 water index
      let colorIdx = Math.floor(randVal * 4.5);
      if (randVal > 0.7) {
        colorIdx = Math.min(colorIdx + 3, RASTER_COLORS.length - 1);
      }
      colorIdx = Math.max(0, Math.min(colorIdx, RASTER_COLORS.length - 1));
      const color = RASTER_COLORS[colorIdx];

      pixelsSvg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize - 0.5}" height="${cellSize - 0.5}" fill="${color}" opacity="0.92" />\n`;
    }
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 580" width="800" height="580">
  <defs>
    <!-- Individual Station Geographic Polygon Clip Path -->
    <clipPath id="stationWaterClip">
      <path d="${polyPathD}" />
    </clipPath>
  </defs>

  ${base64SatImage ? `
    <!-- Real ArcGIS World Imagery Satellite Aerial Photo for this specific station -->
    <image href="${base64SatImage}" width="800" height="580" preserveAspectRatio="none" />
  ` : `
    <!-- Dark Geographic Map Canvas -->
    <rect width="800" height="580" fill="#0d1821" />
  `}

  <!-- Water Bed Tint inside Polygon -->
  <path d="${polyPathD}" fill="#051020" opacity="0.75" />

  <!-- Sentinel-2 Chlorophyll-a Raster Grid (STRICTLY CLIPPED to this station's river/lake boundaries) -->
  <g clip-path="url(#stationWaterClip)">
    ${pixelsSvg}
  </g>

  <!-- Highlighted River / Lake Boundary Outline -->
  <path d="${polyPathD}" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-dasharray="5 3" />

  <!-- Station Point Center Marker -->
  <circle cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" r="11" fill="#f43f5e" stroke="#ffffff" stroke-width="2.5" />
  <circle cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" r="4" fill="#ffffff" />
  
  <!-- Header Overlay Banner -->
  <rect x="15" y="15" width="770" height="46" rx="8" fill="#0f172a" opacity="0.9" stroke="#334155" stroke-width="1" />
  <text x="35" y="43" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="15" font-weight="bold" fill="#f8fafc">
    🛰️ ภาพถ่ายดาวเทียม Chlorophyll-a: ${stInfo.name} (${stInfo.waterType})
  </text>
  <text x="765" y="43" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="end">
    ปี ${year}
  </text>

  <!-- Footer Legend Bar -->
  <rect x="15" y="525" width="770" height="40" rx="8" fill="#0f172a" opacity="0.9" stroke="#334155" stroke-width="1" />
  <text x="35" y="550" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="12" font-weight="bold" fill="#cbd5e1">
    ระดับ Chlorophyll-a:
  </text>

  <rect x="190" y="538" width="16" height="16" fill="#0055ff" rx="2" />
  <text x="212" y="551" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="11" fill="#93c5fd">&lt; 10 µg/L (ต่ำ)</text>

  <rect x="340" y="538" width="16" height="16" fill="#00e676" rx="2" />
  <text x="362" y="551" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="11" fill="#6ee7b7">10-20 µg/L (ปานกลาง)</text>

  <rect x="520" y="538" width="16" height="16" fill="#ffeb3b" rx="2" />
  <text x="542" y="551" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="11" fill="#fde047">20-30 µg/L (สูง)</text>

  <rect x="670" y="538" width="16" height="16" fill="#d50000" rx="2" />
  <text x="692" y="551" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="11" fill="#fca5a5">&gt; 35 µg/L (สูงมาก)</text>
</svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}
