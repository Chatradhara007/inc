import { geoContains } from 'd3-geo';
import type { Coordinate } from '../api/types';

class GeospatialService {
  private landFeatures: any[] = [];
  public loaded = false;

  async loadMask() {
    if (this.loaded) return;
    try {
      const res = await fetch('/land.geojson');
      const data = await res.json();
      this.landFeatures = data.features || [];
      this.loaded = true;
    } catch (e) {
      console.error("Failed to load land mask", e);
    }
  }

  isLand(lat: number, lon: number): boolean {
    if (!this.loaded) {
      // Crude fallback if clicked before mask finishes loading (unlikely)
      if (lat > 30.0 || lat < 5.0 || lon < 45.0 || lon > 105.0) return true;
      if (lon < 56.0 && lat > 14.0) return true; // rough Oman
      if (lat >= 8.0 && lat <= 23.5) {
        const westCoastLon = 72.8 + (20.0 - lat) * 0.39;
        const eastCoastLon = 77.5 + (lat - 8.0) * 0.75;
        if (lon >= westCoastLon && lon <= eastCoastLon) return true;
      }
      return false; 
    }
    const pt = [lon, lat] as [number, number];
    for (const feature of this.landFeatures) {
      if (geoContains(feature, pt)) {
        return true;
      }
    }
    return false;
  }

  getNearestModelCell(lat: number, lon: number): Coordinate {
    const nearestLat = Math.round(lat / 0.25) * 0.25;
    const nearestLon = Math.round(lon / 0.25) * 0.25;
    return {
      lat: Math.max(5.0, Math.min(30.0, nearestLat)),
      lon: Math.max(45.0, Math.min(105.0, nearestLon))
    };
  }
}

export const geoService = new GeospatialService();
