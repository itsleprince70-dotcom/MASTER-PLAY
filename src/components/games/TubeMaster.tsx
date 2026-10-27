import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Volume2, VolumeX, RotateCcw, Undo2, PlusCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface TubeMasterProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: User | null;
  onBalanceUpdate?: (user: User) => void;
}

// Audio Synthesizer for Tube Master
class TubeSoundFx {
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

  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playDrop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch {}
  }

  playInvalid() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }
}

const sfx = new TubeSoundFx();

// Palette of distinct glossy ball colors
export const TUBE_COLORS: Record<string, { bg: string; border: string; glow: string; name: string }> = {
  red: { bg: 'bg-rose-500', border: 'border-rose-300', glow: 'shadow-rose-500/50', name: 'Wouj' },
  blue: { bg: 'bg-sky-500', border: 'border-sky-300', glow: 'shadow-sky-500/50', name: 'Ble' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-300', glow: 'shadow-emerald-500/50', name: 'Vèt' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-200', glow: 'shadow-amber-400/50', name: 'Jòn' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-300', glow: 'shadow-purple-500/50', name: 'Vyolèt' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-300', glow: 'shadow-orange-500/50', name: 'Zoranj' },
  cyan: { bg: 'bg-teal-400', border: 'border-teal-200', glow: 'shadow-teal-400/50', name: 'Tirkwaz' },
  pink: { bg: 'bg-pink-500', border: 'border-pink-300', glow: 'shadow-pink-500/50', name: 'Woz' },
};

const ALL_COLOR_KEYS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'];

// Generate solvable level configurations for 7 levels
function generateLevelTubes(levelNum: number): string[][] {
  const colorCount = Math.min(8, 2 + levelNum); // Nivo 1 = 3 colors, Nivo 2 = 4, ..., Nivo 7 = 8
  const emptyTubesCount = 2;
  const colorsToUse = ALL_COLOR_KEYS.slice(0, colorCount);

  // 4 balls per color
  const allBalls: string[] = [];
  colorsToUse.forEach(c => {
    for (let i = 0; i < 4; i++) allBalls.push(c);
  });

  // Shuffle thoroughly
  for (let i = allBalls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allBalls[i], allBalls[j]] = [allBalls[j], allBalls[i]];
  }

  const tubes: string[][] = [];
  for (let i = 0; i < colorCount; i++) {
    tubes.push(allBalls.slice(i * 4, (i + 1) * 4));
  }
  for (let i = 0; i < emptyTubesCount; i++) {
    tubes.push([]);
  }

  return tubes;
}

export const TubeMaster: React.FC<TubeMasterProps> = ({ onGameOver, currentUser, onBalanceUpdate }) => {
  const [level, setLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[][][]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [levelWon, setLevelWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [extraTubeUsed, setExtraTubeUsed] = useState(false);

  // Load progress from backend
  useEffect(() => {
    if (currentUser?.id) {
      api.getGameProgress('game_tubemaster', currentUser.id).then(res => {
        if (res.success && res.progress) {
          setUnlockedLevels(res.progress.unlockedLevels || [1]);
          if (res.progress.currentLevel) setLevel(res.progress.currentLevel);
          if (res.progress.highScore) setScore(res.progress.highScore);
        }
      }).catch(err => console.error(err));
    }
  }, [currentUser?.id]);

  // Init tubes for current level
  useEffect(() => {
    initLevel(level);
  }, [level]);

  // Timer
  useEffect(() => {
    if (levelWon) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [levelWon]);

  const initLevel = (lvl: number) => {
    const generated = generateLevelTubes(lvl);
    setTubes(generated);
    setSelectedTubeIndex(null);
    setMoveHistory([]);
    setMovesCount(0);
    setMessage('');
    setLevelWon(false);
    setSeconds(0);
    setExtraTubeUsed(false);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Check victory condition: Every tube must be either completely empty OR contain exactly 4 balls of the same color
  const checkVictory = (currentTubes: string[][]) => {
    for (const tube of currentTubes) {
      if (tube.length === 0) continue;
      if (tube.length !== 4) return false;
      const firstColor = tube[0];
      if (!tube.every(b => b === firstColor)) return false;
    }
    return true;
  };

  // Handle clicking on a tube
  const handleTubeClick = async (clickedIndex: number) => {
    if (levelWon) return;

    // If no tube selected yet -> Select source tube
    if (selectedTubeIndex === null) {
      if (tubes[clickedIndex].length === 0) {
        setMessage('Tib sa a vid ! Chwazi yon tib ki gen boul ladan l.');
        return;
      }
      setSelectedTubeIndex(clickedIndex);
      setMessage('');
      sfx.playPop();
      return;
    }

    // If clicked on same tube -> Deselect
    if (selectedTubeIndex === clickedIndex) {
      setSelectedTubeIndex(null);
      sfx.playDrop();
      return;
    }

    // Try moving top ball from selectedTubeIndex to clickedIndex
    const sourceTube = tubes[selectedTubeIndex];
    const destTube = tubes[clickedIndex];
    const ballToMove = sourceTube[sourceTube.length - 1];

    // Rule 1: Destination tube must not be full (< 4 balls)
    if (destTube.length >= 4) {
      sfx.playInvalid();
      setMessage('Tib destinasyon an plen (max 4 boul) !');
      return;
    }

    // Rule 2: Destination tube must be empty OR top ball matches color
    if (destTube.length > 0 && destTube[destTube.length - 1] !== ballToMove) {
      sfx.playInvalid();
      setMessage('Koulè a pa koresponn ! Ou ka mete l sèlman sou menm koulè oswa nan yon tib vid.');
      return;
    }

    // Valid move! Save history for undo
    setMoveHistory(prev => [...prev, tubes.map(t => [...t])]);

    // Apply move
    const newTubes = tubes.map((t, idx) => {
      if (idx === selectedTubeIndex) return t.slice(0, -1);
      if (idx === clickedIndex) return [...t, ballToMove];
      return [...t];
    });

    sfx.playDrop();
    setTubes(newTubes);
    setSelectedTubeIndex(null);
    setMovesCount(m => m + 1);
    setMessage('');

    // Check if won
    if (checkVictory(newTubes)) {
      sfx.playWin();
      setLevelWon(true);
      const earned = Math.max(100, 300 - movesCount * 5 - Math.floor(seconds / 2));
      const newScore = score + earned;
      setScore(newScore);

      if (currentUser?.id) {
        try {
          const res = await api.saveGameProgress({
            gameId: 'game_tubemaster',
            userId: currentUser.id,
            level,
            won: true,
            score: newScore,
            pointsEarned: earned,
            stats: { moves: movesCount + 1, timeSeconds: seconds }
          });
          if (res.success && res.progress) {
            setUnlockedLevels(res.progress.unlockedLevels);
          }
          if (res.user && onBalanceUpdate) {
            onBalanceUpdate(res.user);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Undo last move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;
    sfx.playPop();
    const prev = moveHistory[moveHistory.length - 1];
    setTubes(prev);
    setMoveHistory(h => h.slice(0, -1));
    setSelectedTubeIndex(null);
    setMessage('');
  };

  // Add extra empty tube powerup
  const handleAddExtraTube = () => {
    if (extraTubeUsed || levelWon) return;
    setTubes(prev => [...prev, []]);
    setExtraTubeUsed(true);
    sfx.playPop();
    setMessage('Yon nouvo tib vid ajoute avèk siksè !');
  };

  const handleNextLevel = () => {
    if (level < 7) {
      setLevel(l => l + 1);
    } else {
      onGameOver(score, 0, 7);
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-teal-500/15 border border-teal-500/30">🧪</span>
          <div>
            <h3 className="text-base font-black text-white">Tube Master</h3>
            <div className="text-xs text-slate-400">Ranje koulè yo · Nivo {level} sou 7</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 font-mono">{seconds}s</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1 font-bold">
            <span className="text-slate-400">Mouvman:</span>
            <span className="text-white font-mono">{movesCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 font-black text-amber-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{score} pts</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* 7 Level Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3, 4, 5, 6, 7].map(lvl => {
          const isUnlocked = unlockedLevels.includes(lvl);
          const isCurrent = level === lvl;
          return (
            <button
              key={lvl}
              onClick={() => isUnlocked && setLevel(lvl)}
              disabled={!isUnlocked}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : isUnlocked
                  ? 'bg-slate-800 text-slate-300 hover:text-white'
                  : 'bg-slate-900/60 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              Nivo {lvl}
            </button>
          );
        })}
      </div>

      {/* Message alert */}
      {message && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-center font-bold animate-in fade-in">
          {message}
        </div>
      )}

      {/* Tubes Area */}
      {!levelWon ? (
        <div className="space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-950/80 to-[#10172A] border border-slate-800 flex flex-wrap justify-center items-end gap-3 sm:gap-5 min-h-[290px]">
            {tubes.map((tube, tubeIdx) => {
              const isSelected = selectedTubeIndex === tubeIdx;
              const hasBallPopped = isSelected && tube.length > 0;
              const poppedBall = hasBallPopped ? tube[tube.length - 1] : null;
              const ballsInside = hasBallPopped ? tube.slice(0, -1) : tube;

              return (
                <div key={tubeIdx} className="flex flex-col items-center">
                  {/* Popped Ball Above Tube */}
                  <div className="h-10 flex items-center justify-center">
                    {poppedBall && (
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${TUBE_COLORS[poppedBall]?.bg || 'bg-slate-500'} border-2 ${TUBE_COLORS[poppedBall]?.border || 'border-white'} shadow-lg ${TUBE_COLORS[poppedBall]?.glow || ''} animate-bounce`}
                      />
                    )}
                  </div>

                  {/* Glass Tube Container */}
                  <button
                    onClick={() => handleTubeClick(tubeIdx)}
                    className={`relative w-12 sm:w-14 h-48 rounded-b-3xl border-2 transition-all flex flex-col-reverse items-center p-1.5 gap-1 shadow-inner ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/50 scale-105'
                        : 'border-slate-500/60 bg-slate-900/40 hover:border-slate-300 hover:bg-slate-800/50'
                    }`}
                    style={{
                      boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {/* Balls inside tube */}
                    {ballsInside.map((ballColor, bIdx) => (
                      <div
                        key={bIdx}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${TUBE_COLORS[ballColor]?.bg || 'bg-slate-500'} border-2 ${TUBE_COLORS[ballColor]?.border || 'border-white'} shadow-md transition-all`}
                      />
                    ))}

                    {/* Tube rim top indicator */}
                    <div className="absolute -top-1.5 w-12 sm:w-14 h-3 rounded-full border border-slate-400/80 bg-slate-800/60 pointer-events-none" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">#{tubeIdx + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Controls Bar: Undo, Restart, Add Extra Tube */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Undo2 className="w-4 h-4" />
              <span>Anile Dènye Mouvman</span>
            </button>

            <button
              onClick={() => initLevel(level)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rekòmanse</span>
            </button>

            <button
              onClick={handleAddExtraTube}
              disabled={extraTubeUsed}
              className="py-2.5 px-3.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/40 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{extraTubeUsed ? 'Tib siplemantè itilize' : '+1 Nouvo Tib Vid'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Victory Modal */
        <div className="p-6 rounded-2xl bg-[#131B2E] border-2 border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-xl">
            🧪
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Bravo ! Tout Koulè yo Byen Klase !</h3>
            <p className="text-xs text-slate-300 mt-1">
              Ou fini Nivo {level} la nan {movesCount} mouvman ak {seconds} segonn !
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {level < 7 ? (
              <button
                onClick={handleNextLevel}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <span>Pwochen Nivo (Nivo {level + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-sm font-black text-amber-400">
                🎉 FELISITASYON ! OU RANPÒTE TOUT 7 NIVO TUBE MASTER YO !
              </div>
            )}

            <button
              onClick={() => initLevel(level)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejwe Nivo Sa a</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
