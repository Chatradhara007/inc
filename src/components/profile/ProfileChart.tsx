import React from 'react';
import type { OceanProfile } from '../../api/types';

interface ProfileChartProps {
  profile: OceanProfile;
  selectedDepth: number | null;
  onSelectDepth: (depth: number) => void;
  variable?: 'temperature' | 'salinity';
}

export function ProfileChart({ profile, selectedDepth, onSelectDepth, variable = 'temperature' }: ProfileChartProps) {
  const width = 280;
  const height = 400;
  
  // Collect all values to determine X scale
  const allValues: number[] = [];
  profile.depths.forEach(d => {
    if (d.oceanEmbed?.[variable] !== undefined) allValues.push(d.oceanEmbed[variable]!);
    if (d.armor3d?.[variable] !== undefined) allValues.push(d.armor3d[variable]!);
    if (d.argo?.[variable] !== undefined) allValues.push(d.argo[variable]!);
  });
  
  if (allValues.length === 0) return null;
  
  const minVal = Math.floor(Math.min(...allValues) - 0.5);
  const maxVal = Math.ceil(Math.max(...allValues) + 0.5);
  
  const getX = (val: number) => {
    if (maxVal === minVal) return width / 2;
    return 30 + ((val - minVal) / (maxVal - minVal)) * (width - 40);
  };
  
  // Y scale: Evenly space the 15 depths for better clickability
  const getY = (index: number) => 10 + (index / (profile.depths.length - 1 || 1)) * (height - 20);

  const oceanEmbedPath = profile.depths
    .filter(d => d.oceanEmbed?.[variable] !== undefined)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.oceanEmbed![variable]!)} ${getY(i)}`)
    .join(' ');
    
  const armor3dPath = profile.depths
    .filter(d => d.armor3d?.[variable] !== undefined)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.armor3d![variable]!)} ${getY(i)}`)
    .join(' ');

  return (
    <div className="profile-chart-container" style={{ position: 'relative', height, width: '100%', margin: '0 auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background Grid Lines */}
        {profile.depths.map((d, i) => (
          <line key={`grid-${d.depth}`} x1={30} x2={width} y1={getY(i)} y2={getY(i)} stroke="rgba(255,255,255,0.05)" />
        ))}
        
        {/* Paths */}
        <path d={oceanEmbedPath} fill="none" stroke="#52e0c4" strokeWidth="2" />
        <path d={armor3dPath} fill="none" stroke="#ff9d5c" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Clickable Zones and Points */}
        {profile.depths.map((d, i) => {
          const y = getY(i);
          const isSelected = selectedDepth === d.depth;
          const oceanX = d.oceanEmbed?.[variable] !== undefined ? getX(d.oceanEmbed[variable]!) : null;
          const armorX = d.armor3d?.[variable] !== undefined ? getX(d.armor3d[variable]!) : null;
          const argoX = d.argo?.[variable] !== undefined ? getX(d.argo[variable]!) : null;
          
          return (
            <g key={`depth-${d.depth}`} onClick={() => onSelectDepth(d.depth)} style={{ cursor: 'pointer' }}>
              {/* Invisible large rect for easy clicking */}
              <rect x={0} y={y - 12} width={width} height={24} fill="transparent" />
              
              {isSelected && (
                <rect x={0} y={y - 12} width={width} height={24} fill="rgba(82,224,196,0.1)" />
              )}
              
              {/* Label */}
              <text x={0} y={y + 4} fill={isSelected ? "#52e0c4" : "#a0b0b8"} fontSize="11px" fontFamily="monospace">
                {d.depth}m
              </text>
              
              {/* Points */}
              {armorX !== null && <circle cx={armorX} cy={y} r={isSelected ? 4 : 3} fill="#ff9d5c" />}
              {oceanX !== null && <circle cx={oceanX} cy={y} r={isSelected ? 5 : 4} fill="#52e0c4" />}
              {argoX !== null && <circle cx={argoX} cy={y} r={isSelected ? 4 : 3} fill="#fff" stroke="#000" strokeWidth="1" />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
