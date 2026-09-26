import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DataCenter } from "@/data/gccDataCenters";

type Props = { data: DataCenter[]; selectedId?: string; onSelect: (item: DataCenter) => void };

const lifecycleColor: Record<DataCenter["lifecycle_stage"], string> = {
  operational: "#27b36a",
  under_construction: "#f5a623",
  planned: "#6f7bf7",
  land_banked: "#9ca3af",
  decommissioned: "#ef5350",
  unknown: "#8b95a5",
};

const formatStage = (stage: string) => stage.replaceAll("_", " ");

const DataCenterMap = ({ data, selectedId, onSelect }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView([24.5, 51.5], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapInstance.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapInstance.current = null; layerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const points: L.LatLngExpression[] = [];
    const mappableData = data.filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
    mappableData.forEach((item) => {
      points.push([item.latitude, item.longitude]);
      const color = lifecycleColor[item.lifecycle_stage];
      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: item.id === selectedId ? 10 : 7,
        color: item.id === selectedId ? "#111827" : color,
        weight: item.id === selectedId ? 3 : 2,
        fillColor: color,
        fillOpacity: 0.9,
      });
      marker.bindPopup(`<strong>${item.canonical_name}</strong><br/>${item.operator_name || "Operator not disclosed"}<br/><span style="text-transform:capitalize">${formatStage(item.lifecycle_stage)}</span><br/>${item.capacity_mw ? `${item.capacity_mw} MW reported` : "Capacity not disclosed"}`);
      marker.on("click", () => onSelect(item));
      marker.addTo(layer);
    });
    if (points.length > 1 && !selectedId) map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 7 });
    if (selectedId) {
      const selected = mappableData.find((item) => item.id === selectedId);
      if (selected) map.flyTo([Number(selected.latitude), Number(selected.longitude)], Math.max(map.getZoom(), 7), { duration: 0.5 });
    }
  }, [data, selectedId, onSelect]);

  return <div ref={mapRef} className="h-[430px] w-full overflow-hidden rounded-[4px]" aria-label="Interactive GCC data-center map" />;
};

export default DataCenterMap;
