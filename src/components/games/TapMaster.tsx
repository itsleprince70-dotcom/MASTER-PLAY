import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Zap, ArrowRight, AlertCircle } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

interface TargetItem {
  id: number;
  x: number;
  y: number;
  color: string;
  isBomb: boolean;
  type: string;
}

export const TapMaster: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const [wrongHits, setWrongHits] = useState(0);
  const [items, setItems] = useState<TargetItem[]>([]);
  const [targetColor, setTargetColor] = useState('red');
  const [targetLabel, setTargetLabel] = useState('WOUJ 🔴');
  const [timeLeft, setTimeLeft] = useState(25);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : Dousman', targetScore: 10, spawnInterval: 1200, timeLimit: 25 },
    2: { name: 'Nivo 2 : Pi Souvan', targetScore: 14, spawnInterval: 950, timeLimit: 25 },
    3: { name: 'Nivo 3 : Plis Koulè', targetScore: 18, spawnInterval: 800, timeLimit: 22 },
    4: { name: 'Nivo 4 : Pyèj & Bonm', targetScore: 20, spawnInterval: 700, timeLimit: 20 },
    5: { name: 'Nivo 5 : Vitès Rekò', targetScore: 24, spawnInterval: 600, timeLimit: 18 },
    6: { name: 'Nivo 6 : Defi Mèt Reflèks', targetScore: 28, spawnInterval: 500, timeLimit: 16 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetScore: 10, spawnInterval: 1200, timeLimit: 25 };

  // Setup instruction color
  useEffect(() => {
    const colors = [
      { id: 'red', label: 'WOUJ 🔴', hex: '#EF4444' },
      { id: 'blue', label: 'BLE 🔵', hex: '#3B82F6' },
      { id: 'yellow', label: 'JÒN 🟡', hex: '#F59E0B' },
      { id: 'green', label: 'VÈT 🟢', hex: '#10B981' }
    ];
    const picked = colors[Math.floor(Math.random() * (level >= 3 ? 4 : 2))];
    setTargetColor(picked.id);
    setTargetLabel(picked.label);
    setCorrectHits(0);
    setWrongHits(0);
    setTimeLeft(levelConfig.timeLimit);
    setLevelSuccess(false);
    setItems([]);
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

  // Spawner
  useEffect(() => {
    if (levelSuccess) return;
    const colors = ['red', 'blue', 'yellow', 'green'];

    const spawner = setInterval(() => {
      const hasBomb = level >= 4 && Math.random() < 0.25;
      const color = hasBomb ? 'black' : colors[Math.floor(Math.random() * colors.length)];

      const newItem: TargetItem = {
        id: Date.now() + Math.random(),
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 75) + 10,
        color,
        isBomb: hasBomb,
        type: hasBomb ? '💣' : color === 'red' ? '🔴' : color === 'blue' ? '🔵' : color === 'yellow' ? '🟡' : '🟢'
      };

      setItems(prev => [...prev.slice(-7), newItem]);
    }, levelConfig.spawnInterval);

    return () => clearInterval(spawner);
  }, [level, levelSuccess, levelConfig.spawnInterval]);

  const handleItemClick = (item: TargetItem) => {
    // Remove clicked item
    setItems(items.filter(i => i.id !== item.id));

    if (item.isBomb) {
      // Hit bomb
      setWrongHits(w => w + 1);
      setScore(s => Math.max(0, s - 200));
      return;
    }

    if (item.color === targetColor) {
      const newCorrect = correctHits + 1;
      setCorrectHits(newCorrect);
      setScore(s => s + 100 * level);

      if (newCorrect >= levelConfig.targetScore) {
        if (level < 6) {
          setLevelSuccess(true);
        } else {
          onGameOver(score + 1500, 150, 6);
        }
      }
    } else {
      setWrongHits(w => w + 1);
      setScore(s => Math.max(0, s - 50));
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
  };

  const accuracy = correctHits + wrongHits > 0
    ? Math.round((correctHits / (correctHits + wrongHits)) * 100)
    : 100;

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-yellow-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-amber-400 text-sm">Tap Master — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Bon: <strong className="text-emerald-400">{correctHits} / {levelConfig.targetScore}</strong> • Egzaktitid: {accuracy}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className={`font-black tabular-nums text-sm ${timeLeft < 6 ? 'text-red-400 animate-pulse' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instruction Banner */}
      <div className="w-full my-2 p-2.5 bg-[#131B2E] border border-amber-500/40 rounded-xl text-center">
        <span className="text-xs text-slate-300">Enstriksyon: </span>
        <strong className="text-sm font-black text-amber-400">PEZE SÈLMAN SOU {targetLabel} !</strong>
        {level >= 4 && <span className="block text-[10px] text-red-400 font-bold mt-0.5">Atansyon: Pa janm peze sou bonm 💣 !</span>}
      </div>

      {/* Target Arena Canvas */}
      <div className="relative w-full h-80 my-2 rounded-2xl overflow-hidden border-2 border-yellow-600 bg-slate-900 shadow-inner">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl p-2 rounded-full transition-transform active:scale-125 animate-in zoom-in duration-200"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            {item.type}
          </button>
        ))}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 👆</h3>
            <p className="text-xs text-slate-300">Reflèks ou rapid anpil !</p>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 text-center">
        Klike rapid sou bon objè yo anvan yo disparèt !
      </div>
    </div>
  );
};
