import React, { useState, useEffect } from 'react';

const ControlPanel = ({ onStartAuto, onStopAuto, onStep, onSync, isAuto, isLoading }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-bg-deep to-slate-900 border border-white/10 rounded-3xl p-6 mb-10 shadow-2xl flex flex-wrap gap-8 items-center justify-between">
      {/* Left: Status */}
      <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
        <div className={`w-3 h-3 rounded-full ${isAuto ? 'bg-neon-cyan animate-pulse-cyan' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Status</span>
          <span className={`text-xs font-rajdhani font-bold ${isAuto ? 'text-neon-cyan' : 'text-red-500'}`}>
            {isAuto ? 'AUTO-PILOT ACTIVE' : 'MANUAL OVERRIDE'}
          </span>
        </div>
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={isAuto ? onStopAuto : onStartAuto}
            className={`group flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 font-rajdhani font-bold tracking-widest text-sm
              ${isAuto 
                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20' 
                : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]'
              }`}
          >
            {isAuto ? <span>⏸ PAUSE SYSTEM</span> : <span>▶ AUTO RUN</span>}
          </button>

          <button
            onClick={onStep}
            disabled={isAuto || isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 font-rajdhani font-bold tracking-widest text-sm"
          >
            ⏭ STEP TICK
          </button>

          <button
            onClick={onSync}
            className="p-3 rounded-xl bg-slate-800/50 text-slate-400 border border-white/10 hover:bg-slate-700 hover:text-white transition-all duration-300"
            title="Manual Sync"
          >
            🔄
          </button>
        </div>

        {/* Main Parameters */}
        <div className="flex flex-wrap gap-6 px-4 py-2 bg-black/20 rounded-lg border border-white/5">
           <div className="flex flex-col gap-1 min-w-[120px]">
              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Fleet Density</span>
                <span className="text-[9px] text-neon-cyan opacity-80 font-bold">N=100</span>
              </div>
              <input 
                type="range" min="1" max="100" defaultValue="8"
                onMouseUp={(e) => onSync(parseInt(e.target.value))} // We'll overload onSync for reset
                className="w-full h-1 accent-neon-cyan opacity-50 hover:opacity-100" 
              />
           </div>
           <div className="flex flex-col gap-1 min-w-[100px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Drain Rate</span>
              <input type="range" className="w-full h-1 accent-rose-500 opacity-50 hover:opacity-100" />
           </div>
           <div className="flex flex-col gap-1 min-w-[100px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Charge Speed</span>
              <input type="range" className="w-full h-1 accent-emerald-500 opacity-50 hover:opacity-100" />
           </div>
        </div>
      </div>

      {/* Right: Clock */}
      <div className="hidden md:flex flex-col items-end px-6 border-l border-white/10">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Standard Time</span>
        <span className="text-xl font-orbitron font-bold text-neon-cyan tracking-tighter">
          {time.toLocaleTimeString([], { hour12: false })}
        </span>
      </div>
    </div>
  );
};

export default ControlPanel;
