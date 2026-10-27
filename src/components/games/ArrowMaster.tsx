import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Trophy, RotateCcw, Volume2, VolumeX, Wind, Award, Play, Pause, ArrowLeft } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface ArrowMasterProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: any;
  onBack?: () => void;
}

interface TargetObj {
  x: number;
  y: number;
  radius: number;
  vy: number;
  minY: number;
  maxY: number;
  hit: boolean;
}

interface ObstacleObj {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  minY: number;
  maxY: number;
}

interface ArrowObj {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active: boolean;
  trail: { x: number; y: number }[];
}

export const ArrowMaster: React.FC<ArrowMasterProps> = ({ onGameOver, currentUser, onBack }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [arrowsLeft, setArrowsLeft] = useState(6);
  const [targetsHit, setTargetsHit] = useState(0);
  const [totalTargetsNeeded, setTotalTargetsNeeded] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [wind, setWind] = useState(0); // Wind factor in pixels/frame
  const [gameState, setGameState] = useState<'aiming' | 'flying' | 'level_win' | 'game_over' | 'completed'>('aiming');
  const [lastShotScore, setLastShotScore] = useState<number | null>(null);

  // Aiming parameters
  const [aimAngle, setAimAngle] = useState(0); // in degrees: -45 to +45
  const [aimPower, setAimPower] = useState(70); // 30 to 100

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const arrowRef = useRef<ArrowObj | null>(null);
  const targetsRef = useRef<TargetObj[]>([]);
  const obstaclesRef = useRef<ObstacleObj[]>([]);
  const isDraggingRef = useRef(false);

  // Level configuration
  const setupLevel = useCallback((lvl: number) => {
    // Canvas standard dimensions: 640x360
    const needed = lvl <= 3 ? 3 : lvl <= 8 ? 4 : 5;
    const arrows = needed + 3;
    setTotalTargetsNeeded(needed);
    setTargetsHit(0);
    setArrowsLeft(arrows);
    setLastShotScore(null);
    setGameState('aiming');

    // Wind applies in levels 10+
    const windSpeed = lvl >= 10 ? (Math.random() * 2 - 1) * (lvl >= 13 ? 0.35 : 0.2) : 0;
    setWind(Number(windSpeed.toFixed(2)));

    // Generate targets
    const newTargets: TargetObj[] = [];
    const targetCount = lvl <= 6 ? 1 : lvl <= 10 ? 2 : 2;
    const baseRadius = lvl <= 3 ? 36 : lvl <= 6 ? 30 : lvl <= 12 ? 26 : 22;

    for (let i = 0; i < targetCount; i++) {
      const tx = 520 + i * 40;
      const vy = lvl >= 7 ? (i % 2 === 0 ? 1 : -1) * (1.2 + lvl * 0.15) : 0;
      newTargets.push({
        x: Math.min(tx, 580),
        y: 180 + (i === 1 ? -60 : 40),
        radius: baseRadius,
        vy: vy,
        minY: 60,
        maxY: 300,
        hit: false,
      });
    }
    targetsRef.current = newTargets;

    // Obstacles in levels 10+
    const newObs: ObstacleObj[] = [];
    if (lvl >= 10) {
      newObs.push({
        x: 380,
        y: 120,
        width: 16,
        height: 90,
        vy: lvl >= 12 ? 1.5 : 0,
        minY: 80,
        maxY: 240,
      });
    }
    obstaclesRef.current = newObs;
    arrowRef.current = null;
  }, []);

  useEffect(() => {
    setupLevel(level);
  }, [level, setupLevel]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      // Update positions if not paused
      if (!isPaused && gameState !== 'level_win' && gameState !== 'game_over' && gameState !== 'completed') {
        // Move targets
        targetsRef.current.forEach((t) => {
          if (t.vy !== 0) {
            t.y += t.vy;
            if (t.y <= t.minY || t.y >= t.maxY) {
              t.vy = -t.vy;
            }
          }
        });

        // Move obstacles
        obstaclesRef.current.forEach((o) => {
          if (o.vy !== 0) {
            o.y += o.vy;
            if (o.y <= o.minY || o.y >= o.maxY) {
              o.vy = -o.vy;
            }
          }
        });

        // Move arrow if flying
        const arrow = arrowRef.current;
        if (arrow && arrow.active) {
          arrow.trail.push({ x: arrow.x, y: arrow.y });
          if (arrow.trail.length > 15) arrow.trail.shift();

          // Apply physics
          arrow.x += arrow.vx;
          arrow.y += arrow.vy;
          arrow.vy += 0.28; // gravity
          arrow.vx += wind * 0.1; // wind effect
          arrow.angle = Math.atan2(arrow.vy, arrow.vx);

          // Check obstacle collisions
          for (const obs of obstaclesRef.current) {
            if (
              arrow.x >= obs.x &&
              arrow.x <= obs.x + obs.width &&
              arrow.y >= obs.y &&
              arrow.y <= obs.y + obs.height
            ) {
              // Arrow blocked
              arrow.active = false;
              gameAudio.play('hit');
              setLastShotScore(0);
              finishShot(0);
              break;
            }
          }

          // Check target collisions
          if (arrow.active) {
            for (let i = 0; i < targetsRef.current.length; i++) {
              const t = targetsRef.current[i];
              const dx = arrow.x - t.x;
              const dy = arrow.y - t.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist <= t.radius) {
                arrow.active = false;
                // Determine ring score: bullseye, middle, outer
                let pts = 10;
                if (dist <= t.radius * 0.3) {
                  pts = 50; // Bullseye
                  gameAudio.play('win');
                } else if (dist <= t.radius * 0.65) {
                  pts = 30; // Mid ring
                  gameAudio.play('coin');
                } else {
                  pts = 10;
                  gameAudio.play('coin');
                }

                setLastShotScore(pts);
                setScore((s) => s + pts);
                setTargetsHit((th) => th + 1);

                finishShot(pts, true);
                break;
              }
            }
          }

          // Boundary check (off screen)
          if (arrow.active && (arrow.x > 640 || arrow.y > 360 || arrow.x < 0)) {
            arrow.active = false;
            gameAudio.play('lose');
            setLastShotScore(0);
            finishShot(0, false);
          }
        }
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky & ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grass floor
      const grad = ctx.createLinearGradient(0, 320, 0, 360);
      grad.addColorStop(0, '#15803d');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 320, canvas.width, 40);

      // Draw Archery Stand / Range markings
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let x = 100; x < 600; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 320);
        ctx.lineTo(x, 330);
        ctx.stroke();
      }

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#b45309';
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      });

      // Draw Targets
      targetsRef.current.forEach((t) => {
        // Target Stand
        ctx.fillStyle = '#64748b';
        ctx.fillRect(t.x - 3, t.y, 6, 320 - t.y);

        // Concentric circles
        // Outer white ring
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();

        // Black ring
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Blue ring
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();

        // Red ring (30 pts)
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Yellow Bullseye (50 pts)
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308';
        ctx.fill();

        // Bullseye crosshairs
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t.x - t.radius * 0.28, t.y);
        ctx.lineTo(t.x + t.radius * 0.28, t.y);
        ctx.moveTo(t.x, t.y - t.radius * 0.28);
        ctx.lineTo(t.x, t.y + t.radius * 0.28);
        ctx.stroke();
      });

      // Draw Archer Bow Position (x: 80, y: 220)
      const bowX = 80;
      const bowY = 220;

      // Draw Archer Silhouette
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bowX - 15, bowY - 20, 10, 0, Math.PI * 2); // head
      ctx.fill();
      ctx.fillRect(bowX - 22, bowY - 10, 14, 30); // body

      // Draw Bow Curve
      ctx.save();
      ctx.translate(bowX, bowY);
      const rad = (aimAngle * Math.PI) / 180;
      ctx.rotate(rad);

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 32, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      // Bowstring
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      const pullOffset = gameState === 'aiming' ? (aimPower / 100) * 16 : 0;
      ctx.beginPath();
      ctx.moveTo(16, -28);
      ctx.lineTo(-pullOffset, 0);
      ctx.lineTo(16, 28);
      ctx.stroke();

      // Guide line when aiming
      if (gameState === 'aiming') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(aimPower * 2, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // Draw Arrow
      const arrow = arrowRef.current;
      if (arrow) {
        // Trail
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        arrow.trail.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Arrow Shaft & Head
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(arrow.angle);

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        ctx.fill();

        // Feathers
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-28, -4, 8, 2);
        ctx.fillRect(-28, 2, 8, 2);

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [aimAngle, aimPower, gameState, isPaused, wind]);

  const finishShot = (pts: number, hit = false) => {
    setTimeout(() => {
      setArrowsLeft((prevArrows) => {
        const remaining = prevArrows - 1;
        setTargetsHit((currentHits) => {
          // Check win condition
          if (currentHits >= totalTargetsNeeded) {
            // Victory
            const arrowBonus = remaining * 5;
            setScore((s) => s + 100 + arrowBonus);
            setGameState(level === 15 ? 'completed' : 'level_win');
            gameAudio.play('win');
            if (level === 15) {
              onGameOver(score + 100 + arrowBonus, 0, 15);
            }
          } else if (remaining <= 0) {
            // Defeat
            setGameState('game_over');
            gameAudio.play('lose');
          } else {
            setGameState('aiming');
          }
          return currentHits;
        });
        return remaining;
      });
    }, 400);
  };

  const shootArrow = () => {
    if (gameState !== 'aiming' || arrowsLeft <= 0 || isPaused) return;

    setGameState('flying');
    setLastShotScore(null);
    gameAudio.play('shoot');

    const rad = (aimAngle * Math.PI) / 180;
    const velocity = 8 + (aimPower / 100) * 14;

    arrowRef.current = {
      x: 80,
      y: 220,
      vx: Math.cos(rad) * velocity,
      vy: Math.sin(rad) * velocity,
      angle: rad,
      active: true,
      trail: [],
    };
  };

  const nextLevel = () => {
    if (level < 15) {
      setLevel((l) => l + 1);
    }
  };

  const restartLevel = () => {
    setupLevel(level);
  };

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-20">
      {/* Header Bar */}
      <div className="w-full max-w-lg flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">ARROW MASTER</h1>
            <p className="text-xs text-slate-400">Nivo {level} / 15</p>
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
      <div className="w-full max-w-lg grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Flèch Rete</span>
          <span className="text-base font-black text-amber-400">🏹 {arrowsLeft}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Sib Manyen</span>
          <span className="text-base font-black text-blue-400">
            {targetsHit} / {totalTargetsNeeded}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Van</span>
          <span className="text-base font-black text-cyan-400 flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" />
            {wind === 0 ? 'Kèm' : `${wind > 0 ? '→' : '←'} ${Math.abs(wind)}`}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Nòt</span>
          <span className="text-base font-black text-emerald-400">{score}</span>
        </div>
      </div>

      {/* Canvas Archery Range */}
      <div className="relative w-full max-w-lg aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        <canvas ref={canvasRef} width={640} height={360} className="w-full h-full object-contain" />

        {/* Shot Feedback Popup */}
        {lastShotScore !== null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-black shadow-lg animate-bounce">
            {lastShotScore === 50 && <span className="text-yellow-400">🎯 MILYE! +50 PWEN</span>}
            {lastShotScore === 30 && <span className="text-red-400">⭐ BON TIR! +30 PWEN</span>}
            {lastShotScore === 10 && <span className="text-blue-400">TOUCHÉ! +10 PWEN</span>}
            {lastShotScore === 0 && <span className="text-slate-400">OU RATE SIB LA! 0 PWEN</span>}
          </div>
        )}
      </div>

      {/* Controls: Aim Angle, Power & Shoot Button */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mt-3 shadow-lg">
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Angle Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-semibold">Ang Vize:</span>
              <span className="font-mono text-cyan-400">{aimAngle}°</span>
            </div>
            <input
              type="range"
              min={-45}
              max={30}
              value={aimAngle}
              onChange={(e) => setAimAngle(Number(e.target.value))}
              disabled={gameState !== 'aiming'}
              className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Power Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-semibold">Fòs Tir:</span>
              <span className="font-mono text-amber-400">{aimPower}%</span>
            </div>
            <input
              type="range"
              min={35}
              max={100}
              value={aimPower}
              onChange={(e) => setAimPower(Number(e.target.value))}
              disabled={gameState !== 'aiming'}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Big Shoot Button */}
        <button
          onClick={shootArrow}
          disabled={gameState !== 'aiming' || arrowsLeft <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          🏹 LAGE FLÈCH LA (TIRE)
        </button>
      </div>

      {/* Win Level Modal */}
      {gameState === 'level_win' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">Bèl tir! Ou metrize banza a!</h2>
            <p className="text-xs text-slate-300 mb-4">Ou manyen tout sib nivo {level} yo avèk siksè.</p>

            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Bonis nivo fini:</span>
                <span className="font-bold text-emerald-400">+100 pwen</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Flèch rete ({arrowsLeft}):</span>
                <span className="font-bold text-amber-400">+{arrowsLeft * 5} pwen</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Nòt Total:</span>
                <span className="font-bold text-white text-sm">{score} pwen</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={nextLevel}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110"
              >
                Nivo Ki Vin Apre ❯
              </button>
              <button
                onClick={restartLevel}
                className="w-full py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700"
              >
                Rejwe nivo sa a
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'game_over' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black text-red-400 mb-1">Flèch ou yo fini!</h2>
            <p className="text-xs text-slate-300 mb-4">Eseye yon lòt estrateji pou manyen tout sib yo.</p>
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 mb-5 text-xs">
              <span className="text-slate-400">Nòt ou fè: </span>
              <span className="text-amber-400 font-black text-sm">{score} pwen</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={restartLevel}
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
export default ArrowMaster;
