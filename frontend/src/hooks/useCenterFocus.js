import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to detect which child element is closest to the horizontal center of the parent container.
 */
export const useCenterFocus = () => {
  const containerRef = useRef(null);
  const [focusedId, setFocusedId] = useState(null);

  const calculateFocus = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerMid = container.scrollLeft + container.offsetWidth / 2;
    const children = Array.from(container.children);

    let closestId = null;
    let minDistance = Infinity;

    children.forEach((child) => {
      const childMid = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerMid - childMid);

      if (distance < minDistance) {
        minDistance = distance;
        closestId = child.getAttribute('data-focus-id');
      }
    });

    setFocusedId(closestId);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Throttled scroll listener
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateFocus();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', onScroll);
    // Initial check
    calculateFocus();

    return () => container.removeEventListener('scroll', onScroll);
  }, [calculateFocus]);

  return { containerRef, focusedId };
};
