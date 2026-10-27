import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ArrowRight, Shield } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const AirHockeyBattle: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [levelSuccess, setLevelSuccess] = useState(false);

  // Table coordinates (percentages 0-100)
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 80 });
  const [aiPos, setAiPos] = useState({ x: 50, y: 20 });
  const [puckPos, setPuckPos] = useState({ x: 50, y: 50 });
  const puckVel = useRef({ vx: 1.2, vy: 1.5 });

  const levelConfig = {
    1: { name: 'Nivo 1 : Ralanti', targetGoals: 3, aiSpeed: 1.2, puckSpeed: 1.2 },
    2: { name: 'Nivo 2 : Repons Rapid', targetGoals: 4, aiSpeed: 2.2, puckSpeed: 1.5 },
    3: { name: 'Nivo 3 : Disk Rapid', targetGoals: 4, aiSpeed: 2.8, puckSpeed: 2.0 },
    4: { name: 'Nivo 4 : Bon Defans', targetGoals: 5, aiSpeed: 3.4, puckSpeed: 2.2 },
    5: { name: 'Nivo 5 : Presizyon Wo', targetGoals: 5, aiSpeed: 4.0, puckSpeed: 2.5 },
    6: { name: 'Nivo 6 : Chanpyon Air Hockey', targetGoals: 6, aiSpeed: 4.8, puckSpeed: 2.8 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetGoals: 3, aiSpeed: 1.5, puckSpeed: 1.2 };

  // Main Physics Engine Loop
  useEffect(() => {
    if (levelSuccess) return;

    const loop = setInterval(() => {
      setPuckPos((p) => {
        let nx = p.x + puckVel.current.vx;
        let ny = p.y + puckVel.current.vy;

        // Side wall bounces
        if (nx <= 6) {
          nx = 6;
          puckVel.current.vx *= -1;
        } else if (nx >= 94) {
          nx = 94;
          puckVel.current.vx *= -1;
        }

        // Goal check top (AI goal: player scores!)
        if (ny <= 4) {
          if (nx >= 30 && nx <= 70) {
            // GOAL FOR PLAYER
            setPlayerScore((s) => {
              const ns = s + 1;
              if (ns >= levelConfig.targetGoals) {
                setTimeout(() => {
                  if (level < 6) {
                    setLevelSuccess(true);
                  } else {
                    onGameOver(1800, 150, 6);
                  }
                }, 0);
              }
              return ns;
            });
            // Reset puck
            puckVel.current = { vx: (Math.random() - 0.5) * 2, vy: 1.5 };
            return { x: 50, y: 50 };
          } else {
            ny = 4;
            puckVel.current.vy *= -1;
          }
        }

        // Goal check bottom (Player goal: AI scores)
        if (ny >= 96) {
          if (nx >= 30 && nx <= 70) {
            // GOAL FOR AI
            setAiScore((s) => {
              const ns = s + 1;
              if (ns >= levelConfig.targetGoals) {
                setTimeout(() => {
                  onGameOver(playerScore * 100, 0, level);
                }, 0);
              }
              return ns;
            });
            puckVel.current = { vx: (Math.random() - 0.5) * 2, vy: -1.5 };
            return { x: 50, y: 50 };
          } else {
            ny = 96;
            puckVel.current.vy *= -1;
          }
        }

        // Player paddle collision
        const pdx = nx - playerPos.x;
        const pdy = ny - playerPos.y;
        if (Math.hypot(pdx, pdy) < 9) {
          puckVel.current.vy = -Math.abs(puckVel.current.vy) * 1.05;
          puckVel.current.vx += pdx * 0.2;
          ny = playerPos.y - 8;
        }

        // AI paddle collision
        const adx = nx - aiPos.x;
        const ady = ny - aiPos.y;
        if (Math.hypot(adx, ady) < 9) {
          puckVel.current.vy = Math.abs(puckVel.current.vy) * 1.05;
          puckVel.current.vx += adx * 0.2;
          ny = aiPos.y + 8;
        }

        return { x: nx, y: ny };
      });

      // AI movement towards puck
      setAiPos((prev) => {
        let targetX = puckPos.x;
        let dx = targetX - prev.x;
        let moveX = Math.sign(dx) * Math.min(Math.abs(dx), levelConfig.aiSpeed);
        return {
          x: Math.max(15, Math.min(85, prev.x + moveX)),
          y: Math.max(12, Math.min(38, prev.y + (puckPos.y < 50 ? 0.3 : -0.3))),
        };
      });
    }, 30);

    return () => clearInterval(loop);
  }, [level, playerPos, aiPos, levelSuccess, levelConfig]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Restrict player to bottom half
    setPlayerPos({
      x: Math.max(12, Math.min(88, x)),
      y: Math.max(54, Math.min(90, y)),
    });
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
    setPlayerScore(0);
    setAiScore(0);
    setLevelSuccess(false);
    setPuckPos({ x: 50, y: 50 });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-cyan-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-cyan-400 text-sm">{levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">Premye a {levelConfig.targetGoals} gòl genyen</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-[10px] text-slate-400">Advèsè</span>
            <div className="font-black text-red-400 text-lg tabular-nums">{aiScore}</div>
          </div>
          <span className="text-slate-600 font-bold">-</span>
          <div className="text-center">
            <span className="text-[10px] text-slate-400">Ou menm</span>
            <div className="font-black text-emerald-400 text-lg tabular-nums">{playerScore}</div>
          </div>
        </div>
      </div>

      {/* Air Hockey Table Canvas */}
      <div
        className="relative w-full h-88 my-3 rounded-2xl overflow-hidden border-4 border-cyan-500 bg-gradient-to-b from-slate-900 via-cyan-950/20 to-slate-900 shadow-2xl cursor-none touch-none"
        onPointerMove={handlePointerMove}
      >
        {/* Center Line and Center Circle */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-500/50 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full border-2 border-cyan-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Goals */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-red-600 rounded-b-md shadow-lg" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-2.5 bg-emerald-500 rounded-t-md shadow-lg" />

        {/* AI Mallet */}
        <div
          className="absolute w-10 h-10 rounded-full bg-red-500 border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-transform"
          style={{ left: `${aiPos.x}%`, top: `${aiPos.y}%` }}
        >
          <div className="w-4 h-4 rounded-full bg-red-800" />
        </div>

        {/* Puck */}
        <div
          className="absolute w-7 h-7 rounded-full bg-amber-400 border border-white shadow-[0_0_12px_rgba(245,158,11,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${puckPos.x}%`, top: `${puckPos.y}%` }}
        />

        {/* Player Mallet */}
        <div
          className="absolute w-11 h-11 rounded-full bg-cyan-400 border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-transform"
          style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
        >
          <div className="w-5 h-5 rounded-full bg-cyan-700" />
        </div>

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-cyan-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🥅</h3>
            <p className="text-xs text-slate-300">Ou bat advèsè a ! Nivo siperyè a ap pi rapid.</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 text-center">
        Trennen dwèt ou nan pati anba a pou kontwole manch ou epi make gòl !
      </div>
    </div>
  );
};
