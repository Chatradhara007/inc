import { useCallback, useEffect, useMemo, useState } from "react";
import { mockOceanApi } from "./api/mockOceanApi";
import { DEPTHS, type ArgoFloat, type Coordinate, type FieldId, type FieldPoint, type Profile, type RunStatus } from "./api/types";
import { OceanMap } from "./map/OceanMap";
import type { BasemapId } from "./map/basemaps";

const fieldDefinitions: { id: FieldId; label: string; unit: string; depth: boolean }[] = [
  { id: "temperature", label: "Temperature", unit: "°C", depth: true },
  { id: "salinity", label: "Salinity", unit: "psu", depth: true },
  { id: "uncertainty", label: "Uncertainty", unit: "σ °C", depth: true },
  { id: "tchp", label: "Cyclone heat", unit: "kJ cm⁻²", depth: false },
  { id: "d26", label: "D26", unit: "m", depth: false },
  { id: "mld", label: "Mixed-layer depth", unit: "m", depth: false },
];

function formatLocation(location?: Coordinate) {
  if (!location) return "No location selected";
  return `${location.lat.toFixed(2)}°N, ${location.lon.toFixed(2)}°E`;
}

function ProfileChart({ profile, depth }: { profile?: Profile; depth: number }) {
  if (!profile) return <div className="empty-profile">Click a water cell to cast a virtual profile.</div>;
  const values = [...profile.temperature, ...profile.argo!, ...profile.armor3d!];
  const low = Math.floor(Math.min(...values) - 0.8);
  const high = Math.ceil(Math.max(...values) + 0.8);
  const x = (value: number) => 38 + ((value - low) / (high - low)) * 236;
  const y = (value: number) => 16 + Math.sqrt(value / 1000) * 224;
  const path = (values: number[]) => values.map((value, index) => `${index ? "L" : "M"}${x(value)},${y(profile.depths[index])}`).join(" ");
  const selectedY = y(depth);
  return <svg className="profile-chart" viewBox="0 0 292 262" role="img" aria-label="Temperature against depth profile">
    {[0, 100, 200, 500, 1000].map((tick) => <g key={tick}><line x1="38" x2="274" y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x="31" y={y(tick) + 3} textAnchor="end">{tick}</text></g>)}
    {[low, Math.round((low + high) / 2), high].map((tick) => <text key={tick} x={x(tick)} y="254" textAnchor="middle">{tick}°</text>)}
    <path d={path(profile.temperature.map((v, index) => v + profile.uncertainty[index])) + " " + path([...profile.temperature].map((v, index) => v - profile.uncertainty[index]).reverse()).replace("M", "L") + " Z"} className="confidence-band" />
    <path d={path(profile.armor3d ?? [])} className="armor-line" />
    <path d={path(profile.temperature)} className="model-line" />
    {(profile.argo ?? []).filter((_, index) => index % 2 === 0).map((value, index) => <circle key={index} cx={x(value)} cy={y(profile.depths[index * 2])} r="2.6" className="argo-dot" />)}
    <line x1="38" x2="274" y1={selectedY} y2={selectedY} className="selected-depth" />
  </svg>;
}

export function App() {
  const [field, setField] = useState<FieldId>("temperature");
  const [depthIndex, setDepthIndex] = useState(7);
  const [basemap, setBasemap] = useState<BasemapId>("basic");
  const [showArgo, setShowArgo] = useState(true);
  const [showSampling, setShowSampling] = useState(false);
  const [selected, setSelected] = useState<Coordinate>({ lat: 15.25, lon: 87.5 });
  const [points, setPoints] = useState<FieldPoint[]>([]);
  const [floats, setFloats] = useState<ArgoFloat[]>([]);
  const [profile, setProfile] = useState<Profile>();
  const [status, setStatus] = useState<RunStatus>();
  const selectedField = useMemo(() => fieldDefinitions.find((item) => item.id === field)!, [field]);
  const depth = DEPTHS[depthIndex];

  useEffect(() => { void mockOceanApi.getStatus().then(setStatus); void mockOceanApi.getArgoFloats().then(setFloats); }, []);
  useEffect(() => { void mockOceanApi.getField(field, selectedField.depth ? depth : 0).then(setPoints); }, [field, depth, selectedField.depth]);
  useEffect(() => { void mockOceanApi.getProfile(selected).then(setProfile); }, [selected]);
  const chooseLocation = useCallback((location: Coordinate) => setSelected(location), []);

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-dot" /> <strong>OceanEmbed</strong><small>CBAM-CNN · v1.0</small></div>
      <div className="timeline"><span>Analysis week</span><b>{status?.analysisWeek ?? "Loading…"}</b><span>{status?.sourceWindow ?? ""}</span></div>
      <div className="top-actions">
        <div className="basemap-toggle" role="group" aria-label="Basemap">
          {(["basic", "satellite"] as BasemapId[]).map((item) => <button key={item} className={basemap === item ? "selected" : ""} onClick={() => setBasemap(item)}>{item === "basic" ? "Map" : "Satellite"}</button>)}
        </div>
        <span className={`run-pill ${status?.gateStatus ?? ""}`}><i /> {status?.gateStatus === "published" ? "NRT ready" : "Loading"}</span>
      </div>
    </header>

    <aside className="left-panel">
      <p className="eyebrow">Reconstructed fields</p>
      <div className="field-list">{fieldDefinitions.map((item) => <button key={item.id} className={`field-button ${field === item.id ? "active" : ""}`} onClick={() => setField(item.id)}><span className={`field-dot ${item.id}`} /><span>{item.label}</span><small>{item.unit}</small></button>)}</div>
      <hr />
      <p className="eyebrow">Overlays</p>
      <label className="switch-row"><span>ARGO floats</span><input type="checkbox" checked={showArgo} onChange={(event) => setShowArgo(event.target.checked)} /><i /></label>
      <label className="switch-row"><span>Suggested sampling</span><input type="checkbox" checked={showSampling} onChange={(event) => setShowSampling(event.target.checked)} /><i /></label>
      <label className="switch-row disabled"><span>Saliency (future)</span><input type="checkbox" disabled /><i /></label>
      <section className="data-note"><p className="eyebrow">Source status</p><b>{status?.lastUpdated ?? "Connecting…"}</b><span>Model {status?.modelVersion ?? "—"}</span></section>
    </aside>

    <section className="map-stage">
      <OceanMap basemap={basemap} field={field} points={points} floats={floats} showArgo={showArgo} selected={selected} onSelect={chooseLocation} />
      <div className="legend"><span>{selectedField.label}</span><b>{selectedField.depth ? `${depth} m` : "Surface product"}</b><div className={`ramp ${field}`} /><small>{selectedField.unit}</small></div>
      {showSampling && <div className="sampling-note">＋ Recommended next observations</div>}
      <div className="readout"><span>Selected cell</span><b>{formatLocation(selected)}</b><small>0.25° grid · click map to update</small></div>
      <div className={`depth-rail ${selectedField.depth ? "" : "muted"}`}><span className="eyebrow">Depth</span><input aria-label="Depth" type="range" min="0" max={DEPTHS.length - 1} value={depthIndex} disabled={!selectedField.depth} onChange={(event) => setDepthIndex(Number(event.target.value))} /><b>{depth}</b><small>metres</small></div>
    </section>

    <aside className="profile-panel">
      <div className="profile-head"><p className="eyebrow">Virtual profile</p><b>{formatLocation(profile?.location)}</b><small>{status?.analysisWeek ?? "—"} · nearest ARGO {profile ? `${profile.nearestArgoKm.toFixed(0)} km` : "—"}</small></div>
      <ProfileChart profile={profile} depth={depth} />
      <div className="chart-legend"><span><i className="model" />OceanEmbed</span><span><i className="argo" />ARGO</span><span><i className="armor" />ARMOR3D</span></div>
      <div className="profile-metrics"><div><span>TCHP</span><b>{profile?.tchp.toFixed(0) ?? "—"}<small> kJ cm⁻²</small></b></div><div><span>D26</span><b>{profile?.d26.toFixed(0) ?? "—"}<small> m</small></b></div><div><span>Confidence</span><b>±{profile?.uncertainty[depthIndex].toFixed(2) ?? "—"}<small> °C</small></b></div><div><span>Gate</span><b className="ok">{status?.gateStatus ?? "—"}</b></div></div>
    </aside>

    <footer className="metrics-strip"><span>RMSE <b>0.42°C</b></span><span>R² <b>0.94</b></span><span>vs ARMOR3D <b>−18% error</b></span><span>Virtual floats <b>≈ +14</b></span><span>Domain <b>5°N–30°N, 45°E–105°E</b></span></footer>
  </main>;
}
