import React, { useState, useEffect } from 'react';

const Header = ({ isSimulationRunning }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="glass" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      zIndex: 100,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: '0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>🚦 Robot Traffic Control</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 12px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: isSimulationRunning ? 'var(--primary)' : 'var(--danger)',
            boxShadow: `0 0 10px ${isSimulationRunning ? 'var(--primary)' : 'var(--danger)'}`,
            animation: isSimulationRunning ? 'pulse-glow 2s infinite' : 'none'
          }} />
          <span style={{ color: isSimulationRunning ? 'var(--primary)' : 'var(--text-dim)' }}>
            {isSimulationRunning ? 'SYSTEM ACTIVE' : 'SIMULATION OFFLINE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="hud-font" style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
          {time.toLocaleTimeString([], { hour12: false })}
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%', 
          background: 'var(--secondary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.2rem',
          boxShadow: '0 0 15px rgba(112, 0, 255, 0.4)'
        }}>
          🤖
        </div>
      </div>
    </header>
  );
};

export default Header;
