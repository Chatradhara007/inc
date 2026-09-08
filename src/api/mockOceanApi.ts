import { DEPTHS, type ArgoFloat, type Coordinate, type FieldId, type FieldPoint, type OceanEmbedApi, type OceanProfile, type RunStatus } from "./types";

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

export function isLand(lat: number, lon: number): boolean {
  // Global domain boundaries for North Indian Ocean water
  if (lat > 30.0 || lat < 5.0 || lon < 45.0 || lon > 105.0) return true;

  // Arabia / Oman / Persian Gulf
  if (lon < 56.0 && lat > 14.0) return true;

  // Myanmar / Indochina
  if (lon > 94.0 && lat > 15.0) return true;

  // India peninsula mainland:
  if (lat >= 8.0 && lat <= 23.5) {
    // West coast goes from ~72.8 at 20N down to ~77.5 at 8N
    const westCoastLon = 72.8 + (20.0 - lat) * 0.39;
    const eastCoastLon = 77.5 + (lat - 8.0) * 0.75;
    if (lon >= westCoastLon && lon <= eastCoastLon) {
      return true;
    }
  }

  // Northern India / Pakistan / Ganges Delta
  if (lat > 22.0 && lon > 66.0 && lon < 91.0) return true;

  // Sri Lanka island mask
  const dLat = (lat - 7.8) / 1.1;
  const dLon = (lon - 80.7) / 0.8;
  if (dLat * dLat + dLon * dLon < 1) return true;

  return false;
}

const LATS = [5.0, 5.25, 5.5, 5.75, 6.0, 6.25, 6.5, 6.75, 7.0, 7.25, 7.5, 7.75, 8.0, 8.25, 8.5, 8.75, 9.0, 9.25, 9.5, 9.75, 10.0, 10.25, 10.5, 10.75, 11.0, 11.25, 11.5, 11.75, 12.0, 12.25, 12.5, 12.75, 13.0, 13.25, 13.5, 13.75, 14.0, 14.25, 14.5, 14.75, 15.0, 15.25, 15.5, 15.75, 16.0, 16.25, 16.5, 16.75, 17.0, 17.25, 17.5, 17.75, 18.0, 18.25, 18.5, 18.75, 19.0, 19.25, 19.5, 19.75, 20.0, 20.25, 20.5, 20.75, 21.0, 21.25, 21.5, 21.75, 22.0, 22.25, 22.5, 22.75, 23.0, 23.25, 23.5, 23.75, 24.0, 24.25, 24.5, 24.75, 25.0, 25.25, 25.5, 25.75, 26.0, 26.25, 26.5, 26.75, 27.0, 27.25, 27.5, 27.75, 28.0, 28.25, 28.5, 28.75, 29.0, 29.25, 29.5, 29.75, 30.0];
const LONS = [45.0, 45.25, 45.5, 45.75, 46.0, 46.25, 46.5, 46.75, 47.0, 47.25, 47.5, 47.75, 48.0, 48.25, 48.5, 48.75, 49.0, 49.25, 49.5, 49.75, 50.0, 50.25, 50.5, 50.75, 51.0, 51.25, 51.5, 51.75, 52.0, 52.25, 52.5, 52.75, 53.0, 53.25, 53.5, 53.75, 54.0, 54.25, 54.5, 54.75, 55.0, 55.25, 55.5, 55.75, 56.0, 56.25, 56.5, 56.75, 57.0, 57.25, 57.5, 57.75, 58.0, 58.25, 58.5, 58.75, 59.0, 59.25, 59.5, 59.75, 60.0, 60.25, 60.5, 60.75, 61.0, 61.25, 61.5, 61.75, 62.0, 62.25, 62.5, 62.75, 63.0, 63.25, 63.5, 63.75, 64.0, 64.25, 64.5, 64.75, 65.0, 65.25, 65.5, 65.75, 66.0, 66.25, 66.5, 66.75, 67.0, 67.25, 67.5, 67.75, 68.0, 68.25, 68.5, 68.75, 69.0, 69.25, 69.5, 69.75, 70.0, 70.25, 70.5, 70.75, 71.0, 71.25, 71.5, 71.75, 72.0, 72.25, 72.5, 72.75, 73.0, 73.25, 73.5, 73.75, 74.0, 74.25, 74.5, 74.75, 75.0, 75.25, 75.5, 75.75, 76.0, 76.25, 76.5, 76.75, 77.0, 77.25, 77.5, 77.75, 78.0, 78.25, 78.5, 78.75, 79.0, 79.25, 79.5, 79.75, 80.0, 80.25, 80.5, 80.75, 81.0, 81.25, 81.5, 81.75, 82.0, 82.25, 82.5, 82.75, 83.0, 83.25, 83.5, 83.75, 84.0, 84.25, 84.5, 84.75, 85.0, 85.25, 85.5, 85.75, 86.0, 86.25, 86.5, 86.75, 87.0, 87.25, 87.5, 87.75, 88.0, 88.25, 88.5, 88.75, 89.0, 89.25, 89.5, 89.75, 90.0, 90.25, 90.5, 90.75, 91.0, 91.25, 91.5, 91.75, 92.0, 92.25, 92.5, 92.75, 93.0, 93.25, 93.5, 93.75, 94.0, 94.25, 94.5, 94.75, 95.0, 95.25, 95.5, 95.75, 96.0, 96.25, 96.5, 96.75, 97.0, 97.25, 97.5, 97.75, 98.0, 98.25, 98.5, 98.75, 99.0, 99.25, 99.5, 99.75, 100.0, 100.25, 100.5, 100.75, 101.0, 101.25, 101.5, 101.75, 102.0, 102.25, 102.5, 102.75, 103.0, 103.25, 103.5, 103.75, 104.0, 104.25, 104.5, 104.75, 105.0];

export const mockOceanApi: OceanEmbedApi = {
  getStatus: (date) => wait<RunStatus>({
    analysisWeek: "2026-W35", modelVersion: "oceanembed-v1.0.0", gateStatus: "published",
    sourceWindow: "27 Aug – 02 Sep 2026", lastUpdated: "03 Sep 2026 · 06:18 UTC",
  }),
  getArgoFloats: (date) => wait(floats),
  getField: (date, field, depth) => {
    const rows: FieldPoint[] = [];
    for (const lat of LATS) {
      for (const lon of LONS) {
        rows.push({ lat, lon, value: fieldValue(field, lat, lon, depth), uncertainty: fieldValue("uncertainty", lat, lon, depth) });
      }
    }
    return wait(rows);
  },
  getProfile: (date, location, variable) => {
    if (location.lat > 13.0 && location.lat < 17.0 && location.lon > 63.0 && location.lon < 68.0) {
      return wait<OceanProfile | null>(null as any);
    }
    const point = { lat: clamp(location.lat, domain.minLat, domain.maxLat), lon: clamp(location.lon, domain.minLon, domain.maxLon) };
    const depths = DEPTHS.map((depth, i) => {
      const temp = fieldValue("temperature", point.lat, point.lon, depth);
      const sal = fieldValue("salinity", point.lat, point.lon, depth);
      const unc = fieldValue("uncertainty", point.lat, point.lon, depth);
      
      const argoTemp = temp + Math.sin(i * 1.8 + point.lat) * 0.33;
      const argoSal = sal + Math.cos(i * 2.1 + point.lon) * 0.15;
      const armorTemp = temp + Math.cos(i + point.lon) * 0.5;
      const armorSal = sal + Math.sin(i * 1.1 + point.lat) * 0.2;
      
      return {
        depth,
        oceanEmbed: { temperature: temp, salinity: sal, uncertainty: unc },
        armor3d: { temperature: armorTemp, salinity: armorSal },
        argo: { temperature: argoTemp, salinity: argoSal }
      };
    });
    return wait<OceanProfile>({ 
      location: point, week: "2026-W35", depths, 
      tchp: fieldValue("tchp", point.lat, point.lon), 
      d26: fieldValue("d26", point.lat, point.lon), 
      mld: fieldValue("mld", point.lat, point.lon),
      confidence: fieldValue("uncertainty", point.lat, point.lon, 0),
      nearestArgoKm: nearestArgo(point), gateStatus: "PUBLISHED"
    });
  },
  getTchp: (date, location) => {
    if (location.lat > 13.0 && location.lat < 17.0 && location.lon > 63.0 && location.lon < 68.0) return wait(null);
    const value = fieldValue("tchp", location.lat, location.lon);
    let category = "Too Low";
    if (value >= 40 && value < 60) category = "Medium (Baseline)";
    else if (value >= 60 && value < 90) category = "High (Good)";
    else if (value >= 90) category = "Too High (Extreme Energy)";
    
    return wait({
      value, category, d26: fieldValue("d26", location.lat, location.lon),
      confidence: fieldValue("uncertainty", location.lat, location.lon, 0),
      week: "2026-W35", location
    });
  },
  getD26: (date, location) => {
    if (location.lat > 13.0 && location.lat < 17.0 && location.lon > 63.0 && location.lon < 68.0) return wait(null);
    return wait({
      value: fieldValue("d26", location.lat, location.lon),
      tchp: fieldValue("tchp", location.lat, location.lon),
      confidence: fieldValue("uncertainty", location.lat, location.lon, 0),
      week: "2026-W35", location
    });
  },
  getMld: (date, location) => {
    if (location.lat > 13.0 && location.lat < 17.0 && location.lon > 63.0 && location.lon < 68.0) return wait(null);
    return wait({
      value: fieldValue("mld", location.lat, location.lon),
      confidence: fieldValue("uncertainty", location.lat, location.lon, 0),
      week: "2026-W35", location
    });
  },
  getUncertainty: (date, location, depth) => {
    if (location.lat > 13.0 && location.lat < 17.0 && location.lon > 63.0 && location.lon < 68.0) return wait(null);
    return wait({
      value: fieldValue("uncertainty", location.lat, location.lon, depth ?? 0),
      week: "2026-W35", location, depth
    });
  }
};
