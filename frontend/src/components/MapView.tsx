'use client';

import React, { useEffect, useState } from 'react';
import { MapConfigResponse } from '@/types';
import { fetchMapGeoJson } from '@/lib/api';
import { Layers, Loader2 } from 'lucide-react';

interface MapViewProps {
  config: MapConfigResponse | null;
  selectedYear: number;
  onSelectArea: (area: any) => void;
}

export default function MapView({ config, selectedYear, onSelectArea }: MapViewProps) {
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;

    // Find the map file matching selected year
    const provinceFile = config.files.province.find((f) => f.year === selectedYear);
    if (provinceFile) {
      setLoading(true);
      fetchMapGeoJson(provinceFile.file)
        .then((data) => {
          setMapData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [config, selectedYear]);

  return (
    <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
      {/* Map Loader */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-sky-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Đang nạp dữ liệu bản đồ năm {selectedYear}...</span>
        </div>
      )}

      {/* Map Viewport Container */}
      <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 left-4 z-10 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 backdrop-blur-md flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Bản đồ ranh giới hành chính năm {selectedYear}</span>
        </div>

        {hoveredName && (
          <div className="absolute top-4 right-4 z-10 bg-sky-950/90 border border-sky-600/40 text-sky-200 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-md">
            {hoveredName}
          </div>
        )}

        <div className="w-full h-full max-w-5xl max-h-[80vh] border border-slate-800/80 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 flex items-center justify-center p-8 relative shadow-2xl">
          {mapData ? (
            <div className="text-center text-slate-400 space-y-4">
              <div className="inline-block p-4 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Layers className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                GeoJSON Map Layer Loaded ({mapData.features?.length || 0} Đơn vị hành chính)
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Dữ liệu bản đồ năm {selectedYear} sẵn sàng để kết nối với Leaflet / Mapbox / Canvas Renderer.
              </p>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">Chưa có dữ liệu bản đồ</div>
          )}
        </div>
      </div>
    </div>
  );
}
