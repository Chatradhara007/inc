import type { StyleSpecification } from "maplibre-gl";

const rasterStyle = (id: string, tiles: string[], attribution: string): StyleSpecification => ({
  version: 8,
  sources: { [id]: { type: "raster", tiles, tileSize: 256, attribution } },
  layers: [{ id, type: "raster", source: id }],
});

export const basemaps = {
  basic: rasterStyle("osm", ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], "© OpenStreetMap contributors"),
  satellite: rasterStyle("satellite", ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], "Tiles © Esri"),
} as const;

export type BasemapId = keyof typeof basemaps;
