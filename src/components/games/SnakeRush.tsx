import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Trophy, RotateCcw, Volume2, VolumeX, Pause, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface SnakeRushProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;

export const SnakeRush: React.FC<SnakeRushProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [specialFood, setSpecialFood] = useState<Point | null>(null);
  const [dir, setDir] = useState<Direction>('RIGHT');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'level_win' | 'game_over' | 'completed'>('playing');

  const TARGETS = [100, 150, 200, 250, 300];
  const targetScore = TARGETS[level - 1] || 350;

  // Obstacles per level
  const obstacles = React.useMemo(() => {
    const obs: Point[] = [];
    if (level >= 3) {
      // 4 pillar obstacles
      obs.push({ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 14, y: 5 }, { x: 14, y: 6 });
      obs.push({ x: 5, y: 14 }, { x: 5, y: 13 }, { x: 14, y: 14 }, { x: 14, y: 13 });
    }
    if (level >= 4) {
      // Cross center
      obs.push({ x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 14 }, { x: 10, y: 15 });
    }
    if (level >= 5) {
      obs.push({ x: 4, y: 10 }, { x: 5, y: 10 }, { x: 14, y: 10 }, { x: 15, y: 10 });
    }
    return obs;
  }, [level]);

  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random food not on snake or obstacles
  const generateFood = useCallback((currentSnake: Point[], currentObstacles: Point[]): Point => {
    const occupied = new Set<string>();
    currentSnake.forEach((p) => occupied.add(`${p.x},${p.y}`));
    currentObstacles.forEach((p) => occupied.add(`${p.x},${p.y}`));

    const freeSlots: Point[] = [];
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          freeSlots.push({ x, y });
        }
      }
    }

    if (freeSlots.length === 0) return { x: 1, y: 1 };
    return freeSlots[Math.floor(Math.random() * freeSlots.length)];
  }, []);

  // Init level
  const initLevel = useCallback((lvl: number) => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(initialSnake);
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    setDir('RIGHT');
    setGameStatus('playing');

    const newFood = generateFood(initialSnake, obstacles);
    setFood(newFood);
    setSpecialFood(null);
  }, [generateFood, obstacles]);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cur = dirRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && cur !== 'DOWN') {
        nextDirRef.current = 'UP';
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && cur !== 'UP') {
        nextDirRef.current = 'DOWN';
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && cur !== 'RIGHT') {
        nextDirRef.current = 'LEFT';
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && cur !== 'LEFT') {
        nextDirRef.current = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Change direction safely
  const changeDirection = (newDir: Direction) => {
    const cur = dirRef.current;
    if (newDir === 'UP' && cur !== 'DOWN') nextDirRef.current = 'UP';
    if (newDir === 'DOWN' && cur !== 'UP') nextDirRef.current = 'DOWN';
    if (newDir === 'LEFT' && cur !== 'RIGHT') nextDirRef.current = 'LEFT';
    if (newDir === 'RIGHT' && cur !== 'LEFT') nextDirRef.current = 'RIGHT';
  };

  // Main game tick
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused) return;

    // Speed increases with level and snake length
    const speed = Math.max(90, 160 - level * 10 - Math.min(snake.length * 2, 40));

    gameLoopRef.current = setInterval(() => {
      dirRef.current = nextDirRef.current;
      setDir(nextDirRef.current);

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (nextDirRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // 1. Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          gameAudio.play('hit');
          gameAudio.play('lose');
          setGameStatus('game_over');
          return prevSnake;
        }

        // 2. Check obstacle collision
        if (obstacles.some((obs) => obs.x === head.x && obs.y === head.y)) {
          gameAudio.play('hit');
          gameAudio.play('lose');
          setGameStatus('game_over');
          return prevSnake;
        }

        // 3. Check self collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          gameAudio.play('hit');
          gameAudio.play('lose');
          setGameStatus('game_over');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // 4. Check eating food
        if (head.x === food.x && head.y === food.y) {
          gameAudio.play('eat');
          const newScore = score + 10;
          setScore(newScore);

          // Check win condition
          if (newScore >= targetScore) {
            gameAudio.play('win');
            if (level >= 5) {
              setGameStatus('completed');
              onGameOver(newScore, 0, 5);
            } else {
              setGameStatus('level_win');
            }
          }

          setFood(generateFood(newSnake, obstacles));

          // 25% chance of spawning special food if not present
          if (!specialFood && Math.random() < 0.3) {
            setSpecialFood(generateFood(newSnake, obstacles));
          }
        } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
          gameAudio.play('coin');
          const newScore = score + 25;
          setScore(newScore);
          setSpecialFood(null);

          if (newScore >= targetScore) {
            gameAudio.play('win');
            if (level >= 5) {
              setGameStatus('completed');
              onGameOver(newScore, 0, 5);
            } else {
              setGameStatus('level_win');
            }
          }
        } else {
          // Remove tail if no food eaten
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [food, gameStatus, generateFood, isPaused, level, obstacles, onGameOver, score, snake.length, specialFood, targetScore]);

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-20">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">SNAKE RUSH</h1>
            <p className="text-xs text-slate-400">Nivo {level} / 5</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Sound Toggle"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
            >
              Kite
            </button>
          )}
        </div>
      </div>

      {/* Info Dashboard */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Longè Koulèv</span>
          <span className="text-lg font-black text-emerald-400">{snake.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Objektif Nòt</span>
          <span className="text-lg font-black text-blue-400">{targetScore}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt Total</span>
          <span className="text-lg font-black text-amber-400 flex items-center gap-1">
            <Trophy className="w-4 h-4" /> {score}
          </span>
        </div>
      </div>

      {/* Snake Arena Board (20x20 grid) */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 border-4 border-slate-800 rounded-3xl p-2 shadow-2xl overflow-hidden">
        <div
          className="w-full h-full grid bg-slate-950 rounded-2xl relative overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {/* Obstacles */}
          {obstacles.map((obs, idx) => (
            <div
              key={`obs-${idx}`}
              style={{
                gridColumnStart: obs.x + 1,
                gridRowStart: obs.y + 1,
              }}
              className="bg-slate-700 rounded-sm border border-slate-600 shadow-inner"
            />
          ))}

          {/* Normal Food */}
          <div
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
            }}
            className="flex items-center justify-center text-xs animate-bounce"
          >
            🍎
          </div>

          {/* Special Food */}
          {specialFood && (
            <div
              style={{
                gridColumnStart: specialFood.x + 1,
                gridRowStart: specialFood.y + 1,
              }}
              className="flex items-center justify-center text-xs animate-pulse"
            >
              ⭐
            </div>
          )}

          {/* Snake Segments */}
          {snake.map((segment, idx) => {
            const isHead = idx === 0;
            return (
              <div
                key={`snake-${idx}`}
                style={{
                  gridColumnStart: segment.x + 1,
                  gridRowStart: segment.y + 1,
                }}
                className={`rounded-[3px] transition-all duration-75 flex items-center justify-center ${
                  isHead
                    ? 'bg-emerald-400 ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/50 z-10'
                    : 'bg-emerald-600 border border-emerald-500/40'
                }`}
              >
                {isHead && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile D-Pad Controls */}
      <div className="w-full max-w-xs mt-3 flex flex-col items-center gap-1.5">
        <button
          onClick={() => changeDirection('UP')}
          className="w-16 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 text-slate-200 shadow-lg"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="w-16 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 text-slate-200 shadow-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="w-16 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 text-slate-200 shadow-lg"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="w-16 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center active:bg-emerald-600 active:scale-95 text-slate-200 shadow-lg"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Win Level Modal */}
      {gameStatus === 'level_win' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Bèl travay! Koulèv la vin pi long!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou rive nan nòt objektif nivo {level} la!</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Longè koulèv:</span>
                <span className="font-bold text-emerald-400">{snake.length} segman</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Nòt Total:</span>
                <span className="font-bold text-white text-sm">{score} pwen</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLevel((l) => l + 1)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110"
              >
                Nivo Ki Vin Apre ❯
              </button>
              <button
                onClick={() => initLevel(level)}
                className="w-full py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700"
              >
                Rejwe nivo sa a
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameStatus === 'game_over' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black text-red-400 mb-1">Jwèt fini!</h2>
            <p className="text-xs text-slate-300 mb-4">Koulèv la frape yon miray oswa pwòp kò li.</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 text-xs">
              <span className="text-slate-400">Nòt ou fè: </span>
              <span className="text-amber-400 font-black text-sm">{score} pwen</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => initLevel(level)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-lg"
              >
                Eseye Ankò
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Kite Jwèt La
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SnakeRush;
