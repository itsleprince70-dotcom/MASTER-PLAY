import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Heart, RotateCcw, Volume2, VolumeX, Pause, Play, ArrowLeft, ArrowRight, ArrowUp, Flag, Sparkles } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface CoinJumperProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  vx?: number;
  minX?: number;
  maxX?: number;
}

interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'bonus';
  collected: boolean;
}

export const CoinJumper: React.FC<CoinJumperProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [coinsCount, setCoinsCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'level_win' | 'game_over' | 'completed'>('playing');

  // Player physics state
  const playerRef = useRef({
    x: 40,
    y: 280,
    vx: 0,
    vy: 0,
    width: 20,
    height: 28,
    isGrounded: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  const spikesRef = useRef<Spike[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const flagRef = useRef<{ x: number; y: number }>({ x: 580, y: 120 });
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({ left: false, right: false, jump: false });

  // Init Level
  const initLevel = useCallback((lvl: number) => {
    playerRef.current = {
      x: 40,
      y: 280,
      vx: 0,
      vy: 0,
      width: 20,
      height: 28,
      isGrounded: false,
    };
    setLives(3);
    setCoinsCount(0);
    setGameStatus('playing');

    // Create Level Geometry (Canvas 640x360)
    const newPlatforms: Platform[] = [
      // Starting ground
      { x: 0, y: 320, width: 140, height: 40 },
    ];
    const newSpikes: Spike[] = [];
    const newCoins: Coin[] = [];

    if (lvl === 1) {
      newPlatforms.push(
        { x: 180, y: 280, width: 100, height: 20 },
        { x: 320, y: 240, width: 100, height: 20 },
        { x: 460, y: 200, width: 120, height: 20 },
        { x: 560, y: 160, width: 80, height: 20 }
      );
      flagRef.current = { x: 600, y: 130 };
      newCoins.push(
        { id: 1, x: 230, y: 250, type: 'normal', collected: false },
        { id: 2, x: 370, y: 210, type: 'normal', collected: false },
        { id: 3, x: 500, y: 170, type: 'bonus', collected: false }
      );
    } else if (lvl === 2) {
      newPlatforms.push(
        { x: 160, y: 290, width: 80, height: 20 },
        { x: 280, y: 250, width: 80, height: 20 },
        { x: 400, y: 210, width: 80, height: 20 },
        { x: 520, y: 170, width: 120, height: 20 }
      );
      newSpikes.push({ x: 240, y: 345, width: 40, height: 15 });
      flagRef.current = { x: 590, y: 140 };
      newCoins.push(
        { id: 1, x: 200, y: 260, type: 'normal', collected: false },
        { id: 2, x: 320, y: 220, type: 'normal', collected: false },
        { id: 3, x: 440, y: 180, type: 'normal', collected: false },
        { id: 4, x: 550, y: 140, type: 'bonus', collected: false }
      );
    } else if (lvl <= 5) {
      // Moving platform levels
      newPlatforms.push(
        { x: 160, y: 270, width: 70, height: 16, vx: 1.2, minX: 150, maxX: 260 },
        { x: 300, y: 220, width: 80, height: 20 },
        { x: 420, y: 180, width: 70, height: 16, vx: -1.2, minX: 400, maxX: 500 },
        { x: 540, y: 140, width: 100, height: 20 }
      );
      newSpikes.push(
        { x: 230, y: 345, width: 70, height: 15 },
        { x: 370, y: 345, width: 50, height: 15 }
      );
      flagRef.current = { x: 600, y: 110 };
      newCoins.push(
        { id: 1, x: 200, y: 240, type: 'normal', collected: false },
        { id: 2, x: 340, y: 190, type: 'bonus', collected: false },
        { id: 3, x: 450, y: 150, type: 'normal', collected: false }
      );
    } else {
      // Advanced levels (6-10)
      newPlatforms.push(
        { x: 150, y: 280, width: 60, height: 16 },
        { x: 250, y: 240, width: 65, height: 16, vx: 1.5, minX: 230, maxX: 330 },
        { x: 360, y: 200, width: 60, height: 16 },
        { x: 450, y: 160, width: 65, height: 16, vx: -1.5, minX: 430, maxX: 520 },
        { x: 550, y: 120, width: 90, height: 20 }
      );
      newSpikes.push(
        { x: 140, y: 345, width: 400, height: 15 }, // Large spike pit
        { x: 375, y: 185, width: 30, height: 15 } // Spike on platform!
      );
      flagRef.current = { x: 600, y: 90 };
      newCoins.push(
        { id: 1, x: 180, y: 250, type: 'normal', collected: false },
        { id: 2, x: 280, y: 210, type: 'bonus', collected: false },
        { id: 3, x: 390, y: 170, type: 'normal', collected: false },
        { id: 4, x: 480, y: 130, type: 'bonus', collected: false }
      );
    }

    platformsRef.current = newPlatforms;
    spikesRef.current = newSpikes;
    coinsRef.current = newCoins;
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (playerRef.current.isGrounded) {
          playerRef.current.vy = -9.2;
          playerRef.current.isGrounded = false;
          gameAudio.play('jump');
        }
      }
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

  // Jump trigger helper
  const handleJump = () => {
    if (playerRef.current.isGrounded && gameStatus === 'playing' && !isPaused) {
      playerRef.current.vy = -9.2;
      playerRef.current.isGrounded = false;
      gameAudio.play('jump');
    }
  };

  // Lose a life & respawn
  const handlePlayerDeath = () => {
    gameAudio.play('hit');
    setLives((l) => {
      const nextL = l - 1;
      if (nextL <= 0) {
        setGameStatus('game_over');
        gameAudio.play('lose');
      } else {
        // Respawn at starting position
        playerRef.current = {
          x: 40,
          y: 280,
          vx: 0,
          vy: 0,
          width: 20,
          height: 28,
          isGrounded: false,
        };
      }
      return nextL;
    });
  };

  // Main platformer physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (gameStatus === 'playing' && !isPaused) {
        const p = playerRef.current;

        // Move moving platforms
        platformsRef.current.forEach((plat) => {
          if (plat.vx) {
            plat.x += plat.vx;
            if (plat.minX && plat.maxX) {
              if (plat.x <= plat.minX || plat.x >= plat.maxX) {
                plat.vx = -plat.vx;
              }
            }
          }
        });

        // Horizontal velocity
        if (keysRef.current.left) p.vx = -3.8;
        else if (keysRef.current.right) p.vx = 3.8;
        else p.vx *= 0.7; // friction

        // Apply gravity
        p.vy += 0.45;
        if (p.vy > 9) p.vy = 9; // Terminal velocity

        // Update positions
        p.x += p.vx;
        p.y += p.vy;

        // Screen horizontal boundaries
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > canvas.width) p.x = canvas.width - p.width;

        // Platform collision
        p.isGrounded = false;
        for (const plat of platformsRef.current) {
          // Landing on top of platform
          if (
            p.x + p.width > plat.x &&
            p.x < plat.x + plat.width &&
            p.y + p.height >= plat.y &&
            p.y + p.height <= plat.y + 12 &&
            p.vy >= 0
          ) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
            // Carry horizontal movement of platform
            if (plat.vx) p.x += plat.vx;
            break;
          }
        }

        // Spike collision
        for (const sp of spikesRef.current) {
          if (
            p.x + p.width > sp.x &&
            p.x < sp.x + sp.width &&
            p.y + p.height > sp.y &&
            p.y < sp.y + sp.height
          ) {
            handlePlayerDeath();
            break;
          }
        }

        // Pitfall (fell off bottom)
        if (p.y > canvas.height + 20) {
          handlePlayerDeath();
        }

        // Coin collection
        for (const coin of coinsRef.current) {
          if (!coin.collected) {
            const dx = p.x + p.width / 2 - coin.x;
            const dy = p.y + p.height / 2 - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18) {
              coin.collected = true;
              gameAudio.play('coin');
              const pts = coin.type === 'bonus' ? 25 : 10;
              setScore((s) => s + pts);
              setCoinsCount((c) => c + 1);
            }
          }
        }

        // Flag reached (Finish Level)
        const flag = flagRef.current;
        if (
          p.x + p.width >= flag.x &&
          p.x <= flag.x + 30 &&
          p.y + p.height >= flag.y &&
          p.y <= flag.y + 40
        ) {
          // Level Completed!
          gameAudio.play('win');
          const winBonus = 100 + lives * 10;
          setScore((s) => s + winBonus);
          if (level >= 10) {
            setGameStatus('completed');
            onGameOver(score + winBonus, 0, 10);
          } else {
            setGameStatus('level_win');
          }
        }
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0c4a6e');
      skyGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(120, 80, 30, 0, Math.PI * 2);
      ctx.arc(150, 75, 40, 0, Math.PI * 2);
      ctx.arc(180, 80, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(420, 100, 25, 0, Math.PI * 2);
      ctx.arc(450, 95, 35, 0, Math.PI * 2);
      ctx.arc(480, 100, 25, 0, Math.PI * 2);
      ctx.fill();

      // Draw Platforms
      platformsRef.current.forEach((plat) => {
        // Platform top grass
        ctx.fillStyle = '#10b981';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
        // Platform stone body
        ctx.fillStyle = '#334155';
        ctx.fillRect(plat.x, plat.y + 5, plat.width, plat.height - 5);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
      });

      // Draw Spikes
      spikesRef.current.forEach((sp) => {
        ctx.fillStyle = '#ef4444';
        const numTeeth = Math.floor(sp.width / 12);
        for (let i = 0; i < numTeeth; i++) {
          const toothX = sp.x + i * 12;
          ctx.beginPath();
          ctx.moveTo(toothX, sp.y + sp.height);
          ctx.lineTo(toothX + 6, sp.y);
          ctx.lineTo(toothX + 12, sp.y + sp.height);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw Coins
      coinsRef.current.forEach((coin) => {
        if (!coin.collected) {
          ctx.fillStyle = coin.type === 'bonus' ? '#f59e0b' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sparkle inside coin
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', coin.x, coin.y);
        }
      });

      // Draw Finish Flag
      const flag = flagRef.current;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(flag.x, flag.y + 30);
      ctx.lineTo(flag.x, flag.y - 10);
      ctx.stroke();

      // Flag banner
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(flag.x, flag.y - 10);
      ctx.lineTo(flag.x + 22, flag.y);
      ctx.lineTo(flag.x, flag.y + 10);
      ctx.closePath();
      ctx.fill();

      // Draw Player Hero Character
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Hero Body (Blue and Gold)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 8, p.width, p.height - 8);

      // Hero Head / Helmet
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.width / 2, 7, 7, 0, Math.PI * 2);
      ctx.fill();

      // Visor eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.vx >= 0 ? 10 : 3, 5, 5, 3);

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameStatus, isPaused, level, lives, onGameOver, score]);

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-20">
      {/* Header Bar */}
      <div className="w-full max-w-lg flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">COIN JUMPER</h1>
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
      <div className="w-full max-w-lg grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Pyès Kolekte</span>
          <span className="text-base font-black text-amber-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> {coinsCount}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Lavi</span>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 ${idx < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt Total</span>
          <span className="text-base font-black text-emerald-400 flex items-center gap-1">
            <Trophy className="w-4 h-4" /> {score}
          </span>
        </div>
      </div>

      {/* Platformer Canvas */}
      <div className="relative w-full max-w-lg aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain" />
      </div>

      {/* Touch Left / Right + Big Jump Button */}
      <div className="w-full max-w-lg grid grid-cols-3 gap-3 mt-3">
        <button
          onMouseDown={() => (keysRef.current.left = true)}
          onMouseUp={() => (keysRef.current.left = false)}
          onTouchStart={() => (keysRef.current.left = true)}
          onTouchEnd={() => (keysRef.current.left = false)}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg select-none"
        >
          <ArrowLeft className="w-6 h-6 text-blue-400" />
          <span className="text-sm">Agoch</span>
        </button>

        <button
          onClick={handleJump}
          className="py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 select-none"
        >
          <ArrowUp className="w-6 h-6 font-black" />
          <span className="text-sm">SOTE</span>
        </button>

        <button
          onMouseDown={() => (keysRef.current.right = true)}
          onMouseUp={() => (keysRef.current.right = false)}
          onTouchStart={() => (keysRef.current.right = true)}
          onTouchEnd={() => (keysRef.current.right = false)}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg select-none"
        >
          <span className="text-sm">Adwat</span>
          <ArrowRight className="w-6 h-6 text-blue-400" />
        </button>
      </div>

      {/* Win Level Modal */}
      {gameStatus === 'level_win' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Bravo! Ou fini nivo a!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou rive nan drapo a avèk siksè nan nivo {level}!</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Bonis fini nivo:</span>
                <span className="font-bold text-emerald-400">+100 pwen</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lavi rete ({lives}):</span>
                <span className="font-bold text-amber-400">+{lives * 10} pwen</span>
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
            <h2 className="text-xl font-black text-red-400 mb-1">Ou tonbe!</h2>
            <p className="text-xs text-slate-300 mb-4">Tout lavi ou fini. Eseye ankò pou franchi platfòm yo.</p>
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
export default CoinJumper;
