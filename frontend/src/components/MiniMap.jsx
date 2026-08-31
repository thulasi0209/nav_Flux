import React from 'react';

const MiniMap = ({ nodes, robots }) => {
  return (
    <div className="glass p-8 h-full min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <h2 className="hud-font text-xl border-l-4 border-electric-purple pl-4">Topology Matrix</h2>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zone: GRID-ALPHA-4</span>
      </div>

      <div className="flex-grow relative flex items-center justify-center border border-white/5 bg-black/20 rounded-2xl overflow-hidden p-10">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#00f2ff 1px, transparent 1px), linear-gradient(90#00f2ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="grid grid-cols-3 md:grid-cols-4 gap-8 relative z-10 w-full max-w-2xl">
          {nodes?.map((nodeId) => {
            const robotAtNode = robots?.find(r => r.current_node === nodeId);
            return (
              <div 
                key={nodeId}
                className={`relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 
                  ${robotAtNode 
                    ? 'bg-neon-cyan/20 border-neon-cyan shadow-[0_0_20px_rgba(0,242,255,0.4)] scale-110 z-20' 
                    : 'bg-white/5 border-white/10 opacity-60'
                  }`}
              >
                <span className="font-orbitron text-xs font-bold text-white mb-1">{nodeId}</span>
                {robotAtNode && (
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-bold text-neon-cyan bg-black/50 px-1 rounded animate-pulse">
                      {robotAtNode.id}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan mt-1 animate-ping" />
                  </div>
                )}
                
                {/* Connector lines (abstract) */}
                <div className="absolute -right-4 top-1/2 w-4 h-[1px] bg-white/10" />
                <div className="absolute -bottom-4 left-1/2 w-[1px] h-4 bg-white/10" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-6 text-[10px] font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white/5 border border-white/10" /> NODE PORTAL
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neon-cyan/20 border-2 border-neon-cyan" /> ROBOT DOCKED
        </div>
      </div>
    </div>
  );
};

export default MiniMap;
