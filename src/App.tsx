import { useCallback, useEffect, useMemo, useState } from "react";
import { mockOceanApi } from "./api/mockOceanApi";
import { DEPTHS, type ArgoFloat, type Coordinate, type FieldId, type FieldPoint, type OceanProfile, type RunStatus } from "./api/types";
import { OceanMap } from "./map/OceanMap";
import { ProfilePanel } from "./components/profile/ProfilePanel";
import type { BasemapId } from "./map/basemaps";

const fieldDefinitions: { id: FieldId; label: string; unit: string; depth: boolean; color: string; short: string }[] = [
  { id: "temperature", label: "Temperature", unit: "°C", depth: true, color: "#ff9d5c", short: "OSTS" },
  { id: "salinity", label: "Salinity", unit: "psu", depth: true, color: "#7ab8ff", short: "OSSS" },
  { id: "uncertainty", label: "Uncertainty", unit: "σ °C", depth: true, color: "#b9c6cc", short: "σ" },
  { id: "tchp", label: "Cyclone heat", unit: "kJ cm⁻²", depth: false, color: "#ff5a5a", short: "TCHP" },
  { id: "d26", label: "D26", unit: "m", depth: false, color: "#83c8dd", short: "D26" },
  { id: "mld", label: "Mixed-layer depth", unit: "m", depth: false, color: "#b29bf2", short: "MLD" },
];

import { geoService } from "./services/GeospatialService";

function formatLocation(location?: Coordinate) {
  if (!location) return "No location selected";
  return `${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°E`;
}

function regionName(lat: number, lon: number) {
  if (lon < 60) return "Western Arabian Sea";
  if (lon < 77) return "Eastern Arabian Sea";
  if (lon < 85 && lat < 15) return "Southern tip / approach to Bay";
  return "Central Bay of Bengal";
}

export function App() {
  const [field, setField] = useState<FieldId>("temperature");
  const [depthIndex, setDepthIndex] = useState(7);
  const [basemap, setBasemap] = useState<BasemapId>("basic");
  
  const [railOpen, setRailOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showArgo, setShowArgo] = useState(true);
  const [showSampling, setShowSampling] = useState(false);
  const [showSaliency, setShowSaliency] = useState(false);
  
  const [selected, setSelected] = useState<Coordinate | null>(null);
  
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [floats, setFloats] = useState<ArgoFloat[]>([]);
  const [profile, setProfile] = useState<OceanProfile | null | undefined>();
  const [status, setStatus] = useState<RunStatus>();
  
  const selectedField = useMemo(() => fieldDefinitions.find((item) => item.id === field)!, [field]);
  const depth = DEPTHS[depthIndex];

  useEffect(() => {
    mockOceanApi.getStatus().then(setStatus);
    mockOceanApi.getArgoFloats().then(setFloats);
    geoService.loadMask();
  }, []);
  
  useEffect(() => { 
    void mockOceanApi.getField(field, selectedField.depth ? depth : 0).then(setPoints); 
  }, [field, depth, selectedField.depth]);
  
  useEffect(() => { 
    if (selected) {
      if (geoService.isLand(selected.lat, selected.lon)) {
        setProfile(undefined);
      } else {
        void mockOceanApi.getProfile(selected).then(setProfile);
      }
    } else {
      setProfile(undefined);
    }
  }, [selected]);

  const chooseLocation = useCallback((location: Coordinate) => setSelected(location), []);

  return (
    <div id="root">
      <div className="map-canvas">
        <OceanMap basemap={basemap} field={field} points={points} floats={floats} showGrid={showGrid} showArgo={showArgo} showSampling={showSampling} showSaliency={showSaliency} selected={selected ?? undefined} onSelect={chooseLocation} />
      </div>
      
      <div className="flagline"></div>

      <div className="topbar">
        <div className="brand"><span className="dot"></span>OCEANEMBED <small>&nbsp;CBAM-CNN · v1.0</small></div>
        
        <div className="status" style={{ marginLeft: '20px' }}>
          <span>Analysis week <b>{status?.analysisWeek ?? "Loading…"}</b></span>
          <span style={{ marginLeft: '10px' }}>{status?.sourceWindow ?? ""}</span>
        </div>

        <div className="scrubber-wrap" style={{ visibility: 'hidden', flex: 1 }}>
           {/* Placeholder to keep layout balanced */}
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="basemap-toggle">
            {(["basic", "satellite"] as BasemapId[]).map((item) => (
              <button key={item} className={basemap === item ? "selected" : ""} onClick={() => setBasemap(item)}>
                {item === "basic" ? "Map" : "Satellite"}
              </button>
            ))}
          </div>
          <div className="status">
            <span className={`liveDot ${status?.gateStatus === 'published' ? 'published' : ''}`}></span>
            {status?.gateStatus === "published" ? "NRT READY" : "LOADING"}
          </div>
        </div>
      </div>

      <div className={`rail ${railOpen ? "open" : ""}`}>
        <div className="rail-toggle" onClick={() => setRailOpen(!railOpen)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52e0c4" strokeWidth="2.4" style={{ marginLeft: '3px' }}>
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span>{railOpen ? "COLLAPSE" : "EXPAND"}</span>
        </div>
        
        <div className="rail-section-label">Reconstructed fields</div>
        {fieldDefinitions.map((item) => (
          <div key={item.id} className={`layer-btn ${field === item.id ? "active" : ""}`} onClick={() => setField(item.id)} data-name={item.label}>
            <span className="swatch" style={{ background: item.color }}></span>
            <span className="lbl">{item.label}</span>
            <span className="num">{item.short}</span>
          </div>
        ))}
        
        <div className="rail-divider"></div>
        <div className="rail-section-label">Overlays</div>
        
        <div className="toggle-row" onClick={() => setShowGrid(!showGrid)}>
          <span className="t-lbl">0.25° Model Grid</span>
          <div className={`switch ${showGrid ? "on" : ""}`}></div>
        </div>
        <div className="toggle-row" onClick={() => setShowArgo(!showArgo)}>
          <span className="t-lbl">ARGO floats</span>
          <div className={`switch ${showArgo ? "on" : ""}`}></div>
        </div>
        <div className="toggle-row" onClick={() => setShowSampling(!showSampling)}>
          <span className="t-lbl">Suggested sampling</span>
          <div className={`switch ${showSampling ? "on" : ""}`}></div>
        </div>
        <div className="toggle-row disabled">
          <span className="t-lbl">Saliency (future)</span>
          <div className="switch"></div>
        </div>
      </div>

      <div className="legend">
        <div className="ttl">{selectedField.label} — {selectedField.depth ? `${depth}m` : "Surface"}</div>
        <div className={`bar ${field}`}></div>
        <div className="scale">
          <span>{selectedField.unit}</span>
        </div>
      </div>

      <div className={`depth-rail ${!selectedField.depth ? "muted" : ""}`}>
        <div className="cap">Depth</div>
        <div className="depth-track-wrap">
          <div className="depth-track"></div>
          {DEPTHS.map((d, i) => (
            <div key={d} className="depth-tick" style={{ top: `${(i / (DEPTHS.length - 1)) * 100}%` }}>
              <div className="mk"></div>
              <div className="lb">{d}m</div>
            </div>
          ))}
          <div className="depth-handle" style={{ top: `${(depthIndex / (DEPTHS.length - 1)) * 100}%` }}></div>
          <div 
            style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10 }}
            onClick={(e) => {
              if (!selectedField.depth) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const t = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              const idx = Math.round(t * (DEPTHS.length - 1));
              setDepthIndex(idx);
            }}
          />
        </div>
        <div className="depth-readout">
          <div className="val">{depth}</div>
          <div className="unit">METERS</div>
        </div>
      </div>

      <div className={`profile-panel ${selected ? "show" : ""}`}>
        <div className="pp-close" style={{ zIndex: 50, pointerEvents: 'auto' }} onClick={(e) => { e.stopPropagation(); setSelected(null); }}>✕</div>
        <div className="pp-head">
          <div className="coord">
            {selected
              ? geoService.isLand(selected.lat, selected.lon)
                ? `⛰️ LAND · ${formatLocation(selected)}`
                : `🌊 OCEAN · ${formatLocation(selected)}`
              : "No location selected"}
          </div>
          <div className="region">
            {selected && geoService.isLand(selected.lat, selected.lon)
              ? "Land Mass (Subsurface Profile N/A)"
              : `${status?.analysisWeek ?? "—"} · nearest ARGO ${profile?.nearestArgoKm ? `${profile.nearestArgoKm.toFixed(0)} km` : "—"}`}
          </div>
        </div>
        <div className="pp-body" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
          {selected && geoService.isLand(selected.lat, selected.lon) ? (
            <div className="land-warning-card" style={{ padding: "36px 20px", textAlign: "center", background: "rgba(255, 122, 82, 0.06)", border: "1px dashed rgba(255, 122, 82, 0.4)", borderRadius: "10px", margin: "10px 0" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⛰️</div>
              <b style={{ fontSize: "14px", color: "#ff7a52", letterSpacing: "0.05em" }}>LAND LOCATION SELECTED</b>
              <p style={{ fontSize: "12px", marginTop: "10px", color: "#a0b0b8", lineHeight: "1.5" }}>
                Coordinate <strong>{formatLocation(selected)}</strong> is on land mass. Subsurface ocean profiles (0–1000m) are only computed for water cells.
              </p>
            </div>
          ) : (
            <ProfilePanel profile={profile ?? null} isOceanMissing={profile === null} />
          )}
        </div>
      </div>

      <div className="stats-strip">
        <div className="item">RMSE <b>0.42°C</b></div>
        <div className="sep"></div>
        <div className="item">R² <b>0.94</b></div>
        <div className="sep"></div>
        <div className="item">vs ARMOR3D <b>−18% error</b></div>
        <div className="sep"></div>
        <div className="item warn">Virtual floats <b>≈ +14</b></div>
        <div className="sep"></div>
        <div className="item">Domain <b>5°N–30°N, 45°E–105°E</b></div>
      </div>
    </div>
  );
}
