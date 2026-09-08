import React, { useState } from 'react';
import type { OceanProfile } from '../../api/types';
import { ProfileOverview } from './ProfileOverview';
import { DepthReport } from './DepthReport';

import { TchpReport } from './TchpReport';
import { ScalarReport } from './ScalarReport';

interface ProfilePanelProps {
  field?: string;
  panelData?: any;
  profile: OceanProfile | null;
  isOceanMissing: boolean;
}

export function ProfilePanel({ field, panelData, profile, isOceanMissing }: ProfilePanelProps) {
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);

  if (isOceanMissing) {
    return (
      <div className="land-warning-card" style={{
        padding: "36px 20px",
        textAlign: "center",
        background: "rgba(255, 180, 0, 0.06)",
        border: "1px dashed rgba(255, 180, 0, 0.4)",
        borderRadius: "10px",
        margin: "10px 0"
      }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚠️</div>
        <b style={{ fontSize: "14px", color: "#ffb400", letterSpacing: "0.05em" }}>DATA NOT AVAILABLE</b>
        <p style={{ fontSize: "12px", marginTop: "10px", color: "#a0b0b8", lineHeight: "1.5" }}>
          No scientific input data was provided by the model for this ocean coordinate.
        </p>
      </div>
    );
  }

  if (!profile && !panelData) {
    return <div className="empty-profile">Click a water cell to cast a virtual profile.</div>;
  }

  if (field === 'tchp') {
    return panelData ? <TchpReport date="2025-01-01" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading TCHP...</div>;
  }

  if (field === 'mld') {
    return panelData ? <ScalarReport title="Mixed Layer Depth" unit="m" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading MLD...</div>;
  }

  if (field === 'd26') {
    return panelData ? <ScalarReport title="Depth of 26°C Isotherm" unit="m" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading D26...</div>;
  }

  if (field === 'uncertainty') {
    return panelData ? <ScalarReport title="Temperature Uncertainty" unit="σ °C" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading Uncertainty...</div>;
  }

  if (!profile) {
    return <div className="empty-profile">Loading Profile...</div>;
  }

  return (
    <div className="profile-panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable Main Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
        {selectedDepth === null ? (
          <ProfileOverview 
            profile={profile} 
            selectedDepth={selectedDepth} 
            onSelectDepth={setSelectedDepth} 
          />
        ) : (
          <DepthReport 
            profile={profile} 
            selectedDepth={selectedDepth} 
            onBack={() => setSelectedDepth(null)} 
          />
        )}
      </div>

      {/* Fixed Context Metrics at the Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0b0b8', letterSpacing: '0.05em', marginBottom: '12px' }}>
          CONTEXT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="pp-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
            <div className="k" style={{ fontSize: '10px', color: '#6d7b82' }}>TCHP</div>
            <div className="v" style={{ fontSize: '13px', color: '#fff', marginTop: '2px' }}>
              {profile.tchp ? profile.tchp.toFixed(0) : '—'}<small style={{ color: '#6d7b82', fontSize: '10px' }}> kJ cm⁻²</small>
            </div>
          </div>
          <div className="pp-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
            <div className="k" style={{ fontSize: '10px', color: '#6d7b82' }}>D26</div>
            <div className="v" style={{ fontSize: '13px', color: '#fff', marginTop: '2px' }}>
              {profile.d26 ? profile.d26.toFixed(0) : '—'}<small style={{ color: '#6d7b82', fontSize: '10px' }}> m</small>
            </div>
          </div>
          <div className="pp-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
            <div className="k" style={{ fontSize: '10px', color: '#6d7b82' }}>CONFIDENCE</div>
            <div className="v" style={{ fontSize: '13px', color: '#fff', marginTop: '2px' }}>
              {profile.confidence ? `±${profile.confidence.toFixed(2)}` : '—'}<small style={{ color: '#6d7b82', fontSize: '10px' }}> °C</small>
            </div>
          </div>
          <div className="pp-stat" style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
            <div className="k" style={{ fontSize: '10px', color: '#6d7b82' }}>GATE</div>
            <div className="v" style={{ fontSize: '13px', color: '#fff', marginTop: '2px' }}>
              {profile.gateStatus || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
