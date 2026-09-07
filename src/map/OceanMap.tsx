import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { basemaps, type BasemapId } from "./basemaps";
import type { ArgoFloat, Coordinate, FieldId, FieldPoint } from "../api/types";

import { isLand } from "../api/mockOceanApi";

type Props = { basemap: BasemapId; field: FieldId; points: FieldPoint[]; floats: ArgoFloat[]; showArgo: boolean; showSampling: boolean; showSaliency: boolean; selected?: Coordinate; onSelect: (point: Coordinate) => void };
const sourceId = "ocean-field";
const floatSource = "argo-floats";
const selectedSource = "selected-cell";

function fillColors(field: FieldId): maplibregl.ExpressionSpecification {
  if (field === "uncertainty") {
    return [
      "interpolate", ["linear"], ["get", "value"],
      0.1, "#133c5b",
      0.6, "#55d6c2",
      1.2, "#ff785a"
    ];
  }
  if (field === "tchp") {
    return [
      "interpolate", ["linear"], ["get", "value"],
      10, "#113b62",
      70, "#31c8c9",
      130, "#ffe17b"
    ];
  }
  if (field === "d26" || field === "mld") {
    return [
      "interpolate", ["linear"], ["get", "value"],
      10, "#1d4b77",
      85, "#43cfbe",
      160, "#f4da7a"
    ];
  }
  if (field === "salinity") {
    return [
      "interpolate", ["linear"], ["get", "value"],
      31, "#4b2b73",
      34, "#4ed3d0",
      37, "#d9e8e8"
    ];
  }
  return [
    "interpolate", ["linear"], ["get", "value"],
    3, "#153c85",
    17, "#18a7c8",
    25, "#64dfc9",
    31, "#ffca65"
  ];
}

const toCollection = (points: FieldPoint[]): FeatureCollection => {
  const d = 0.3; // Half-width of the 0.6 degree mock grid
  return { 
    type: "FeatureCollection", 
    features: points.map((p) => ({ 
      type: "Feature", 
      properties: { value: p.value }, 
      geometry: { 
        type: "Polygon", 
        coordinates: [[
          [p.lon - d, p.lat - d],
          [p.lon + d, p.lat - d],
          [p.lon + d, p.lat + d],
          [p.lon - d, p.lat + d],
          [p.lon - d, p.lat - d]
        ]] 
      } 
    })) 
  };
};
const floatsCollection = (floats: ArgoFloat[]): FeatureCollection => ({ type: "FeatureCollection", features: floats.map((f) => ({ type: "Feature", properties: { id: f.id }, geometry: { type: "Point", coordinates: [f.lon, f.lat] } })) });

export function OceanMap({ basemap, field, points, floats, showArgo, showSampling, showSaliency, selected, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeBasemap = useRef<BasemapId>(basemap);
  const [styleRevision, setStyleRevision] = useState(0);

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: node.current, style: basemaps[basemap], center: [77, 17.5], zoom: 3.45, maxBounds: [[42, 2], [108, 33]] });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("click", (event: MapMouseEvent) => onSelect({ lat: event.lngLat.lat, lon: event.lngLat.lng }));
    map.on("mousemove", (event: MapMouseEvent) => {
      const land = isLand(event.lngLat.lat, event.lngLat.lng);
      map.getCanvas().style.cursor = land ? "default" : "pointer";
    });
    map.once("load", () => setStyleRevision((revision) => revision + 1));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const addLayers = () => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "geojson", data: toCollection(points) });
        map.addLayer({ 
          id: "ocean-grid", 
          type: "fill", 
          source: sourceId, 
          paint: { 
            "fill-color": fillColors(field),
            "fill-opacity": 0.85,
            "fill-outline-color": "rgba(255, 0, 0, 0.4)" // Red grid lines matching the sketch
          } 
        });
      }
      if (!map.getSource(floatSource)) {
        map.addSource(floatSource, { type: "geojson", data: floatsCollection(floats) });
        map.addLayer({ id: "argo-halo", type: "circle", source: floatSource, paint: { "circle-radius": 9, "circle-color": "#4fd8e6", "circle-opacity": 0.14, "circle-stroke-width": 1, "circle-stroke-color": "#dce9ef" } });
        map.addLayer({ id: "argo-points", type: "circle", source: floatSource, paint: { "circle-radius": 3.5, "circle-color": "#dce9ef", "circle-stroke-width": 1.5, "circle-stroke-color": "#4fd8e6" } });
      }
      if (!map.getSource(selectedSource)) {
        map.addSource(selectedSource, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({ id: "selected-point", type: "circle", source: selectedSource, paint: { "circle-radius": 8, "circle-color": "#ffa53d", "circle-opacity": 0.2, "circle-stroke-width": 2, "circle-stroke-color": "#ffa53d" } });
      }
    };
    const apply = () => {
      addLayers();
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      source?.setData(toCollection(points));
      const floatData = map.getSource(floatSource) as maplibregl.GeoJSONSource | undefined;
      floatData?.setData(floatsCollection(floats));
      map.setLayoutProperty("argo-halo", "visibility", showArgo ? "visible" : "none");
      map.setLayoutProperty("argo-points", "visibility", showArgo ? "visible" : "none");
      map.setPaintProperty("ocean-grid", "fill-color", fillColors(field));
      const selection = map.getSource(selectedSource) as maplibregl.GeoJSONSource | undefined;
      selection?.setData({ type: "FeatureCollection", features: selected ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [selected.lon, selected.lat] } }] : [] });
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [points, floats, showArgo, showSampling, showSaliency, field, selected, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeBasemap.current === basemap) return;
    activeBasemap.current = basemap;
    map.setStyle(basemaps[basemap]);
    map.once("style.load", () => setStyleRevision((revision) => revision + 1));
  }, [basemap]);

  return <div ref={node} className="map-canvas" aria-label="North Indian Ocean reconstruction map" />;
}
