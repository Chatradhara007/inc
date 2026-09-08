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
  const [panelData, setPanelData] = useState<any>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [status, setStatus] = useState<RunStatus>();
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState("2026-08-25");
  
  const selectedField = useMemo(() => fieldDefinitions.find((item) => item.id === field)!, [field]);
  const depth = DEPTHS[depthIndex];

  useEffect(() => {
    setApiError(null);
    const controller = new AbortController();
    mockOceanApi.getStatus(selectedAnalysisDate).then(data => { if (!controller.signal.aborted) setStatus(data); }).catch(e => { if (!controller.signal.aborted) console.error(e); });
    mockOceanApi.getArgoFloats(selectedAnalysisDate).then(data => { if (!controller.signal.aborted) setFloats(data); }).catch(e => { if (!controller.signal.aborted) console.error(e); });
    geoService.loadMask();
    return () => controller.abort();
  }, [selectedAnalysisDate]);
  
  useEffect(() => { 
    const controller = new AbortController();
    void mockOceanApi.getField(selectedAnalysisDate, field, selectedField.depth ? depth : 0).then(data => {
      if (!controller.signal.aborted) setPoints(data);
    }).catch(err => {
      if (!controller.signal.aborted) console.error("Failed to load map field", err);
    }); 
    return () => controller.abort();
  }, [selectedAnalysisDate, field, depth, selectedField.depth]);
  
  useEffect(() => { 
    const controller = new AbortController();
    setApiError(null);
    
    if (selected) {
      if (geoService.isLand(selected.lat, selected.lon)) {
        setProfile(undefined);
        setPanelData(undefined);
      } else {
        const handleSuccess = (setData: (v: any) => void) => (data: any) => {
          if (!controller.signal.aborted) setData(data);
        };
        const handleError = (err: any) => {
          if (!controller.signal.aborted) {
            setApiError(err.message || "Failed to load profile data");
            setProfile(null);
            setPanelData(null);
          }
        };

        if (field === 'temperature' || field === 'salinity') {
          setPanelData(undefined);
          void mockOceanApi.getProfile(selectedAnalysisDate, selected)
            .then(handleSuccess(setProfile)).catch(handleError);
        } else if (field === 'tchp') {
          setPanelData(undefined);
          setProfile(undefined);
          void mockOceanApi.getTchp(selectedAnalysisDate, selected)
            .then(handleSuccess(setPanelData)).catch(handleError);
        } else if (field === 'mld') {
          setPanelData(undefined);
          setProfile(undefined);
          void mockOceanApi.getMld(selectedAnalysisDate, selected)
            .then(handleSuccess(setPanelData)).catch(handleError);
        } else if (field === 'uncertainty') {
          setPanelData(undefined);
          setProfile(undefined);
          void mockOceanApi.getUncertainty(selectedAnalysisDate, selected, depth)
            .then(handleSuccess(setPanelData)).catch(handleError);
        }
      }
    } else {
      setProfile(undefined);
      setPanelData(undefined);
    }
    
    return () => controller.abort();
  }, [selected, selectedAnalysisDate, field, depth]);

  const chooseLocation = useCallback((location: Coordinate) => setSelected(location), []);

  return (
    <div id="root">
      <div className="map-canvas">
        <OceanMap basemap={basemap} field={field} points={points} floats={floats} showGrid={showGrid} showArgo={showArgo} showSampling={showSampling} showSaliency={showSaliency} selected={selected ?? undefined} onSelect={chooseLocation} />
      </div>
      
      <div className="flagline"></div>

      <div className="topbar">
        <div className="brand">
          <div className="brand-badge-icon">
            <span className="dot"></span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52e0c4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h3l3-7 4 14 3-7h7" />
            </svg>
          </div>
          <div className="brand-titles">
            <span className="brand-name">OCEANEMBED</span>
            <span className="brand-model-pill">CBAM-CNN · v1.0</span>
          </div>
        </div>
        
        <div className="date-selector-pill">
          <div className="date-pill-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#52e0c4" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>DATE</span>
          </div>
          <input 
            type="date" 
            min="2020-01-01" 
            max="2026-12-31" 
            value={selectedAnalysisDate}
            onChange={(e) => setSelectedAnalysisDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div className="basemap-toggle-segmented">
            {(["basic", "satellite"] as BasemapId[]).map((item) => (
              <button key={item} className={basemap === item ? "active" : ""} onClick={() => setBasemap(item)}>
                {item === "basic" ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    <span>MAP</span>
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    <span>SATELLITE</span>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="status-badge">
            <span className={`liveDot ${status?.gateStatus === 'published' ? 'published' : ''}`}></span>
            <span className="status-main">{status?.gateStatus === "published" ? "NRT READY" : "LOADING"}</span>
            <span className="status-cycle">{status?.analysisWeek ?? "2026-W35"}</span>
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
          <div key={item.id} className={`layer-btn ${field === item.id ? "active" : ""}`} onClick={() => {
            setField(item.id);
            setProfile(undefined);
            setPanelData(undefined);
          }} data-name={item.label}>
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
            <ProfilePanel 
              field={field} 
              profile={profile ?? null} 
              panelData={panelData ?? null} 
              isOceanMissing={(field === 'temperature' || field === 'salinity') ? profile === null : panelData === null} 
              apiError={apiError} 
            />
          )}
        </div>
      </div>

      <div className="bottom-model-bar">
        <div className="bmb-brand">
          <div className="bmb-pulse-dot"></div>
          <span className="bmb-model-name">OCEANEMBED</span>
          <span className="bmb-chip">CBAM-CNN · v1.0.0</span>
        </div>
        <div className="bmb-sep"></div>
        <div className="bmb-subtitle">
          Convolutional Block Attention Reanalysis
        </div>
        <div className="bmb-sep"></div>
        <div className="bmb-specs">
          <span className="bmb-spec-item"><b>GRID:</b> 0.25° × 0.25°</span>
          <span className="bmb-spec-dot">·</span>
          <span className="bmb-spec-item"><b>DEPTH:</b> 0–1000m</span>
          <span className="bmb-spec-dot">·</span>
          <span className="bmb-spec-item"><b>CYCLE:</b> {status?.analysisWeek ?? "2026-W35"}</span>
        </div>
      </div>

    </div>
  );
}
