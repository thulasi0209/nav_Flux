import React from 'react';

const HubStatusCard = ({ hubs }) => {
  return (
    <div className="glass p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="hud-font text-xl border-l-4 border-orange-500 pl-4">Power Hub Telemetry</h2>
      </div>
      
      <div className="space-y-4 flex-grow">
        {hubs.map(hub => (
          <div key={hub.id} className="bg-black/30 rounded-xl border border-white/5 p-4 relative overflow-hidden group">
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-20 transition-all group-hover:opacity-40 ${hub.status === 'OPERATIONAL' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Sector Station</span>
                <span className="font-orbitron text-lg text-white">HUB {hub.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hub.status === 'OPERATIONAL' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {hub.status}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                <span>Active Docks</span>
                <span>{hub.units.length} / 4</span>
              </div>
              <div className="flex gap-2">
                {hub.units.map(unitId => (
                  <div key={unitId} className="w-8 h-8 rounded bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[10px] font-bold text-orange-400 animate-pulse">
                    {unitId.replace('R', '')}
                  </div>
                ))}
                {hub.units.length === 0 && (
                  <span className="text-[10px] text-slate-600 italic">No units currently docked</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-orange-500/5 rounded-lg border border-orange-500/10 text-[9px] text-orange-400/70 font-mono leading-relaxed">
        [SYS_MSG] AUTOMATIC_POWER_ROUTING_ENABLED // STATIONS_A_E_ACTIVE // DOCK_PRIORITY: LOW_BATTERY_UNITS
      </div>
    </div>
  );
};

export default HubStatusCard;
