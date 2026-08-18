import React from 'react';

const HeatmapGrid = ({ heatmap }) => {
  const getCongestionColor = (score) => {
    if (score < 5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/20';
    if (score < 15) return 'bg-amber-500/20 text-amber-400 border-amber-400/20';
    return 'bg-rose-500/30 text-rose-400 border-rose-400/20 animate-pulse';
  };

  return (
    <div className="glass p-8 mt-12 mb-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="hud-font text-xl border-l-4 border-neon-cyan pl-4">Network Traffic Density</h2>
        <div className="flex gap-4 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> LOW</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> MEDIUM</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> HIGH</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {heatmap?.map((lane) => (
          <div 
            key={lane.lane_id}
            className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${getCongestionColor(lane.congestion_score)}`}
          >
            <span className="font-orbitron text-[10px] opacity-70 mb-1">{lane.lane_id}</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-rajdhani font-bold">{lane.usage_count}</span>
              <span className="text-[10px] opacity-50 uppercase">Loads</span>
            </div>
            {lane.usage_count > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-ping" />
                <span className="text-[8px] font-bold tracking-tighter text-white">ACTIVE OPS</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapGrid;
