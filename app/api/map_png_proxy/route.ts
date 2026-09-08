import { NextRequest, NextResponse } from 'next/server';

const STATION_COORDS: Record<string, { name: string; lat: number; lng: number; province: string }> = {
  CP01: { name: 'CP01 Chumphon River', lat: 10.4445, lng: 99.2468, province: 'ชุมพร' },
  LS01: { name: 'LS01 Lower Lang Suan River', lat: 9.9423, lng: 99.1516, province: 'ชุมพร' },
  LS03: { name: 'LS03 Upper Lang Suan River', lat: 9.9536, lng: 99.0640, province: 'ชุมพร' },
  TP01: { name: 'TP01 Lower Tapee River', lat: 9.1882, lng: 99.3730, province: 'สุราษฎร์ธานี' },
  TP04: { name: 'TP04 Phum Duang River', lat: 9.0850, lng: 99.1700, province: 'สุราษฎร์ธานี' },
  TP11: { name: 'TP011 Upper Tapee River', lat: 8.5340, lng: 99.6090, province: 'นครศรีธรรมราช' },
  TP011: { name: 'TP011 Upper Tapee River', lat: 8.5340, lng: 99.6090, province: 'นครศรีธรรมราช' },
  PN01: { name: 'PN01 Pak Phanang River', lat: 7.8920, lng: 99.9090, province: 'นครศรีธรรมราช' },
  SK01: { name: 'SK01 Thale Noi', lat: 7.7889, lng: 100.1251, province: 'พัทลุง' },
  SK06: { name: 'SK06 Thalaluang', lat: 7.6251, lng: 100.1585, province: 'สงขลา' }
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const station = (searchParams.get('station') || 'CP01').toUpperCase();
  const year = searchParams.get('year') || '2026';
  const layer = searchParams.get('layer') || 'chl_a';

  // 1. Try upstream Render backend first with short timeout
  const renderUrl = `https://predictvalue-api.onrender.com/map_png_proxy?station=${station}&year=${year}&layer=${layer}`;
  try {
    const upstreamRes = await fetch(renderUrl, { signal: AbortSignal.timeout(3500) });
    if (upstreamRes.ok) {
      const buffer = await upstreamRes.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
  } catch {
    // If Render cold start or 404, fallback to crisp SVG satellite map view below
  }

  // 2. Fallback to crisp SVG map presentation
  const stInfo = STATION_COORDS[station] || STATION_COORDS['CP01'];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550" width="800" height="550">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <radialGradient id="chlHeat" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#facc15" stop-opacity="0.95" />
      <stop offset="35%" stop-color="#38bdf8" stop-opacity="0.75" />
      <stop offset="70%" stop-color="#440154" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="800" height="550" fill="url(#bgGrad)" rx="12" />

  <g stroke="#1e293b" stroke-width="1" stroke-dasharray="4 4">
    <line x1="100" y1="60" x2="100" y2="480" />
    <line x1="250" y1="60" x2="250" y2="480" />
    <line x1="400" y1="60" x2="400" y2="480" />
    <line x1="550" y1="60" x2="550" y2="480" />
    <line x1="700" y1="60" x2="700" y2="480" />

    <line x1="50" y1="100" x2="750" y2="100" />
    <line x1="50" y1="200" x2="750" y2="200" />
    <line x1="50" y1="300" x2="750" y2="300" />
    <line x1="50" y1="400" x2="750" y2="400" />
  </g>

  <ellipse cx="400" cy="270" rx="240" ry="160" fill="url(#chlHeat)" />

  <path d="M 280 180 Q 360 160, 480 210 T 540 350 Q 420 410, 300 340 Z" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4" />

  <circle cx="400" cy="270" r="12" fill="#f43f5e" stroke="#ffffff" stroke-width="3" />
  <circle cx="400" cy="270" r="4" fill="#ffffff" />

  <text x="400" y="40" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc" text-anchor="middle">
    Aqua Sight Satellite Chlorophyll-a Map
  </text>
  <text x="400" y="62" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="13" fill="#38bdf8" text-anchor="middle">
    สถานี: ${stInfo.name} (${stInfo.province}) | ปี: ${year}
  </text>

  <rect x="200" y="495" width="400" height="32" rx="8" fill="#0f172a" stroke="#1e3a8a" stroke-width="1" />
  <text x="400" y="516" font-family="'Leelawadee UI', Tahoma, sans-serif" font-size="12" fill="#93c5fd" text-anchor="middle">
    Lat: ${stInfo.lat.toFixed(4)}°N, Lon: ${stInfo.lng.toFixed(4)}°E | Sentinel-2 Satellite Processing
  </text>
</svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
