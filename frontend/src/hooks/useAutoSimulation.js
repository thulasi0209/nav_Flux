import { useState, useEffect, useCallback, useRef } from 'react';

export const useAutoSimulation = (isAutoMode, onTick, intervalMs = 2000) => {
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    timerRef.current = setInterval(() => {
      onTick();
    }, intervalMs);
  }, [onTick, intervalMs, stop]);

  useEffect(() => {
    if (isAutoMode) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [isAutoMode, start, stop]);

  return { stop, start };
};
