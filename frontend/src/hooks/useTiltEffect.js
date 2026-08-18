import { useState, useEffect, useRef } from 'react';

export const useTiltEffect = (mousePosition) => {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  const [proximity, setProximity] = useState(0); // 0 to 1

  useEffect(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mousePosition.x - centerX;
    const dy = mousePosition.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Dynamic scale and tilt based on proximity
    const maxDist = 500;
    const currentProximity = Math.max(0, 1 - distance / maxDist);
    setProximity(currentProximity);

    if (currentProximity > 0) {
      const rotateX = (-dy / maxDist) * 15 * currentProximity; // Max 15 degree tilt
      const rotateY = (dx / maxDist) * 15 * currentProximity;
      
      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${1 + 0.05 * currentProximity})`,
        transition: 'transform 0.1s ease-out',
        zIndex: Math.round(currentProximity * 100)
      });
    } else {
      setStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: 'transform 0.5s ease-out'
      });
    }
  }, [mousePosition]);

  return { ref, style, proximity };
};
