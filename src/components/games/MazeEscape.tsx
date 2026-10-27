import React, { useState, useEffect } from 'react';
import { Trophy, Clock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const MazeEscape: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [playerPos, setPlayerPos] = useState({ r: 1, c: 1 });
  const [stars, setStars] = useState<{ r: number; c: number }[]>([]);
  const [starsCollected, setStarsCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [levelSuccess, setLevelSuccess] = useState(false);
  const [maze, setMaze] = useState<number[][]>([]);

  const levelConfig = {
    1: { name: 'Nivo 1 : Labirent Kout', size: 7, timeLimit: 30 },
    2: { name: 'Nivo 2 : Vire & Fo Chemen', size: 9, timeLimit: 35 },
    3: { name: 'Nivo 3 : Labirent Laj', size: 9, timeLimit: 30 },
    4: { name: 'Nivo 4 : Obstak & Pyèj', size: 11, timeLimit: 35 },
    5: { name: 'Nivo 5 : Vitès & Presyon', size: 11, timeLimit: 25 },
    6: { name: 'Nivo 6 : Gran Labirent Final', size: 13, timeLimit: 30 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', size: 7, timeLimit: 30 };

  useEffect(() => {
    generateMazeForLevel(level);
  }, [level]);

  // Timer
  useEffect(() => {
    if (levelSuccess) return;
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
  }, [level, levelSuccess]);

  const generateMazeForLevel = (lvl: number) => {
    const size = levelConfig.size;
    // 1 = wall, 0 = path
    const m = Array(size).fill(null).map(() => Array(size).fill(1));

    // Simple prim's / recursive division carving
    for (let r = 1; r < size - 1; r++) {
      for (let c = 1; c < size - 1; c++) {
        if (r % 2 === 1 || c % 2 === 1) {
          m[r][c] = 0;
        }
      }
    }

    // Add some random walls for higher levels
    if (lvl >= 2) {
      for (let i = 0; i < lvl * 2; i++) {
        const wr = Math.floor(Math.random() * (size - 2)) + 1;
        const wc = Math.floor(Math.random() * (size - 2)) + 1;
        if (!(wr === 1 && wc === 1) && !(wr === size - 2 && wc === size - 2)) {
          m[wr][wc] = 1;
        }
      }
    }

    // Clear start and exit
    m[1][1] = 0;
    m[size - 2][size - 2] = 0;
    m[size - 2][size - 3] = 0;
    m[size - 3][size - 2] = 0;

    setMaze(m);
    setPlayerPos({ r: 1, c: 1 });

    // Place collectible stars
    const newStars = [
      { r: 1, c: size - 2 },
      { r: size - 2, c: 1 },
      { r: Math.floor(size / 2), c: Math.floor(size / 2) }
    ].filter(s => m[s.r] && m[s.r][s.c] === 0);

    setStars(newStars);
    setStarsCollected(0);
    setTimeLeft(levelConfig.timeLimit);
    setLevelSuccess(false);
  };

  const movePlayer = (dr: number, dc: number) => {
    if (levelSuccess || maze.length === 0) return;
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    if (nr < 0 || nr >= maze.length || nc < 0 || nc >= maze[0].length) return;
    if (maze[nr][nc] === 1) return; // Wall hit

    setPlayerPos({ r: nr, c: nc });

    // Check star collect
    const starIdx = stars.findIndex(s => s.r === nr && s.c === nc);
    if (starIdx !== -1) {
      setStars(stars.filter((_, i) => i !== starIdx));
      setStarsCollected(s => s + 1);
      setScore(s => s + 150);
    }

    // Check exit reach
    const exitR = maze.length - 2;
    const exitC = maze[0].length - 2;

    if (nr === exitR && nc === exitC) {
      setScore(s => s + 500 * level);
      if (level < 6) {
        setLevelSuccess(true);
      } else {
        onGameOver(score + 1500, 150, 6);
      }
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-teal-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-teal-400 text-sm">Maze Escape — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Zetwal ranmase: <strong className="text-amber-400">{starsCollected}</strong> • Nòt: {score} pts
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className={`font-black tabular-nums text-sm ${timeLeft < 8 ? 'text-red-400 animate-pulse' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Maze Grid Canvas */}
      <div className="relative w-full my-3 p-3 bg-slate-900 rounded-2xl border-2 border-teal-600 flex flex-col items-center justify-center">
        <div
          className="grid gap-1 bg-slate-950 p-2 rounded-xl"
          style={{ gridTemplateColumns: `repeat(${maze[0]?.length || 7}, minmax(0, 1fr))` }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPos.r === r && playerPos.c === c;
              const isExit = r === maze.length - 2 && c === maze[0].length - 2;
              const hasStar = stars.some(s => s.r === r && s.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm flex items-center justify-center text-xs font-bold transition-all ${
                    cell === 1
                      ? 'bg-slate-800 border border-slate-700/80 shadow-inner'
                      : isPlayer
                      ? 'bg-teal-500 text-slate-950 font-black shadow-lg scale-105'
                      : isExit
                      ? 'bg-amber-500/30 border border-amber-400 animate-pulse'
                      : 'bg-slate-900'
                  }`}
                >
                  {isPlayer ? '🏃' : isExit ? '🚪' : hasStar ? '⭐' : ''}
                </div>
              );
            })
          )}
        </div>

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3 rounded-2xl">
            <Trophy className="w-12 h-12 text-teal-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🌀</h3>
            <p className="text-xs text-slate-300">Ou jwenn sòti a anvan tan an fini !</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* D-Pad Arrow Controls for touch screens */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <button
          onClick={() => movePlayer(-1, 0)}
          className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white flex items-center justify-center shadow-md active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => movePlayer(0, -1)}
            className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white flex items-center justify-center shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white flex items-center justify-center shadow-md active:scale-95"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => movePlayer(0, 1)}
            className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-teal-600 text-white flex items-center justify-center shadow-md active:scale-95"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
