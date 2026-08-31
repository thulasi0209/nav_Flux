import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const MetricCard = ({ label, value, unit, color, icon, index }) => {
  const { ref, className } = useScrollReveal();
  
  return (
    <div 
      ref={ref}
      className={`glass hover-lift ${className} focus-base`} 
      style={{ 
        padding: '20px', 
        textAlign: 'left', 
        borderLeft: `4px solid ${color}`,
        animationDelay: `${index * 0.1}s` 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
        <span className="hud-font" style={{ fontSize: '2rem', fontWeight: '700', color: color }}>{value}</span>
        {unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{unit}</span>}
      </div>
    </div>
  );
};

const Metrics = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="metrics-grid">
      <MetricCard index={0} label="Average Wait" value={metrics.avg_wait_time} unit="steps" color="var(--primary)" icon="⏳" />
      <MetricCard index={1} label="Throughput" value={metrics.throughput} unit="nodes/s" color="var(--success)" icon="⚡" />
      <MetricCard index={2} label="Resolved" value={metrics.deadlock_count} unit="cycles" color="var(--accent)" icon="🛡️" />
      <MetricCard index={3} label="Fleet Load" value={metrics.robots.moving} unit={`/ ${metrics.robots.total}`} color="var(--secondary)" icon="🛰️" />
    </div>
  );
};

export default Metrics;
