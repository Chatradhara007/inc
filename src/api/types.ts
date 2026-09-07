export const DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000] as const;

export type FieldId = "temperature" | "salinity" | "uncertainty" | "tchp" | "d26" | "mld";
export type Coordinate = { lat: number; lon: number };
export type FieldPoint = Coordinate & { value: number; uncertainty: number };
export type ArgoFloat = Coordinate & { id: string; lastProfile: string };

export type DepthProfilePoint = {
  depth: number;
  oceanEmbed?: {
      temperature?: number;
      salinity?: number;
      uncertainty?: number;
  };
  armor3d?: {
      temperature?: number;
      salinity?: number;
  };
  argo?: {
      temperature?: number;
      salinity?: number;
      depth?: number;
  };
};

export type OceanProfile = {
  location: Coordinate;
  week: string;
  depths: DepthProfilePoint[];
  tchp?: number;
  d26?: number;
  confidence?: number;
  nearestArgoKm?: number;
  gateStatus?: string;
};

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
  getProfile(location: Coordinate): Promise<OceanProfile | null>;
  getArgoFloats(): Promise<ArgoFloat[]>;
}
