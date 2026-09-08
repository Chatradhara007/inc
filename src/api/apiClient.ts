import type { ArgoFloat, Coordinate, FieldId, FieldPoint, OceanEmbedApi, OceanProfile, RunStatus } from "./types";

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

const BASE_URL = '/api/v1/ocean';

export const oceanApi: OceanEmbedApi = {
  getStatus: async (date) => {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) throw new Error("Failed to fetch status");
      return await response.json() as RunStatus;
    } catch (err) {
      console.warn("Backend offline or error in getStatus:", err);
      return {
        analysisWeek: getWeekNumber(new Date(date)),
        modelVersion: "unknown",
        gateStatus: "blocked",
        sourceWindow: "N/A",
        lastUpdated: "N/A"
      } as RunStatus;
    }
  },
  
  getArgoFloats: async (date) => {
    try {
      const week = getWeekNumber(new Date(date));
      const response = await fetch(`${BASE_URL}/argo?week=${week}`);
      if (!response.ok) throw new Error("Failed to fetch argo");
      return await response.json() as ArgoFloat[];
    } catch (err) {
      console.warn("Backend offline or error in getArgoFloats:", err);
      return [];
    }
  },
  
  getField: async (date, field, depth) => {
    try {
      const week = getWeekNumber(new Date(date));
      const response = await fetch(`${BASE_URL}/field_json?variable=${field}&depth=${depth}&week=${week}&stride=4`);
      if (!response.ok) throw new Error("Failed to fetch field");
      return await response.json() as FieldPoint[];
    } catch (err) {
      console.warn("Backend offline or error in getField:", err);
      return [];
    }
  },
  
  getProfile: async (date, location) => {
    try {
      const week = getWeekNumber(new Date(date));
      const response = await fetch(`${BASE_URL}/profile?lat=${location.lat}&lon=${location.lon}&week=${week}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return await response.json() as OceanProfile;
    } catch (err) {
      console.warn("Backend offline or error in getProfile:", err);
      return null;
    }
  },
  
  getTchp: async (date, location) => { return null; },
  getD26: async (date, location) => { return null; },
  getMld: async (date, location) => { return null; },
  getUncertainty: async (date, location, depth) => { return null; }
};
