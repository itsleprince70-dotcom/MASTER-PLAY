import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, Target, Play, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const FootballChallenge: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [goals, setGoals] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(6);
  const [timeLeft, setTimeLeft] = useState(25);
  const [aimX, setAimX] = useState(50); // 10 to 90%
  const [aimY, setAimY] = useState(40); // 15 to 70%
  const [power, setPower] = useState(70); // 30 to 100
  const [isShooting, setIsShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 88, scale: 1 });
  const [keeperX, setKeeperX] = useState(50);
  const [shotResult, setShotResult] = useState<'goal' | 'saved' | 'miss' | null>(null);
  const [levelSuccess, setLevelSuccess] = useState(false);

  // Level configuration
  const levelConfig = {
    1: { name: 'Nivo 1 : Debut', targetGoals: 3, keeperSpeed: 1.5, defenders: 0, timeLimit: 30 },
    2: { name: 'Nivo 2 : Mouvman', targetGoals: 3, keeperSpeed: 3, defenders: 0, timeLimit: 25 },
    3: { name: 'Nivo 3 : Defansè', targetGoals: 4, keeperSpeed: 3.5, defenders: 1, timeLimit: 25 },
    4: { name: 'Nivo 4 : Presyon Tan', targetGoals: 4, keeperSpeed: 4, defenders: 1, timeLimit: 18 },
    5: { name: 'Nivo 5 : Miray Solid', targetGoals: 5, keeperSpeed: 5, defenders: 2, timeLimit: 20 },
    6: { name: 'Nivo 6 : Defi Final', targetGoals: 5, keeperSpeed: 6, defenders: 2, timeLimit: 16 }
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetGoals: 3, keeperSpeed: 2, defenders: 0, timeLimit: 30 };

  // Timer
  useEffect(() => {
    if (levelSuccess || shotsLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setTimeout(() => finishMatch(false), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [level, levelSuccess, shotsLeft]);

  // Goalkeeper animation
  useEffect(() => {
    if (isShooting) return;
    let dir = 1;
    const interval = setInterval(() => {
      setKeeperX(prev => {
        let next = prev + dir * levelConfig.keeperSpeed;
        if (next > 72) {
          dir = -1;
          return 72;
        }
        if (next < 28) {
          dir = 1;
          return 28;
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [level, isShooting, levelConfig.keeperSpeed]);

  const shootBall = () => {
    if (isShooting || shotsLeft <= 0) return;
    setIsShooting(true);
    setShotResult(null);

    // Ball animation
    const targetX = aimX;
    const targetY = aimY;

    let progress = 0;
    const anim = setInterval(() => {
      progress += 0.1;
      setBallPos({
        x: 50 + (targetX - 50) * progress,
        y: 88 + (targetY - 88) * progress,
        scale: 1 - 0.45 * progress
      });

      if (progress >= 1) {
        clearInterval(anim);

        // Check if goal, saved, or miss
        const inGoal = targetX >= 25 && targetX <= 75 && targetY >= 15 && targetY <= 55;
        const keeperRange = Math.abs(targetX - keeperX);
        const defenderBlock = levelConfig.defenders > 0 && Math.abs(targetX - 50) < 12 && targetY > 40;

        let res: 'goal' | 'saved' | 'miss' = 'miss';
        if (inGoal) {
          if (defenderBlock) {
            res = 'saved';
          } else if (keeperRange < 11) {
            res = 'saved';
          } else {
            res = 'goal';
          }
        }

        setShotResult(res);
        const newGoals = res === 'goal' ? goals + 1 : goals;
        if (res === 'goal') {
          setGoals(newGoals);
          setScore(s => s + 150 * level);
        }

        const remainingShots = shotsLeft - 1;
        setShotsLeft(remainingShots);

        setTimeout(() => {
          setIsShooting(false);
          setBallPos({ x: 50, y: 88, scale: 1 });
          setShotResult(null);

          // Check win / lose
          if (newGoals >= levelConfig.targetGoals) {
            if (level < 6) {
              setLevelSuccess(true);
            } else {
              // Beaten all 6 levels!
              onGameOver(score + 1000, 150, 6);
            }
          } else if (remainingShots <= 0) {
            finishMatch(false);
          }
        }, 1200);
      }
    }, 30);
  };

  const nextLevel = () => {
    setLevel(lvl => lvl + 1);
    setGoals(0);
    setShotsLeft(6);
    setTimeLeft(levelConfig.timeLimit);
    setLevelSuccess(false);
    setBallPos({ x: 50, y: 88, scale: 1 });
  };

  const finishMatch = (cleared: boolean) => {
    const finalScore = score + goals * 100;
    const prize = cleared && level >= 3 ? level * 25 : 0;
    onGameOver(finalScore, prize, level);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-emerald-500/30 text-white select-none">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-amber-400 text-sm">{levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Gòl: <strong className="text-emerald-400">{goals} / {levelConfig.targetGoals}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-bold tabular-nums">{timeLeft}s</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400">Tir ki rete</span>
            <div className="font-black text-amber-400 text-sm tabular-nums">{shotsLeft}</div>
          </div>
        </div>
      </div>

      {/* Teren & Gòl Canvas */}
      <div
        className="relative w-full h-80 my-3 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-700 shadow-inner flex items-center justify-center"
        onClick={(e) => {
          if (isShooting) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 100;
          const clickY = ((e.clientY - rect.top) / rect.height) * 100;
          setAimX(Math.max(15, Math.min(85, clickX)));
          setAimY(Math.max(15, Math.min(65, clickY)));
        }}
      >
        {/* Grass lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(0deg,#000_0,#000_20px,transparent_20px,transparent_40px)]" />

        {/* Penalty Area Lines */}
        <div className="absolute top-0 w-3/4 h-44 border-2 border-white/60 rounded-b-2xl pointer-events-none" />
        <div className="absolute top-0 w-1/2 h-20 border-2 border-white/60 pointer-events-none" />

        {/* Goal Post Frame */}
        <div className="absolute top-4 w-[56%] h-24 border-4 border-white bg-slate-900/40 rounded-t-lg shadow-2xl pointer-events-none flex items-center justify-center">
          {/* Net texture */}
          <div className="w-full h-full opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
        </div>

        {/* Goalkeeper */}
        <div
          className="absolute top-16 -translate-x-1/2 transition-all duration-75 flex flex-col items-center pointer-events-none"
          style={{ left: `${keeperX}%` }}
        >
          <div className="text-3xl drop-shadow-md">🧤</div>
          <span className="text-[9px] bg-amber-500 text-slate-950 px-1 font-bold rounded">GADYEN</span>
        </div>

        {/* Defenders (Levels 3+) */}
        {levelConfig.defenders > 0 && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 flex gap-12 pointer-events-none">
            <div className="text-2xl animate-pulse">👕</div>
            {levelConfig.defenders > 1 && <div className="text-2xl animate-pulse">👕</div>}
          </div>
        )}

        {/* Aim Target Cursor */}
        {!isShooting && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none text-red-500 animate-spin"
            style={{ left: `${aimX}%`, top: `${aimY}%` }}
          >
            <Target className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>
        )}

        {/* Football */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none transition-transform"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballPos.scale})`,
          }}
        >
          ⚽
        </div>

        {/* Shot Result Message */}
        {shotResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <span
              className={`text-3xl font-black uppercase tracking-wider px-6 py-2 rounded-2xl shadow-2xl ${
                shotResult === 'goal'
                  ? 'bg-emerald-500 text-slate-950 animate-bounce'
                  : 'bg-red-600 text-white animate-pulse'
              }`}
            >
              {shotResult === 'goal' ? 'GÒÒÒL ! 🔥' : shotResult === 'saved' ? 'BLOKE ! 🧤' : 'RATEDEVIYE !'}
            </span>
          </div>
        )}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🎉</h3>
            <p className="text-xs text-slate-300">Ou make {goals} gòl ! Nivo siperyè a ap pi rapid.</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Touch Controls for Aim and Shoot */}
      <div className="w-full space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Touche sou gòl la pou chwazi direksyon tir la</span>
          <span className="font-bold text-amber-400">Fòs: {power}%</span>
        </div>

        {/* Power Slider */}
        <input
          type="range"
          min="40"
          max="100"
          value={power}
          onChange={(e) => setPower(Number(e.target.value))}
          disabled={isShooting}
          className="w-full accent-amber-500 cursor-pointer"
        />

        {/* Shoot Button */}
        <button
          onClick={shootBall}
          disabled={isShooting || shotsLeft <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>TIRE BOUL LA ⚽</span>
        </button>
      </div>
    </div>
  );
};
