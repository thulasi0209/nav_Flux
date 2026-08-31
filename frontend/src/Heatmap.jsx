import { useState, useEffect } from 'react'

import { API_URL } from './config';

const Heatmap = ({ refreshTrigger }) => {
  const [heatmap, setHeatmap] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHeatmap = async () => {
    try {
      const resp = await fetch(`${API_URL}/heatmap`)
      if (resp.ok) {
        const data = await resp.json()
        setHeatmap(data)
      }
    } catch (err) {
      console.error('Failed to fetch heatmap', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatmap()
    // Periodic refresh
    const interval = setInterval(fetchHeatmap, 5000)
    return () => clearInterval(interval)
  }, [])

  // Also refresh when simulation steps
  useEffect(() => {
    fetchHeatmap()
  }, [refreshTrigger])

  const getColor = (congestion) => {
    if (congestion < 5) return '#4ade80' // Green
    if (congestion < 15) return '#fde047' // Yellow
    return '#f87171' // Red
  }

  if (loading && heatmap.length === 0) return <div className="card">Loading Heatmap...</div>

  return (
    <div className="card" style={{ marginTop: '2rem', textAlign: 'left' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>System Performance Heatmap</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {heatmap.map((lane) => (
          <div 
            key={lane.lane_id} 
            style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${lane.occupancy ? 'var(--primary)' : 'transparent'}`,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{lane.lane_id}</span>
              <div 
                style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: getColor(lane.congestion),
                  boxShadow: `0 0 10px ${getColor(lane.congestion)}`
                }} 
              />
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <div>Usage: <span style={{ color: 'white' }}>{lane.usage}</span></div>
              <div>Congestion: <span style={{ color: 'white' }}>{lane.congestion}</span></div>
            </div>

            {lane.occupancy === 1 && (
              <div style={{ 
                position: 'absolute', 
                top: '0.5rem', 
                right: '2.5rem', 
                fontSize: '0.6rem', 
                background: 'var(--primary)', 
                color: 'black', 
                padding: '1px 4px', 
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                BUSY
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Heatmap
