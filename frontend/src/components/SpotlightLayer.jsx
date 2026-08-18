import React from 'react';

const SpotlightLayer = ({ mousePosition }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5, // Above background, below content
        background: `radial-gradient(
          600px circle at ${mousePosition.x}px ${mousePosition.y}px,
          rgba(0, 242, 255, 0.08),
          transparent 80%
        )`,
        mixBlendMode: 'screen',
        opacity: 0.8
      }}
    />
  );
};

export default SpotlightLayer;
