import React from 'react';

const RobotCard = ({ robot }) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'MOVING': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'IN TRANSIT' };
      case 'WAITING': return { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'CONGESTED' };
      case 'CHARGING': return { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', label: 'RECHARGING' };
      case 'STOPPED': return { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: 'OFFLINE' };
      default: return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', label: 'UNKNOWN' };
    }
  };

  const config = getStatusConfig(robot.status);
  const speed = (Math.random() * (1.5 - 0.2) + 0.2).toFixed(1); 

  // Compute battery aesthetics
  const battery = robot.battery_level || 0;
  const batteryColor = battery > 70 ? 'from-emerald-400' : (battery > 30 ? 'from-amber-400' : 'from-rose-500');

  return (
    <div className={`glass group overflow-hidden transition-all duration-300 hover:border-neon-cyan/30 hover:shadow-[0_0_30px_rgba(0,242,255,0.05)] ${robot.status === 'LOW_BATTERY' || robot.status === 'WAITING' || robot.status === 'CHARGING' ? 'border-amber-500/30 animate-pulse' : ''}`}>
      {/* Top HUD Line */}
      <div className="h-1 w-full bg-white/5">
        <div className={`h-full transition-all duration-1000 ${robot.status === 'MOVING' ? 'bg-neon-cyan shadow-[0_0_10px_#00f2ff]' : (robot.status === 'CHARGING' ? 'bg-orange-500' : (robot.status === 'LOW_BATTERY' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-slate-700'))}`} style={{ width: robot.status === 'MOVING' ? '100%' : (robot.status === 'CHARGING' ? '100%' : '15%') }}></div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-bg-deep border border-white/10 flex items-center justify-center font-orbitron font-bold text-sm ${robot.status === 'charging' ? 'text-amber-400 border-amber-400/30' : 'text-neon-cyan'}`}>
              {robot.status === 'charging' ? '⚡' : robot.id}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Signal Identified</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.bg} ${config.color} ${config.border}`}>
                {config.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] block text-slate-500 uppercase font-bold">Battery</span>
            <span className={`font-rajdhani font-bold ${battery < 20 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{Math.round(battery)}%</span>
          </div>
        </div>

        {/* BATTERY BAR (Premium Gradient) */}
        <div className="mb-6 space-y-2">
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${batteryColor} to-transparent transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                style={{ width: `${battery}%` }}
              />
           </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            <span>Traversal Loop</span>
            <span className={robot.status === 'MOVING' ? 'text-neon-cyan' : 'text-slate-600'}>
              {robot.status === 'MOVING' ? 'SCANNING...' : 'STATIONARY'}
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full bg-gradient-to-r from-neon-cyan via-blue-500 to-electric-purple shadow-[0_0_15px_rgba(0,242,255,0.5)] ${robot.status === 'MOVING' ? 'w-full animate-pulse' : 'w-0'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Position</span>
            <div className="font-rajdhani font-bold text-sm text-slate-200 bg-white/5 px-2 py-1 rounded border border-white/5 text-center">
              X: {robot?.x !== undefined ? Math.round(robot.x) : '--'} , Y: {robot?.y !== undefined ? Math.round(robot.y) : '--'}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Health Scan</span>
            <div className="font-rajdhani font-bold text-sm text-neon-pink bg-white/5 px-2 py-1 rounded border border-white/5 text-center">
              NOMINAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotCard;
