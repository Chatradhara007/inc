import React, { useState, useEffect } from 'react';
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
  apiError?: string | null;
}

export function ProfilePanel({ field, panelData, profile, isOceanMissing, apiError }: ProfilePanelProps) {
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDepth(null);
  }, [profile?.location?.lat, profile?.location?.lon, field]);

  if (apiError) {
    return (
      <div className="land-warning-card" style={{
        padding: "36px 20px",
        textAlign: "center",
        background: "rgba(255, 90, 90, 0.06)",
        border: "1px dashed rgba(255, 90, 90, 0.4)",
        borderRadius: "10px",
        margin: "10px 0"
      }}>
        <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚠️</div>
        <b style={{ fontSize: "14px", color: "#ff5a5a", letterSpacing: "0.05em" }}>API ERROR</b>
        <p style={{ fontSize: "12px", marginTop: "10px", color: "#a0b0b8", lineHeight: "1.5" }}>
          {apiError}
        </p>
      </div>
    );
  }

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

  if (field === 'tchp') {
    return panelData ? <TchpReport date="2025-01-01" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading TCHP...</div>;
  }

  if (field === 'mld') {
    return panelData ? <ScalarReport title="Mixed Layer Depth" unit="m" location={panelData.location} data={panelData} /> : <div className="empty-profile">Loading MLD...</div>;
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
            field={field}
            profile={profile} 
            selectedDepth={selectedDepth} 
            onSelectDepth={setSelectedDepth} 
          />
        ) : (
          <DepthReport 
            field={field}
            profile={profile} 
            selectedDepth={selectedDepth} 
            onBack={() => setSelectedDepth(null)} 
          />
        )}
      </div>

    </div>
  );
}
