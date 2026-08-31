import React, { useState, useEffect } from 'react';
import { useDragScroll } from '../hooks/useDragScroll';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCenterFocus } from '../hooks/useCenterFocus';

import { API_URL } from '../config';

const Heatmap = ({ refreshTrigger, mousePosition }) => {
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const dragScroll = useDragScroll();
  const { ref: revealRef, className: revealClass } = useScrollReveal();
  const { containerRef: focusRef, focusedId } = useCenterFocus();

  const fetchHeatmap = async () => {
    try {
      const resp = await fetch(`${API_URL}/heatmap`);
      if (!resp.ok) throw new Error('Heatmap link severed');
      const data = await resp.json();
      setHeatmap(data);
    } catch (err) {
      console.error('Failed to fetch heatmap', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHeatmap();
  }, [refreshTrigger]);

  const getColor = (congestion) => {
    if (congestion < 5) return 'var(--success)';
    if (congestion < 15) return 'var(--warning)';
    return 'var(--danger)';
  };

  // Combine scroll refs
  const compositeRef = (el) => {
    revealRef.current = el;
    dragScroll.ref.current = el;
    focusRef.current = el;
  };

  if (loading && heatmap.length === 0) return <div className="glass" style={{ padding: '20px' }}>INITIALIZING SCANNER...</div>;

  return (
    <div 
      ref={compositeRef}
      className={`glass ${revealClass}`} 
      style={{ 
        marginTop: '40px', 
        padding: '30px', 
        textAlign: 'left',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(0, 242, 255, 0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="hud-font" style={{ fontSize: '1.4rem', borderLeft: '4px solid var(--primary)', paddingLeft: '15px' }}>
          Network Topology Scanner
        </h2>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1px' }}>
          AUTO-SCANNING: <span className="status-cyan">ENABLED</span>
        </div>
      </div>

      <div 
        onMouseDown={dragScroll.onMouseDown}
        onMouseLeave={dragScroll.onMouseLeave}
        onMouseUp={dragScroll.onMouseUp}
        onMouseMove={dragScroll.onMouseMove}
        style={{ 
          ...dragScroll.style,
          display: 'grid', 
          gridAutoFlow: 'column', 
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '15px', 
          overflowX: 'auto', 
          paddingBottom: '20px',
          scrollbarWidth: 'none'
        }}
      >
        {heatmap.map((lane) => {
          const color = getColor(lane.congestion);
          const isFocused = focusedId === lane.lane_id;
          const isDimmed = focusedId && focusedId !== lane.lane_id;

          return (
            <div 
              key={lane.lane_id} 
              data-focus-id={lane.lane_id}
              className={`focus-base ${isFocused ? 'focused' : ''} ${isDimmed ? 'dimmed' : ''}`}
              style={{ 
                minWidth: '180px',
                padding: '16px', 
                borderRadius: '8px', 
                background: 'rgba(15, 23, 42, 0.4)',
                border: `1px solid ${lane.occupancy ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.4s ease',
                position: 'relative',
                // Mouse proximity glow logic (internal)
                boxShadow: isFocused ? `0 0 15px ${color}` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="hud-font" style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{lane.lane_id}</span>
                <div 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                    animation: lane.occupancy ? 'pulse-glow 1s infinite' : 'none'
                  }} 
                />
              </div>
              
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>LOAD:</span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{lane.usage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>CONGESTION:</span>
                  <span style={{ color: color, fontWeight: 'bold' }}>{lane.congestion}</span>
                </div>
              </div>

              {lane.occupancy === 1 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '0', 
                  left: '0', 
                  right: '0', 
                  bottom: '0', 
                  background: 'rgba(0, 242, 255, 0.03)',
                  pointerEvents: 'none',
                  animation: 'pulse-glow 0.5s linear infinite'
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Heatmap;
