import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { INDIA_GEOJSON_URL, normalizeStateName } from '../constants';
import { StateSummary, InsightType } from '../types';

interface Props {
  summaries: Record<string, StateSummary>;
  onStateSelect: (stateName: string) => void;
  selectedState: string | null;
  activeInsight: InsightType;
}

const DIVERSE_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ef4444', '#14b8a6', '#f43f5e', '#a855f7'
];

const IndiaMap: React.FC<Props> = ({ summaries, onStateSelect, selectedState, activeInsight }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const getMapColor = (stateName: string) => {
    const summary = summaries[stateName];
    if (!summary || stateName === "1000") return 'rgba(15, 23, 42, 0.4)';
    
    // For Welfare and Child tabs, use multicolor based on state name for high contrast
    if (activeInsight === 'WELFARE' || activeInsight === 'CHILD') {
      let hash = 0;
      for (let i = 0; i < stateName.length; i++) {
        hash = stateName.charCodeAt(i) + ((hash << 5) - hash);
      }
      return DIVERSE_PALETTE[Math.abs(hash) % DIVERSE_PALETTE.length];
    }

    // Default logic for Migration tab (Red/Green)
    if (activeInsight === 'MIGRATION') {
      return summary.hasMigrationRisk ? '#ef4444' : '#064e3b';
    }

    return '#064e3b';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        maxBounds: [[6, 60], [38, 100]],
        minZoom: 4,
        maxZoom: 7
      }).setView([22.5, 82], 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }

    const map = mapRef.current;

    fetch(INDIA_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        if (!map) return;
        if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);

        geoJsonLayerRef.current = L.geoJSON(data, {
          style: (feature) => {
            const rawName = feature?.properties?.ST_NM || feature?.properties?.state_name || feature?.properties?.NAME_1 || "";
            const normalized = normalizeStateName(rawName);
            if (normalized === "1000") return { opacity: 0, fillOpacity: 0 };
            
            const isSelected = selectedState === normalized;

            return {
              fillColor: getMapColor(normalized),
              weight: isSelected ? 3 : 1,
              opacity: 1,
              color: isSelected ? '#ffffff' : '#1e293b',
              fillOpacity: 0.8
            };
          },
          onEachFeature: (feature, layer) => {
            const rawName = feature?.properties?.ST_NM || feature?.properties?.state_name || feature?.properties?.NAME_1 || "";
            const normalized = normalizeStateName(rawName);
            if (normalized === "1000") return;

            const summary = summaries[normalized];
            const total = summary?.totalEnrolments || 0;
            const adultP = total > 0 ? ((summary.ageDist.adults / total) * 100).toFixed(1) : 0;
            const childP = total > 0 ? ((summary.ageDist.infants / total) * 100).toFixed(1) : 0;

            let tooltipContent = `
              <div class="p-4 bg-slate-900 border border-slate-700 shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-xl min-w-[160px]">
                <p class="font-black text-white uppercase text-[12px] tracking-widest border-b border-slate-800 pb-2 mb-3">${normalized}</p>
                <div class="space-y-2">
                  <div class="flex justify-between items-center"><p class="text-[9px] font-black text-slate-500 uppercase">Volume</p><p class="text-[11px] font-black text-white">${total.toLocaleString()}</p></div>
                  <div class="flex justify-between items-center"><p class="text-[9px] font-black text-slate-500 uppercase">Adult %</p><p class="text-[11px] font-black text-orange-500">${adultP}%</p></div>
                  <div class="flex justify-between items-center"><p class="text-[9px] font-black text-slate-500 uppercase">Child %</p><p class="text-[11px] font-black text-blue-500">${childP}%</p></div>
                </div>
              </div>
            `;

            layer.on({
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onStateSelect(normalized);
              }
            });

            layer.bindTooltip(tooltipContent, { sticky: true, className: 'custom-tooltip' });
          }
        }).addTo(map);
      });
  }, [summaries, selectedState, activeInsight]);

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden bg-slate-950">
      <div ref={mapContainerRef} className="h-full w-full" />
      <style>{`
        .custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .custom-tooltip:before {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default IndiaMap;