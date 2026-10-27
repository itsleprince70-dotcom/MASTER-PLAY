import React, { useState, useEffect } from 'react';
import { Trophy, Volume2, VolumeX, RotateCcw, Dices, ArrowRight, Shield, Crown } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface ParchisiStarProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: User | null;
  onBalanceUpdate?: (user: User) => void;
}

// Sound Synthesizer for Parchisi
class ParchisiSoundFx {
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

  playDice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 + Math.random() * 200, this.ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.05);
        osc.stop(this.ctx.currentTime + i * 0.05 + 0.04);
      }
    } catch {}
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 0.28);
      });
    } catch {}
  }
}

const sfx = new ParchisiSoundFx();

type ParchisiColor = 'red' | 'green' | 'yellow' | 'blue';

interface Token {
  id: string;
  color: ParchisiColor;
  step: number; // -1: In Base, 0..51: On Track, 52..56: Home column, 57: Finished in Home
}

const COLOR_CONFIG: Record<ParchisiColor, { name: string; bg: string; border: string; text: string; startTrackIndex: number }> = {
  red: { name: 'Wouj', bg: 'bg-rose-500', border: 'border-rose-300', text: 'text-rose-400', startTrackIndex: 0 },
  green: { name: 'Vèt', bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-400', startTrackIndex: 13 },
  yellow: { name: 'Jòn', bg: 'bg-amber-400', border: 'border-amber-200', text: 'text-amber-300', startTrackIndex: 26 },
  blue: { name: 'Ble', bg: 'bg-sky-500', border: 'border-sky-300', text: 'text-sky-400', startTrackIndex: 39 },
};

// Safe squares on the 52-tile track
const SAFE_STEPS = [0, 8, 13, 21, 26, 34, 39, 47];

export const ParchisiStar: React.FC<ParchisiStarProps> = ({ onGameOver, currentUser, onBalanceUpdate }) => {
  const [level, setLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [gameMode, setGameMode] = useState<'solo' | 'pvp'>('solo');
  const [playersCount, setPlayersCount] = useState<number>(2); // 2 to 4
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeTurn, setActiveTurn] = useState<ParchisiColor>('red');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [winner, setWinner] = useState<ParchisiColor | null>(null);
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Lanse zo a pou kòmanse !');

  const activeColors: ParchisiColor[] = ['red', 'green', 'yellow', 'blue'].slice(0, playersCount) as ParchisiColor[];

  // Load progress
  useEffect(() => {
    if (currentUser?.id) {
      api.getGameProgress('game_parchisi', currentUser.id).then(res => {
        if (res.success && res.progress) {
          setUnlockedLevels(res.progress.unlockedLevels || [1]);
          if (res.progress.currentLevel) setLevel(res.progress.currentLevel);
          if (res.progress.highScore) setScore(res.progress.highScore);
        }
      }).catch(err => console.error(err));
    }
  }, [currentUser?.id]);

  // Init board tokens
  const initGame = (numPlayers = playersCount) => {
    const colors: ParchisiColor[] = ['red', 'green', 'yellow', 'blue'].slice(0, numPlayers) as ParchisiColor[];
    const initialTokens: Token[] = [];
    colors.forEach(col => {
      for (let i = 0; i < 4; i++) {
        initialTokens.push({ id: `${col}_${i}`, color: col, step: -1 });
      }
    });
    setTokens(initialTokens);
    setActiveTurn('red');
    setDiceValue(null);
    setHasRolled(false);
    setWinner(null);
    setStatusMsg('Peze "Lanse Zo a" pou kòmanse.');
  };

  useEffect(() => {
    initGame(playersCount);
  }, [playersCount, level]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Roll Dice Action
  const rollDice = () => {
    if (isRolling || hasRolled || winner) return;
    setIsRolling(true);
    sfx.playDice();

    let rollCount = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 8) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalVal);
        setIsRolling(false);
        setHasRolled(true);
        handlePostRoll(finalVal);
      }
    }, 50);
  };

  // Evaluate playable tokens after roll
  const handlePostRoll = (roll: number) => {
    const currentTokens = tokens.filter(t => t.color === activeTurn);
    const playable = currentTokens.filter(t => {
      if (t.step === -1) return roll === 6 || roll === 1; // Can exit base on 6 or 1
      if (t.step + roll <= 57) return true;
      return false;
    });

    if (playable.length === 0) {
      setStatusMsg(`Zo bay ${roll} — Pa gen pyès ki ka deplase.`);
      setTimeout(() => nextTurn(roll === 6), 1000);
    } else if (playable.length === 1 && (gameMode === 'solo' && activeTurn !== 'red')) {
      // Auto move for single choice AI
      setTimeout(() => moveToken(playable[0], roll), 600);
    } else {
      setStatusMsg(`Zo bay ${roll} ! Klike sou yon pyès ${COLOR_CONFIG[activeTurn].name} pou deplase l.`);
      // If AI turn in Solo mode
      if (gameMode === 'solo' && activeTurn !== 'red') {
        setTimeout(() => {
          // AI selects token: prefer exiting base, then advancing closest to home
          const sorted = [...playable].sort((a, b) => {
            if (a.step === -1 && roll === 6) return -1;
            return b.step - a.step;
          });
          moveToken(sorted[0], roll);
        }, 800);
      }
    }
  };

  // Move a chosen token
  const moveToken = async (token: Token, roll: number) => {
    sfx.playMove();
    let newStep = token.step;

    if (token.step === -1) {
      // Exit base to start square
      newStep = 0;
    } else {
      newStep = token.step + roll;
    }

    let updatedTokens = tokens.map(t => (t.id === token.id ? { ...t, step: newStep } : t));

    // Check for capturing an opponent piece on outer track
    if (newStep >= 0 && newStep <= 51) {
      const myColorConfig = COLOR_CONFIG[token.color];
      const absolutePos = (myColorConfig.startTrackIndex + newStep) % 52;
      const isSafe = SAFE_STEPS.includes(absolutePos);

      if (!isSafe) {
        // Find if any opponent token is on this absolute tile
        const targetOpponent = updatedTokens.find(t => {
          if (t.color === token.color || t.step < 0 || t.step > 51) return false;
          const oppStart = COLOR_CONFIG[t.color].startTrackIndex;
          const oppAbs = (oppStart + t.step) % 52;
          return oppAbs === absolutePos;
        });

        if (targetOpponent) {
          sfx.playCapture();
          setStatusMsg(`💥 Ou voye yon pyès ${COLOR_CONFIG[targetOpponent.color].name} tounen nan baz !`);
          // Send back to base!
          updatedTokens = updatedTokens.map(t =>
            t.id === targetOpponent.id ? { ...t, step: -1 } : t
          );
        }
      }
    }

    setTokens(updatedTokens);

    // Check win condition (all 4 tokens step === 57)
    const activeColorTokens = updatedTokens.filter(t => t.color === activeTurn);
    if (activeColorTokens.every(t => t.step === 57)) {
      sfx.playWin();
      setWinner(activeTurn);
      const earned = 200 + level * 30;
      const newScore = score + earned;
      setScore(newScore);

      if (activeTurn === 'red' && currentUser?.id) {
        try {
          const res = await api.saveGameProgress({
            gameId: 'game_parchisi',
            userId: currentUser.id,
            level,
            won: true,
            score: newScore,
            pointsEarned: earned
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
      return;
    }

    // Next turn (if rolled 6, get another turn!)
    nextTurn(roll === 6);
  };

  // Next player's turn
  const nextTurn = (extraTurn = false) => {
    setHasRolled(false);
    if (!extraTurn) {
      const currentIdx = activeColors.indexOf(activeTurn);
      const nextIdx = (currentIdx + 1) % activeColors.length;
      const nextColor = activeColors[nextIdx];
      setActiveTurn(nextColor);
      setStatusMsg(`Se tou ${COLOR_CONFIG[nextColor].name}.`);

      // If AI turn in Solo mode
      if (gameMode === 'solo' && nextColor !== 'red') {
        setTimeout(() => rollDice(), 600);
      }
    } else {
      setStatusMsg(`🎲 Ou fè yon 6 ! Ou gen yon lòt chans pou lanse zo a.`);
      if (gameMode === 'solo' && activeTurn !== 'red') {
        setTimeout(() => rollDice(), 600);
      }
    }
  };

  // Level progression
  const handleNextLevel = () => {
    if (level < 7) {
      setLevel(l => l + 1);
      initGame();
    } else {
      onGameOver(score, 0, 7);
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">🎲</span>
          <div>
            <h3 className="text-base font-black text-white">Parchisi Star</h3>
            <div className="text-xs text-slate-400">
              {gameMode === 'solo' ? `Solo kont Òdinatè · Nivo ${level}` : `${playersCount} Jwè Lokal`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => { setGameMode('solo'); setPlayersCount(2); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'solo' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => { setGameMode('pvp'); setPlayersCount(2); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              2-4 Jwè
            </button>
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

      {/* 7 Levels Selector */}
      {gameMode === 'solo' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[1, 2, 3, 4, 5, 6, 7].map(lvl => {
            const isUnlocked = unlockedLevels.includes(lvl);
            const isCurrent = level === lvl;
            return (
              <button
                key={lvl}
                onClick={() => {
                  if (isUnlocked) {
                    setLevel(lvl);
                    initGame();
                  }
                }}
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
      )}

      {/* Status Bar */}
      <div className="p-2.5 rounded-xl bg-[#131B2E] border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">Tou :</span>
          <span className={`px-2 py-0.5 rounded-lg font-black text-white ${COLOR_CONFIG[activeTurn].bg}`}>
            {COLOR_CONFIG[activeTurn].name}
          </span>
          <span className="text-slate-300 text-[11px] truncate">{statusMsg}</span>
        </div>
      </div>

      {/* Parchisi Board Arena */}
      <div className="p-3 sm:p-5 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0A0E17] border border-slate-800 flex flex-col items-center justify-center space-y-4">
        {/* 4 Bases Overview & Active Tokens */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {activeColors.map(color => {
            const colTokens = tokens.filter(t => t.color === color);
            const inBaseCount = colTokens.filter(t => t.step === -1).length;
            const inHomeCount = colTokens.filter(t => t.step === 57).length;
            const onTrackTokens = colTokens.filter(t => t.step >= 0 && t.step < 57);
            const isCurrent = activeTurn === color;

            return (
              <div
                key={color}
                className={`p-3 rounded-2xl border ${
                  isCurrent ? `${COLOR_CONFIG[color].border} ring-2 ring-amber-400/50 bg-[#161F33]` : 'border-slate-800 bg-[#0F172A]'
                } transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-black text-xs uppercase ${COLOR_CONFIG[color].text}`}>
                    {COLOR_CONFIG[color].name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Kay: {inHomeCount}/4
                  </span>
                </div>

                {/* Tokens in this base / player */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {colTokens.map((t, i) => {
                    const canMove = hasRolled && isCurrent && (
                      (t.step === -1 && (diceValue === 6 || diceValue === 1)) ||
                      (t.step >= 0 && t.step + (diceValue || 0) <= 57)
                    );

                    return (
                      <button
                        key={t.id}
                        onClick={() => canMove && moveToken(t, diceValue || 1)}
                        disabled={!canMove || (gameMode === 'solo' && color !== 'red')}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${COLOR_CONFIG[color].bg} text-white font-black text-[10px] border-2 border-white flex items-center justify-center shadow-md transition-all ${
                          canMove
                            ? 'ring-2 ring-amber-300 animate-bounce scale-110 cursor-pointer'
                            : 'opacity-70'
                        }`}
                      >
                        {t.step === -1 ? 'B' : t.step === 57 ? '👑' : t.step}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dice & Roll Button */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {/* Animated 3D Dice Display */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-slate-200 border-2 border-slate-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-2xl relative">
            {isRolling ? '🎲' : diceValue !== null ? diceValue : '—'}
          </div>

          <button
            onClick={rollDice}
            disabled={isRolling || hasRolled || Boolean(winner) || (gameMode === 'solo' && activeTurn !== 'red')}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl flex items-center gap-2 active:scale-95 transition-all disabled:opacity-40"
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Zo ap vire...' : 'Lanse Zo a'}</span>
          </button>
        </div>
      </div>

      {/* Victory Modal */}
      {winner && (
        <div className="p-5 rounded-2xl bg-[#131B2E] border-2 border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="text-xl font-black text-white">
              Bravo ! {COLOR_CONFIG[winner].name} Ranpòte Match la !
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Tout 4 pyès yo rive nan kay santral la avèk siksè nan Nivo {level} la !
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {winner === 'red' && level < 7 ? (
              <button
                onClick={handleNextLevel}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <span>Pwochen Nivo (Nivo {level + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={() => initGame()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejwe Pati a</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
