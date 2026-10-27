import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Eye, ArrowRight, RotateCcw } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

const SYMBOLS_POOL = ['👑', '🎮', '🥤', '⚡', '🏆', '⚽', '🏀', '🎱', '🧪', '🔥', '💎', '🎯'];

export const MemoryMaster: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [cards, setCards] = useState<string[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : 6 Kat', pairsCount: 3, timeLimit: 30, cols: 3 },
    2: { name: 'Nivo 2 : 12 Kat', pairsCount: 6, timeLimit: 40, cols: 4 },
    3: { name: 'Nivo 3 : 16 Kat', pairsCount: 8, timeLimit: 45, cols: 4 },
    4: { name: 'Nivo 4 : 20 Kat', pairsCount: 10, timeLimit: 50, cols: 5 },
    5: { name: 'Nivo 5 : Vitès & Memwa', pairsCount: 10, timeLimit: 35, cols: 5 },
    6: { name: 'Nivo 6 : Gwo Tablo 24 Kat', pairsCount: 12, timeLimit: 55, cols: 6 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', pairsCount: 3, timeLimit: 30, cols: 3 };

  useEffect(() => {
    initLevel(level);
  }, [level]);

  // Timer
  useEffect(() => {
    if (levelSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setTimeout(() => onGameOver(score, 0, level), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [level, levelSuccess]);

  const initLevel = (lvl: number) => {
    const config = levelConfig;
    const selectedSymbols = SYMBOLS_POOL.slice(0, config.pairsCount);
    const deck = [...selectedSymbols, ...selectedSymbols].sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setAttempts(0);
    setTimeLeft(config.timeLimit);
    setLevelSuccess(false);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index) || matchedIndices.includes(index)) {
      return;
    }

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setAttempts((a) => a + 1);
      const [first, second] = newFlipped;

      if (cards[first] === cards[second]) {
        const newMatched = [...matchedIndices, first, second];
        setMatchedIndices(newMatched);
        setFlippedIndices([]);
        setScore((s) => s + 100 * level);

        // Check if level completed
        if (newMatched.length === cards.length) {
          if (level < 6) {
            setLevelSuccess(true);
          } else {
            onGameOver(score + 1500, 150, 6);
          }
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-purple-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-purple-400 text-sm">Memory Master — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Pè jwenn:{' '}
            <strong className="text-emerald-400">
              {matchedIndices.length / 2} / {levelConfig.pairsCount}
            </strong>{' '}
            • Tantativ: {attempts}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className={`font-black tabular-nums text-sm ${timeLeft < 10 ? 'text-red-400 animate-pulse' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Cards Board Canvas */}
      <div className="relative w-full min-h-[300px] my-3 p-4 rounded-2xl border-2 border-purple-600 bg-gradient-to-b from-slate-900 to-purple-950/30 flex items-center justify-center">
        <div
          className="grid gap-2 w-full max-w-sm justify-center"
          style={{ gridTemplateColumns: `repeat(${levelConfig.cols}, minmax(0, 1fr))` }}
        >
          {cards.map((sym, idx) => {
            const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
            const isMatched = matchedIndices.includes(idx);

            return (
              <button
                key={idx}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-xl text-2xl sm:text-3xl font-black flex items-center justify-center transition-all duration-300 transform ${
                  isFlipped
                    ? isMatched
                      ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-95'
                      : 'bg-purple-600/40 border-2 border-purple-400 scale-100'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-750 active:scale-95'
                }`}
              >
                {isFlipped ? sym : '❓'}
              </button>
            );
          })}
        </div>

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-purple-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🧠</h3>
            <p className="text-xs text-slate-300">Felisitasyon ! Memwa w trè rapid.</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="w-full text-center text-[11px] text-slate-400">
        Tape sou 2 kat pou w jwenn pè yo anvan tan an fini !
      </div>
    </div>
  );
};
