'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, Calendar, ChevronDown, ChevronUp, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StationInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  province: string;
  type: string;
}

export const STATIONS_DATA: StationInfo[] = [
  { id: 'CP01', name: 'CP01 Chumphon River', lat: 10.4445, lng: 99.2468, province: 'ชุมพร', type: 'แม่น้ำชุมพร' },
  { id: 'LS01', name: 'LS01 Lower Lang Suan River', lat: 9.9423, lng: 99.1516, province: 'ชุมพร', type: 'แม่น้ำหลังสวน (ตอนล่าง)' },
  { id: 'LS03', name: 'LS03 Upper Lang Suan River', lat: 9.9536, lng: 99.0640, province: 'ชุมพร', type: 'แม่น้ำหลังสวน (ตอนบน)' },
  { id: 'TP01', name: 'TP01 Lower Tapee River', lat: 9.1882, lng: 99.3730, province: 'สุราษฎร์ธานี', type: 'แม่น้ำตาปี (ตอนล่าง)' },
  { id: 'TP04', name: 'TP04 Phum Duang River', lat: 9.0850, lng: 99.1700, province: 'สุราษฎร์ธานี', type: 'แม่น้ำพุมดวง' },
  { id: 'TP11', name: 'TP011 Upper Tapee River', lat: 8.5340, lng: 99.6090, province: 'นครศรีธรรมราช', type: 'แม่น้ำตาปี (ตอนบน)' },
  { id: 'PN01', name: 'PN01 Pak Phanang River', lat: 7.8920, lng: 99.9090, province: 'นครศรีธรรมราช', type: 'แม่น้ำปากพนัง' },
  { id: 'SK01', name: 'SK01 Thale Noi', lat: 7.7889, lng: 100.1251, province: 'พัทลุง', type: 'ทะเลน้อย' },
  { id: 'SK06', name: 'SK06 Thalaluang', lat: 7.6251, lng: 100.1585, province: 'สงขลา', type: 'ทะเลหลวง' }
];

export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

const FORECAST_BASE = process.env.NEXT_PUBLIC_FORECAST_API_URL || 'https://predictvalue-api.onrender.com';

export default function InteractiveMap({
  selectedStation,
  selectedYear,
  onSelectStation,
  onSelectYear
}: {
  selectedStation?: string;
  selectedYear?: number;
  onSelectStation?: (st: string) => void;
  onSelectYear?: (yr: number) => void;
}) {
  const [station, setStation] = useState<string>(selectedStation || 'CP01');
  const [year, setYear] = useState<number>(selectedYear || 2026);
  const [layerType, setLayerType] = useState<'chl_a' | 'satellite' | 'street'>('chl_a');
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  const activeStation = STATIONS_DATA.find((s) => s.id === station) || STATIONS_DATA[0];
  const stationCode = activeStation.id === 'TP11' ? 'TP011' : activeStation.id;
  const imageSrc = `/api/map_png_proxy?station=${stationCode}&year=${year}&layer=chl_a`;

  useEffect(() => {
    setImgError(false);
  }, [station, year]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const scriptId = 'leaflet-js';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (leafletMap.current) {
        leafletMap.current.remove();
      }

      const map = L.map(mapRef.current).setView([activeStation.lat, activeStation.lng], 12);
      leafletMap.current = map;

      const tileUrl = layerType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap / Esri',
        maxZoom: 18
      }).addTo(map);

      STATIONS_DATA.forEach((st) => {
        const isCurrent = st.id === station;
        const iconHtml = `
          <div style="
            background: ${isCurrent ? '#f43f5e' : '#0284c7'};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            border: 2px solid white;
            white-space: nowrap;
          ">
            📍 ${st.id}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-marker',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });

        const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          setStation(st.id);
          if (onSelectStation) onSelectStation(st.id);
        });
      });

      map.flyTo([activeStation.lat, activeStation.lng], 12, { duration: 1.2 });
      setTimeout(() => {
        try { map.invalidateSize(); } catch {}
      }, 300);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else if ((window as any).L) {
      initMap();
    }
  }, [station, year, layerType]);

  const handleStationClick = (stId: string) => {
    setStation(stId);
    if (onSelectStation) onSelectStation(stId);
  };

  const handleYearClick = (yr: number) => {
    setYear(yr);
    if (onSelectYear) onSelectYear(yr);
  };

  return (
    <div className="interactive-map-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f8fafc' }}>
      {/* Control Toolbar */}
      <div style={{ padding: '10px 14px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={18} style={{ color: '#38bdf8' }} />
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>แผนที่โต้ตอบ 9 สถานี</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Layer Selector */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '2px', border: '1px solid #334155' }}>
            <Button
              variant={layerType === 'chl_a' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('chl_a')}
              style={{ fontSize: '11px', padding: '3px 8px', height: '26px', background: layerType === 'chl_a' ? '#0284c7' : 'transparent', color: '#fff' }}
            >
              <Layers size={13} style={{ marginRight: '3px' }} /> Chlorophyll-a
            </Button>
            <Button
              variant={layerType === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('satellite')}
              style={{ fontSize: '11px', padding: '3px 8px', height: '26px', background: layerType === 'satellite' ? '#0284c7' : 'transparent', color: layerType === 'satellite' ? '#fff' : '#94a3b8' }}
            >
              ดาวเทียม
            </Button>
            <Button
              variant={layerType === 'street' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('street')}
              style={{ fontSize: '11px', padding: '3px 8px', height: '26px', background: layerType === 'street' ? '#0284c7' : 'transparent', color: layerType === 'street' ? '#fff' : '#94a3b8' }}
            >
              ถนน
            </Button>
          </div>

          {/* Year Pills */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Calendar size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            {YEARS.map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearClick(yr)}
                style={{
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: year === yr ? 'bold' : 'normal',
                  background: year === yr ? '#0284c7' : '#334155',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Station Selector Pills */}
      <div style={{ padding: '6px 12px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', overflowX: 'auto', gap: '6px', WebkitOverflowScrolling: 'touch' }}>
        {STATIONS_DATA.map((st) => (
          <button
            key={st.id}
            onClick={() => handleStationClick(st.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              fontWeight: station === st.id ? 'bold' : '500',
              background: station === st.id ? '#f43f5e' : '#1e293b',
              color: station === st.id ? 'white' : '#cbd5e1',
              border: '1px solid ' + (station === st.id ? '#f43f5e' : '#334155'),
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            📍 {st.id} ({st.province})
          </button>
        ))}
      </div>

      {/* Responsive Grid / Flex Container */}
      <div className="map-view-split" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Leaflet Map */}
        <div ref={mapRef} className="leaflet-container-box" style={{ width: '100%', height: '100%', minHeight: '320px' }} />

        {/* Floating / Stacked Station Card */}
        <div className="station-detail-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สถานีที่เลือก</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{activeStation.name}</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>จังหวัด{activeStation.province} · {activeStation.type}</p>
            </div>
            
            <button
              className="mobile-toggle-btn"
              onClick={() => setMobileDetailOpen(!mobileDetailOpen)}
              style={{ background: '#334155', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
            >
              {mobileDetailOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {mobileDetailOpen && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '6px 10px', background: '#0f172a', borderRadius: '6px', border: '1px solid #334155', fontSize: '11px' }}>
                <span style={{ color: '#cbd5e1' }}>📍 พิกัด Lat/Lon: </span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{activeStation.lat.toFixed(4)}°N, {activeStation.lng.toFixed(4)}°E</span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  🖼️ ภาพดาวเทียม Chlorophyll-a ({year})
                </span>
                <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155', background: '#090d16', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!imgError ? (
                    <img
                      src={imageSrc}
                      alt={`Chlorophyll-a Map ${activeStation.id}`}
                      onError={() => setImgError(true)}
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '250px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={20} className="animate-spin text-sky-400" />
                      <span>กำลังโหลดประมวลผลภาพดาวเทียม…</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User-Friendly Explanation Card for General Public */}
              <div style={{ padding: '10px 12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #1e3a8a', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={14} /> 💡 วิธีดูความหมายของค่าสีบนแผนที่
                </div>
                <p style={{ margin: '0 0 6px 0', color: '#cbd5e1', lineHeight: '1.5' }}>
                  <strong>Chlorophyll-a (คลอโรฟิลล์-เอ):</strong> บอกความหนาแน่นของสาหร่ายในน้ำ ค่าต่ำหมายถึงน้ำใส ปริมาณสาหร่ายน้อย
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#440154', display: 'inline-block', flexShrink: 0 }}></span>
                    <strong style={{ color: '#a78bfa' }}>สีม่วง/น้ำเงิน (&lt; 10 µg/L):</strong> น้ำใส ปริมาณสาหร่ายน้อย (คุณภาพดี)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#21918c', display: 'inline-block', flexShrink: 0 }}></span>
                    <strong style={{ color: '#38bdf8' }}>สีเขียว/ฟ้า (10 - 20 µg/L):</strong> ปริมาณปานกลาง มีสารอาหารสมบูรณ์
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fde725', display: 'inline-block', flexShrink: 0 }}></span>
                    <strong style={{ color: '#facc15' }}>สีเหลือง (&gt; 25 µg/L):</strong> ปริมาณคลอโรฟิลล์สูง อาจเกิดปรากฏการณ์น้ำเปลี่ยนสี
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
