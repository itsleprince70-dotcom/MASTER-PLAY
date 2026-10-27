import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rocket, Shield, Trophy, RotateCcw, Volume2, VolumeX, Pause, Play, Sparkles, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface MeteorSurvivorProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface Meteor {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  vx: number;
  color: string;
}

interface BonusStar {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
}

export const MeteorSurvivor: React.FC<MeteorSurvivorProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(35); // 35s per level to survive
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'level_win' | 'game_over' | 'completed'>('playing');

  // Player spaceship position
  const [playerX, setPlayerX] = useState(200); // 0 to 400
  const [invincible, setInvincible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const meteorsRef = useRef<Meteor[]>([]);
  const starsRef = useRef<BonusStar[]>([]);
  const lastSpawnRef = useRef<number>(Date.now());
  const lastStarSpawnRef = useRef<number>(Date.now());
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Init level
  const initLevel = useCallback((lvl: number) => {
    setTimeLeft(30 + lvl * 2);
    setLives(3);
    setPlayerX(200);
    setInvincible(false);
    meteorsRef.current = [];
    starsRef.current = [];
    setGameStatus('playing');
    lastSpawnRef.current = Date.now();
    lastStarSpawnRef.current = Date.now();
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
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
          // Level Completed!
          const waveBonus = 50;
          setScore((s) => s + waveBonus);
          gameAudio.play('win');
          if (level >= 10) {
            setGameStatus('completed');
            onGameOver(score + waveBonus, 0, 10);
          } else {
            setGameStatus('level_win');
          }
          return 0;
        }
        // Points for surviving every second
        if (prev % 5 === 0) {
          setScore((s) => s + 10);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isPaused, level, onGameOver, score]);

  // Main game animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (gameStatus === 'playing' && !isPaused) {
        // Move player based on keys
        setPlayerX((px) => {
          let nx = px;
          if (keysRef.current.left) nx -= 6;
          if (keysRef.current.right) nx += 6;
          return Math.max(20, Math.min(380, nx));
        });

        const now = Date.now();
        // Spawn meteors based on level
        const spawnInterval = Math.max(300, 1100 - level * 75);
        if (now - lastSpawnRef.current > spawnInterval) {
          lastSpawnRef.current = now;
          const radius = Math.floor(Math.random() * 16) + 12; // 12-28px
          const speed = 2.2 + level * 0.4 + Math.random() * 1.5;
          const vx = level >= 5 ? (Math.random() * 2 - 1) * (level * 0.2) : 0;
          meteorsRef.current.push({
            id: Math.random(),
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            radius,
            speed,
            vx,
            color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
          });
        }

        // Spawn bonus stars
        if (now - lastStarSpawnRef.current > 3500) {
          lastStarSpawnRef.current = now;
          starsRef.current.push({
            id: Math.random(),
            x: Math.random() * (canvas.width - 40) + 20,
            y: -20,
            radius: 10,
            speed: 2.5,
          });
        }

        // Update meteors
        meteorsRef.current.forEach((m) => {
          m.y += m.speed;
          m.x += m.vx;
        });
        meteorsRef.current = meteorsRef.current.filter((m) => m.y < canvas.height + 40);

        // Update bonus stars
        starsRef.current.forEach((s) => {
          s.y += s.speed;
        });
        starsRef.current = starsRef.current.filter((s) => s.y < canvas.height + 30);

        // Collision detection
        const shipY = canvas.height - 45;
        const currentPx = playerX;

        // Meteor collisions
        if (!invincible) {
          for (let i = 0; i < meteorsRef.current.length; i++) {
            const m = meteorsRef.current[i];
            const dx = m.x - currentPx;
            const dy = m.y - shipY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < m.radius + 16) {
              // Hit!
              meteorsRef.current.splice(i, 1);
              gameAudio.play('hit');
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  setGameStatus('game_over');
                  gameAudio.play('lose');
                } else {
                  // Temporary invincibility
                  setInvincible(true);
                  setTimeout(() => setInvincible(false), 1500);
                }
                return nextLives;
              });
              break;
            }
          }
        }

        // Star collections
        for (let i = 0; i < starsRef.current.length; i++) {
          const s = starsRef.current[i];
          const dx = s.x - currentPx;
          const dy = s.y - shipY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < s.radius + 18) {
            starsRef.current.splice(i, 1);
            gameAudio.play('coin');
            setScore((sc) => sc + 25);
            break;
          }
        }
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant stars background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 47) % canvas.width);
        const sy = ((i * 73 + Date.now() * 0.05) % canvas.height);
        ctx.fillRect(sx, sy, (i % 3 === 0) ? 2 : 1, (i % 3 === 0) ? 2 : 1);
      }

      // Draw Bonus Stars
      starsRef.current.forEach((s) => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Meteors
      meteorsRef.current.forEach((m) => {
        ctx.save();
        ctx.translate(m.x, m.y);

        // Meteor Trail Flame
        const flameGrad = ctx.createLinearGradient(0, -m.radius * 2, 0, 0);
        flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        flameGrad.addColorStop(1, 'rgba(249, 115, 22, 0.6)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.7, 0);
        ctx.lineTo(0, -m.radius * 2);
        ctx.lineTo(m.radius * 0.7, 0);
        ctx.fill();

        // Meteor Rock
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Meteor craters
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(-m.radius * 0.3, -m.radius * 0.2, m.radius * 0.25, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.3, m.radius * 0.2, m.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw Player Spaceship
      const shipY = canvas.height - 45;
      ctx.save();
      ctx.translate(playerX, shipY);

      if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.3; // Blink
      }

      // Jet exhaust flame
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(0, 22 + Math.random() * 6);
      ctx.lineTo(6, 12);
      ctx.fill();

      // Spaceship Body (sleek triangle)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 12);
      ctx.lineTo(0, 8);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cockpit window
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -2, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shield effect if invincible
      if (invincible) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
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
  }, [gameStatus, invincible, isPaused, level, playerX]);

  const moveLeft = () => {
    setPlayerX((px) => Math.max(20, px - 25));
  };

  const moveRight = () => {
    setPlayerX((px) => Math.min(380, px + 25));
  };

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-20">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">METEOR SURVIVOR</h1>
            <p className="text-xs text-slate-400">Misyon Nivo {level} / 10</p>
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
          <span className="text-[10px] text-slate-400 font-bold uppercase">Tan Siviv Rete</span>
          <span className="text-lg font-black text-amber-400">{timeLeft}s</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Boukliye / Lavi</span>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Shield
                key={idx}
                className={`w-4 h-4 ${idx < lives ? 'text-blue-400 fill-blue-400' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt Total</span>
          <span className="text-lg font-black text-emerald-400 flex items-center gap-1">
            <Trophy className="w-4 h-4" /> {score}
          </span>
        </div>
      </div>

      {/* Space Simulation Canvas */}
      <div className="relative w-full max-w-md aspect-[4/5] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        <canvas ref={canvasRef} width={400} height={500} className="w-full h-full object-contain" />

        {/* Warning Indicator */}
        {timeLeft <= 5 && timeLeft > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/80 px-4 py-1 rounded-full text-xs font-black text-white animate-pulse">
            VAG METEYÒ FINAL!
          </div>
        )}
      </div>

      {/* Touch Left / Right Controls */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={moveLeft}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-blue-400" />
          <span className="text-sm">Agoch</span>
        </button>
        <button
          onClick={moveRight}
          className="py-4 bg-slate-900 hover:bg-slate-800 active:bg-blue-600/40 border border-slate-800 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          <span className="text-sm">Adwat</span>
          <ArrowRight className="w-6 h-6 text-blue-400" />
        </button>
      </div>

      {/* Level Win Modal */}
      {gameStatus === 'level_win' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Ou siviv nan espas la!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou evite tout gwo meteyò nivo {level} yo!</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Bonis vag fini:</span>
                <span className="font-bold text-emerald-400">+50 pwen</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lavi rete ({lives}):</span>
                <span className="font-bold text-blue-400">Bon kondisyon</span>
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
            <h2 className="text-xl font-black text-red-400 mb-1">Meteyò yo pran w!</h2>
            <p className="text-xs text-slate-300 mb-4">Eseye siviv pi lontan san meteyò yo pa frape w.</p>
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
export default MeteorSurvivor;
