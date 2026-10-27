import React, { useState, useEffect } from 'react';
import { Trophy, FlaskConical, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

interface Recipe {
  targetName: string;
  targetHex: string;
  required: { [color: string]: number };
  description: string;
}

export const PotionLab: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [potionsBrewed, setPotionsBrewed] = useState(0);
  const [currentMixture, setCurrentMixture] = useState<{ [color: string]: number }>({
    red: 0,
    blue: 0,
    yellow: 0,
    purple: 0,
  });
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [levelSuccess, setLevelSuccess] = useState(false);
  const [brewFeedback, setBrewFeedback] = useState<'success' | 'fail' | null>(null);

  const recipesByLevel: { [lvl: number]: Recipe } = {
    1: {
      targetName: 'Eliksir Vèt Klè',
      targetHex: '#10B981',
      required: { blue: 1, yellow: 1 },
      description: '1 gout Ble + 1 gout Jòn',
    },
    2: {
      targetName: 'Pousyon Vyolèt Solèy',
      targetHex: '#8B5CF6',
      required: { red: 1, blue: 1 },
      description: '1 gout Wouj + 1 gout Ble',
    },
    3: {
      targetName: 'Eliksir Zoranj Ponpe',
      targetHex: '#F97316',
      required: { red: 2, yellow: 1 },
      description: '2 gout Wouj + 1 gout Jòn',
    },
    4: {
      targetName: 'Petyon Lanmè Pwovens',
      targetHex: '#06B6D4',
      required: { blue: 2, yellow: 1, purple: 1 },
      description: '2 gout Ble + 1 gout Jòn + 1 gout Mov',
    },
    5: {
      targetName: 'Gwo Eliksir Kouròn Royal',
      targetHex: '#EAB308',
      required: { yellow: 3, red: 1, purple: 1 },
      description: '3 gout Jòn + 1 gout Wouj + 1 gout Mov',
    },
    6: {
      targetName: 'Mèt Alchimi Kèkè Grand Master',
      targetHex: '#EC4899',
      required: { red: 2, blue: 1, yellow: 2, purple: 2 },
      description: '2 Wouj + 1 Ble + 2 Jòn + 2 Mov',
    },
  };

  const recipe = recipesByLevel[level] || recipesByLevel[1];

  const addIngredient = (color: string) => {
    setCurrentMixture(prev => ({
      ...prev,
      [color]: (prev[color] || 0) + 1,
    }));
  };

  const clearMixture = () => {
    setCurrentMixture({ red: 0, blue: 0, yellow: 0, purple: 0 });
    setBrewFeedback(null);
  };

  const testMixture = () => {
    const isCorrect = Object.keys(recipe.required).every(
      key => currentMixture[key] === recipe.required[key]
    ) && Object.keys(currentMixture).every(
      key => !recipe.required[key] ? currentMixture[key] === 0 : true
    );

    if (isCorrect) {
      setBrewFeedback('success');
      setScore(s => s + 250 * level);
      setPotionsBrewed(p => p + 1);

      setTimeout(() => {
        if (level < 6) {
          setLevelSuccess(true);
        } else {
          onGameOver(score + 1500, 150, 6);
        }
      }, 900);
    } else {
      setBrewFeedback('fail');
      const rem = attemptsLeft - 1;
      setAttemptsLeft(rem);
      if (rem <= 0) {
        setTimeout(() => onGameOver(score, 0, level), 800);
      }
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    clearMixture();
    setAttemptsLeft(3);
    setLevelSuccess(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-indigo-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-indigo-400 text-sm">Potion Lab — Nivo {level}</span>
          <span className="block text-[11px] text-slate-400">
            Esè ki rete: <strong className="text-amber-400">{attemptsLeft}</strong> • Pwen: {score}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Petyon fabrike</span>
          <div className="font-black text-emerald-400 text-sm tabular-nums">{potionsBrewed}</div>
        </div>
      </div>

      {/* Recipe Target Banner */}
      <div className="w-full my-3 p-3 bg-[#131B2E] border border-indigo-500/40 rounded-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-indigo-300 uppercase font-bold block">Objektif Resèt :</span>
          <h4 className="text-sm font-black text-white">{recipe.targetName}</h4>
          <span className="text-xs text-amber-400 font-bold">{recipe.description}</span>
        </div>
        <div
          className="w-10 h-10 rounded-2xl border-2 border-white shadow-lg shrink-0 flex items-center justify-center"
          style={{ backgroundColor: recipe.targetHex }}
        >
          <Sparkles className="w-5 h-5 text-white drop-shadow" />
        </div>
      </div>

      {/* Cauldron Mixing Canvas */}
      <div className="relative w-full h-56 my-2 rounded-2xl overflow-hidden border-2 border-indigo-600 bg-slate-900 flex flex-col items-center justify-center">
        {/* Mixing Flask / Cauldron */}
        <div className="relative flex flex-col items-center">
          <div
            className="w-28 h-28 rounded-full border-4 border-slate-600 shadow-2xl flex items-center justify-center transition-all duration-500"
            style={{
              backgroundColor:
                brewFeedback === 'success'
                  ? recipe.targetHex
                  : currentMixture.red || currentMixture.blue || currentMixture.yellow || currentMixture.purple
                  ? '#4338CA'
                  : '#1E293B',
            }}
          >
            <FlaskConical className="w-12 h-12 text-white/80 animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-2">Bokal Melanj la</span>
        </div>

        {/* Current Mixture Drops Count */}
        <div className="absolute bottom-2 flex gap-3 text-xs bg-slate-950/80 px-4 py-1 rounded-full border border-slate-800">
          <span className="text-red-400">Wouj: {currentMixture.red || 0}</span>
          <span className="text-blue-400">Ble: {currentMixture.blue || 0}</span>
          <span className="text-yellow-400">Jòn: {currentMixture.yellow || 0}</span>
          <span className="text-purple-400">Mov: {currentMixture.purple || 0}</span>
        </div>

        {/* Feedback message */}
        {brewFeedback && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span
              className={`text-xl font-black uppercase px-6 py-2 rounded-2xl ${
                brewFeedback === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-red-600 text-white'
              }`}
            >
              {brewFeedback === 'success' ? 'ELIKSIR PAWÒL ! ✨' : 'MOVE MELANJ ! 💥'}
            </span>
          </div>
        )}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-indigo-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🧪</h3>
            <p className="text-xs text-slate-300">Ou reyisi resèt majik sa a !</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Ingredient Vials */}
      <div className="w-full space-y-3 pt-2">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => addIngredient('red')}
            className="py-2.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-xs font-bold text-red-300 flex flex-col items-center gap-1 active:scale-95"
          >
            <span>🔴</span>
            <span>+ Wouj</span>
          </button>
          <button
            onClick={() => addIngredient('blue')}
            className="py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-xs font-bold text-blue-300 flex flex-col items-center gap-1 active:scale-95"
          >
            <span>🔵</span>
            <span>+ Ble</span>
          </button>
          <button
            onClick={() => addIngredient('yellow')}
            className="py-2.5 rounded-xl bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500 text-xs font-bold text-yellow-300 flex flex-col items-center gap-1 active:scale-95"
          >
            <span>🟡</span>
            <span>+ Jòn</span>
          </button>
          <button
            onClick={() => addIngredient('purple')}
            className="py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500 text-xs font-bold text-purple-300 flex flex-col items-center gap-1 active:scale-95"
          >
            <span>🟣</span>
            <span>+ Mov</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearMixture}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Vide</span>
          </button>
          <button
            onClick={testMixture}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95"
          >
            MELANJE ELIKSIR LA 🧪
          </button>
        </div>
      </div>
    </div>
  );
};
