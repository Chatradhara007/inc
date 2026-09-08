import React from 'react';

interface ScalarReportProps {
  title: string;
  unit: string;
  location: { lat: number; lon: number };
  data: {
    value: number;
    week: string;
    confidence?: number;
    depth?: number;
  };
}

export function ScalarReport({ title, unit, location, data }: ScalarReportProps) {
  return (
    <div style={{ color: 'var(--text)', padding: '20px 24px' }}>
      <div style={{ display: 'grid', gap: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--sans)' }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', color: '#fff', fontFamily: 'var(--mono)', lineHeight: '1' }}>
              {data.value ? data.value.toFixed(2) : '—'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'var(--sans)' }}>{unit}</span>
          </div>
        </div>

        {data.confidence !== undefined && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', marginBottom: '4px' }}>CONFIDENCE</div>
              <div style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--mono)' }}>
                ±{data.confidence.toFixed(2)} <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{unit}</span>
              </div>
            </div>
          </>
        )}
        
        {data.depth !== undefined && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--sans)', marginBottom: '4px' }}>DEPTH SLICE</div>
              <div style={{ fontSize: '14px', color: '#fff', fontFamily: 'var(--mono)' }}>
                {data.depth} <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>m</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
