import { DEPTHS, type ArgoFloat, type Coordinate, type FieldId, type FieldPoint, type OceanEmbedApi, type Profile, type RunStatus } from "./types";

const domain = { minLat: 5, maxLat: 30, minLon: 45, maxLon: 105 };
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
const wait = <T,>(value: T) => new Promise<T>((resolve) => window.setTimeout(() => resolve(value), 130));

function fieldValue(field: FieldId, lat: number, lon: number, depth = 0) {
  const eddy = Math.sin((lon - 57) / 5) * Math.cos((lat - 14) / 4);
  const thermocline = Math.exp(-Math.pow((depth - 110) / 100, 2));
  if (field === "temperature") return clamp(29.2 - depth * 0.011 + eddy * 1.3 - thermocline * 2.4, 3, 31);
  if (field === "salinity") return clamp(34.3 + eddy * 0.45 + depth * 0.0009, 31, 37);
  if (field === "uncertainty") return clamp(0.18 + Math.abs(eddy) * 0.38 + thermocline * 0.24, 0.1, 1.2);
  if (field === "tchp") return clamp(62 + eddy * 22 + Math.cos(lat / 4) * 12, 10, 130);
  if (field === "d26") return clamp(72 + eddy * 28 + Math.sin(lat / 4) * 14, 10, 160);
  return clamp(33 + eddy * 15 + Math.cos(lon / 8) * 9, 8, 110);
}

const floats: ArgoFloat[] = [
  [11.25, 70.75], [15.75, 84.25], [18.5, 89.5], [21.25, 93.75], [9.75, 59.5], [13.25, 77.5], [23.5, 64.25], [17.75, 100.25],
].map(([lat, lon], index) => ({ lat, lon, id: `WMO ${2900 + index}`, lastProfile: "2026-W35" }));

function nearestArgo(location: Coordinate) {
  return Math.min(...floats.map((f) => Math.hypot(f.lat - location.lat, (f.lon - location.lon) * 0.96) * 111));
}

export const mockOceanApi: OceanEmbedApi = {
  getStatus: () => wait<RunStatus>({
    analysisWeek: "2026-W35", modelVersion: "oceanembed-v1.0.0", gateStatus: "published",
    sourceWindow: "27 Aug – 02 Sep 2026", lastUpdated: "03 Sep 2026 · 06:18 UTC",
  }),
  getArgoFloats: () => wait(floats),
  getField: (field, depth) => {
    const rows: FieldPoint[] = [];
    for (let lat = domain.minLat + 0.75; lat < domain.maxLat; lat += 1.5) {
      for (let lon = domain.minLon + 0.75; lon < domain.maxLon; lon += 1.5) {
        rows.push({ lat, lon, value: fieldValue(field, lat, lon, depth), uncertainty: fieldValue("uncertainty", lat, lon, depth) });
      }
    }
    return wait(rows);
  },
  getProfile: (location) => {
    const point = { lat: clamp(location.lat, domain.minLat, domain.maxLat), lon: clamp(location.lon, domain.minLon, domain.maxLon) };
    const temperature = DEPTHS.map((depth) => fieldValue("temperature", point.lat, point.lon, depth));
    const uncertainty = DEPTHS.map((depth) => fieldValue("uncertainty", point.lat, point.lon, depth));
    const argo = temperature.map((value, i) => value + Math.sin(i * 1.8 + point.lat) * 0.33);
    const armor3d = temperature.map((value, i) => value + Math.cos(i + point.lon) * 0.5);
    return wait<Profile>({ location: point, depths: [...DEPTHS], temperature, uncertainty, argo, armor3d, tchp: fieldValue("tchp", point.lat, point.lon), d26: fieldValue("d26", point.lat, point.lon), nearestArgoKm: nearestArgo(point) });
  },
};
