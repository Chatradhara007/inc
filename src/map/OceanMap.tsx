import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { basemaps, type BasemapId } from "./basemaps";
import type { ArgoFloat, Coordinate, FieldId, FieldPoint } from "../api/types";

type Props = { basemap: BasemapId; field: FieldId; points: FieldPoint[]; floats: ArgoFloat[]; showArgo: boolean; selected?: Coordinate; onSelect: (point: Coordinate) => void };
const sourceId = "ocean-field";
const floatSource = "argo-floats";
const selectedSource = "selected-cell";

function paint(field: FieldId): maplibregl.ExpressionSpecification {
  if (field === "uncertainty") return ["interpolate", ["linear"], ["get", "value"], 0.1, "#133c5b", 0.5, "#55d6c2", 1.2, "#ff785a"];
  if (field === "tchp") return ["interpolate", ["linear"], ["get", "value"], 10, "#113b62", 70, "#31c8c9", 130, "#ffe17b"];
  if (field === "d26" || field === "mld") return ["interpolate", ["linear"], ["get", "value"], 0, "#1d4b77", 75, "#43cfbe", 160, "#f4da7a"];
  if (field === "salinity") return ["interpolate", ["linear"], ["get", "value"], 31, "#4b2b73", 34.5, "#4ed3d0", 37, "#d9e8e8"];
  return ["interpolate", ["linear"], ["get", "value"], 5, "#153c85", 20, "#18a7c8", 26, "#64dfc9", 31, "#ffca65"];
}

const toCollection = (points: FieldPoint[]): FeatureCollection => ({ type: "FeatureCollection", features: points.map((p) => ({ type: "Feature", properties: { value: p.value }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } })) });
const floatsCollection = (floats: ArgoFloat[]): FeatureCollection => ({ type: "FeatureCollection", features: floats.map((f) => ({ type: "Feature", properties: { id: f.id }, geometry: { type: "Point", coordinates: [f.lon, f.lat] } })) });

export function OceanMap({ basemap, field, points, floats, showArgo, selected, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeBasemap = useRef<BasemapId>(basemap);
  const [styleRevision, setStyleRevision] = useState(0);

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: node.current, style: basemaps[basemap], center: [77, 17.5], zoom: 3.45, maxBounds: [[42, 2], [108, 33]] });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("click", (event: MapMouseEvent) => onSelect({ lat: event.lngLat.lat, lon: event.lngLat.lng }));
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
        map.addLayer({ id: "ocean-heat", type: "circle", source: sourceId, paint: { "circle-radius": 15, "circle-color": paint(field), "circle-opacity": 0.76, "circle-blur": 0.72 } });
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
      map.setPaintProperty("ocean-heat", "circle-color", paint(field));
      const selection = map.getSource(selectedSource) as maplibregl.GeoJSONSource | undefined;
      selection?.setData({ type: "FeatureCollection", features: selected ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [selected.lon, selected.lat] } }] : [] });
    };
    if (map.isStyleLoaded()) apply(); else map.once("load", apply);
  }, [points, floats, showArgo, field, selected, styleRevision]);

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
