import { useState, useEffect, useCallback, useMemo } from 'react';
import './index.css';

// Components
import MetricCard from './components/MetricCard';
import ControlPanel from './components/ControlPanel';
import RobotCard from './components/RobotCard';
import HeatmapGrid from './components/HeatmapGrid';
import SimulationCanvas from './components/SimulationCanvas';
import AnimatedBackground from './components/AnimatedBackground';
import SpotlightLayer from './components/SpotlightLayer';
import Toast from './components/Toast';
import ConfigScreen from './components/ConfigScreen';
import HubStatusCard from './components/HubStatusCard';

// Hooks
import { useWebSocket } from './hooks/useWebSocket';
import { useAutoSimulation } from './hooks/useAutoSimulation';
import { useMousePosition } from './hooks/useMousePosition';

import { API_URL, WS_URL } from './config';

function App() {
  const mousePosition = useMousePosition();
  const { data: wsData, isConnected } = useWebSocket(WS_URL);
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [robots, setRobots] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [isAuto, setIsAuto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [gridSettings, setGridSettings] = useState({ rows: 3, cols: 2 });
  const [activeCount, setActiveCount] = useState(0);
  const [hubs, setHubs] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchInitialData = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const [nodesResp, metricsResp] = await Promise.all([
        fetch(`${API_URL}/map`),
        fetch(`${API_URL}/simulate/metrics`)
      ]);
      
      if (!nodesResp.ok || !metricsResp.ok) {
        throw new Error('Failed to fetch system data');
      }

      setNodes((await nodesResp.json()).nodes);
      setMetrics(await metricsResp.json());
    } catch (err) {
      console.error('Initial sync failed', err);
    }
  }, [isConfigured]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle WebSocket updates
  useEffect(() => {
    if (wsData) {
      setRobots(wsData.robots);
      setHeatmap(wsData.heatmap || []);
      setActiveCount(wsData.activeCount || 0);
      setHubs(wsData.hubs || []);
    }
  }, [wsData]);

  const handleStep = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/simulate/step`, { method: 'POST' });
      if (!resp.ok) {
        const err = await resp.json();
        addToast(err.detail || 'Step failed', 'error');
      }
    } catch (err) {
      addToast('System Link Error', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = async () => {
    try {
      await fetch(`${API_URL}/simulate/start`, { method: 'POST' });
      addToast('Fleet Initialized', 'success');
      fetchInitialData();
    } catch (err) {
      addToast('Launch Failed', 'error');
    }
  };

  const handleReset = async (n) => {
    setLoading(true);
    try {
      const targetN = typeof n === 'number' ? n : 8;
      const resp = await fetch(`${API_URL}/simulate/reset?n=${targetN}`, { method: 'POST' });
      if (resp.ok) {
        addToast(`System Pulse: ${targetN} units deployed`, 'success');
        fetchInitialData();
      }
    } catch (err) {
      addToast('Reset Failure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncState = () => {
    fetchInitialData();
    addToast('State Synchronized', 'info');
  };

  // Auto-Simulation Hook
  useAutoSimulation(isAuto, handleStep, 1500);

  // Filtered robots for display (To prevent DOM lag on high N)
  const displayRobots = useMemo(() => robots.slice(0, 12), [robots]);

  const movingCount = robots.filter(r => r.status === 'MOVING').length;

  if (!isConfigured) {
    return <ConfigScreen onComplete={() => setIsConfigured(true)} />;
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <SpotlightLayer mousePosition={mousePosition} />
      
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-10 z-[100] border-b border-white/5 bg-bg-deep/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-neon-cyan/10 rounded-xl flex items-center justify-center border border-neon-cyan/20">
            <span className="text-xl">🚦</span>
          </div>
          <h1 className="hud-font text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VOID Control Hub
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Network Link</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-[10px] font-bold ${isConnected ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isConnected ? 'ESTABLISHED' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-electric-purple flex items-center justify-center text-xl shadow-[0_0_20px_rgba(112,0,255,0.4)]">
            🤖
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-32 px-6 pb-20 relative z-10">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard label="Avg Wait" value={metrics?.avg_wait_time || 0} unit="STEPS" icon="⏳" colorClass="border-neon-cyan" />
          <MetricCard label="Throughput" value={metrics?.throughput || 0} unit="NODES/S" icon="⚡" colorClass="border-emerald-500" />
          <MetricCard label="Resolved" value={metrics?.deadlock_count || 0} unit="CYCLES" icon="🛡️" colorClass="border-neon-pink" />
          <MetricCard label="Fleet Load" value={movingCount} unit={`/ ${activeCount}`} icon="🛰️" colorClass="border-electric-purple" />
        </section>

        <ControlPanel 
          onStartAuto={() => setIsAuto(true)} 
          onStopAuto={() => setIsAuto(false)} 
          onStep={handleStep}
          onSync={handleReset}
          isAuto={isAuto}
          isLoading={loading}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="hud-font text-xl border-l-4 border-neon-cyan pl-4">Tactical Fleet Feed</h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Units: {activeCount}</span>
            </div>
            
            {/* OPERATIONAL LIVE MAP (Canvas) */}
            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl relative">
               <SimulationCanvas 
                  robots={robots} 
                  nodes={nodes} 
                  heatmap={heatmap}
                  gridSettings={gridSettings}
                  isAuto={isAuto}
               />
               
               {/* Grid Controls HUD */}
               <div className="absolute bottom-4 right-4 flex gap-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 z-20">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Grid Rows</span>
                    <input 
                      type="range" min="2" max="10" 
                      value={gridSettings.rows} 
                      onChange={(e) => setGridSettings(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                      className="w-24 accent-neon-cyan opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Grid Cols</span>
                    <input 
                      type="range" min="2" max="10" 
                      value={gridSettings.cols} 
                      onChange={(e) => setGridSettings(prev => ({ ...prev, cols: parseInt(e.target.value) }))}
                      className="w-24 accent-neon-cyan opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayRobots.length > 0 ? (
                displayRobots.map((robot) => (
                  <RobotCard key={robot.id} robot={robot} mousePosition={mousePosition} />
                ))
              ) : (
                <div className="col-span-2 glass p-10 flex flex-col items-center justify-center opacity-40">
                  <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4" />
                  <span className="hud-font">Initializing Simulation...</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10">
             <div className="glass p-8 h-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="hud-font text-xl border-l-4 border-emerald-500 pl-4">Signal Logs</h2>
                </div>
                <div className="flex-grow bg-black/20 rounded-xl border border-white/5 p-4 font-mono text-[10px] text-emerald-400/80 overflow-y-auto space-y-2">
                    {robots.slice(0, 50).map(r => (
                      <div key={r.id} className="border-l border-emerald-500/30 pl-2">
                         [<span className="text-emerald-200">{new Date().toLocaleTimeString()}</span>] UNIT_{r.id} -&gt; {r.status} @ {r.current_node} &gt; {r.next_node} ({Math.round(r.progress * 100)}%)
                      </div>
                    ))}
                </div>
             </div>
             
             <div className="h-1/2">
                <HubStatusCard hubs={hubs} />
             </div>
          </div>
        </div>

        <HeatmapGrid heatmap={heatmap} />
        <Toast toasts={toasts} onRemove={removeToast} />
        
        <footer className="mt-20 border-t border-white/5 pt-10 text-center pb-10">
          <div className="mb-6 overflow-hidden max-w-lg mx-auto bg-black/40 py-2 rounded-full border border-white/5 whitespace-nowrap">
            <div className="inline-block animate-[ticker_20s_linear_infinite] px-4 text-[9px] font-mono text-neon-cyan/60 uppercase">
               SYSTEM_ACTIVE // STABILITY_NOMINAL // ENCRYPTED_LINK_VERIFIED // {activeCount} UNITS IN SECTOR // NO_DEADLOCKS_DETECTED // POWER_GRID_ONLINE // SYNC_SUCCESSFUL // 
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            [ Secure Multi-Agent Coordination Protocol // Void-v1.4.2 ]
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
