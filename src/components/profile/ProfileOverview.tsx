import React, { useState } from 'react';
import type { OceanProfile } from '../../api/types';
import { ProfileChart } from './ProfileChart';

interface ProfileOverviewProps {
  profile: OceanProfile;
  selectedDepth: number | null;
  onSelectDepth: (depth: number) => void;
}

export function ProfileOverview({ profile, selectedDepth, onSelectDepth }: ProfileOverviewProps) {
  const [variable, setVariable] = useState<'temperature' | 'salinity'>('temperature');

  return (
    <div className="profile-overview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0b0b8', letterSpacing: '0.05em' }}>
            LOCATION
          </div>
          <div style={{ color: '#fff', fontSize: '13px', marginTop: '4px' }}>
            {profile.location.lat.toFixed(2)}°N · {profile.location.lon.toFixed(2)}°E
          </div>
          <div style={{ color: '#6d7b82', fontSize: '12px', marginTop: '4px' }}>
            {profile.week} · nearest ARGO {profile.nearestArgoKm?.toFixed(0) ?? '—'} km
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0b0b8', letterSpacing: '0.05em' }}>
          DEPTH PROFILE
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span 
            onClick={() => setVariable('temperature')} 
            style={{ fontSize: '11px', cursor: 'pointer', color: variable === 'temperature' ? '#fff' : '#6d7b82' }}
          >
            TEMP
          </span>
          <span style={{ fontSize: '11px', color: '#6d7b82' }}>|</span>
          <span 
            onClick={() => setVariable('salinity')} 
            style={{ fontSize: '11px', cursor: 'pointer', color: variable === 'salinity' ? '#fff' : '#6d7b82' }}
          >
            SAL
          </span>
        </div>
      </div>
      
      <ProfileChart 
        profile={profile} 
        selectedDepth={selectedDepth} 
        onSelectDepth={onSelectDepth}
        variable={variable}
      />
      
      <div className="pp-legend" style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: '#a0b0b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i style={{ display: 'inline-block', width: '12px', height: '2px', background: '#52e0c4' }}></i>OceanEmbed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i style={{ display: 'inline-block', width: '12px', height: '2px', background: 'transparent', borderTop: '2px dashed #ff9d5c' }}></i>ARMOR3D
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <circle cx={3} cy={3} r={3} fill="#fff" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></circle>ARGO
        </span>
      </div>
    </div>
  );
}
