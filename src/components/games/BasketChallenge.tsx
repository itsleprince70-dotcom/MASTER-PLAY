import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, ArrowRight } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const BasketChallenge: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [baskets, setBaskets] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(7);
  const [angle, setAngle] = useState(65); // 40 to 85 deg
  const [power, setPower] = useState(70); // 40 to 100
  const [isShooting, setIsShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 18, y: 75 });
  const [shotResult, setShotResult] = useState<'swish' | 'rim' | 'airball' | null>(null);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : Toupre', targetBaskets: 3, hoopX: 82, hoopY: 35, obstacle: false },
    2: { name: 'Nivo 2 : Distans mwayen', targetBaskets: 3, hoopX: 85, hoopY: 30, obstacle: false },
    3: { name: 'Nivo 3 : Tir sou kote', targetBaskets: 4, hoopX: 88, hoopY: 28, obstacle: false },
    4: { name: 'Nivo 4 : Obstak Defans', targetBaskets: 4, hoopX: 85, hoopY: 30, obstacle: true },
    5: { name: 'Nivo 5 : Gran Distans 3-Pwen', targetBaskets: 4, hoopX: 88, hoopY: 25, obstacle: true },
    6: { name: 'Nivo 6 : Defi Chanpyon', targetBaskets: 5, hoopX: 90, hoopY: 24, obstacle: true }
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetBaskets: 3, hoopX: 82, hoopY: 35, obstacle: false };

  const shoot = () => {
    if (isShooting || ballsLeft <= 0) return;
    setIsShooting(true);
    setShotResult(null);

    const rad = (angle * Math.PI) / 180;
    const v = (power / 100) * 1.8;
    const vx = Math.cos(rad) * v * 28;
    const vy = -Math.sin(rad) * v * 32;

    let t = 0;
    const startX = 18;
    const startY = 75;
    const gravity = 22;

    const interval = setInterval(() => {
      t += 0.05;
      const curX = startX + vx * t;
      const curY = startY + vy * t + 0.5 * gravity * t * t;

      setBallPos({ x: curX, y: curY });

      // Obstacle collision check (Level 4+)
      if (levelConfig.obstacle && curX > 50 && curX < 56 && curY > 30 && curY < 65) {
        clearInterval(interval);
        setShotResult('rim');
        setTimeout(resetAfterShot, 800);
        return;
      }

      // Check arrival near hoop
      const dx = curX - levelConfig.hoopX;
      const dy = curY - levelConfig.hoopY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4.5) {
        clearInterval(interval);
        setShotResult('swish');
        const newBaskets = baskets + 1;
        setBaskets(newBaskets);
        setScore(s => s + 200 * level);
        setTimeout(resetAfterShot, 800);
        return;
      } else if (dist < 8) {
        clearInterval(interval);
        setShotResult('rim');
        setTimeout(resetAfterShot, 800);
        return;
      }

      // Out of bounds or hit floor
      if (curY > 85 || curX > 105) {
        clearInterval(interval);
        setShotResult('airball');
        setTimeout(resetAfterShot, 800);
      }
    }, 25);
  };

  const resetAfterShot = () => {
    setIsShooting(false);
    setBallPos({ x: 18, y: 75 });
    setShotResult(null);

    const remaining = ballsLeft - 1;
    setBallsLeft(remaining);

    if (baskets >= levelConfig.targetBaskets) {
      if (level < 6) {
        setLevelSuccess(true);
      } else {
        onGameOver(score + 1200, 150, 6);
      }
    } else if (remaining <= 0) {
      onGameOver(score + baskets * 100, 0, level);
    }
  };

  const nextLevel = () => {
    setLevel(lvl => lvl + 1);
    setBaskets(0);
    setBallsLeft(7);
    setLevelSuccess(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-orange-500/30 text-white select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-amber-400 text-sm">{levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Panyen: <strong className="text-orange-400">{baskets} / {levelConfig.targetBaskets}</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Boul ki rete</span>
          <div className="font-black text-amber-400 text-sm tabular-nums">{ballsLeft}</div>
        </div>
      </div>

      {/* Basketball Court Canvas */}
      <div className="relative w-full h-80 my-3 rounded-2xl overflow-hidden border-2 border-orange-600 bg-gradient-to-b from-slate-900 via-orange-950/20 to-amber-900/40 shadow-inner">
        {/* Court markings */}
        <div className="absolute bottom-0 w-full h-12 bg-amber-800/40 border-t-2 border-white/40" />

        {/* Basketball Hoop (Rim + Net + Board) */}
        <div
          className="absolute -translate-y-1/2 flex items-center pointer-events-none"
          style={{ left: `${levelConfig.hoopX}%`, top: `${levelConfig.hoopY}%` }}
        >
          {/* Rim */}
          <div className="w-7 h-2 bg-red-600 border border-white rounded-full shadow-lg relative">
            {/* Net strings */}
            <div className="absolute top-2 left-1 w-5 h-6 border-b-2 border-x-2 border-white/70 rounded-b-lg opacity-80" />
          </div>
          {/* Backboard */}
          <div className="w-1.5 h-16 bg-white border border-red-500 shadow-md ml-0.5" />
          {/* Pole */}
          <div className="w-2 h-44 bg-slate-600 absolute top-12 right-0" />
        </div>

        {/* Defender Obstacle (Level 4+) */}
        {levelConfig.obstacle && (
          <div className="absolute top-36 left-[53%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-pulse">
            <div className="text-3xl">🙋‍♂️</div>
            <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded">BLOKÈ</span>
          </div>
        )}

        {/* Ball */}
        <div
          className="absolute text-2xl -translate-x-1/2 -translate-y-1/2 drop-shadow-lg transition-transform"
          style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
        >
          🏀
        </div>

        {/* Shooter avatar */}
        <div className="absolute bottom-3 left-4 text-3xl pointer-events-none">
          ⛹️
        </div>

        {/* Result message */}
        {shotResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span
              className={`text-2xl font-black uppercase px-5 py-2 rounded-2xl shadow-xl ${
                shotResult === 'swish'
                  ? 'bg-orange-500 text-slate-950 animate-bounce'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {shotResult === 'swish' ? 'PANYEN PÒPÒP ! 🎯' : shotResult === 'rim' ? 'SOU SERK !' : 'RATEDEVIYE !'}
            </span>
          </div>
        )}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🏀</h3>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Ang tir la:</span>
              <span className="font-bold text-amber-400">{angle}°</span>
            </div>
            <input
              type="range"
              min="45"
              max="80"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              disabled={isShooting}
              className="w-full accent-orange-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Fòs lansman:</span>
              <span className="font-bold text-orange-400">{power}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              disabled={isShooting}
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        <button
          onClick={shoot}
          disabled={isShooting || ballsLeft <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50"
        >
          <span>VOYE NAN PANYEN AN 🏀</span>
        </button>
      </div>
    </div>
  );
};
