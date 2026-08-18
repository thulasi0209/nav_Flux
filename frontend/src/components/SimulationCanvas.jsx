import React, { useRef, useEffect, useState } from 'react';

const SimulationCanvas = ({ robots }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [robotPositions, setRobotPositions] = useState({});

  const NODE_COORDS = {
    'A': { x: 1, y: 1 },
    'B': { x: 1, y: 9 },
    'C': { x: 5, y: 9 },
    'D': { x: 5, y: 1 },
    'E': { x: 9, y: 9 },
    'F': { x: 9, y: 1 }
  };

  const CHARGING_STATIONS = ['A', 'E'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const getCanvasCoords = (x, y, width, height) => {
      const padding = 50;
      const usableW = width - padding * 2;
      const usableH = height - padding * 2;
      return {
        cx: padding + (x / 10) * usableW,
        cy: padding + (y / 10) * usableH
      };
    };

    const render = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { width, height } = canvas;

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const { cx: xStart, cy: yStart } = getCanvasCoords(i, 0, width, height);
        const { cx: xEnd, cy: yEnd } = getCanvasCoords(i, 10, width, height);
        ctx.beginPath(); ctx.moveTo(xStart, yStart); ctx.lineTo(xEnd, yEnd); ctx.stroke();
        
        const { cx: xStart2, cy: yStart2 } = getCanvasCoords(0, i, width, height);
        const { cx: xEnd2, cy: yEnd2 } = getCanvasCoords(10, i, width, height);
        ctx.beginPath(); ctx.moveTo(xStart2, yStart2); ctx.lineTo(xEnd2, yEnd2); ctx.stroke();
      }

      // Draw Nodes
      Object.keys(NODE_COORDS).forEach(nodeId => {
        const { cx, cy } = getCanvasCoords(NODE_COORDS[nodeId].x, NODE_COORDS[nodeId].y, width, height);
        const isStation = CHARGING_STATIONS.includes(nodeId);

        if (isStation) {
           const pulse = (Math.sin(time / 200) + 1) / 2;
           ctx.beginPath();
           ctx.arc(cx, cy, 10 + pulse * 5, 0, Math.PI * 2);
           ctx.fillStyle = `rgba(245, 158, 11, ${0.15 * (1 - pulse)})`;
           ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = isStation ? '#f59e0b' : 'rgba(0, 242, 255, 0.3)';
        ctx.fill();

        ctx.font = 'bold 11px Orbitron';
        ctx.fillStyle = isStation ? '#f59e0b' : 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(isStation ? `⚡ HUB ${nodeId}` : nodeId, cx + 10, cy - 10);
      });

      // Draw Robots
      robots.forEach(robot => {
        const startNode = NODE_COORDS[robot.current_node] || { x: 0, y: 0 };
        const endNode = NODE_COORDS[robot.next_node] || startNode;
        
        const targetX = startNode.x + (endNode.x - startNode.x) * (robot.progress || 0);
        const targetY = startNode.y + (endNode.y - startNode.y) * (robot.progress || 0);
        const target = getCanvasCoords(targetX, targetY, width, height);
        
        const currentPos = robotPositions[robot.id] || { x: target.cx, y: target.cy };
        const lerpX = currentPos.x + (target.cx - currentPos.x) * 0.15;
        const lerpY = currentPos.y + (target.cy - currentPos.y) * 0.15;

        // Visual effects for states
        if (robot.status === 'CHARGING') {
          const pulse = (Math.sin(time / 200) + 1) / 2;
          ctx.beginPath();
          ctx.arc(lerpX, lerpY, 15 + pulse * 10, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245, 158, 11, ${0.2 * (1 - pulse)})`;
          ctx.fill();
        } else if (robot.status === 'WAITING') {
          ctx.beginPath();
          ctx.arc(lerpX, lerpY, 12, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Battery HUD
        const batColor = robot.battery_level > 70 ? '#10b981' : (robot.battery_level > 30 ? '#f59e0b' : '#ef4444');
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(lerpX - 10, lerpY - 18, 20, 3);
        ctx.fillStyle = batColor;
        ctx.fillRect(lerpX - 10, lerpY - 18, (robot.battery_level / 100) * 20, 3);

        // Robot Body
        ctx.beginPath();
        ctx.arc(lerpX, lerpY, 10, 0, Math.PI * 2);
        
        let robotColor = 'var(--color-neon-cyan)';
        if (robot.status === 'CHARGING') robotColor = '#f59e0b';
        if (robot.status === 'WAITING') robotColor = '#ef4444';

        ctx.fillStyle = robotColor;
        ctx.shadowBlur = (robot.status === 'CHARGING') ? 20 : 10;
        ctx.shadowColor = robotColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 9px Rajdhani';
        ctx.fillStyle = (robot.status === 'WAITING') ? '#fff' : '#000';
        ctx.textAlign = 'center';
        ctx.fillText(robot.status === 'CHARGING' ? '⚡' : robot.id, lerpX, lerpY + 3);

        robotPositions[robot.id] = { x: lerpX, y: lerpY };
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [robots, robotPositions]);

  return (
    <div className="glass h-full w-full relative overflow-hidden bg-black/40 border border-white/5">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default SimulationCanvas;
