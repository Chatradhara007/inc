import React from 'react';

interface TchpReportProps {
  date: string;
  location: { lat: number; lon: number };
  data: {
    value: number;
    category: string;
    d26: number;
    confidence: number;
    week: string;
  };
}

export function TchpReport({ date, location, data }: TchpReportProps) {
  return (
    <div style={{ color: 'var(--text)', padding: '20px 24px' }}>
      
      {/* Value */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>TCHP</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '42px', color: '#fff', fontWeight: 400, lineHeight: 1 }}>
            {data.value.toFixed(0)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-faint)' }}>kJ cm⁻²</div>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '32px' }} />

      {/* Range Visualizer */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative', height: '6px', display: 'flex', gap: '4px', marginBottom: '12px' }}>
          <div style={{ flex: '40', background: '#3b82f6', opacity: data.value < 40 ? 1 : 0.2 }} />
          <div style={{ flex: '20', background: '#eab308', opacity: data.value >= 40 && data.value < 60 ? 1 : 0.2 }} />
          <div style={{ flex: '30', background: '#f97316', opacity: data.value >= 60 && data.value < 90 ? 1 : 0.2 }} />
          <div style={{ flex: '30', background: '#ef4444', opacity: data.value >= 90 ? 1 : 0.2 }} />
          
          <div style={{ 
            position: 'absolute', 
            top: '-6px', 
            left: `${Math.min(100, Math.max(0, (data.value / 120) * 100))}%`,
            width: '2px', 
            height: '18px', 
            background: '#fff', 
            boxShadow: '0 0 4px rgba(0,0,0,0.8)',
            transform: 'translateX(-50%)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          <span style={{ width: '33%', textAlign: 'left', color: data.value < 40 ? '#fff' : 'var(--text-faint)' }}>&lt;40</span>
          <span style={{ width: '16%', textAlign: 'center', color: data.value >= 40 && data.value < 60 ? '#fff' : 'var(--text-faint)' }}>40–60</span>
          <span style={{ width: '25%', textAlign: 'center', color: data.value >= 60 && data.value < 90 ? '#fff' : 'var(--text-faint)' }}>60–90</span>
          <span style={{ width: '25%', textAlign: 'right', color: data.value >= 90 ? '#fff' : 'var(--text-faint)' }}>&gt;90</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '10px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span style={{ width: '33%', textAlign: 'left', color: data.value < 40 ? '#3b82f6' : 'var(--text-faint)' }}>LOW</span>
          <span style={{ width: '16%', textAlign: 'center', color: data.value >= 40 && data.value < 60 ? '#eab308' : 'var(--text-faint)' }}>BASELINE</span>
          <span style={{ width: '25%', textAlign: 'center', color: data.value >= 60 && data.value < 90 ? '#f97316' : 'var(--text-faint)' }}>HIGH</span>
          <span style={{ width: '25%', textAlign: 'right', color: data.value >= 90 ? '#ef4444' : 'var(--text-faint)' }}>EXTREME</span>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '32px' }} />

      {/* Supporting Context */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>D26 Isotherm</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', color: '#fff', fontWeight: 400, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {data.d26.toFixed(0)} <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>m</span>
          </div>
        </div>
        
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Confidence</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', color: '#fff', fontWeight: 400, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            ±{data.confidence.toFixed(2)} <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>kJ cm⁻²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
