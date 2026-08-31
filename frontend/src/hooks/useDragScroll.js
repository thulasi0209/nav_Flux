import { useRef, useState, useCallback, useEffect } from 'react';

export const useDragScroll = () => {
  const ref = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e) => {
    if (!ref.current) return;
    setIsDown(true);
    ref.current.classList.add('grabbing');
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDown(false);
    if (ref.current) ref.current.classList.remove('grabbing');
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDown(false);
    if (ref.current) ref.current.classList.remove('grabbing');
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDown || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    ref.current.scrollLeft = scrollLeft - walk;
  }, [isDown, scrollLeft, startX]);

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    style: { cursor: isDown ? 'grabbing' : 'grab', userSelect: 'none' }
  };
};
