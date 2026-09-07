import React from 'react';

interface DifferenceSectionProps {
  oceanTemp?: number;
  armorTemp?: number;
  oceanSal?: number;
  armorSal?: number;
}

export function DifferenceSection({ oceanTemp, armorTemp, oceanSal, armorSal }: DifferenceSectionProps) {
  const hasTemp = oceanTemp !== undefined && armorTemp !== undefined;
  const hasSal = oceanSal !== undefined && armorSal !== undefined;

  if (!hasTemp && !hasSal) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#a0b0b8', letterSpacing: '0.05em', marginBottom: '12px' }}>
        MODEL DIFFERENCE
      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
        <div style={{ fontSize: '11px', color: '#6d7b82', marginBottom: '8px' }}>
          OceanEmbed − ARMOR3D
        </div>
        
        {hasTemp && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#fff' }}>Δ Temperature</span>
            <span style={{ 
              color: oceanTemp - armorTemp > 0 ? '#ff5a5a' : '#52e0c4',
              fontWeight: 600
            }}>
              {oceanTemp - armorTemp > 0 ? '+' : ''}{(oceanTemp - armorTemp).toFixed(2)} °C
            </span>
          </div>
        )}
        
        {hasSal && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff' }}>Δ Salinity</span>
            <span style={{ 
              color: oceanSal - armorSal > 0 ? '#ff5a5a' : '#52e0c4',
              fontWeight: 600
            }}>
              {oceanSal - armorSal > 0 ? '+' : ''}{(oceanSal - armorSal).toFixed(2)} PSU
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
