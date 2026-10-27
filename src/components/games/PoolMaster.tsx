import React, { useState, useEffect } from 'react';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isCue?: boolean;
  potted?: boolean;
}

const POCKETS = [
  { x: 5, y: 8 },
  { x: 50, y: 6 },
  { x: 95, y: 8 },
  { x: 5, y: 92 },
  { x: 50, y: 94 },
  { x: 95, y: 92 },
];

export const PoolMaster: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(5);
  const [aimAngle, setAimAngle] = useState(45); // 0 to 360 deg
  const [power, setPower] = useState(65);
  const [isStriking, setIsStriking] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : 2 Boul Byen Plase', targetCount: 2, maxShots: 5 },
    2: { name: 'Nivo 2 : 3 Boul Sou Tab', targetCount: 3, maxShots: 6 },
    3: { name: 'Nivo 3 : Ang Presizyon', targetCount: 4, maxShots: 6 },
    4: { name: 'Nivo 4 : Frap Limite', targetCount: 4, maxShots: 5 },
    5: { name: 'Nivo 5 : Konbinezon Difisil', targetCount: 5, maxShots: 6 },
    6: { name: 'Nivo 6 : Defi Gran Mèt Bilya', targetCount: 6, maxShots: 7 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetCount: 2, maxShots: 5 };

  useEffect(() => {
    initTableForLevel(level);
  }, [level]);

  const initTableForLevel = (lvl: number) => {
    const count = levelConfig.targetCount;
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

    const newBalls: Ball[] = [
      // White cue ball
      { id: 0, x: 25, y: 50, vx: 0, vy: 0, color: '#FFFFFF', isCue: true, potted: false },
    ];

    // Target balls
    for (let i = 0; i < count; i++) {
      newBalls.push({
        id: i + 1,
        x: 60 + (i % 3) * 10,
        y: 35 + Math.floor(i / 2) * 15,
        vx: 0,
        vy: 0,
        color: colors[i % colors.length],
        potted: false,
      });
    }

    setBalls(newBalls);
    setShotsLeft(levelConfig.maxShots);
    setLevelSuccess(false);
  };

  const strikeCueBall = () => {
    if (isStriking || shotsLeft <= 0) return;
    setIsStriking(true);

    const rad = (aimAngle * Math.PI) / 180;
    const speed = (power / 100) * 8;

    const updatedBalls = balls.map((b) => {
      if (b.isCue) {
        return {
          ...b,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
        };
      }
      return b;
    });

    setBalls(updatedBalls);

    // Physics step loop
    let steps = 0;
    const physicsLoop = setInterval(() => {
      steps++;
      setBalls((prevBalls) => {
        const nextBalls = prevBalls.map((ball) => {
          if (ball.potted) return ball;

          let nx = ball.x + ball.vx * 0.4;
          let ny = ball.y + ball.vy * 0.4;
          let nvx = ball.vx * 0.96; // friction
          let nvy = ball.vy * 0.96;

          // Rail bounce
          if (nx <= 6) {
            nx = 6;
            nvx = -nvx * 0.8;
          } else if (nx >= 94) {
            nx = 94;
            nvx = -nvx * 0.8;
          }

          if (ny <= 10) {
            ny = 10;
            nvy = -nvy * 0.8;
          } else if (ny >= 90) {
            ny = 90;
            nvy = -nvy * 0.8;
          }

          // Stop if slow
          if (Math.hypot(nvx, nvy) < 0.05) {
            nvx = 0;
            nvy = 0;
          }

          // Check pocket entrance
          let isPotted = false;
          for (const pocket of POCKETS) {
            if (Math.hypot(nx - pocket.x, ny - pocket.y) < 6) {
              isPotted = true;
              break;
            }
          }

          if (isPotted && !ball.isCue) {
            return { ...ball, potted: true, vx: 0, vy: 0 };
          }

          // If cue ball potted, respawn at center
          if (isPotted && ball.isCue) {
            return { ...ball, x: 25, y: 50, vx: 0, vy: 0 };
          }

          return { ...ball, x: nx, y: ny, vx: nvx, vy: nvy };
        });

        // Simple ball-to-ball collisions
        for (let i = 0; i < nextBalls.length; i++) {
          for (let j = i + 1; j < nextBalls.length; j++) {
            const b1 = nextBalls[i];
            const b2 = nextBalls[j];
            if (b1.potted || b2.potted) continue;

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 6 && dist > 0) {
              // Elastic bounce
              const angle = Math.atan2(dy, dx);
              const speed1 = Math.hypot(b1.vx, b1.vy);
              const speed2 = Math.hypot(b2.vx, b2.vy);

              b1.vx = -Math.cos(angle) * (speed1 + 0.5) * 0.8;
              b1.vy = -Math.sin(angle) * (speed1 + 0.5) * 0.8;
              b2.vx = Math.cos(angle) * (speed2 + 0.5) * 0.8;
              b2.vy = Math.sin(angle) * (speed2 + 0.5) * 0.8;
            }
          }
        }

        return nextBalls;
      });

      if (steps > 50) {
        clearInterval(physicsLoop);
        finishShot();
      }
    }, 30);
  };

  const finishShot = () => {
    setIsStriking(false);
    const remaining = shotsLeft - 1;
    setShotsLeft(remaining);

    const targetPotted = balls.filter((b) => !b.isCue && b.potted).length;
    const targetTotal = balls.filter((b) => !b.isCue).length;
    const newScore = targetPotted * 200 * level;
    setScore(newScore);

    if (targetPotted >= targetTotal) {
      if (level < 6) {
        setLevelSuccess(true);
      } else {
        setTimeout(() => onGameOver(newScore + 1800, 150, 6), 0);
      }
    } else if (remaining <= 0) {
      setTimeout(() => onGameOver(newScore, 0, level), 0);
    }
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
  };

  const cueBall = balls.find((b) => b.isCue) || { x: 25, y: 50 };
  const targetPottedCount = balls.filter((b) => !b.isCue && b.potted).length;

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-emerald-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-emerald-400 text-sm">Pool Master — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Boul antre:{' '}
            <strong className="text-amber-400">
              {targetPottedCount} / {levelConfig.targetCount}
            </strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Frap ki rete</span>
          <div className="font-black text-amber-400 text-sm tabular-nums">{shotsLeft}</div>
        </div>
      </div>

      {/* Billiard Table Canvas */}
      <div className="relative w-full h-80 my-3 rounded-2xl overflow-hidden border-8 border-amber-800 bg-[#065F46] shadow-2xl flex items-center justify-center">
        {/* 6 Pockets */}
        {POCKETS.map((pocket, idx) => (
          <div
            key={idx}
            className="absolute w-6 h-6 rounded-full bg-slate-950 border-2 border-amber-950/80 -translate-x-1/2 -translate-y-1/2 shadow-inner"
            style={{ left: `${pocket.x}%`, top: `${pocket.y}%` }}
          />
        ))}

        {/* Aim Cue Line */}
        {!isStriking && (
          <div
            className="absolute h-0.5 bg-white/70 origin-left pointer-events-none"
            style={{
              left: `${cueBall.x}%`,
              top: `${cueBall.y}%`,
              width: '80px',
              transform: `rotate(${aimAngle}deg)`,
            }}
          />
        )}

        {/* Balls on Table */}
        {balls.map((ball) => {
          if (ball.potted) return null;
          return (
            <div
              key={ball.id}
              className="absolute w-5 h-5 rounded-full border border-black/40 shadow-md -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-black pointer-events-none transition-transform"
              style={{
                left: `${ball.x}%`,
                top: `${ball.y}%`,
                backgroundColor: ball.color,
                color: ball.isCue ? '#000' : '#FFF',
              }}
            >
              {ball.isCue ? '•' : ball.id}
            </div>
          );
        })}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🎱</h3>
            <p className="text-xs text-slate-300">Tout boul sib yo antre nan twou yo !</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-2.5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Ang baton bilya:</span>
              <span className="font-bold text-amber-400">{aimAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={aimAngle}
              onChange={(e) => setAimAngle(Number(e.target.value))}
              disabled={isStriking}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Fòs frap la:</span>
              <span className="font-bold text-emerald-400">{power}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              disabled={isStriking}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={strikeCueBall}
          disabled={isStriking || shotsLeft <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50"
        >
          FRAPE BOUL BLAN AN 🎱
        </button>
      </div>
    </div>
  );
};
