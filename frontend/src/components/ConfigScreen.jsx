import { useState } from 'react';
import { API_URL } from '../config';

function ConfigScreen({ onComplete }) {
  const [robotCount, setRobotCount] = useState(10);
  const [density, setDensity] = useState('HIGH');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (robotCount <= 0 || robotCount > 25) {
      setError('Robot count must be between 1 and 25.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ robotCount: Number(robotCount), density })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Failed to initialize simulation.');
      } else {
        onComplete();
      }
    } catch (err) {
      setError('Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center relative z-50">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="glass p-10 rounded-2xl max-w-md w-full relative z-10 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="w-12 h-12 bg-neon-cyan/10 rounded-xl flex items-center justify-center border border-neon-cyan/20">
            <span className="text-2xl">🚦</span>
          </div>
          <h1 className="hud-font text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VOID INIT
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
              Fleet Size (Max 25)
            </label>
            <input
              type="number"
              min="1"
              max="25"
              value={robotCount}
              onChange={(e) => setRobotCount(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-cyan/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">
              Traffic Density
            </label>
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-neon-cyan/50 transition-colors appearance-none"
            >
              <option value="LOW">LOW - Free Flow</option>
              <option value="MEDIUM">MEDIUM - Standard</option>
              <option value="HIGH">HIGH - Congestion</option>
            </select>
          </div>

          {error && <div className="text-rose-500 text-sm font-semibold">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/30 py-4 rounded-xl font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? 'Initializing...' : 'Start Simulation'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ConfigScreen;
