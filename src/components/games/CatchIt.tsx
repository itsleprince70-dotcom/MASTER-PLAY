import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingBasket, Trophy, Heart, RotateCcw, Volume2, VolumeX, Pause, Play, Sparkles, Bomb, ArrowLeft, ArrowRight } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface CatchItProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface FallingItem {
  id: number;
  type: 'normal' | 'special' | 'rare' | 'hazard';
  x: number;
  y: number;
  speed: number;
  icon: string;
  points: number;
  radius: number;
}

export const CatchIt: React.FC<CatchItProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [itemsCaught, setItemsCaught] = useState(0);
  const [targetItemsNeeded, setTargetItemsNeeded] = useState(12);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'level_win' | 'game_over' | 'completed'>('playing');

  // Basket position (0 to 400)
  const [basketX, setBasketX] = useState(200);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const lastSpawnRef = useRef<number>(Date.now());
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Init level
  const initLevel = useCallback((lvl: number) => {
    const target = 10 + lvl * 2;
    setTargetItemsNeeded(target);
    setItemsCaught(0);
    setLives(3);
    setTimeLeft(45);
    setBasketX(200);
    itemsRef.current = [];
    setGameStatus('playing');
    lastSpawnRef.current = Date.now();
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Check if target reached
          if (itemsCaught >= targetItemsNeeded) {
            handleWin();
          } else {
            setGameStatus('game_over');
            gameAudio.play('lose');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isPaused, itemsCaught, targetItemsNeeded]);

  const handleWin = () => {
    const bonus = 100 + lives * 15;
    setScore((s) => s + bonus);
    gameAudio.play('win');
    if (level >= 10) {
      setGameStatus('completed');
      onGameOver(score + bonus, 0, 10);
    } else {
      setGameStatus('level_win');
    }
  };

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (gameStatus === 'playing' && !isPaused) {
        // Move basket with keys
        setBasketX((bx) => {
          let nx = bx;
          if (keysRef.current.left) nx -= 6;
          if (keysRef.current.right) nx += 6;
          return Math.max(35, Math.min(canvas.width - 35, nx));
        });

        // Spawn items
        const now = Date.now();
        const interval = Math.max(450, 1000 - level * 50);
        if (now - lastSpawnRef.current > interval) {
          lastSpawnRef.current = now;
          const rand = Math.random();
          let itemType: 'normal' | 'special' | 'rare' | 'hazard' = 'normal';
          let icon = '🍎';
          let points = 10;

          // Hazard probability increases with level
          const hazardChance = 0.2 + level * 0.02;
          if (rand < hazardChance) {
            itemType = 'hazard';
            icon = '💣';
            points = -20;
          } else if (rand > 0.85 && level >= 4) {
            itemType = 'rare';
            icon = '👑';
            points = 50;
          } else if (rand > 0.65 && level >= 2) {
            itemType = 'special';
            icon = '⭐';
            points = 25;
          } else {
            const fruits = ['🍎', '🍌', '🍇', '🍉', '🍓'];
            icon = fruits[Math.floor(Math.random() * fruits.length)];
          }

          itemsRef.current.push({
            id: Math.random(),
            type: itemType,
            x: Math.random() * (canvas.width - 60) + 30,
            y: -20,
            speed: 2.5 + level * 0.35 + Math.random() * 1.2,
            icon,
            points,
            radius: 16,
          });
        }

        // Update items position
        itemsRef.current.forEach((it) => {
          it.y += it.speed;
        });

        // Collision with basket
        const basketY = canvas.height - 40;
        const basketW = 60;
        const curBasketX = basketX;

        for (let i = 0; i < itemsRef.current.length; i++) {
          const it = itemsRef.current[i];
          if (
            it.y >= basketY - 15 &&
            it.y <= basketY + 15 &&
            it.x >= curBasketX - basketW / 2 &&
            it.x <= curBasketX + basketW / 2
          ) {
            // Caught!
            itemsRef.current.splice(i, 1);
            if (it.type === 'hazard') {
              gameAudio.play('hit');
              setScore((s) => Math.max(0, s - 20));
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setGameStatus('game_over');
                  gameAudio.play('lose');
                }
                return nextLives;
              });
            } else {
              gameAudio.play('coin');
              setScore((s) => s + it.points);
              setItemsCaught((ic) => {
                const newCount = ic + 1;
                if (newCount >= targetItemsNeeded) {
                  handleWin();
                }
                return newCount;
              });
            }
            break;
          }
        }

        // Remove missed items
        itemsRef.current = itemsRef.current.filter((it) => it.y < canvas.height + 30);
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Playful background garden gradient
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, '#064e3b');
      bg.addColorStop(1, '#022c22');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sunrays / soft light
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * 80, 0, 40, canvas.height);
      }

      // Draw Falling Items
      itemsRef.current.forEach((it) => {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.icon, it.x, it.y);

        // Glow ring around rare/special items
        if (it.type === 'rare' || it.type === 'special') {
          ctx.strokeStyle = it.type === 'rare' ? '#f59e0b' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(it.x, it.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw Basket at bottom
      const basketY = canvas.height - 40;
      const bW = 60;
      const bH = 24;

      ctx.save();
      ctx.translate(basketX, basketY);

      // Basket wood gradient
      const bGrad = ctx.createLinearGradient(0, -bH / 2, 0, bH / 2);
      bGrad.addColorStop(0, '#d97706');
      bGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = bGrad;

      // Rounded basket shape
      ctx.beginPath();
      ctx.roundRect(-bW / 2, -bH / 2, bW, bH, [4, 4, 12, 12]);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Weave pattern lines
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      for (let x = -bW / 2 + 10; x < bW / 2; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, -bH / 2);
        ctx.lineTo(x, bH / 2);
        ctx.stroke();
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [basketX, gameStatus, isPaused, level, targetItemsNeeded]);

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
            <ShoppingBasket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">CATCH IT!</h1>
            <p className="text-xs text-slate-400">Nivo {level} / 10</p>
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
      <div className="w-full max-w-md grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Tan Rete</span>
          <span className="text-base font-black text-amber-400">{timeLeft}s</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Objè Trape</span>
          <span className="text-base font-black text-cyan-400">
            {itemsCaught}/{targetItemsNeeded}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Lavi</span>
          <div className="flex gap-1 mt-0.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3.5 h-3.5 ${idx < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt</span>
          <span className="text-base font-black text-emerald-400">{score}</span>
        </div>
      </div>

      {/* Canvas Catch Arena */}
      <div className="relative w-full max-w-md aspect-[4/5] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        <canvas ref={canvasRef} width={400} height={500} className="w-full h-full object-contain" />
      </div>

      {/* Touch Left / Right Controls */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={() => setBasketX((bx) => Math.max(35, bx - 35))}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-emerald-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-emerald-400" />
          <span className="text-sm">Agoch</span>
        </button>
        <button
          onClick={() => setBasketX((bx) => Math.min(365, bx + 35))}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-emerald-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <span className="text-sm">Adwat</span>
          <ArrowRight className="w-6 h-6 text-emerald-400" />
        </button>
      </div>

      {/* Win Level Modal */}
      {gameStatus === 'level_win' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Ekselan! Ou trape bon objè yo!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou ranpli panyen an avèk siksè nan nivo {level}!</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Bonis fini nivo:</span>
                <span className="font-bold text-emerald-400">+100 pwen</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lavi rete ({lives}):</span>
                <span className="font-bold text-amber-400">+{lives * 15} pwen</span>
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
            <h2 className="text-xl font-black text-red-400 mb-1">Ou rate twòp objè!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou pa trape ase bon fwi oswa bonm yo touche w.</p>
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
export default CatchIt;
