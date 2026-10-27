import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Volume2, VolumeX, Sparkles, HelpCircle, Shuffle, Delete, CheckCircle2, RotateCcw, ArrowRight, Clock, Flame } from 'lucide-react';
import { User, UserGameProgress } from '../../types';
import { api } from '../../services/api';

interface JeuDeMotsProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: User | null;
  onBalanceUpdate?: (user: User) => void;
}

// Sound Synthesizer for Word Game
class WordSoundFx {
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

  playTap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {}
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }
}

const sfx = new WordSoundFx();

// 7 Levels of Haitian Creole & Challenge Words
interface WordItem {
  target: string;
  hint: string;
  scrambled: string[];
}

const LEVEL_WORDS: Record<number, WordItem[]> = {
  1: [
    { target: 'DLO', hint: 'Sa ou bwè lè w swaf, sous lavi', scrambled: ['L', 'D', 'O', 'A'] },
    { target: 'BÈL', hint: 'Yon bagay ki gen bèl aparans ak favè', scrambled: ['È', 'B', 'L', 'I'] },
    { target: 'KÈKÈ', hint: 'Kèkè Challenge — defi ofisyèl la !', scrambled: ['È', 'K', 'K', 'È'] },
    { target: 'LAKAY', hint: 'Kote w dòmi, zòn fanmi w ak rasin ou', scrambled: ['A', 'K', 'Y', 'L', 'A'] }
  ],
  2: [
    { target: 'MANJE', hint: 'Nouriti w pran chak jou pou pran fòs', scrambled: ['A', 'N', 'M', 'J', 'E'] },
    { target: 'SOLÈY', hint: 'Zetwal ki klere jounen an e bay chalè', scrambled: ['È', 'L', 'S', 'O', 'Y'] },
    { target: 'ZANMI', hint: 'Yon bon konpanyon ou fè konfyans', scrambled: ['M', 'I', 'Z', 'A', 'N'] },
    { target: 'AYITI', hint: 'Peyi nou, bèl pèl Zantiy yo', scrambled: ['I', 'T', 'A', 'Y', 'I'] }
  ],
  3: [
    { target: 'PWEN', hint: 'Sa w ranmase lè w genyen nan jwèt la', scrambled: ['E', 'N', 'P', 'W'] },
    { target: 'KOURAJ', hint: 'Fòs nan kè w pou w pa janm dekouraje', scrambled: ['R', 'J', 'K', 'O', 'U', 'A'] },
    { target: 'VIKTWA', hint: 'Lè w bat advèsè a e ou ranpòte match la', scrambled: ['K', 'W', 'V', 'I', 'T', 'A'] },
    { target: 'KOURON', hint: 'Senbòl wa ak mèt chanpyona a', scrambled: ['U', 'N', 'K', 'O', 'R', 'O'] }
  ],
  4: [
    { target: 'LIBÈTE', hint: 'Viv lib san chenn, dwa chak moun', scrambled: ['T', 'B', 'L', 'I', 'È', 'E'] },
    { target: 'TRAVAY', hint: 'Aktivite ki pèmèt ou touche e pwogrese', scrambled: ['V', 'R', 'T', 'A', 'A', 'Y'] },
    { target: 'SOLIDÈ', hint: 'Mete men ansanm pou ede lòt', scrambled: ['L', 'D', 'S', 'O', 'I', 'È'] },
    { target: 'ESTRATEJI', hint: 'Plan kalkile pou w ka genyen jwèt la', scrambled: ['T', 'R', 'E', 'S', 'A', 'T', 'J', 'I'] }
  ],
  5: [
    { target: 'FOUTBÒL', hint: 'Jwèt pasyon an kote 11 jwè tire nan gòl', scrambled: ['T', 'Ò', 'F', 'O', 'U', 'B', 'L'] },
    { target: 'KONPETISYON', hint: 'Gwo tounwa pou chèche pi bon jwè a', scrambled: ['N', 'P', 'K', 'O', 'E', 'T', 'I', 'S', 'Y', 'O', 'N'] },
    { target: 'ENSPIRASYON', hint: 'Lide klere ki pouse w kreye bèl bagay', scrambled: ['S', 'P', 'E', 'N', 'I', 'R', 'A', 'S', 'Y', 'O', 'N'] }
  ],
  6: [
    { target: 'ENTÈLIJANS', hint: 'Kapasite pou w konprann rapid e rezoud pwoblèm', scrambled: ['N', 'T', 'E', 'N', 'T', 'È', 'L', 'I', 'J', 'A', 'S'] },
    { target: 'KONESANS', hint: 'Tout sa w aprann e metrize nan lavi', scrambled: ['S', 'A', 'K', 'O', 'N', 'E', 'S', 'N'] },
    { target: 'DETÈMINASYON', hint: 'Kenbe fèm san fè bak pou rive nan objektif', scrambled: ['T', 'R', 'D', 'E', 'È', 'M', 'I', 'N', 'A', 'S', 'Y', 'O', 'N'] }
  ],
  7: [
    { target: 'TRANZAKSYON', hint: 'Operasyon transfè lajan oswa depo NatCash', scrambled: ['Z', 'A', 'T', 'R', 'N', 'K', 'S', 'Y', 'O', 'N'] },
    { target: 'CHANPYONA', hint: 'Dènye gwo etap pou kouwonnen chanpyon an', scrambled: ['Y', 'N', 'C', 'H', 'A', 'P', 'O', 'N', 'A'] },
    { target: 'FLEKSIBILITE', hint: 'Kapasite pou adapte rapid ak nenpòt sitiyasyon', scrambled: ['K', 'I', 'F', 'L', 'E', 'S', 'B', 'I', 'L', 'I', 'T', 'E'] }
  ]
};

export const JeuDeMots: React.FC<JeuDeMotsProps> = ({ onGameOver, currentUser, onBalanceUpdate }) => {
  const [level, setLevel] = useState(1);
  const [wordIdx, setWordIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Current active word state
  const currentWordList = LEVEL_WORDS[level] || LEVEL_WORDS[1];
  const currentWord = currentWordList[wordIdx] || currentWordList[0];

  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string }[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{ id: string; char: string }[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [showHint, setShowHint] = useState(false);
  const [levelWon, setLevelWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize word letters
  useEffect(() => {
    if (!currentWord) return;
    const tiles = currentWord.scrambled.map((c, i) => ({ id: `${c}_${i}_${Math.random()}`, char: c }));
    // Shuffle
    tiles.sort(() => Math.random() - 0.5);
    setAvailableLetters(tiles);
    setSelectedLetters([]);
    setFeedbackMsg({ text: '', type: '' });
    setShowHint(false);
    setTimeLeft(45);
  }, [level, wordIdx]);

  // Load progress from backend
  useEffect(() => {
    if (currentUser?.id) {
      api.getGameProgress('game_jeudemots', currentUser.id).then(res => {
        if (res.success && res.progress) {
          setUnlockedLevels(res.progress.unlockedLevels || [1]);
          if (res.progress.currentLevel) setLevel(res.progress.currentLevel);
          if (res.progress.totalPoints) setTotalPoints(res.progress.totalPoints);
          if (res.progress.highScore) setScore(res.progress.highScore);
        }
      }).catch(err => console.error(err));
    }
  }, [currentUser?.id]);

  // Timer countdown
  useEffect(() => {
    if (levelWon) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [levelWon]);

  // Toggle sound
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Add letter
  const handleSelectLetter = (tile: { id: string; char: string }) => {
    sfx.playTap();
    setAvailableLetters(prev => prev.filter(t => t.id !== tile.id));
    setSelectedLetters(prev => [...prev, tile]);
    setFeedbackMsg({ text: '', type: '' });
  };

  // Backspace last letter
  const handleBackspace = () => {
    if (selectedLetters.length === 0) return;
    sfx.playTap();
    const last = selectedLetters[selectedLetters.length - 1];
    setSelectedLetters(prev => prev.slice(0, -1));
    setAvailableLetters(prev => [...prev, last]);
    setFeedbackMsg({ text: '', type: '' });
  };

  // Shuffle available letters
  const handleShuffle = () => {
    sfx.playTap();
    setAvailableLetters(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  // Use Hint (point penalty: -20 pts)
  const handleUseHint = () => {
    setShowHint(true);
    setScore(s => Math.max(0, s - 20));
  };

  // Validate formed word
  const handleValidate = async () => {
    const formed = selectedLetters.map(l => l.char).join('');
    if (!formed) {
      setFeedbackMsg({ text: 'Tanpri chwazi lèt yo pou fòme yon mo dabò.', type: 'error' });
      return;
    }

    if (formed.toUpperCase() === currentWord.target.toUpperCase()) {
      sfx.playSuccess();
      const speedBonus = timeLeft > 25 ? 50 : (timeLeft > 10 ? 25 : 10);
      const earned = 100 + speedBonus;
      const newScore = score + earned;
      setScore(newScore);
      setTotalPoints(tp => tp + earned);
      setFeedbackMsg({ text: `🎉 Bravo ! Mo "${currentWord.target}" kòrèk ! (+${earned} pts)`, type: 'success' });

      // If more words in this level
      if (wordIdx + 1 < currentWordList.length) {
        setTimeout(() => {
          setWordIdx(i => i + 1);
        }, 1200);
      } else {
        // Level completed!
        setLevelWon(true);
        if (currentUser?.id) {
          setIsSubmitting(true);
          try {
            const res = await api.saveGameProgress({
              gameId: 'game_jeudemots',
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
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    } else {
      sfx.playError();
      setFeedbackMsg({ text: `❌ Mo "${formed}" pa kòrèk. Eseye ranje lèt yo ankò !`, type: 'error' });
    }
  };

  // Next level
  const handleNextLevel = () => {
    if (level < 7) {
      const next = level + 1;
      setLevel(next);
      setWordIdx(0);
      setLevelWon(false);
    } else {
      onGameOver(score, 0, 7);
    }
  };

  // Replay level
  const handleReplayLevel = () => {
    setWordIdx(0);
    setLevelWon(false);
    setTimeLeft(45);
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">🔤</span>
          <div>
            <h3 className="text-base font-black text-white">Jeu de Mots</h3>
            <div className="text-xs text-slate-400">
              Mo {wordIdx + 1} sou {currentWordList.length} · Nivo {level}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 font-mono">{timeLeft}s</span>
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
                  setWordIdx(0);
                  setLevelWon(false);
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

      {/* Main Play Area */}
      {!levelWon ? (
        <div className="space-y-6">
          {/* Hint / Question definition */}
          <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">Endis Mo a :</div>
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              {showHint ? currentWord.hint : `Mo a gen ${currentWord.target.length} lèt. Klike sou "Mande Endis" pou èd.`}
            </p>
          </div>

          {/* Formed Word Slots */}
          <div className="flex flex-wrap items-center justify-center gap-2 min-h-[58px] p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            {selectedLetters.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Klike sou lèt anba yo pou fòme mo a...</span>
            ) : (
              selectedLetters.map((l, i) => (
                <span
                  key={l.id}
                  className="w-10 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black text-lg sm:text-xl flex items-center justify-center shadow-lg border border-amber-300 animate-in zoom-in-75 duration-150"
                >
                  {l.char}
                </span>
              ))
            )}
          </div>

          {/* Feedback message */}
          {feedbackMsg.text && (
            <div className={`p-2.5 rounded-xl text-xs text-center font-bold ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}>
              {feedbackMsg.text}
            </div>
          )}

          {/* Available Letter Tiles */}
          <div className="space-y-2">
            <div className="text-center text-[11px] font-bold text-slate-400 uppercase">Lèt ki disponib yo :</div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {availableLetters.map(tile => (
                <button
                  key={tile.id}
                  onClick={() => handleSelectLetter(tile)}
                  className="w-11 h-12 sm:w-13 sm:h-14 rounded-2xl bg-[#131B2E] hover:bg-slate-700 active:scale-95 text-white font-black text-lg sm:text-xl border border-slate-700 shadow-md transition-all flex items-center justify-center"
                >
                  {tile.char}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Clear, Shuffle, Hint, Validate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <button
              onClick={handleBackspace}
              disabled={selectedLetters.length === 0}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Delete className="w-4 h-4" />
              <span>Efase</span>
            </button>

            <button
              onClick={handleShuffle}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Shuffle className="w-4 h-4" />
              <span>Melanje</span>
            </button>

            <button
              onClick={handleUseHint}
              disabled={showHint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showHint ? 'Endis vizib' : 'Endis (-20)'}</span>
            </button>

            <button
              onClick={handleValidate}
              disabled={selectedLetters.length === 0}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valide Repons</span>
            </button>
          </div>
        </div>
      ) : (
        /* Level Victory Modal */
        <div className="p-6 rounded-2xl bg-[#131B2E] border-2 border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto shadow-xl">
            🏆
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Bravo ! Nivo {level} Ranpòte !</h3>
            <p className="text-xs text-slate-300 mt-1">
              Ou jwenn tout mo nan Nivo {level} la avèk siksè e ou ranmase {score} pwen !
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
                🎉 FELISITASYON ! OU FINI TOUT 7 NIVO JEU DE MOTS YO !
              </div>
            )}

            <button
              onClick={handleReplayLevel}
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
