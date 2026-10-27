import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Coins,
  ChevronRight,
  Award,
  Flame,
  Info
} from 'lucide-react';
import { User, BalonProgress, BalonConfig } from '../../types';
import { api } from '../../services/api';

interface BalonChallengeProps {
  onGameOver?: (score: number, prize?: number, levelReached?: number) => void;
  currentUser: User | null;
  onBalanceUpdate?: (newUser: User) => void;
  onOpenDeposit?: () => void;
}

// Sound Synthesizer via Web Audio API (No external assets required, 100% reliable)
class SoundFx {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playScratch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.05; // 50ms scratch friction
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800 + Math.random() * 600;
      filter.Q.value = 3;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    } catch {
      // Audio fallback silent
    }
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {
      // silent
    }
  }

  playLoss() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // silent
    }
  }
}

const sfx = new SoundFx();

export const BalonChallenge: React.FC<BalonChallengeProps> = ({
  onGameOver,
  currentUser,
  onBalanceUpdate,
  onOpenDeposit
}) => {
  // Game state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Progress and config from backend
  const [progress, setProgress] = useState<BalonProgress>({
    userId: currentUser?.id || 'demo',
    currentLevel: 1,
    unlockedLevels: [1],
    completedLevels: [],
    levelResults: [],
    totalPoints: 0,
    status: 'in_progress',
    sessionPaid: false,
    lastUpdated: new Date().toISOString()
  });

  const [config, setConfig] = useState<BalonConfig>({
    entryFee: 50,
    pointsPerWin: 100,
    isActive: true,
    totalLevels: 7
  });

  // Current active level being played (1 to 7)
  const [activeLevel, setActiveLevel] = useState<number>(1);

  // Ball interaction state
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);
  const [isScratchingModalOpen, setIsScratchingModalOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  // Round result
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [winningBallIndex, setWinningBallIndex] = useState<number | null>(null);
  const [pointsEarnedThisRound, setPointsEarnedThisRound] = useState<number>(0);

  // Canvas ref for scratch-off
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const hasRevealedRef = useRef(false);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Fetch initial progress
  const fetchProgress = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getBalonProgress(currentUser.id);
      if (res && res.progress) {
        setProgress(res.progress);
        if (res.config) setConfig(res.config);
        // Default active level is user's current unlocked level
        const current = res.progress.currentLevel || 1;
        setActiveLevel(current <= 7 ? current : 7);
      }
    } catch (err: any) {
      console.error('Erè nan chaje 11 Balon:', err);
      setErrorMsg(err.message || 'Pa ka chaje pwogrè jwèt la.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Reset local round state when switching levels
  const startLevel = (lvl: number) => {
    if (!progress.unlockedLevels.includes(lvl)) {
      return;
    }
    setActiveLevel(lvl);
    setSelectedBallIndex(null);
    setIsScratchingModalOpen(false);
    setIsRevealed(false);
    setLastWon(null);
    setWinningBallIndex(null);
    setScratchPercent(0);
    hasRevealedRef.current = false;
    setErrorMsg('');
  };

  // Select a ball to scratch
  const handleSelectBall = (ballIndex: number) => {
    // If already revealed in this round, other balls are locked!
    if (isRevealed || isSubmitting) return;

    setSelectedBallIndex(ballIndex);
    setIsScratchingModalOpen(true);
    setIsRevealed(false);
    setScratchPercent(0);
    hasRevealedRef.current = false;
  };

  // Setup Scratch Canvas when modal opens
  useEffect(() => {
    if (!isScratchingModalOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw metallic scratch coat
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#94A3B8');
    grad.addColorStop(0.3, '#CBD5E1');
    grad.addColorStop(0.5, '#E2E8F0');
    grad.addColorStop(0.7, '#94A3B8');
    grad.addColorStop(1, '#64748B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative texture & pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Label: GRATE LA A
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ GRATE SIFAS LA AK DWÈT OU ✨', width / 2, height / 2 - 14);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('⚽ 100 PWEN KACHE ANBA YON SÈL BALON ⚽', width / 2, height / 2 + 16);

    ctx.fillStyle = '#475569';
    ctx.font = '11px sans-serif';
    ctx.fillText('Glise dwèt ou sou ekran an pou revele', width / 2, height / 2 + 38);
  }, [isScratchingModalOpen]);

  // Compute scratch percentage
  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      const totalPixels = pixels.length / 4;

      // Sample every 4th pixel for speed
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) {
          transparentPixels += 4;
        }
      }

      const percent = Math.min(100, Math.round((transparentPixels / totalPixels) * 100));
      setScratchPercent(percent);

      // Once scratched at least 35%, trigger official reveal!
      if (percent >= 35 && !hasRevealedRef.current) {
        hasRevealedRef.current = true;
        handleRevealResult();
      }
    } catch (err) {
      console.warn('Canvas scratch read error:', err);
    }
  };

  // Scratch Drawing Handlers
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed || hasRevealedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    sfx.playScratch();
    checkScratchPercentage();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isRevealed || hasRevealedRef.current) return;
    isDrawing.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || isRevealed || hasRevealedRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Submit level result to backend
  const handleRevealResult = async () => {
    if (!currentUser || selectedBallIndex === null || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.submitBalonLevel({
        userId: currentUser.id,
        level: activeLevel,
        chosenBallIndex: selectedBallIndex
      });

      if (res && res.success) {
        setLastWon(res.won ?? false);
        setWinningBallIndex(res.winningBallIndex ?? null);
        setPointsEarnedThisRound(res.pointsEarned ?? 0);
        if (res.progress) setProgress(res.progress);
        setIsRevealed(true);

        // Update user state if balance or points updated
        if (onBalanceUpdate && currentUser) {
          onBalanceUpdate({
            ...currentUser,
            balance: res.userBalance !== undefined ? res.userBalance : currentUser.balance,
            points: res.userPoints !== undefined ? res.userPoints : currentUser.points
          });
        }

        if (res.won) {
          sfx.playWin();
        } else {
          sfx.playLoss();
        }

        // Notify parent game view of highscore update
        if (onGameOver) {
          onGameOver(res.progress.totalPoints, 0, res.progress.currentLevel);
        }
      } else {
        throw new Error('Repons sèvè a pa kòrèk.');
      }
    } catch (err: any) {
      console.error('Erè soumèt 11 Balon:', err);
      setErrorMsg(err.message || 'Erè nan verifye rezilta a sou sèvè a.');
      // If error occurs, let player scratch again
      hasRevealedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proceed to next level
  const handleProceedNextLevel = () => {
    setIsScratchingModalOpen(false);
    if (activeLevel < 7) {
      startLevel(activeLevel + 1);
    } else {
      // Completed all 7 levels
      setIsRevealed(true);
    }
  };

  // Retry this level after defeat
  const handleRetryLevel = () => {
    setIsScratchingModalOpen(false);
    startLevel(activeLevel);
  };

  // Restart whole session from Level 1
  const handleRestartSession = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await api.resetBalonSession(currentUser.id);
      if (res && res.progress) {
        setProgress(res.progress);
        setActiveLevel(1);
        setSelectedBallIndex(null);
        setIsScratchingModalOpen(false);
        setIsRevealed(false);
        setLastWon(null);
        setWinningBallIndex(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Pa ka rekòmanse sesyon an.');
    } finally {
      setLoading(false);
    }
  };

  // 11 Balls arrangement on pitch
  // Exactly 11 soccer balls: arranged in a tactical soccer formation across the pitch
  // Formation: Goalkeeper (1), Defense (4), Midfield (3), Attack (3) = 11 balls!
  const formationPositions = [
    // 0: Goalkeeper near goal line
    { index: 0, label: 'Boul #1', top: '85%', left: '50%' },
    // 1-4: Defense line
    { index: 1, label: 'Boul #2', top: '68%', left: '16%' },
    { index: 2, label: 'Boul #3', top: '70%', left: '38%' },
    { index: 3, label: 'Boul #4', top: '70%', left: '62%' },
    { index: 4, label: 'Boul #5', top: '68%', left: '84%' },
    // 5-7: Midfield line
    { index: 5, label: 'Boul #6', top: '48%', left: '26%' },
    { index: 6, label: 'Boul #7', top: '46%', left: '50%' },
    { index: 7, label: 'Boul #8', top: '48%', left: '74%' },
    // 8-10: Attack line
    { index: 8, label: 'Boul #9', top: '24%', left: '20%' },
    { index: 9, label: 'Boul #10', top: '18%', left: '50%' },
    { index: 10, label: 'Boul #11', top: '24%', left: '80%' }
  ];

  const isChampion = progress.status === 'completed' || progress.completedLevels.includes(7);

  if (loading) {
    return (
      <div className="min-h-[460px] bg-slate-900/90 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 border border-emerald-500/30">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-400 font-bold text-sm tracking-wide">
          Chaje teren 11 Balon ak nivo ou yo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-wide">11 BALON</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase">
                  7 Nivo Ofisyèl
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chwazi 1 balon, grate li pou jwenn{' '}
                <strong className="text-amber-400 font-bold">100 PWEN</strong> epi pase nan nivo
                siperyè !
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Total Points Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-amber-300 font-bold uppercase leading-none">
                  Total Pwen
                </div>
                <div className="text-sm font-black text-amber-400 leading-tight">
                  {progress.totalPoints} / 700 pts
                </div>
              </div>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={soundEnabled ? 'Koupe son' : 'Limen son'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* 7 Levels Stepper / Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Pwogrè 7 Nivo yo :
            </span>
            <span className="text-emerald-400 font-mono font-bold text-xs">
              Nivo {activeLevel} sou 7 {progress.completedLevels.length > 0 && `(${progress.completedLevels.length} ranpòte)`}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
              const isCompleted = progress.completedLevels.includes(lvl);
              const isUnlocked = progress.unlockedLevels.includes(lvl);
              const isCurrent = activeLevel === lvl;

              return (
                <button
                  key={lvl}
                  onClick={() => isUnlocked && startLevel(lvl)}
                  disabled={!isUnlocked}
                  className={`relative py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-black shadow-lg shadow-amber-500/20 scale-105'
                      : isCompleted
                      ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/50 font-bold'
                      : isUnlocked
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold'
                      : 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-tight">Nivo</div>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-0.5">
                    {lvl}
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {!isUnlocked && <Lock className="w-2.5 h-2.5 text-slate-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error message banner */}
      {errorMsg && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {errorMsg.includes('depo') && onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shrink-0"
            >
              Fè Depo
            </button>
          )}
        </div>
      )}

      {/* CHAMPION SCREEN: When all 7 levels are beaten! */}
      {isChampion && !isScratchingModalOpen && (
        <div className="bg-gradient-to-b from-amber-950/40 via-[#0B0F19] to-emerald-950/40 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
            🏆
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase tracking-tight">
            CHAPO! OU FINI TOUT 7 NIVO YO!
          </h2>
          <p className="text-lg font-extrabold text-white mt-1">
            OU SE YON CHANPYON 11 BALON!
          </p>
          <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
            Ou reyisi jwenn balon ki gen 100 pwen yo nan chak nivo sou teren an. Ou ranmase total{' '}
            <span className="text-amber-400 font-bold">{progress.totalPoints} pwen</span> e ou mete non w nan liv chanpyon MASTER PLAY !
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto my-5">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Nivo Konplete</div>
              <div className="text-xl font-black text-emerald-400">7 / 7</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pwen</div>
              <div className="text-xl font-black text-amber-400">{progress.totalPoints} pts</div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Estati</div>
              <div className="text-sm font-black text-amber-300 flex items-center justify-center gap-1 mt-1">
                <Award className="w-4 h-4 text-amber-400" />
                CHANPYON
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRestartSession}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rekòmanse yon Nouvo Tounwa</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Soccer Pitch Arena (Teren Foutbòl) */}
      {(!isChampion || isScratchingModalOpen || activeLevel <= 7) && (
        <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-emerald-950">
          {/* Pitch Instruction Header */}
          <div className="bg-slate-950/90 px-4 py-2.5 flex items-center justify-between border-b border-emerald-500/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-extrabold text-white uppercase tracking-wider">
                Nivo {activeLevel} sou 7
              </span>
            </div>
            <div className="text-xs font-bold text-amber-400">
              🎯 1 Balon = +100 Pwen | 10 Balon = 0 Pwen
            </div>
          </div>

          {/* Subheader Call to Action: Official Haitian Creole Prompt */}
          <div className="bg-emerald-900/90 text-center py-2 px-3 border-b border-emerald-600/30">
            <p className="text-xs sm:text-sm font-black text-emerald-100 tracking-wide">
              « CHWAZI YON BALON, GRATE LI POU W WÈ SI LI GEN 100 PWEN YO! »
            </p>
          </div>

          {/* Grass Field with White Lines */}
          <div
            className="relative w-full h-[460px] sm:h-[500px] overflow-hidden"
            style={{
              background:
                'repeating-linear-gradient(0deg, #15803d, #15803d 30px, #166534 30px, #166534 60px)'
            }}
          >
            {/* Field Outer Border & Inner Glow */}
            <div className="absolute inset-3 border-2 border-white/60 rounded-xl pointer-events-none"></div>

            {/* Halfway Line */}
            <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-white/60 -translate-y-1/2 pointer-events-none"></div>

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 border-2 border-white/60 rounded-full pointer-events-none flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white/80 rounded-full"></div>
            </div>

            {/* Top Penalty Area (Goal Box) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-20 border-b-2 border-x-2 border-white/60 rounded-b-lg pointer-events-none">
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-10 border-b-2 border-white/60 rounded-b-full"></div>
            </div>

            {/* Bottom Penalty Area (Goal Box) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-20 border-t-2 border-x-2 border-white/60 rounded-t-lg pointer-events-none">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-10 border-t-2 border-white/60 rounded-t-full"></div>
            </div>

            {/* Corner Arcs */}
            <div className="absolute top-3 left-3 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br-full pointer-events-none"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr-full pointer-events-none"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl-full pointer-events-none"></div>

            {/* THE 11 SOCCER BALLS ON THE FIELD */}
            {formationPositions.map((pos) => {
              const isSelected = selectedBallIndex === pos.index;
              const isRevealedBall = isRevealed && selectedBallIndex === pos.index;
              const isWinningBall = isRevealed && winningBallIndex === pos.index;

              return (
                <div
                  key={pos.index}
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="z-10 group"
                >
                  <button
                    onClick={() => handleSelectBall(pos.index)}
                    disabled={isRevealed || isSubmitting}
                    className={`relative p-1 rounded-full transition-all duration-200 active:scale-95 focus:outline-none ${
                      isRevealed
                        ? isWinningBall
                          ? 'ring-4 ring-amber-400 bg-amber-400/30 scale-125'
                          : isSelected
                          ? 'ring-4 ring-red-500 bg-red-500/30 opacity-80'
                          : 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'ring-4 ring-amber-400 scale-110 shadow-lg'
                        : 'hover:scale-115 hover:ring-2 hover:ring-white/80 drop-shadow-md'
                    }`}
                  >
                    {/* Soccer Ball Graphic */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-xl sm:text-2xl shadow-xl border-2 border-slate-900 overflow-hidden relative">
                      <span>⚽</span>

                      {/* Ball Number Tag */}
                      <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-tl-md bg-slate-900/90 text-[9px] font-black text-amber-300 leading-tight">
                        #{pos.index + 1}
                      </span>
                    </div>

                    {/* Reveal Status Pin */}
                    {isRevealed && isWinningBall && (
                      <span className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black shadow-lg animate-bounce">
                        100 pts!
                      </span>
                    )}
                    {isRevealed && isSelected && !lastWon && (
                      <span className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black shadow-lg">
                        0 pts
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Bottom Floating Status Bar */}
            <div className="absolute bottom-3 left-4 right-4 bg-slate-950/85 backdrop-blur-md rounded-2xl p-2.5 border border-slate-700/80 flex items-center justify-between text-xs z-20">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">Nivo {activeLevel}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  {selectedBallIndex !== null
                    ? `Balon #${selectedBallIndex + 1} chwazi`
                    : 'Klike sou yon balon sou teren an'}
                </span>
              </div>
              <div className="font-mono text-amber-400 font-bold">
                {progress.completedLevels.includes(activeLevel) ? '✓ Ranpòte' : 'Poko jwe'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCRATCH-OFF MODAL OVERLAY (Sistèm Gratay Reyèl) */}
      {isScratchingModalOpen && selectedBallIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131B2E] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-center">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚽</span>
                <div className="text-left">
                  <h4 className="text-sm font-black text-white uppercase">
                    Balon #{selectedBallIndex + 1} - Nivo {activeLevel}
                  </h4>
                  <p className="text-[11px] text-amber-400 font-bold">
                    Grate sifas la ak dwèt ou kounye a !
                  </p>
                </div>
              </div>

              {!isRevealed && !isSubmitting && (
                <button
                  onClick={() => setIsScratchingModalOpen(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800"
                >
                  Fèmen
                </button>
              )}
            </div>

            {/* Scratching Canvas Container */}
            <div className="my-5 relative flex flex-col items-center justify-center">
              {/* Underlying Hidden Card (Under the scratch coating) */}
              <div className="w-[300px] h-[190px] rounded-2xl bg-gradient-to-br from-slate-900 to-[#0A0D14] border-2 border-slate-700 flex flex-col items-center justify-center p-4 text-center shadow-inner relative overflow-hidden">
                {isRevealed ? (
                  lastWon ? (
                    <div className="space-y-2 animate-in zoom-in-90 duration-300">
                      <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
                        ⭐
                      </div>
                      <div className="text-2xl font-black text-amber-400">
                        +{pointsEarnedThisRound > 0 ? pointsEarnedThisRound : 100} PWEN !
                      </div>
                      <p className="text-xs font-bold text-emerald-400">
                        Balon ki gen pwen an te jwenn !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in zoom-in-90 duration-300">
                      <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-3xl">
                        ❌
                      </div>
                      <div className="text-2xl font-black text-red-400">0 PWEN</div>
                      <p className="text-xs text-slate-400">
                        Balon sa a pa gen pwen. Balon ki te genyen an te #{winningBallIndex !== null ? winningBallIndex + 1 : '?'}.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="text-3xl animate-pulse">❓</div>
                    <div className="text-sm font-bold text-slate-400">
                      Kisa ki kache anba balon sa a ?
                    </div>
                    <div className="text-[11px] text-amber-400 font-mono">
                      Grate omwen 35% pou dekouvri ! ({scratchPercent}%)
                    </div>
                  </div>
                )}

                {/* Real HTML5 Scratch Overlay Canvas */}
                {!isRevealed && (
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={190}
                    className="absolute inset-0 cursor-pointer touch-none rounded-2xl"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  />
                )}
              </div>

              {/* Scratch Percentage Indicator */}
              {!isRevealed && (
                <div className="w-full max-w-[300px] mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-bold">
                    <span>Sifas grate :</span>
                    <span className="text-amber-400">{scratchPercent}% / 35%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${Math.min(100, (scratchPercent / 35) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Submitting Loading Spinner */}
            {isSubmitting && (
              <div className="py-2 text-center text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Verifikasyon rezilta sou sèvè a...</span>
              </div>
            )}

            {/* OFFICIAL RESULT MESSAGES (Prompt Specifications) */}
            {isRevealed && (
              <div className="space-y-4 pt-2">
                {lastWon ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                    <div className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-tight">
                      « FELISITASYON! OU JWENN 100 PWEN! »
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeLevel < 7
                        ? `Ou debloke Nivo ${activeLevel + 1} avèk siksè !`
                        : 'Ou ranpòte dènye nivo a !'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300">
                    <div className="text-base sm:text-lg font-black text-red-400 uppercase tracking-tight">
                      « OU PA JWENN BALON KI GEN PWEN AN. OU PÈDI NIVO SA A! »
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Pwochen nivo a rete fèmen jiskaske w genyen nivo sa a. Eseye ankò !
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  {lastWon ? (
                    activeLevel < 7 ? (
                      <button
                        onClick={handleProceedNextLevel}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <span>PASE NAN PWOCHEN NIVO A</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsScratchingModalOpen(false)}
                        className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>WÈ EKRAN CHANPYON AN</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleRetryLevel}
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>REJWE NIVO SA A</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rules and Information Card */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Règ Ofisyèl 11 Balon (7 Nivo) :</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed pl-1">
          <li>Chak nivo gen 11 balon sou teren an. 1 sèl balon kache 100 pwen.</li>
          <li>Grate balon w chwazi a pou dekouvri sa ki anba li.</li>
          <li>Chak nivo ou genyen debloke nivo ki swiv li a (soti Nivo 1 rive Nivo 7).</li>
          <li>Si w pèdi yon nivo, pwochen nivo a rete fèmen jiskaske w reyisi li.</li>
          <li>Fini tout 7 nivo yo pou w ranmase 700 pwen epi vin yon Chanpyon 11 Balon !</li>
        </ul>
      </div>
    </div>
  );
};
