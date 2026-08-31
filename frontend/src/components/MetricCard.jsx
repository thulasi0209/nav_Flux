import React, { useState, useEffect } from 'react';

const MetricCard = ({ label, value, unit, icon, colorClass }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = parseFloat(value) || 0;
    if (start === end) return;

    const duration = 1000;
    const increment = (end - start) / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        // If the end value is an integer, show rounded integers for a cleaner look
        setDisplayValue(Number.isInteger(end) ? Math.round(start) : Math.round(start * 100) / 100);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`glass p-6 group transition-all duration-500 hover:scale-[1.02] border-l-4 ${colorClass}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">{label}</span>
        <span className="text-xl opacity-80 group-hover:scale-125 transition-transform duration-300">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-rajdhani font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] italic">
          {displayValue}
        </span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>
      
      {/* Trend sparkline */}
      <div className="mt-4 h-6 w-full opacity-20 group-hover:opacity-40 transition-opacity">
        <svg viewBox="0 0 100 20" className="w-full h-full">
           <path 
             d="M0 15 Q 25 5, 50 15 T 100 10" 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="2"
             className={colorClass.replace('border-', 'text-')}
           />
        </svg>
      </div>

      <div className="mt-2 h-[2px] w-full bg-white/5 overflow-hidden">
        <div className={`h-full opacity-50 animate-pulse ${colorClass.replace('border-', 'bg-')}`} style={{ width: '100%' }}></div>
      </div>
    </div>
  );
};

export default MetricCard;
