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
  mld?: number;
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
  getStatus(date: string): Promise<RunStatus>;
  getField(date: string, field: FieldId, depth: number): Promise<FieldPoint[]>;
  getProfile(date: string, location: Coordinate, variable?: string): Promise<OceanProfile | null>;
  getArgoFloats(date: string): Promise<ArgoFloat[]>;
  getTchp(date: string, location: Coordinate): Promise<{ value: number; category: string; d26: number; confidence: number; week: string; location: Coordinate } | null>;
  getD26(date: string, location: Coordinate): Promise<{ value: number; tchp: number; confidence: number; week: string; location: Coordinate } | null>;
  getMld(date: string, location: Coordinate): Promise<{ value: number; confidence: number; week: string; location: Coordinate } | null>;
  getUncertainty(date: string, location: Coordinate, depth?: number): Promise<{ value: number; week: string; location: Coordinate; depth?: number } | null>;
}
