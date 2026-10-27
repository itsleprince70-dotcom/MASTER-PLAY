import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Trophy, Clock, Volume2, VolumeX, Pause, Play, RotateCcw, AlertTriangle } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface BalloonPopperProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface Balloon {
  id: number;
  type: 'normal' | 'bonus' | 'special' | 'danger';
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  popped: boolean;
  color: string;
}

export const BalloonPopper: React.FC<BalloonPopperProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [balloonsPopped, setBalloonsPopped] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'round_end' | 'completed'>('playing');

  // Targets per level
  const LEVEL_TARGETS = [200, 350, 500, 700, 900];
  const targetScore = LEVEL_TARGETS[level - 1] || 1000;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const lastSpawnRef = useRef<number>(Date.now());
  const poppedParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);

  // Init Level
  const initLevel = useCallback((lvl: number) => {
    setTimeLeft(60);
    setBalloonsPopped(0);
    balloonsRef.current = [];
    poppedParticlesRef.current = [];
    setGameStatus('playing');
    lastSpawnRef.current = Date.now();
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // 60-second timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 60s finished!
          setGameStatus('round_end');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isPaused]);

  // Handle round end sound & completion check
  useEffect(() => {
    if (gameStatus === 'round_end') {
      if (score >= targetScore) {
        gameAudio.play('win');
        if (level >= 5) {
          setGameStatus('completed');
          onGameOver(score, 0, 5);
        }
      } else {
        gameAudio.play('lose');
      }
    }
  }, [gameStatus, level, onGameOver, score, targetScore]);

  // Pop a balloon
  const popBalloon = (b: Balloon) => {
    if (b.popped || gameStatus !== 'playing' || isPaused || timeLeft <= 0) return;
    b.popped = true;

    // Create pop particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      poppedParticlesRef.current.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        color: b.color,
        life: 1.0,
      });
    }

    if (b.type === 'danger') {
      gameAudio.play('hit');
      setScore((s) => Math.max(0, s - 20));
    } else {
      gameAudio.play('pop');
      let pts = 10;
      if (b.type === 'bonus') pts = 25;
      if (b.type === 'special') pts = 50;
      setScore((s) => s + pts);
      setBalloonsPopped((bp) => bp + 1);
    }
  };

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      if (gameStatus === 'playing' && !isPaused) {
        const now = Date.now();
        // Spawn rate based on level
        const spawnInterval = Math.max(350, 750 - level * 70);
        if (now - lastSpawnRef.current > spawnInterval) {
          lastSpawnRef.current = now;

          // Determine balloon type
          const rand = Math.random();
          let type: 'normal' | 'bonus' | 'special' | 'danger' = 'normal';
          let color = '#3b82f6';

          if (rand < 0.18 + level * 0.02) {
            type = 'danger';
            color = '#1e293b'; // black danger balloon
          } else if (rand > 0.88) {
            type = 'special';
            color = '#ec4899'; // pink rainbow
          } else if (rand > 0.7) {
            type = 'bonus';
            color = '#eab308'; // golden
          } else {
            const colors = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f97316'];
            color = colors[Math.floor(Math.random() * colors.length)];
          }

          balloonsRef.current.push({
            id: Math.random(),
            type,
            x: Math.random() * (canvas.width - 60) + 30,
            y: canvas.height + 40,
            radius: type === 'special' ? 22 : type === 'bonus' ? 24 : 26,
            speed: 1.8 + level * 0.45 + Math.random() * 1.0,
            wobbleSpeed: 0.04 + Math.random() * 0.03,
            wobbleAmp: level >= 4 ? 2.5 : 1.2,
            popped: false,
            color,
          });
        }

        // Update balloons
        balloonsRef.current.forEach((b) => {
          b.y -= b.speed;
          b.x += Math.sin(b.y * b.wobbleSpeed) * b.wobbleAmp;
        });

        // Filter out popped or offscreen
        balloonsRef.current = balloonsRef.current.filter((b) => !b.popped && b.y > -50);

        // Update particles
        poppedParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
        });
        poppedParticlesRef.current = poppedParticlesRef.current.filter((p) => p.life > 0);
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky background gradient
      const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(0.5, '#2e1065');
      sky.addColorStop(1, '#0f172a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Balloons
      balloonsRef.current.forEach((b) => {
        ctx.save();
        ctx.translate(b.x, b.y);

        // String
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, b.radius + 2);
        ctx.quadraticCurveTo(-4, b.radius + 12, 0, b.radius + 22);
        ctx.stroke();

        // Balloon body (oval)
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radius, b.radius * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Balloon knot
        ctx.beginPath();
        ctx.moveTo(-4, b.radius * 1.25);
        ctx.lineTo(4, b.radius * 1.25);
        ctx.lineTo(0, b.radius * 1.25 + 4);
        ctx.closePath();
        ctx.fill();

        // Balloon highlight / shine reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-b.radius * 0.35, -b.radius * 0.4, b.radius * 0.25, b.radius * 0.4, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Type icon or label
        if (b.type === 'bonus') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★ 25', 0, 0);
        } else if (b.type === 'special') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡ 50', 0, 0);
        } else if (b.type === 'danger') {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☠ -20', 0, 0);
        }

        ctx.restore();
      });

      // Draw Popped particles
      poppedParticlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameStatus, isPaused, level]);

  // Click/Touch canvas interaction
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickX = (clientX - rect.left) * scaleX;
    const clickY = (clientY - rect.top) * scaleY;

    // Check hit balloons from top to bottom
    for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
      const b = balloonsRef.current[i];
      const dx = clickX - b.x;
      const dy = clickY - b.y;
      const dist = Math.sqrt(dx * dx + (dy / 1.25) * (dy / 1.25));

      if (dist <= b.radius + 6) {
        popBalloon(b);
        break; // Only pop one per touch event
      }
    }
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
          <div className="p-2 bg-pink-500/20 rounded-xl text-pink-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">BALLOON POPPER</h1>
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
      <div className="w-full max-w-md grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Tan (60s)</span>
          <span className={`text-base font-black ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Pete</span>
          <span className="text-base font-black text-pink-400">{balloonsPopped}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Objektif</span>
          <span className="text-base font-black text-blue-400">{targetScore}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt</span>
          <span className="text-base font-black text-emerald-400">{score}</span>
        </div>
      </div>

      {/* Balloon Popping Touch Arena */}
      <div className="relative w-full max-w-md aspect-[4/5] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onMouseDown={handleCanvasInteraction}
          onTouchStart={handleCanvasInteraction}
          className="w-full h-full object-contain touch-none"
        />
      </div>

      {/* Pop Instruction Pill */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mt-3 flex items-center justify-between text-xs text-slate-400 shadow-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Touche balon yo rapid pou fè pwen!
        </span>
        <span className="text-red-400 font-semibold">Evite balon nwa (-20)</span>
      </div>

      {/* Round End Modal */}
      {gameStatus === 'round_end' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            {score >= targetScore ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-white mb-1">Bravo! Ou se yon mèt balon!</h2>
                <p className="text-xs text-slate-300 mb-4">Ou depase nòt nivo {level} la avèk siksè!</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-white mb-1">Eseye ankò pou fè plis pwen!</h2>
                <p className="text-xs text-slate-300 mb-4">
                  Ou te bezwen {targetScore} pwen men ou fè sèlman {score} pwen.
                </p>
              </>
            )}

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Balon Pete:</span>
                <span className="font-bold text-pink-400">{balloonsPopped}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nòt Nivo a:</span>
                <span className="font-bold text-white">{score} pwen</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Objektif:</span>
                <span className="font-bold text-blue-400">{targetScore} pwen</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {score >= targetScore && level < 5 ? (
                <button
                  onClick={() => setLevel((l) => l + 1)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110"
                >
                  Nivo Ki Vin Apre ❯
                </button>
              ) : null}
              <button
                onClick={() => initLevel(level)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Rejwe 60 Segonn Sa a
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full py-2 bg-slate-900 text-slate-400 text-xs rounded-xl hover:text-white"
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
export default BalloonPopper;
