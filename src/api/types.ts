export const DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000] as const;

export type FieldId = "temperature" | "salinity" | "uncertainty" | "tchp" | "d26" | "mld";
export type Coordinate = { lat: number; lon: number };
export type FieldPoint = Coordinate & { value: number; uncertainty: number };
export type Profile = {
  location: Coordinate;
  depths: number[];
  temperature: number[];
  uncertainty: number[];
  argo?: number[];
  armor3d?: number[];
  tchp: number;
  d26: number;
  nearestArgoKm: number;
};
export type ArgoFloat = Coordinate & { id: string; lastProfile: string };
export type RunStatus = {
  analysisWeek: string;
  modelVersion: string;
  gateStatus: "published" | "stale" | "blocked";
  sourceWindow: string;
  lastUpdated: string;
};

export interface OceanEmbedApi {
  getStatus(): Promise<RunStatus>;
  getField(field: FieldId, depth: number): Promise<FieldPoint[]>;
  getProfile(location: Coordinate): Promise<Profile>;
  getArgoFloats(): Promise<ArgoFloat[]>;
}
