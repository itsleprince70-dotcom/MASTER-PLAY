import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';
import { gameAudio } from '../../utils/gameAudio';
import {
  Plane,
  Coins,
  Volume2,
  VolumeX,
  AlertTriangle,
  History,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Sparkles,
  Flame,
  CheckCircle2,
  Lock,
  Wallet,
  Clock,
  RotateCcw,
  Skull,
  Award
} from 'lucide-react';

interface AvionCrashProps {
  currentUser: User | null;
  onBalanceUpdate: (user: User) => void;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
  onBack?: () => void;
}

interface CrashHistoryItem {
  id: string;
  multiplier: number;
  status: string;
  time: string;
}

export const AvionCrash: React.FC<AvionCrashProps> = ({
  currentUser,
  onBalanceUpdate,
  onOpenDeposit,
  onOpenAuth,
  onBack,
}) => {
  // Config state
  const [minBet, setMinBet] = useState(10);
  const [maxBet, setMaxBet] = useState(5000);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Bet and Game State
  const [betAmount, setBetAmount] = useState<number>(50);
  const [betInput, setBetInput] = useState<string>('50');
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [activeSeedHash, setActiveSeedHash] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'betting' | 'flying' | 'cashed_out' | 'crashed'>('idle');
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number | null>(null);
  const [cashedMultiplier, setCashedMultiplier] = useState<number | null>(null);
  const [cashedPayout, setCashedPayout] = useState<number | null>(null);
  const [cashedProfit, setCashedProfit] = useState<number | null>(null);
  const [obstacleNotice, setObstacleNotice] = useState<string | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  // UI state
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentMultipliers, setRecentMultipliers] = useState<CrashHistoryItem[]>([]);
  const [userRounds, setUserRounds] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false);

  // Flight timing and canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number>(0);
  const isCashingOutRef = useRef<boolean>(false);
  const activeRoundIdRef = useRef<string | null>(null);
  const targetCrashMultiplierRef = useRef<number>(1.0);
  const targetObstacleNoticeRef = useRef<string>('zwazo');
  const audioContextRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  // Sync ref
  activeRoundIdRef.current = activeRoundId;

  // Synthesize realistic crash explosion sound
  const playCrashBoomSound = useCallback(() => {
    if (gameAudio.getMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Low frequency rumble oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);

      // Noise buffer for blast crackle
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch {
      gameAudio.play('hit');
    }
  }, []);

  // Engine sound when flying
  const startEngineSound = useCallback(() => {
    if (gameAudio.getMuted()) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      engineOscRef.current = osc;
      engineGainRef.current = gain;
    } catch {
      // Audio not permitted
    }
  }, []);

  const updateEnginePitch = useCallback((mult: number) => {
    if (engineOscRef.current && audioContextRef.current) {
      try {
        const targetFreq = Math.min(650, 110 + (mult - 1.0) * 80);
        engineOscRef.current.frequency.setTargetAtTime(targetFreq, audioContextRef.current.currentTime, 0.1);
      } catch {}
    }
  }, []);

  const stopEngineSound = useCallback(() => {
    if (engineOscRef.current) {
      try {
        engineOscRef.current.stop();
        engineOscRef.current.disconnect();
      } catch {}
      engineOscRef.current = null;
    }
  }, []);

  // Load config, history, and check for active session recovery
  const loadConfigAndHistory = useCallback(async () => {
    try {
      const cfgRes = await api.getAvionCrashConfig();
      if (cfgRes.success && cfgRes.config) {
        setMinBet(cfgRes.config.minBet || 10);
        setMaxBet(cfgRes.config.maxBet || 5000);
        setIsMaintenance(Boolean(cfgRes.config.isMaintenance));
        setIsActive(Boolean(cfgRes.config.isActive));
      }

      const histRes = await api.getAvionCrashHistory(currentUser?.id);
      if (histRes.success) {
        if (histRes.recentMultipliers) {
          setRecentMultipliers(histRes.recentMultipliers);
        }
        if (histRes.userRounds) {
          setUserRounds(histRes.userRounds);
        }
      }

      // Check if user has an active session (Recovery on refresh / disconnect)
      if (currentUser?.id) {
        const activeRes = await api.getActiveAvionCrashRound(currentUser.id);
        if (activeRes.success && activeRes.activeRound) {
          const r = activeRes.activeRound;
          if (activeRes.hasCrashed || r.status === 'crashed') {
            setActiveRoundId(r.id);
            setBetAmount(r.betAmount);
            setCrashMultiplier(r.crashMultiplier);
            setGameState('crashed');
            setObstacleNotice(r.obstacleType || 'Avyon an kraze pandan w te dekonekte.');
          } else if (r.status === 'flying') {
            setActiveRoundId(r.id);
            setBetAmount(r.betAmount);
            targetCrashMultiplierRef.current = r.crashMultiplier;
            targetObstacleNoticeRef.current = r.obstacleType || 'zwazo';
            flightStartTimeRef.current = performance.now() - (activeRes.elapsedSec || 0) * 1000;
            setGameState('flying');
            startEngineSound();
          }
        }
      }
    } catch (err) {
      console.error('Failed to load Avion Crash config:', err);
    }
  }, [currentUser?.id, startEngineSound]);

  useEffect(() => {
    loadConfigAndHistory();
    return () => {
      stopEngineSound();
    };
  }, [loadConfigAndHistory, stopEngineSound]);

  const availableBalance = currentUser ? Math.max(0, currentUser.balance - (currentUser.reservedBalance || 0)) : 0;

  // Quick Bet Select
  const handleQuickBet = (amt: number | 'half' | 'double' | 'max') => {
    if (gameState === 'flying' || gameState === 'betting') return;
    let nextVal = betAmount;
    if (typeof amt === 'number') {
      nextVal = amt;
    } else if (amt === 'half') {
      nextVal = Math.max(minBet, Math.floor(betAmount / 2));
    } else if (amt === 'double') {
      nextVal = Math.min(maxBet, betAmount * 2);
    } else if (amt === 'max') {
      nextVal = Math.min(maxBet, Math.max(minBet, Math.floor(availableBalance)));
    }
    setBetAmount(nextVal);
    setBetInput(nextVal.toString());
    setErrorMessage(null);
  };

  const handleInputChange = (val: string) => {
    setBetInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setBetAmount(parsed);
      setErrorMessage(null);
    }
  };

  // Helper when crash happens
  const handleCrashHappened = useCallback((crashedAt: number, obstacleTypeKey?: string) => {
    stopEngineSound();

    setGameState((current) => {
      // If already cashed out successfully, a subsequent crash CANNOT cancel or alter winnings!
      if (current === 'cashed_out') return current;

      setCrashMultiplier(crashedAt);
      playCrashBoomSound();

      // Screen shake trigger
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 600);

      let notice = 'Avyon an kraze bridsoukou !';
      if (crashedAt <= 1.15 || obstacleTypeKey === 'pann_mote') {
        notice = 'Pann motè brid sou kou nan depegolaj !';
      } else if (crashedAt < 1.6 || obstacleTypeKey === 'zwazo') {
        notice = 'Twoupo zwazo sovaj frape zèl avyon an !';
      } else if (crashedAt < 2.8 || obstacleTypeKey === 'loraj') {
        notice = 'Gwo kout zèklè ak loraj frape avyon an !';
      } else if (crashedAt < 6.0 || obstacleTypeKey === 'tibilans') {
        notice = 'Gwo tibilans stratosferik kraze zèl avyon an !';
      } else {
        notice = 'Yon meteyò nan lespas siperyè detwi vòl la !';
      }
      setObstacleNotice(notice);

      if (activeRoundIdRef.current && currentUser) {
        api.notifyAvionCrash(activeRoundIdRef.current, currentUser.id).catch(() => {});
      }

      setRecentMultipliers((prev) => [
        {
          id: activeRoundIdRef.current || `crash_${Date.now()}`,
          multiplier: crashedAt,
          status: 'crashed',
          time: new Date().toISOString()
        },
        ...prev.slice(0, 24)
      ]);

      return 'crashed';
    });
  }, [currentUser, playCrashBoomSound, stopEngineSound]);

  // Place Bet and launch server round
  const handlePlaceBet = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (isMaintenance) {
      setErrorMessage('Avion Crash an antretyen pou kounye a. Tanpri eseye pita.');
      return;
    }

    if (!isActive) {
      setErrorMessage('Avion Crash dezaktive pou kounye a pa administratè a.');
      return;
    }

    const bet = Math.floor(Number(betInput));
    if (isNaN(bet) || bet < minBet) {
      setErrorMessage(`Miz minimòm lan se ${minBet} HTG.`);
      return;
    }
    if (bet > maxBet) {
      setErrorMessage(`Miz maksimòm lan se ${maxBet} HTG.`);
      return;
    }
    if (availableBalance < bet) {
      setErrorMessage(`Balans ou pa ase (${availableBalance.toLocaleString()} HTG). Fè yon depo NatCash.`);
      return;
    }

    setErrorMessage(null);
    setGameState('betting');
    isCashingOutRef.current = false;
    setIsSubmittingCashout(false);
    setCashedMultiplier(null);
    setCashedPayout(null);
    setCashedProfit(null);
    setCrashMultiplier(null);
    setObstacleNotice(null);
    setCurrentMultiplier(1.0);

    try {
      const res = await api.placeAvionCrashBet(currentUser.id, bet);
      if (!res.success || !res.roundId) {
        setGameState('idle');
        setErrorMessage(res.error || 'Erè nan plase miz la sou sèvè a.');
        return;
      }

      // Successfully placed! Money is deducted on server and enters isolated game session
      setActiveRoundId(res.roundId);
      setActiveSeedHash(res.seedHash || null);
      targetCrashMultiplierRef.current = res.crashMultiplier || 1.10;
      targetObstacleNoticeRef.current = res.obstacleType || 'zwazo';

      if (res.user) {
        onBalanceUpdate(res.user);
      } else if (res.newBalance !== undefined) {
        onBalanceUpdate({ ...currentUser, balance: res.newBalance });
      }

      gameAudio.play('alert');
      startEngineSound();

      // Start Flight Animation
      flightStartTimeRef.current = performance.now();
      setGameState('flying');
    } catch (err: any) {
      setGameState('idle');
      setErrorMessage(err.message || 'Pwoblèm rezo pandan plasman miz la.');
    }
  };

  // Cash Out handler: "RETIRE KÒB MWEN"
  const handleCashout = async () => {
    // Prevent double clicking or cashout when not flying
    if (gameState !== 'flying' || !activeRoundId || !currentUser || isCashingOutRef.current) return;
    isCashingOutRef.current = true;
    setIsSubmittingCashout(true);

    const multToClaim = currentMultiplier;

    try {
      const res = await api.cashoutAvionCrash(activeRoundId, currentUser.id, multToClaim);
      if (res.success && res.cashedOut) {
        // Cashed out successfully!
        stopEngineSound();
        gameAudio.play('win');
        setGameState('cashed_out');
        const finalMult = res.multiplier || multToClaim;
        const finalPayout = res.payout || Math.round(betAmount * finalMult);
        const finalProfit = res.netProfit || finalPayout - betAmount;

        setCashedMultiplier(finalMult);
        setCashedPayout(finalPayout);
        setCashedProfit(finalProfit);

        if (res.user) {
          onBalanceUpdate(res.user);
        } else if (res.newBalance !== undefined) {
          onBalanceUpdate({ ...currentUser, balance: res.newBalance });
        }

        // Add to history
        setRecentMultipliers((prev) => [
          {
            id: activeRoundId,
            multiplier: finalMult,
            status: 'cashed_out',
            time: new Date().toISOString()
          },
          ...prev.slice(0, 24)
        ]);
      } else if (res.crashed) {
        // Crashed before cashout was acknowledged by server
        handleCrashHappened(res.crashMultiplier || currentMultiplier, res.error);
      } else {
        setErrorMessage(res.error || 'Erè pandan retrè kòb la.');
        isCashingOutRef.current = false;
        setIsSubmittingCashout(false);
      }
    } catch (err: any) {
      console.error('Cashout error:', err);
      isCashingOutRef.current = false;
      setIsSubmittingCashout(false);
    }
  };

  // Replay: Reset to idle for a new session
  const handleReplay = () => {
    setGameState('idle');
    setCurrentMultiplier(1.0);
    setCrashMultiplier(null);
    setCashedMultiplier(null);
    setCashedPayout(null);
    setCashedProfit(null);
    setObstacleNotice(null);
    setActiveRoundId(null);
    setActiveSeedHash(null);
    isCashingOutRef.current = false;
    setIsSubmittingCashout(false);
    setErrorMessage(null);
  };

  // Canvas Flight Animation & Multiplier Math Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = (time: number) => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Dynamic Sky background based on flight state
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (gameState === 'crashed') {
        bgGrad.addColorStop(0, '#450a0a'); // Dark red crash smoke
        bgGrad.addColorStop(0.5, '#1e1017');
        bgGrad.addColorStop(1, '#090d16');
      } else if (gameState === 'cashed_out') {
        bgGrad.addColorStop(0, '#064e3b'); // Golden/Emerald victory sky
        bgGrad.addColorStop(0.5, '#0b2e2b');
        bgGrad.addColorStop(1, '#050811');
      } else {
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.5, '#0c172e');
        bgGrad.addColorStop(1, '#050811');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Starfield / speed lines animation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      const t = time * 0.08;
      for (let i = 0; i < 45; i++) {
        const sx = (i * 37 + (gameState === 'flying' ? -t * 3 : 0)) % width;
        const realSx = sx < 0 ? sx + width : sx;
        const sy = (i * 43 + (gameState === 'flying' ? t * 1.8 : 0)) % height;
        ctx.fillRect(realSx, sy, (i % 3 === 0) ? 2 : 1, (i % 3 === 0) ? 2 : 1);
      }

      // Runway at bottom
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 30);
      ctx.lineTo(width, height - 30);
      ctx.stroke();

      // Multiplier updates when flying
      if (gameState === 'flying') {
        const elapsedSec = (time - flightStartTimeRef.current) / 1000;
        // Fast, high-tension exponential growth
        const mult = 1.0 + 0.07 * Math.pow(elapsedSec, 1.5);
        const formatted = Math.floor(mult * 100) / 100;
        setCurrentMultiplier(formatted);
        updateEnginePitch(formatted);

        // Check predetermined crash multiplier (Ekstrèmman difisil)
        if (targetCrashMultiplierRef.current && formatted >= targetCrashMultiplierRef.current) {
          handleCrashHappened(targetCrashMultiplierRef.current, targetObstacleNoticeRef.current);
          return;
        }

        // Flight coordinates on canvas
        const progressNorm = Math.min(1.0, elapsedSec / 10);
        const planeX = 40 + progressNorm * (width - 120);
        const planeY = (height - 40) - Math.pow(progressNorm, 0.85) * (height - 100);

        // Draw flight curve trail (glowing trajectory)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(40, height - 40);
        ctx.quadraticCurveTo(planeX * 0.5, height - 35, planeX, planeY);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Area under the curve gradient
        ctx.lineTo(planeX, height - 30);
        ctx.lineTo(40, height - 30);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, planeY, 0, height - 30);
        areaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = areaGrad;
        ctx.fill();
        ctx.restore();

        // Draw Jet Afterburner Flame Exhaust
        ctx.save();
        ctx.translate(planeX, planeY);
        const angle = -Math.atan2((height - 40) - planeY, planeX - 40) * 0.45;
        ctx.rotate(angle);

        // Flame animation
        const flameLength = 20 + Math.random() * 12;
        const flameGrad = ctx.createLinearGradient(-flameLength, 0, 0, 0);
        flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        flameGrad.addColorStop(0.4, '#f97316');
        flameGrad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-flameLength, 0);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.fill();

        // Airplane Body (modern supersonic jet silhouette)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(24, 0); // nose
        ctx.lineTo(-14, -8); // top wing
        ctx.lineTo(-8, -1);
        ctx.lineTo(-18, -1);
        ctx.lineTo(-22, -7); // tail top
        ctx.lineTo(-20, 0);
        ctx.lineTo(-22, 7); // tail bottom
        ctx.lineTo(-18, 1);
        ctx.lineTo(-8, 1);
        ctx.lineTo(-14, 8); // bottom wing
        ctx.closePath();
        ctx.fill();

        // Cockpit glass
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(10, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw animated obstacles at altitude
        if (formatted > 1.25 && formatted < 2.5) {
          // Thunderstorm cloud
          ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
          ctx.beginPath();
          ctx.arc(width - 90, 80, 24, 0, Math.PI * 2);
          ctx.arc(width - 70, 75, 30, 0, Math.PI * 2);
          ctx.arc(width - 50, 80, 24, 0, Math.PI * 2);
          ctx.fill();
        } else if (formatted >= 2.5 && formatted < 6.0) {
          // Birds flock
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
          ctx.lineWidth = 2;
          for (let b = 0; b < 3; b++) {
            const bx = width - 80 + b * 20;
            const by = 60 + b * 10;
            ctx.beginPath();
            ctx.moveTo(bx - 6, by - 4);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + 6, by - 4);
            ctx.stroke();
          }
        }
      } else if (gameState === 'crashed') {
        // Dramatic explosion blast on screen
        const expX = width * 0.65;
        const expY = height * 0.4;

        ctx.save();
        ctx.translate(expX, expY);

        // Shockwave expansion ring
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();

        // Explosion blast circles
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Flying fiery debris particles
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI * 2) / 10 + 0.3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 55, Math.sin(a) * 55, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dark smoke puffs
        ctx.fillStyle = '#334155';
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI * 2) / 8;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 45, Math.sin(a) * 45, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // Grounded on runway
        ctx.save();
        ctx.translate(60, height - 42);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -7);
        ctx.lineTo(-6, -1);
        ctx.lineTo(-16, -1);
        ctx.lineTo(-20, -6);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-20, 6);
        ctx.lineTo(-16, 1);
        ctx.lineTo(-6, 1);
        ctx.lineTo(-12, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, handleCrashHappened, updateEnginePitch]);

  const toggleSound = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
    if (muted) stopEngineSound();
  };

  const currentPotentialPayout = Math.round(betAmount * currentMultiplier);
  const currentPotentialProfit = currentPotentialPayout - betAmount;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-950 text-white p-3 select-none pb-24">
      {/* Top Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-xl text-slate-950 shadow-md">
            <Plane className="w-5 h-5 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm tracking-wide text-white">AVION CRASH</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1">
                <Coins className="w-3 h-3" /> VRÈ LAJAN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Mize ak lajan reyèl sou balans kont ou</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            aria-label="Sound Toggle"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* History modal toggle */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
            title="Gade istwa miz ak rezilta ou yo"
          >
            <History className="w-4 h-4 text-amber-400" />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              disabled={gameState === 'flying'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-xl text-slate-200"
            >
              Kite
            </button>
          )}
        </div>
      </div>

      {/* Real Money Balance & Deposit Bar */}
      <div className="w-full max-w-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Balans Lajan Reyèl Ou
            </span>
            <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5 tabular-nums">
              <span>{currentUser ? `${availableBalance.toLocaleString()} HTG` : '0 HTG'}</span>
              {!currentUser && (
                <span className="text-xs text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-md">
                  Poko konekte
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          {currentUser ? (
            <button
              onClick={onOpenDeposit}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Depo NatCash</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Konekte</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Visible Warning Banner (Requirement 5) */}
      <div className="w-full max-w-2xl mb-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
        <span>Si avyon an kraze anvan ou retire kòb ou, ou pèdi miz sesyon sa a.</span>
      </div>

      {/* Multiplier History Strip (Recent Crashes) */}
      <div className="w-full max-w-2xl mb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-cyan-400" /> Dènye:
        </span>
        {recentMultipliers.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Pa gen rezilta poko</span>
        ) : (
          recentMultipliers.slice(0, 15).map((item, idx) => {
            const mult = Number(item.multiplier || 1.0);
            const isHigh = mult >= 5.0;
            const isMid = mult >= 2.0;
            return (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-tight shrink-0 transition-all border ${
                  isHigh
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : isMid
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}
              >
                x{mult.toFixed(2)}
              </span>
            );
          })
        )}
      </div>

      {/* Main Crash Flight Stage (Canvas Arena) */}
      <div className={`relative w-full max-w-2xl aspect-[16/10] bg-slate-950 rounded-3xl border-2 ${
        gameState === 'crashed'
          ? 'border-rose-600 shadow-rose-950/50'
          : gameState === 'cashed_out'
          ? 'border-emerald-500 shadow-emerald-950/50'
          : 'border-slate-800'
      } shadow-2xl overflow-hidden flex flex-col justify-between p-4 transition-all duration-300 ${
        isScreenShaking ? 'translate-x-1 translate-y-1' : ''
      }`}>
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Top Floating Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-slate-300 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sèvè MASTER PLAY — Pwoteje</span>
          </div>

          {gameState === 'flying' && (
            <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black animate-pulse flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>AVYON AN AP MONTE</span>
            </div>
          )}
        </div>

        {/* Multiplier Center Display */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center pointer-events-none">
          {gameState === 'crashed' ? (
            /* CRASH STATE (Requirement 2) */
            <div className="space-y-2 animate-in zoom-in-95 duration-200">
              <div className="text-5xl sm:text-7xl font-black text-rose-500 tracking-tighter drop-shadow-2xl">
                x{crashMultiplier ? crashMultiplier.toFixed(2) : '1.00'}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-rose-600 text-white font-black text-sm sm:text-base uppercase tracking-wider inline-flex items-center gap-2 shadow-2xl">
                <Skull className="w-5 h-5 text-yellow-300" />
                <span>CRASH! Ou pèdi miz ou pou sesyon sa a.</span>
              </div>
              {obstacleNotice && (
                <p className="text-xs text-rose-300 max-w-sm mx-auto font-bold drop-shadow mt-1">
                  {obstacleNotice}
                </p>
              )}
            </div>
          ) : gameState === 'cashed_out' ? (
            /* CASHOUT STATE (Requirement 1) */
            <div className="space-y-2 animate-in zoom-in-95 duration-200">
              <div className="text-5xl sm:text-7xl font-black text-emerald-400 tracking-tighter drop-shadow-2xl">
                x{cashedMultiplier ? cashedMultiplier.toFixed(2) : currentMultiplier.toFixed(2)}
              </div>
              <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Felisitasyon! Ou retire kòb ou avèk siksè.</span>
              </div>
              <div className="text-sm font-black text-emerald-300">
                +{cashedPayout?.toLocaleString()} HTG kredite nan balans kont ou
              </div>
            </div>
          ) : gameState === 'flying' ? (
            /* FLYING STATE */
            <div className="space-y-1">
              <div className="text-6xl sm:text-8xl font-black text-white tracking-tighter drop-shadow-2xl tabular-nums">
                x{currentMultiplier.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm font-black text-cyan-400 uppercase tracking-widest">
                Miltiplikatè aktyèl la
              </div>
            </div>
          ) : (
            /* IDLE STATE */
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-3xl mx-auto shadow-inner text-amber-400">
                ✈️
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-200">
                Pare pou Depegolaj
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                Chwazi miz ou anba a epi peze <strong>PLASE MIZ LA</strong> pou kòmanse sesyon an.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Safety Info Bar */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
          <span>Min: {minBet} HTG • Max: {maxBet.toLocaleString()} HTG</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sèvè Sekirize (Provably Fair)
          </span>
        </div>
      </div>

      {/* Error / Alert Message Banner */}
      {errorMessage && (
        <div className="w-full max-w-2xl mt-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Interactive Action Controls Panel */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 mt-3 shadow-xl">
        {gameState === 'flying' ? (
          /* REQUIREMENT 1: GIANT BUTTON "RETIRE KÒB MWEN" */
          <div className="space-y-3">
            <button
              onClick={handleCashout}
              disabled={isCashingOutRef.current || isSubmittingCashout}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 disabled:opacity-60 text-slate-950 font-black text-xl sm:text-2xl uppercase tracking-wider shadow-2xl shadow-emerald-500/50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border-2 border-emerald-300"
            >
              <div className="flex items-center gap-2">
                <span>RETIRE KÒB MWEN</span>
                <span className="text-base font-black bg-slate-950 text-emerald-400 px-2.5 py-0.5 rounded-xl border border-emerald-500/50">
                  x{currentMultiplier.toFixed(2)}
                </span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                Montan k ap rantre: {currentPotentialPayout.toLocaleString()} HTG (+{currentPotentialProfit.toLocaleString()} HTG pwofi)
              </div>
            </button>

            <div className="flex justify-between items-center text-xs text-slate-400 px-1">
              <span>Miz sesyon sa a: <strong className="text-white">{betAmount} HTG</strong></span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Peze anvan avyon an kraze !
              </span>
            </div>
          </div>
        ) : gameState === 'cashed_out' ? (
          /* CASHOUT RECAP & REPLAY (Requirement 1 & 5) */
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Kantite ou te mete a :</span>
                <span className="font-bold text-white font-mono">{betAmount} HTG</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Miltiplikatè final la :</span>
                <span className="font-black text-emerald-400 font-mono text-sm">
                  x{cashedMultiplier?.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Benefis nèt ou :</span>
                <span className="font-black text-emerald-400 font-mono text-sm">
                  +{cashedProfit?.toLocaleString()} HTG
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20 font-bold">
                <span className="text-slate-200">Total ki antre nan kont ou :</span>
                <span className="font-black text-emerald-300 font-mono text-base">
                  {cashedPayout?.toLocaleString()} HTG
                </span>
              </div>
            </div>

            <button
              onClick={handleReplay}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>REJWE</span>
            </button>
          </div>
        ) : gameState === 'crashed' ? (
          /* CRASH RECAP & REPLAY (Requirement 2 & 5) */
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Miz pèdi pou sesyon sa a :</span>
                <span className="font-bold text-rose-400 font-mono">-{betAmount} HTG</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Miltiplikatè avyon an te kraze :</span>
                <span className="font-black text-rose-400 font-mono text-sm">
                  x{crashMultiplier?.toFixed(2)}
                </span>
              </div>
              {obstacleNotice && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-500/20">
                  Kòz aksidan an: <strong className="text-rose-300">{obstacleNotice}</strong>
                </div>
              )}
            </div>

            <button
              onClick={handleReplay}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-base uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>REJWE</span>
            </button>
          </div>
        ) : (
          /* BET PLACEMENT CONTROLS (IDLE STATE) */
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs text-slate-300 font-semibold mb-1.5">
                <span>Montan Miz la (HTG):</span>
                <span>Disponib: <strong className="text-emerald-400">{availableBalance.toLocaleString()} HTG</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={minBet}
                    max={maxBet}
                    value={betInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={gameState === 'betting'}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-base text-white font-mono font-bold focus:outline-none transition-colors"
                    placeholder="Montan miz"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-bold">
                    HTG
                  </span>
                </div>

                <button
                  onClick={handlePlaceBet}
                  disabled={gameState === 'betting'}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Plane className="w-4 h-4 font-black" />
                  <span>{gameState === 'betting' ? 'N ap verifye...' : 'PLASE MIZ LA'}</span>
                </button>
              </div>
            </div>

            {/* Quick Chips Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[25, 50, 100, 250, 500].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickBet(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    betAmount === chip
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +{chip} HT
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleQuickBet('half')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:border-slate-700"
              >
                1/2
              </button>
              <button
                type="button"
                onClick={() => handleQuickBet('double')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:border-slate-700"
              >
                2X
              </button>
              <button
                type="button"
                onClick={() => handleQuickBet('max')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 hover:border-amber-500/50"
              >
                MAX
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules & Information Accordion Card */}
      <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mt-3 space-y-2 text-xs text-slate-400">
        <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Règ Ofisyèl AVION CRASH nan MASTER PLAY:
        </h4>
        <ul className="space-y-1.5 list-disc list-inside text-slate-300">
          <li>Chwazi kantite lajan ou vle mize (ant {minBet} ak {maxBet.toLocaleString()} HTG).</li>
          <li>Montan sa a retire dirèkteman sou balans kont ou epi antre nan sesyon an.</li>
          <li>Avyon an pran vòl epi miltiplikatè a monte an tan reyèl (x1.00, x1.20, x2.00, x5.00...).</li>
          <li>Peze <strong>« RETIRE KÒB MWEN »</strong> nenpòt moman anvan avyon an kraze pou touche tout gany ou.</li>
          <li>Si avyon an kraze anvan ou retire kòb la, ou pèdi miz sesyon sa a.</li>
          <li>Rezilta chak sesyon kalkile davans avèk yon sistèm o aza kriptografik ki verifyab.</li>
        </ul>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Istwa Wonn Ou Yo
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {userRounds.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">
                  Ou poko jwe okenn wonn nan Avion Crash.
                </div>
              ) : (
                userRounds.map((r, i) => (
                  <div
                    key={r.id || i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        Miz: {r.betAmount} HTG
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.startTime).toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' })} • Aksidan nan x{r.crashMultiplier}
                      </div>
                    </div>

                    <div className="text-right">
                      {r.status === 'cashed_out' ? (
                        <div>
                          <span className="font-black text-emerald-400 text-sm">
                            +{r.payoutAmount} HTG
                          </span>
                          <span className="text-[10px] text-emerald-500 block">
                            x{r.cashoutMultiplier} (Genyen)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-black text-rose-400 text-sm">
                            -{r.betAmount} HTG
                          </span>
                          <span className="text-[10px] text-rose-500 block">
                            Pèdi
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Fèmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvionCrash;
