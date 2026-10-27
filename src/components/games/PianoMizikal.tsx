import React, { useState, useEffect, useRef } from 'react';
import { User, Game, UserGameProgress } from '../../types';
import { api } from '../../services/api';
import { Music, Play, RotateCcw, Volume2, VolumeX, Award, CheckCircle, Lock, Star, ChevronRight, Zap } from 'lucide-react';

interface PianoMizikalProps {
  currentUser?: User | null;
  user?: User;
  game?: Game;
  onBack?: () => void;
  onUpdateUser?: (user: User) => void;
  onBalanceUpdate?: (user: User) => void;
  onGameOver?: (score: number, prize?: number, levelReached?: number) => void;
}

interface NotePattern {
  id: number;
  lane: number; // 0, 1, 2, 3
  pitch: string; // note name e.g. 'C4'
  freq: number;
  y: number; // percentage down the screen (0 to 100)
  hit: boolean;
  missed: boolean;
}

interface SongLevel {
  level: number;
  title: string;
  tempoBpm: number;
  durationSec: number;
  speed: number; // pixels per frame or speed multiplier
  description: string;
  notes: { lane: number; pitch: string; freq: number; delayMs: number }[];
}

// Frequency map for standard notes
const NOTE_FREQS: Record<string, number> = {
  'C4': 261.63,
  'D4': 293.66,
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25,
  'D5': 587.33,
  'E5': 659.25,
  'G5': 783.99,
};

// 7 Progressive Songs
const SONGS: SongLevel[] = [
  {
    level: 1,
    title: "Melodi Dous",
    tempoBpm: 75,
    durationSec: 25,
    speed: 0.45,
    description: "Mo ralanti pou aprann kowòdone dwèt ou sou 4 tras yo.",
    notes: [
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 1200 },
      { lane: 1, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 2400 },
      { lane: 2, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 3600 },
      { lane: 3, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 4800 },
      { lane: 2, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 6000 },
      { lane: 1, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 7200 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 8400 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 9800 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 11200 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 12600 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 14000 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 15400 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 16800 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 18200 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 19600 },
    ]
  },
  {
    level: 2,
    title: "Ti Zwazo Chante",
    tempoBpm: 90,
    durationSec: 28,
    speed: 0.55,
    description: "Yon ti kout ritm ki pi rapid avèk nòt ki fofile.",
    notes: [
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 1000 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 1800 },
      { lane: 3, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 2600 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 3400 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 4200 },
      { lane: 0, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 5000 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 5800 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 6600 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 7600 },
      { lane: 2, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 8600 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 9600 },
      { lane: 0, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 10600 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 11600 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 12600 },
      { lane: 3, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 13600 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 14800 },
      { lane: 1, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 16000 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 17200 },
    ]
  },
  {
    level: 3,
    title: "Ritm Konpa Dous",
    tempoBpm: 105,
    durationSec: 30,
    speed: 0.65,
    description: "Senkòp gita ak tanbou kote nòt yo desann nan vitès mwayen.",
    notes: [
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 900 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 1600 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 2200 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 2900 },
      { lane: 2, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 3600 },
      { lane: 1, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 4300 },
      { lane: 0, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 5000 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 5700 },
      { lane: 3, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 6400 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 7200 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 8000 },
      { lane: 3, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 8800 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 9600 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 10400 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 11200 },
      { lane: 3, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 12000 },
      { lane: 1, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 12900 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 13800 },
      { lane: 2, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 14700 },
      { lane: 3, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 15600 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 16500 },
    ]
  },
  {
    level: 4,
    title: "Tanbou Rara",
    tempoBpm: 120,
    durationSec: 32,
    speed: 0.75,
    description: "Korelasyon vivan avèk batri rara ki mande kowòdinasyon rapid.",
    notes: [
      { lane: 0, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 800 },
      { lane: 1, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 1300 },
      { lane: 2, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 1800 },
      { lane: 3, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 2300 },
      { lane: 1, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 2800 },
      { lane: 2, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 3300 },
      { lane: 0, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 3900 },
      { lane: 3, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 4500 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 5100 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 5700 },
      { lane: 0, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 6300 },
      { lane: 2, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 6900 },
      { lane: 3, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 7500 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 8200 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 8900 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 9600 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 10300 },
      { lane: 2, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 11000 },
      { lane: 1, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 11700 },
      { lane: 0, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 12400 },
      { lane: 2, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 13200 },
      { lane: 3, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 14000 },
    ]
  },
  {
    level: 5,
    title: "Kèkè Challenge Beat",
    tempoBpm: 135,
    durationSec: 35,
    speed: 0.85,
    description: "Batman frapan ak anpil nòt ki mande presizyon segondè.",
    notes: [
      { lane: 3, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 700 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 1100 },
      { lane: 1, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 1500 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 1900 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 2300 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 2700 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 3100 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 3600 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 4100 },
      { lane: 1, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 4600 },
      { lane: 3, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 5100 },
      { lane: 2, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 5600 },
      { lane: 0, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 6200 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 6800 },
      { lane: 3, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 7400 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 8000 },
      { lane: 1, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 8600 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 9200 },
      { lane: 3, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 9800 },
      { lane: 2, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 10400 },
      { lane: 1, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 11000 },
      { lane: 0, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 11600 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 12300 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 13000 },
    ]
  },
  {
    level: 6,
    title: "Senkòp & Akò",
    tempoBpm: 150,
    durationSec: 36,
    speed: 0.95,
    description: "Kombinasyon rapid sou tout liy yo. Pa kite okenn touche pase!",
    notes: [
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 600 },
      { lane: 1, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 950 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 1300 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 1650 },
      { lane: 2, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 2000 },
      { lane: 1, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 2350 },
      { lane: 0, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 2700 },
      { lane: 3, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 3050 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 3450 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 3850 },
      { lane: 0, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 4250 },
      { lane: 3, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 4650 },
      { lane: 2, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 5050 },
      { lane: 1, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 5450 },
      { lane: 0, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 5900 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 6350 },
      { lane: 2, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 6800 },
      { lane: 1, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 7250 },
      { lane: 0, pitch: 'G5', freq: NOTE_FREQS['G5'], delayMs: 7700 },
      { lane: 3, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 8200 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 8700 },
      { lane: 1, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 9200 },
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 9700 },
      { lane: 2, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 10200 },
      { lane: 3, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 10700 },
      { lane: 1, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 11200 },
    ]
  },
  {
    level: 7,
    title: "Virtuoz Mèt Piano",
    tempoBpm: 165,
    durationSec: 38,
    speed: 1.05,
    description: "Dènye defi a! Vitès maksimòm ak kaskad nòt mizikal.",
    notes: [
      { lane: 0, pitch: 'C4', freq: NOTE_FREQS['C4'], delayMs: 500 },
      { lane: 1, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 800 },
      { lane: 2, pitch: 'E4', freq: NOTE_FREQS['E4'], delayMs: 1100 },
      { lane: 3, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 1400 },
      { lane: 2, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 1700 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 2000 },
      { lane: 0, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 2300 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 2600 },
      { lane: 2, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 2950 },
      { lane: 1, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 3300 },
      { lane: 0, pitch: 'G5', freq: NOTE_FREQS['G5'], delayMs: 3650 },
      { lane: 3, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 4000 },
      { lane: 2, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 4350 },
      { lane: 1, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 4700 },
      { lane: 0, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 5050 },
      { lane: 2, pitch: 'D4', freq: NOTE_FREQS['D4'], delayMs: 5450 },
      { lane: 3, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 5850 },
      { lane: 1, pitch: 'B4', freq: NOTE_FREQS['B4'], delayMs: 6250 },
      { lane: 0, pitch: 'D5', freq: NOTE_FREQS['D5'], delayMs: 6650 },
      { lane: 2, pitch: 'F4', freq: NOTE_FREQS['F4'], delayMs: 7100 },
      { lane: 3, pitch: 'A4', freq: NOTE_FREQS['A4'], delayMs: 7550 },
      { lane: 1, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 8000 },
      { lane: 0, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 8450 },
      { lane: 3, pitch: 'G5', freq: NOTE_FREQS['G5'], delayMs: 8900 },
      { lane: 2, pitch: 'E5', freq: NOTE_FREQS['E5'], delayMs: 9400 },
      { lane: 1, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 9900 },
      { lane: 0, pitch: 'G4', freq: NOTE_FREQS['G4'], delayMs: 10400 },
      { lane: 3, pitch: 'C5', freq: NOTE_FREQS['C5'], delayMs: 11000 },
    ]
  }
];

export const PianoMizikal: React.FC<PianoMizikalProps> = ({
  currentUser,
  user,
  game,
  onBack,
  onUpdateUser,
  onBalanceUpdate,
  onGameOver,
}) => {
  const activeUser = currentUser || user || ({
    id: 'guest',
    name: 'Jwè',
    fullName: 'Jwè Envite',
    phoneNumber: '50900000000',
    profilePhoto: '',
    level: 1,
    balance: 0,
    points: 0,
    createdAt: new Date().toISOString()
  } as User);
  const activeGameId = game?.id || 'game_pianomizikal';
  const activeGameFee = game?.entryFee || 45;

  const notifyUserUpdate = (u: User) => {
    if (onUpdateUser) onUpdateUser(u);
    if (onBalanceUpdate) onBalanceUpdate(u);
  };

  const [progress, setProgress] = useState<UserGameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Game state
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'paused' | 'won' | 'lost' | 'champion'>('lobby');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedbackText, setFeedbackText] = useState<{ text: string; color: string; lane: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [accuracy, setAccuracy] = useState(100);

  // Active notes on board
  const [activeNotes, setActiveNotes] = useState<NotePattern[]>([]);
  const activeNotesRef = useRef<NotePattern[]>([]);
  activeNotesRef.current = activeNotes;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const hitStatsRef = useRef({ perfect: 0, good: 0, missed: 0, total: 0 });

  // Init AudioContext on user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSynthNote = (freq: number, type: 'note' | 'miss' | 'win' = 'note') => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'miss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        return;
      }

      if (type === 'win') {
        [440, 554.37, 659.25, 880].forEach((f, idx) => {
          const winOsc = ctx.createOscillator();
          const winGain = ctx.createGain();
          winOsc.type = 'triangle';
          winOsc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.1);
          winGain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
          winGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
          winOsc.connect(winGain);
          winGain.connect(ctx.destination);
          winOsc.start(ctx.currentTime + idx * 0.1);
          winOsc.stop(ctx.currentTime + idx * 0.1 + 0.45);
        });
        return;
      }

      // Realistic rich piano synthesizer with triangle + sine harmonics
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio playback failsafe
    }
  };

  // Load user progress
  useEffect(() => {
    loadProgress();
  }, [activeGameId, activeUser.id]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const res = await api.getGameProgress(activeGameId, activeUser.id);
      if (res.success && res.progress) {
        setProgress(res.progress);
        setSelectedLevel(res.progress.currentLevel || 1);
      }
    } catch (err: unknown) {
      console.error("Failed to load Piano Mizikal progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayEntry = async () => {
    if (activeUser.balance < activeGameFee) {
      setErrorMsg(`Balans ou pa ase (${activeUser.balance.toFixed(2)} HT). Pri antre a se ${activeGameFee} HT. Tanpri rechaje kont ou.`);
      return;
    }
    try {
      setPaying(true);
      setErrorMsg('');
      const res = await api.payGameSession(activeGameId, activeUser.id);
      if (res.success && res.progress) {
        setProgress(res.progress);
        if (res.user) {
          notifyUserUpdate(res.user);
        }
      } else {
        setErrorMsg(res.error || "Peman an pa pase.");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Erè koneksyon.");
    } finally {
      setPaying(false);
    }
  };

  // Clean animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startLevel = (lvlNum: number) => {
    initAudio();
    setSelectedLevel(lvlNum);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFeedbackText(null);
    setAccuracy(100);
    hitStatsRef.current = { perfect: 0, good: 0, missed: 0, total: 0 };

    const currentSong = SONGS.find(s => s.level === lvlNum) || SONGS[0];
    hitStatsRef.current.total = currentSong.notes.length;

    // Build notes list
    const preparedNotes: NotePattern[] = currentSong.notes.map((n, i) => ({
      id: i,
      lane: n.lane,
      pitch: n.pitch,
      freq: n.freq,
      y: -10 - (n.delayMs / 30), // initial position above screen
      hit: false,
      missed: false,
    }));

    setActiveNotes(preparedNotes);
    activeNotesRef.current = preparedNotes;
    setGameState('playing');
    startTimeRef.current = Date.now();

    // Start game loop
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    lastTimestampRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const lastTimestampRef = useRef<number>(0);

  const gameLoop = (timestamp: number) => {
    const delta = (timestamp - (lastTimestampRef.current || timestamp)) / 16.66; // normalize to ~60fps
    lastTimestampRef.current = timestamp;

    const currentSong = SONGS.find(s => s.level === selectedLevel) || SONGS[0];
    const speed = currentSong.speed * (delta || 1);

    let hasActiveNotesLeft = false;
    let anyMissedNow = false;

    const updated = activeNotesRef.current.map(note => {
      if (note.hit) return note;

      const nextY = note.y + speed;

      // Missed threshold: passed past the hit zone (86% to 98%)
      if (nextY > 96 && !note.missed && !note.hit) {
        note.missed = true;
        anyMissedNow = true;
        hitStatsRef.current.missed++;
      }

      if (!note.hit && nextY < 105) {
        hasActiveNotesLeft = true;
      }

      return {
        ...note,
        y: nextY
      };
    });

    if (anyMissedNow) {
      setCombo(0);
      playSynthNote(100, 'miss');
      setFeedbackText({ text: 'RATE!', color: 'text-rose-400', lane: 1 });
      setTimeout(() => setFeedbackText(null), 500);

      // Recalculate accuracy
      const totalAttempted = hitStatsRef.current.perfect + hitStatsRef.current.good + hitStatsRef.current.missed;
      if (totalAttempted > 0) {
        const acc = Math.round(((hitStatsRef.current.perfect * 100 + hitStatsRef.current.good * 60) / (totalAttempted * 100)) * 100);
        setAccuracy(acc);
      }
    }

    activeNotesRef.current = updated;
    setActiveNotes(updated);

    // Check if song has finished
    const songTotalNotes = currentSong.notes.length;
    const resolvedNotes = hitStatsRef.current.perfect + hitStatsRef.current.good + hitStatsRef.current.missed;

    if (resolvedNotes >= songTotalNotes && !hasActiveNotesLeft) {
      handleSongComplete();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const handleLaneTap = (laneIndex: number) => {
    if (gameState !== 'playing') return;
    initAudio();

    // Hit zone is between y: 72% and y: 94%
    // Find closest note in this lane
    const notesInLane = activeNotesRef.current.filter(n => n.lane === laneIndex && !n.hit && !n.missed && n.y >= 60 && n.y <= 96);

    if (notesInLane.length === 0) {
      // Tap on empty lane: slight combo break
      setCombo(0);
      return;
    }

    // Pick closest note to center of target (y ~ 82)
    notesInLane.sort((a, b) => Math.abs(a.y - 82) - Math.abs(b.y - 82));
    const target = notesInLane[0];
    const diff = Math.abs(target.y - 82);

    let hitType: 'perfect' | 'good' | 'ok' = 'ok';
    let pts = 40;

    if (diff <= 6) {
      hitType = 'perfect';
      pts = 100;
      hitStatsRef.current.perfect++;
    } else if (diff <= 11) {
      hitType = 'good';
      pts = 60;
      hitStatsRef.current.good++;
    } else {
      hitStatsRef.current.good++;
      pts = 40;
    }

    playSynthNote(target.freq, 'note');

    target.hit = true;
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    // Multiplier calculation
    const mult = newCombo >= 20 ? 3 : newCombo >= 10 ? 2 : 1;
    setScore(s => s + pts * mult);

    const feedbackStr = hitType === 'perfect' ? 'PÈFÈ! +100' : hitType === 'good' ? 'TRÈ BON! +60' : 'BON! +40';
    const feedbackCol = hitType === 'perfect' ? 'text-amber-300' : 'text-emerald-400';
    setFeedbackText({ text: feedbackStr, color: feedbackCol, lane: laneIndex });
    setTimeout(() => setFeedbackText(null), 400);

    const totalAttempted = hitStatsRef.current.perfect + hitStatsRef.current.good + hitStatsRef.current.missed;
    if (totalAttempted > 0) {
      const acc = Math.round(((hitStatsRef.current.perfect * 100 + hitStatsRef.current.good * 60) / (totalAttempted * 100)) * 100);
      setAccuracy(acc);
    }
  };

  const handleSongComplete = async () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const totalNotes = hitStatsRef.current.total || 1;
    const hits = hitStatsRef.current.perfect + hitStatsRef.current.good;
    const finalAccuracy = Math.round((hits / totalNotes) * 100);

    // Win condition: at least 65% accuracy
    if (finalAccuracy >= 60) {
      playSynthNote(0, 'win');
      if (selectedLevel === 7) {
        setGameState('champion');
      } else {
        setGameState('won');
      }

      // Save progress to database
      try {
        const res = await api.saveGameProgress({
          gameId: activeGameId,
          userId: activeUser.id,
          level: selectedLevel,
          won: true,
          score: score + (selectedLevel * 100),
          pointsEarned: 100,
        });
        if (res.success && res.progress) {
          setProgress(res.progress);
          if (res.user) {
            notifyUserUpdate(res.user);
          }
        }
      } catch (err) {
        console.error("Failed to save Piano Mizikal level win:", err);
      }
    } else {
      setGameState('lost');
    }
  };

  const handleNextLevel = () => {
    if (selectedLevel < 7) {
      startLevel(selectedLevel + 1);
    } else {
      setGameState('lobby');
    }
  };

  const unlockedLevels = progress?.unlockedLevels || [1];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-slate-900/90 border-b border-indigo-900/40 p-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (gameState === 'playing') {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                setGameState('lobby');
              } else if (onBack) {
                onBack();
              }
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-sm transition"
          >
            ← {gameState === 'playing' ? 'Kite Pati a' : 'Retounen nan Jwèt yo'}
          </button>

          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600/30 text-indigo-400 rounded-lg">
              <Music className="w-5 h-5" />
            </span>
            <div className="text-left">
              <h1 className="font-bold text-base md:text-lg leading-tight text-white flex items-center gap-2">
                Piano Mizikal
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  7 Nivo
                </span>
              </h1>
              <p className="text-xs text-indigo-300/80">Kowòdinasyon, vitès ak bèl melodi kreyòl</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title={soundEnabled ? 'Koupe son' : 'Ouvri son'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg text-right hidden sm:block">
              <div className="text-[10px] text-amber-300 font-semibold uppercase">Balans Ou</div>
              <div className="text-xs font-bold text-amber-400">{activeUser.balance.toFixed(2)} HT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-xs underline ml-2">Fèmen</button>
          </div>
        )}

        {/* LOBBY VIEW */}
        {gameState === 'lobby' && (
          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-4 space-y-6">
            {/* Header hero */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
                <Music className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">PIANO MIZIKAL</h2>
              <p className="text-sm text-indigo-200/90 max-w-md mx-auto mb-4">
                Touche tout brik nwa yo lè yo rive sou liy anba a pou jwe melodi a san w pa rate okenn nòt!
              </p>

              {/* Progress pill */}
              <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>Pi Bon Nòt: <b>{progress?.highScore || 0}</b></span>
                </div>
                <div className="w-px h-3 bg-slate-700"></div>
                <div className="text-indigo-300">
                  Nivo Aktif: <b>{progress?.currentLevel || 1}/7</b>
                </div>
              </div>
            </div>

            {/* Entry payment check */}
            {!progress?.sessionPaid && (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-2xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-400 font-bold">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Antre nan Jwèt la</span>
                </div>
                <p className="text-xs text-amber-200/80">
                  Pri pou debloke tout 7 nivo yo se <b>{activeGameFee} HT</b>. Ou peye yon sèl fwa pou sesyon an!
                </p>
                <button
                  onClick={handlePayEntry}
                  disabled={paying}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {paying ? 'Peman an ap trete...' : `Peye ${activeGameFee} HT & Jwe`}
                </button>
              </div>
            )}

            {/* Level selection grid (7 Levels) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Chwazi Nivo (1 - 7)</h3>
                <span className="text-xs text-indigo-400 font-medium">Chak viktwa bay 100 pwen</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SONGS.map((song) => {
                  const isUnlocked = unlockedLevels.includes(song.level);
                  const isCompleted = progress?.completedLevels?.includes(song.level);

                  return (
                    <button
                      key={song.level}
                      disabled={!isUnlocked || !progress?.sessionPaid}
                      onClick={() => startLevel(song.level)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition relative overflow-hidden ${
                        !progress?.sessionPaid || !isUnlocked
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed'
                          : isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40'
                          : 'bg-indigo-950/40 border-indigo-500/40 hover:bg-indigo-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isUnlocked ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : isUnlocked ? song.level : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            Nivo {song.level}: {song.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{song.description}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {song.tempoBpm} BPM
                        </span>
                        {isUnlocked && progress?.sessionPaid && (
                          <ChevronRight className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1">
                <Music className="w-4 h-4 text-indigo-400" /> Konsèy pou jwè a:
              </div>
              <p>• Gen 4 tras vètikal sou ekran an ki koresponn ak brik yo.</p>
              <p>• Touche tras la egzakteman lè brik la antre nan rektang vètikal anba a.</p>
              <p>• Si w rive fè plis pase 60% presizyon san w pa kite tout nòt pase, w ap genyen nivo a epi pase nan pwochen an!</p>
            </div>
          </div>
        )}

        {/* PLAYING VIEW: 4 PIANO LANES */}
        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full relative select-none">
            {/* Top HUD */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Nivo {selectedLevel}</span>
                <span className="text-sm font-bold text-white">{SONGS[selectedLevel - 1]?.title}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase text-indigo-300 font-semibold block">Nòt</span>
                <span className="text-base font-black text-amber-400">{score}</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Combo</span>
                <span className="text-sm font-black text-pink-400">{combo}x</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Presizyon</span>
                <span className="text-sm font-bold text-emerald-400">{accuracy}%</span>
              </div>
            </div>

            {/* Rhythm Board: 4 vertical lanes */}
            <div className="w-full flex-1 min-h-[480px] bg-slate-950 border-2 border-indigo-900/60 rounded-2xl relative overflow-hidden grid grid-cols-4 shadow-2xl">
              {/* Lane guides & separator lines */}
              {[0, 1, 2, 3].map((laneIdx) => (
                <div
                  key={laneIdx}
                  onClick={() => handleLaneTap(laneIdx)}
                  className={`h-full border-r border-indigo-900/30 last:border-r-0 relative flex flex-col justify-end cursor-pointer active:bg-indigo-900/30 transition-colors ${
                    laneIdx % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/40'
                  }`}
                >
                  {/* Lane hit target zone at bottom */}
                  <div className="w-full h-24 border-t-2 border-indigo-500/50 bg-gradient-to-t from-indigo-600/30 to-transparent flex flex-col items-center justify-center text-xs font-bold text-indigo-400">
                    <div className="w-12 h-1 bg-indigo-400/80 rounded-full mb-1"></div>
                    <span className="text-[11px] font-mono tracking-widest text-indigo-300">TRÈT {laneIdx + 1}</span>
                  </div>
                </div>
              ))}

              {/* Falling Piano Tiles */}
              {activeNotes.map((note) => {
                if (note.hit || note.missed) return null;
                // Calculate position inside the grid
                const leftPercent = note.lane * 25;

                return (
                  <div
                    key={note.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaneTap(note.lane);
                    }}
                    style={{
                      position: 'absolute',
                      top: `${note.y}%`,
                      left: `${leftPercent}%`,
                      width: '25%',
                      height: '70px',
                    }}
                    className="p-1 cursor-pointer transition-transform"
                  >
                    <div className="w-full h-full bg-gradient-to-b from-indigo-500 via-purple-600 to-indigo-800 rounded-xl shadow-lg border border-indigo-300/40 flex flex-col items-center justify-center text-white active:scale-95 animate-pulse">
                      <Music className="w-4 h-4 text-white/80" />
                      <span className="text-[10px] font-mono font-bold text-indigo-100">{note.pitch}</span>
                    </div>
                  </div>
                );
              })}

              {/* Feedback toast overlay */}
              {feedbackText && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
                  <div className={`text-2xl font-black px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 shadow-2xl animate-bounce ${feedbackText.color}`}>
                    {feedbackText.text}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Piano Tap Bar for mobile thumbs */}
            <div className="w-full grid grid-cols-4 gap-2 mt-3 pb-2">
              {[0, 1, 2, 3].map((l) => (
                <button
                  key={l}
                  onMouseDown={() => handleLaneTap(l)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleLaneTap(l);
                  }}
                  className="py-4 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-indigo-900 hover:to-indigo-800 active:bg-indigo-600 border border-indigo-700/50 rounded-xl text-center font-black text-indigo-200 active:scale-95 shadow-lg flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xs">Liy {l + 1}</span>
                  <div className="w-3 h-3 rounded-full bg-indigo-500/60"></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VICTORY MODAL */}
        {gameState === 'won' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/40">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">FELISITASYON!</h3>
              <p className="text-sm text-emerald-300 font-medium">
                Ou reyisi Nivo {selectedLevel} avèk siksè!
              </p>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Nòt Total:</span>
                  <b className="text-amber-400 font-mono">{score}</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Presizyon:</span>
                  <b className="text-emerald-400 font-mono">{accuracy}%</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pwen Ranmase:</span>
                  <b className="text-indigo-400 font-mono">+100 Pwen</b>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {selectedLevel < 7 ? (
                  <button
                    onClick={handleNextLevel}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-xl transition shadow-lg"
                  >
                    PASE NAN PWOCHEN NIVO A →
                  </button>
                ) : null}
                <button
                  onClick={() => startLevel(selectedLevel)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition"
                >
                  REJWE NIVO SA A
                </button>
                <button
                  onClick={() => setGameState('lobby')}
                  className="w-full py-2 bg-transparent text-slate-400 hover:text-white text-xs"
                >
                  Retounen nan Meni Nivo yo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAMPION MODAL (LEVEL 7 COMPLETED) */}
        {gameState === 'champion' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-pink-500 text-slate-950 rounded-2xl mx-auto flex items-center justify-center shadow-xl rotate-3">
                <Award className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-amber-300">CHAPO! OU SE YON CHANPYON!</h3>
              <p className="text-sm text-slate-200">
                Ou fini tout 7 nivo Piano Mizikal yo! Ou se yon vrè mèt virtuoz!
              </p>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Tout 7 Nivo:</span>
                  <b className="text-emerald-400">100% Konplete</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Dènye Nòt:</span>
                  <b className="text-amber-400 font-mono">{score}</b>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pwen Total:</span>
                  <b className="text-indigo-400 font-mono">700 Pwen</b>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setGameState('lobby')}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 font-black text-slate-950 rounded-xl transition shadow-lg"
                >
                  RETOUNEN NAN MENI JWÈT LA
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Retounen nan Paj Akèy la
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOST MODAL */}
        {gameState === 'lost' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full mx-auto flex items-center justify-center">
                <RotateCcw className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">OU PÈDI NIVO A!</h3>
              <p className="text-xs text-rose-300">
                Ou rate twòp nòt oswa presizyon an te anba 60%. Eseye ankò pou debloke pwochen nivo a!
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => startLevel(selectedLevel)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 font-bold text-white rounded-xl transition shadow-lg text-sm"
                >
                  REKÒMANSE NIVO A
                </button>
                <button
                  onClick={() => setGameState('lobby')}
                  className="w-full py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
                >
                  Chwazi yon lòt nivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
