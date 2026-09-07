import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent } from "maplibre-gl";
import { basemaps, type BasemapId } from "./basemaps";
import type { ArgoFloat, Coordinate, FieldId, FieldPoint } from "../api/types";

import { MapboxOverlay } from '@deck.gl/mapbox';
import { BitmapLayer, GeoJsonLayer, ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { MaskExtension } from '@deck.gl/extensions';
import { geoService } from "../services/GeospatialService";

type Props = { basemap: BasemapId; field: FieldId; points: FieldPoint[]; floats: ArgoFloat[]; showGrid: boolean; showArgo: boolean; showSampling: boolean; showSaliency: boolean; selected?: Coordinate; onSelect: (point: Coordinate) => void };

function interpolateColor(val: number, stops: [number, string][]): [number, number, number, number] {
  if (val <= stops[0][0]) return hexToRgb(stops[0][1]);
  if (val >= stops[stops.length - 1][0]) return hexToRgb(stops[stops.length - 1][1]);
  for (let i = 0; i < stops.length - 1; i++) {
    if (val >= stops[i][0] && val <= stops[i+1][0]) {
      const t = (val - stops[i][0]) / (stops[i+1][0] - stops[i][0]);
      const c1 = hexToRgb(stops[i][1]);
      const c2 = hexToRgb(stops[i+1][1]);
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
        255
      ];
    }
  }
  return [0, 0, 0, 0];
}

const hexCache: Record<string, [number, number, number]> = {};
function hexToRgb(hex: string): [number, number, number, number] {
  if (hex === "rgba(0,0,0,0)" || hex === "transparent") return [0,0,0,0];
  if (hexCache[hex]) return [...hexCache[hex], 255];
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (m) {
    const rgb = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] as [number, number, number];
    hexCache[hex] = rgb;
    return [...rgb, 255];
  }
  return [0,0,0,0];
}

const colorStops: Record<FieldId, [number, string][]> = {
  temperature: [[3, "#153c85"], [17, "#18a7c8"], [25, "#64dfc9"], [31, "#ffca65"]],
  salinity: [[31, "#4b2b73"], [34, "#4ed3d0"], [37, "#d9e8e8"]],
  uncertainty: [[0.1, "#133c5b"], [0.6, "#55d6c2"], [1.2, "#ff785a"]],
  tchp: [[10, "#113b62"], [70, "#31c8c9"], [130, "#ffe17b"]],
  d26: [[10, "#1d4b77"], [85, "#43cfbe"], [160, "#f4da7a"]],
  mld: [[10, "#1d4b77"], [85, "#43cfbe"], [160, "#f4da7a"]]
};

function generateImageData(points: FieldPoint[], field: FieldId) {
  const width = 241;
  const height = 101;
  const data = new Uint8ClampedArray(width * height * 4);
  const stops = colorStops[field];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = Math.round((p.lon - 45) / 0.25);
    const y = 100 - Math.round((p.lat - 5) / 0.25);
    const idx = (y * width + x) * 4;
    const color = interpolateColor(p.value, stops);
    data[idx] = color[0];
    data[idx+1] = color[1];
    data[idx+2] = color[2];
    data[idx+3] = color[3];
  }
  return new ImageData(data, width, height);
}

type GridLine = { source: [number, number], target: [number, number], level: 5 | 1 | 0.25 };
const gridLines: GridLine[] = [];

for (let lat = 5; lat <= 30; lat += 0.25) {
  let level: 5 | 1 | 0.25 = 0.25;
  if (lat % 1 === 0) level = 1;
  if (lat % 5 === 0) level = 5;
  gridLines.push({ source: [45, lat], target: [105, lat], level });
}

for (let lon = 45; lon <= 105; lon += 0.25) {
  let level: 5 | 1 | 0.25 = 0.25;
  if (lon % 1 === 0) level = 1;
  if (lon % 5 === 0) level = 5;
  gridLines.push({ source: [lon, 5], target: [lon, 30], level });
}

export function OceanMap({ basemap, field, points, floats, showGrid, showArgo, showSampling, showSaliency, selected, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const activeBasemap = useRef<BasemapId>(basemap);

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: node.current, style: basemaps[basemap], center: [77, 17.5], zoom: 3.45, maxBounds: [[42, 2], [108, 33]] });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("click", (event: MapMouseEvent) => onSelect({ lat: event.lngLat.lat, lon: event.lngLat.lng }));
    map.on("mousemove", (event: MapMouseEvent) => {
      const land = geoService.isLand(event.lngLat.lat, event.lngLat.lng);
      map.getCanvas().style.cursor = land ? "default" : "pointer";
    });

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay as any);
    overlayRef.current = overlay;

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; overlayRef.current = null; };
  }, [onSelect]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const layers: any[] = [];

    // Mask layer - renders into stencil buffer
    layers.push(new GeoJsonLayer({
      id: 'land-mask',
      data: '/land.geojson',
      operation: 'mask',
      getFillColor: [255, 255, 255, 255]
    }));

    // Scientific Raster
    if (points.length > 0) {
      const imageData = generateImageData(points, field);
      layers.push(new BitmapLayer({
        id: 'ocean-raster',
        bounds: [44.875, 4.875, 105.125, 30.125] as [number, number, number, number],
        image: imageData,
        _imageCoordinateSystem: 1, // LNGLAT
        extensions: [new MaskExtension()],
        maskId: 'land-mask',
        maskInverted: true
      } as any));
    }

    if (showGrid) {
      layers.push(new LineLayer({
        id: 'model-grid',
        data: gridLines,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getColor: d => {
          if (d.level === 5) return [255, 255, 255, 60];
          if (d.level === 1) return [255, 255, 255, 40];
          return [255, 255, 255, 12]; // subtle
        },
        getWidth: d => {
          if (d.level === 5) return 1.5;
          if (d.level === 1) return 1.0;
          return 0.5;
        },
        widthUnits: 'pixels',
        extensions: [new MaskExtension()],
        maskId: 'land-mask',
        maskInverted: true
      }));
    }

    // ARGO
    if (showArgo && floats.length > 0) {
      layers.push(new ScatterplotLayer({
        id: 'argo-halo',
        data: floats,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: [79, 216, 230, 36],
        getRadius: 9,
        radiusUnits: 'pixels',
        getLineColor: [220, 233, 239, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 1,
        stroked: true,
        filled: true,
      }));
      layers.push(new ScatterplotLayer({
        id: 'argo-points',
        data: floats,
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: [220, 233, 239, 255],
        getRadius: 3.5,
        radiusUnits: 'pixels',
        getLineColor: [79, 216, 230, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 1.5,
        stroked: true,
        filled: true,
      }));
    }

    // Selected
    if (selected) {
      layers.push(new ScatterplotLayer({
        id: 'selected-point',
        data: [selected],
        getPosition: (d: any) => [d.lon, d.lat],
        getFillColor: [255, 165, 61, 51],
        getRadius: 8,
        radiusUnits: 'pixels',
        getLineColor: [255, 165, 61, 255],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        stroked: true,
        filled: true,
      }));
    }

    overlay.setProps({ layers });
  }, [points, floats, showArgo, showSampling, showSaliency, field, selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeBasemap.current === basemap) return;
    activeBasemap.current = basemap;
    map.setStyle(basemaps[basemap]);
  }, [basemap]);

  return <div ref={node} className="map-canvas" aria-label="North Indian Ocean reconstruction map" />;
}
