import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, ArrowRight } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const PenaltyKing: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [penaltiesScored, setPenaltiesScored] = useState(0);
  const [penaltiesLeft, setPenaltiesLeft] = useState(5);
  const [targetCorner, setTargetCorner] = useState<'TL' | 'TR' | 'BL' | 'BR' | 'CTR'>('CTR');
  const [power, setPower] = useState(75);
  const [isKicking, setIsKicking] = useState(false);
  const [keeperDive, setKeeperDive] = useState<'TL' | 'TR' | 'BL' | 'BR' | 'CTR'>('CTR');
  const [kickResult, setKickResult] = useState<'goal' | 'saved' | 'miss' | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : Gardyen Dousman', targetGoals: 3, keeperAgility: 0.35, timeLimit: 25 },
    2: { name: 'Nivo 2 : Kouvri Espas', targetGoals: 3, keeperAgility: 0.5, timeLimit: 22 },
    3: { name: 'Nivo 3 : Presizyon Kwen', targetGoals: 4, keeperAgility: 0.65, timeLimit: 20 },
    4: { name: 'Nivo 4 : Presyon 11 Mèt', targetGoals: 4, keeperAgility: 0.75, timeLimit: 15 },
    5: { name: 'Nivo 5 : Gardyen Pwofesyonèl', targetGoals: 4, keeperAgility: 0.85, timeLimit: 14 },
    6: { name: 'Nivo 6 : Tir Pafè 5/5', targetGoals: 5, keeperAgility: 0.9, timeLimit: 12 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetGoals: 3, keeperAgility: 0.4, timeLimit: 25 };

  useEffect(() => {
    setTimeLeft(levelConfig.timeLimit);
  }, [level]);

  // Timer
  useEffect(() => {
    if (levelSuccess || penaltiesLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setTimeout(() => onGameOver(score, 0, level), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [level, levelSuccess, penaltiesLeft]);

  const shootPenalty = () => {
    if (isKicking || penaltiesLeft <= 0) return;
    setIsKicking(true);
    setKickResult(null);

    // Keeper dive decision
    const corners: ('TL' | 'TR' | 'BL' | 'BR' | 'CTR')[] = ['TL', 'TR', 'BL', 'BR', 'CTR'];
    const willGuessRight = Math.random() < levelConfig.keeperAgility;
    const dive = willGuessRight ? targetCorner : corners[Math.floor(Math.random() * corners.length)];
    setKeeperDive(dive);

    setTimeout(() => {
      let res: 'goal' | 'saved' | 'miss' = 'goal';

      // Too much power can miss
      if (power > 95 && Math.random() < 0.3) {
        res = 'miss';
      } else if (dive === targetCorner) {
        // Keeper guessed corner, check power
        if (power > 80 && (targetCorner === 'TL' || targetCorner === 'TR')) {
          res = 'goal'; // Top corner power strike beats diving keeper!
        } else {
          res = 'saved';
        }
      } else {
        res = 'goal';
      }

      setKickResult(res);
      const newScored = res === 'goal' ? penaltiesScored + 1 : penaltiesScored;
      if (res === 'goal') {
        setPenaltiesScored(newScored);
        setScore(s => s + 200 * level);
      }

      const remaining = penaltiesLeft - 1;
      setPenaltiesLeft(remaining);

      setTimeout(() => {
        setIsKicking(false);
        setKickResult(null);
        setKeeperDive('CTR');

        if (newScored >= levelConfig.targetGoals) {
          if (level < 6) {
            setLevelSuccess(true);
          } else {
            onGameOver(score + 1800, 150, 6);
          }
        } else if (remaining <= 0) {
          onGameOver(score, 0, level);
        }
      }, 1200);
    }, 600);
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setPenaltiesScored(0);
    setPenaltiesLeft(5);
    setLevelSuccess(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-yellow-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-amber-400 text-sm">Penalty King — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Penalti make: <strong className="text-emerald-400">{penaltiesScored} / {levelConfig.targetGoals}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-bold tabular-nums">{timeLeft}s</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400">Tir ki rete</span>
            <div className="font-black text-amber-400 text-sm tabular-nums">{penaltiesLeft}</div>
          </div>
        </div>
      </div>

      {/* Penalty Shootout View */}
      <div className="relative w-full h-80 my-3 rounded-2xl overflow-hidden border-2 border-yellow-600 bg-gradient-to-b from-slate-900 via-green-950 to-emerald-900 flex flex-col items-center justify-between p-4 shadow-inner">
        {/* Goal Post Frame */}
        <div className="relative w-72 h-36 border-4 border-white bg-slate-950/60 rounded-t-xl shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Net grid */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />

          {/* Target Corners Selection Buttons */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 p-2 gap-2 z-10">
            {[
              { id: 'TL', label: '↖ Wò / Goch' },
              { id: 'CTR', label: '⬆ Sant' },
              { id: 'TR', label: '↗ Wò / Dwa' },
              { id: 'BL', label: '↙ Ba / Goch' },
              { id: 'CTR', label: '⬇ Ba / Sant' },
              { id: 'BR', label: '↘ Ba / Dwa' },
            ].map((btn, idx) => {
              const cornerKey = btn.id as any;
              const isSelected = targetCorner === cornerKey;
              return (
                <button
                  key={idx}
                  onClick={() => !isKicking && setTargetCorner(cornerKey)}
                  className={`rounded-lg border text-[10px] font-bold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-500/40 border-amber-400 text-amber-300 scale-105'
                      : 'border-white/20 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Goalkeeper Sprite with diving transformation */}
          <div
            className={`absolute text-4xl transition-all duration-300 pointer-events-none drop-shadow-2xl ${
              keeperDive === 'TL'
                ? 'top-2 left-6 -rotate-45'
                : keeperDive === 'TR'
                ? 'top-2 right-6 rotate-45'
                : keeperDive === 'BL'
                ? 'bottom-2 left-8 -rotate-90'
                : keeperDive === 'BR'
                ? 'bottom-2 right-8 rotate-90'
                : 'top-10 left-1/2 -translate-x-1/2'
            }`}
          >
            🧤
          </div>
        </div>

        {/* Penalty Spot & Ball */}
        <div className="relative flex flex-col items-center">
          <div
            className={`text-4xl transition-all duration-300 ${
              isKicking ? '-translate-y-24 scale-75' : ''
            }`}
          >
            ⚽
          </div>
          <div className="w-3 h-1 bg-white/70 rounded-full mt-1" />
        </div>

        {/* Shot Result Message */}
        {kickResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <span
              className={`text-3xl font-black uppercase px-6 py-2 rounded-2xl shadow-2xl ${
                kickResult === 'goal'
                  ? 'bg-emerald-500 text-slate-950 animate-bounce'
                  : kickResult === 'saved'
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {kickResult === 'goal' ? 'GÒÒÒL ! ⚽🔥' : kickResult === 'saved' ? 'GARDYEN AN BLOKE L !' : 'TIR DEVIYE !'}
            </span>
          </div>
        )}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🏆</h3>
            <p className="text-xs text-slate-300">Ou se yon vre wa penalti !</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-2.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Fòs frap la:</span>
          <span className="font-bold text-amber-400">{power}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          value={power}
          onChange={(e) => setPower(Number(e.target.value))}
          disabled={isKicking}
          className="w-full accent-amber-500"
        />

        <button
          onClick={shootPenalty}
          disabled={isKicking || penaltiesLeft <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50"
        >
          TIRE PENALTI A ⚽
        </button>
      </div>
    </div>
  );
};
