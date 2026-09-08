'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Layers, RefreshCw, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  const activeStation = STATIONS_DATA.find((s) => s.id === station) || STATIONS_DATA[0];

  useEffect(() => {
    // Dynamically inject Leaflet CSS & JS
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

      const map = L.map(mapRef.current, {
        center: [activeStation.lat, activeStation.lng],
        zoom: 12,
        zoomControl: false
      });
      leafletMap.current = map;

      // Base tile layers
      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics'
      });

      const osmStreets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      if (layerType === 'street') {
        osmStreets.addTo(map);
      } else {
        esriSatellite.addTo(map);
      }

      // Add all 9 stations as interactive markers
      STATIONS_DATA.forEach((st) => {
        const isSelected = st.id === station;
        const iconHtml = `
          <div style="
            background-color: ${isSelected ? '#f43f5e' : '#0284c7'};
            color: white;
            border: 2px solid white;
            border-radius: 9999px;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 11px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>📍</span>
            <span>${st.id}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-station-marker',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });

        const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(map);

        const mapImageUrl = `http://localhost:8000/map_png_proxy?station=${st.id}&year=${year}&layer=chl_a`;

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; min-width: 220px;">
            <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 14px; font-weight: bold;">${st.name}</h4>
            <p style="margin: 0 0 6px 0; color: #475569; font-size: 12px;">จังหวัด: ${st.province} | ${st.type}</p>
            <p style="margin: 0 0 8px 0; color: #0284c7; font-size: 11px; font-weight: 600;">ปีที่เลือก: ${year}</p>
            <img src="${mapImageUrl}" style="width: 100%; height: auto; border-radius: 6px; border: 1px solid #cbd5e1;" alt="Satellite Chlorophyll-a Map" />
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setStation(st.id);
          if (onSelectStation) onSelectStation(st.id);
        });
      });

      // Fly to active station
      map.flyTo([activeStation.lat, activeStation.lng], 12, { duration: 1.2 });
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
    <div className="interactive-map-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f172a', color: '#f8fafc' }}>
      {/* Control Toolbar */}
      <div style={{ padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} className="text-cyan-400" />
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}> Interactive Map — แผนที่โต้ตอบ 9 สถานี</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Layer Selector */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '2px', border: '1px solid #334155' }}>
            <Button
              variant={layerType === 'chl_a' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('chl_a')}
              style={{ fontSize: '12px', padding: '4px 10px', height: '28px' }}
            >
              <Layers size={14} style={{ marginRight: '4px' }} /> Chlorophyll-a
            </Button>
            <Button
              variant={layerType === 'satellite' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('satellite')}
              style={{ fontSize: '12px', padding: '4px 10px', height: '28px' }}
            >
              ดาวเทียม Esri
            </Button>
            <Button
              variant={layerType === 'street' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('street')}
              style={{ fontSize: '12px', padding: '4px 10px', height: '28px' }}
            >
              ถนน OpenStreetMap
            </Button>
          </div>

          {/* Year Pills */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Calendar size={15} style={{ color: '#94a3b8' }} />
            {YEARS.map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearClick(yr)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: year === yr ? 'bold' : 'normal',
                  background: year === yr ? '#0284c7' : '#334155',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Station Selector Bar */}
      <div style={{ padding: '8px 16px', background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', overflowX: 'auto', gap: '6px' }}>
        {STATIONS_DATA.map((st) => (
          <button
            key={st.id}
            onClick={() => handleStationClick(st.id)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              fontWeight: station === st.id ? 'bold' : '500',
              background: station === st.id ? '#f43f5e' : '#1e293b',
              color: station === st.id ? 'white' : '#cbd5e1',
              border: '1px solid ' + (station === st.id ? '#f43f5e' : '#334155'),
              cursor: 'pointer'
            }}
          >
            📍 {st.id} ({st.province})
          </button>
        ))}
      </div>

      {/* Map View & Active Station Preview Split Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', position: 'relative' }}>
        {/* Leaflet Map Container */}
        <div ref={mapRef} style={{ flex: 1, height: '100%', minHeight: '400px', zIndex: 1 }} />

        {/* Floating Station Data Sidebar Card */}
        <div style={{ width: '320px', background: '#1e293b', borderLeft: '1px solid #334155', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สถานีที่เลือก</span>
            <h3 style={{ margin: '2px 0 4px 0', fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>{activeStation.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>จังหวัด{activeStation.province} · {activeStation.type}</p>
          </div>

          <div style={{ padding: '8px 12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}>
            <p style={{ margin: '0 0 4px 0', color: '#cbd5e1' }}>📍 พิกัด Latitude/Longitude:</p>
            <p style={{ margin: 0, color: '#38bdf8', fontWeight: 'bold' }}>{activeStation.lat.toFixed(4)}°N, {activeStation.lng.toFixed(4)}°E</p>
          </div>

          <div>
            <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
              🖼️ ภาพดาวเทียม Chlorophyll-a ({year})
            </span>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', background: '#090d16' }}>
              <img
                src={`http://localhost:8000/map_png_proxy?station=${activeStation.id}&year=${year}&layer=chl_a`}
                alt={`Chlorophyll-a Map ${activeStation.id}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
