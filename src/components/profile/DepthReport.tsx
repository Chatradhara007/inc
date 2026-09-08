import React from 'react';
import type { OceanProfile, DepthProfilePoint } from '../../api/types';
import { DifferenceSection } from './DifferenceSection';

interface DepthReportProps {
  field?: string;
  profile: OceanProfile;
  selectedDepth: number;
  onBack: () => void;
}

export function DepthReport({ field, profile, selectedDepth, onBack }: DepthReportProps) {
  const data = profile.depths.find(d => d.depth === selectedDepth);
  
  if (!data) return null;

  return (
    <div className="depth-report">
      <div 
        onClick={onBack} 
        style={{ cursor: 'pointer', color: '#52e0c4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
      >
        <span style={{ fontSize: '14px' }}>←</span> PROFILE
      </div>
      
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
        DEPTH REPORT · {selectedDepth} m
      </div>
      
      {/* Location Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0b0b8', letterSpacing: '0.05em', marginBottom: '8px' }}>
          LOCATION
        </div>
        <div style={{ color: '#fff', fontSize: '13px' }}>
          {profile.location.lat.toFixed(2)}°N · {profile.location.lon.toFixed(2)}°E
        </div>
        <div style={{ color: '#6d7b82', fontSize: '12px', marginTop: '4px' }}>
          {profile.week}
        </div>
      </div>
      
      {/* OceanEmbed Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#52e0c4', letterSpacing: '0.05em', marginBottom: '12px' }}>
          OCEANEMBED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', background: 'rgba(82,224,196,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(82,224,196,0.1)' }}>
          {field !== 'salinity' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Temperature</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.oceanEmbed?.temperature !== undefined ? `${data.oceanEmbed.temperature.toFixed(2)} °C` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Uncertainty</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.oceanEmbed?.uncertainty !== undefined ? `±${data.oceanEmbed.uncertainty.toFixed(2)}` : 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Salinity</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.oceanEmbed?.salinity !== undefined ? `${data.oceanEmbed.salinity.toFixed(2)} PSU` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Uncertainty</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.oceanEmbed?.uncertainty !== undefined ? `±${data.oceanEmbed.uncertainty.toFixed(2)}` : 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* ARMOR3D Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff9d5c', letterSpacing: '0.05em', marginBottom: '12px' }}>
          ARMOR3D REFERENCE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,157,92,0.2)' }}>
          {field !== 'salinity' ? (
            <div>
              <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Temperature</div>
              <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                {data.armor3d?.temperature !== undefined ? `${data.armor3d.temperature.toFixed(2)} °C` : 'N/A'}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Salinity</div>
              <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                {data.armor3d?.salinity !== undefined ? `${data.armor3d.salinity.toFixed(2)} PSU` : 'N/A'}
              </div>
            </div>
          )}
        </div>
        
        <DifferenceSection 
          oceanTemp={field !== 'salinity' ? data.oceanEmbed?.temperature : undefined}
          armorTemp={field !== 'salinity' ? data.armor3d?.temperature : undefined}
          oceanSal={field === 'salinity' ? data.oceanEmbed?.salinity : undefined}
          armorSal={field === 'salinity' ? data.armor3d?.salinity : undefined}
        />
      </div>
      
      {/* ARGO Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', letterSpacing: '0.05em', marginBottom: '12px' }}>
          ARGO OBSERVATION
        </div>
        {((field !== 'salinity' && data.argo?.temperature !== undefined) || (field === 'salinity' && data.argo?.salinity !== undefined)) ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {field !== 'salinity' ? (
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Temperature</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.argo?.temperature !== undefined ? `${data.argo.temperature.toFixed(2)} °C` : 'N/A'}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '11px', color: '#a0b0b8' }}>Salinity</div>
                <div style={{ fontSize: '14px', color: '#fff', marginTop: '4px' }}>
                  {data.argo?.salinity !== undefined ? `${data.argo.salinity.toFixed(2)} PSU` : 'N/A'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#6d7b82', fontStyle: 'italic' }}>
            No collocated ARGO observation at {selectedDepth} m.
          </div>
        )}
      </div>

    </div>
  );
}
