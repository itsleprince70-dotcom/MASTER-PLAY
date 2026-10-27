import React, { useState, useEffect } from 'react';
import { Trophy, AlertTriangle, ArrowRight } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

export const BubbleShooter: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(15);
  const [aimAngle, setAimAngle] = useState(90); // 30 to 150 deg
  const [grid, setGrid] = useState<string[][]>([]);
  const [currentBubbleColor, setCurrentBubbleColor] = useState(COLORS[0]);
  const [nextBubbleColor, setNextBubbleColor] = useState(COLORS[1]);
  const [isShooting, setIsShooting] = useState(false);
  const [movingBubble, setMovingBubble] = useState<{ x: number; y: number } | null>(null);
  const [levelSuccess, setLevelSuccess] = useState(false);

  // Initialize grid based on level
  useEffect(() => {
    initGridForLevel(level);
  }, [level]);

  const initGridForLevel = (lvl: number) => {
    const numColors = Math.min(COLORS.length, 2 + Math.floor(lvl / 2));
    const activeColors = COLORS.slice(0, numColors);
    const rows = 3 + Math.min(3, Math.floor(lvl / 2));
    const cols = 8;

    const newGrid: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        // Pattern variations per level
        if (lvl >= 3 && r === 2 && (c === 3 || c === 4)) {
          row.push('stone'); // Obstacle stone
        } else {
          row.push(activeColors[Math.floor(Math.random() * activeColors.length)]);
        }
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setShotsLeft(12 + (6 - lvl) * 2);
    setCurrentBubbleColor(activeColors[Math.floor(Math.random() * activeColors.length)]);
    setNextBubbleColor(activeColors[Math.floor(Math.random() * activeColors.length)]);
    setLevelSuccess(false);
  };

  const shoot = () => {
    if (isShooting || shotsLeft <= 0) return;
    setIsShooting(true);

    const rad = (aimAngle * Math.PI) / 180;
    const speed = 7;
    const vx = Math.cos(rad) * speed;
    const vy = -Math.sin(rad) * speed;

    let posX = 50; // starts at bottom center (50%)
    let posY = 92;

    const interval = setInterval(() => {
      posX += vx * 0.4;
      posY += vy * 0.4;

      // Bounce off walls
      if (posX < 6) posX = 6;
      if (posX > 94) posX = 94;

      setMovingBubble({ x: posX, y: posY });

      // Hit top or grid row
      const targetRow = Math.max(0, Math.floor((posY / 100) * 10));
      const targetCol = Math.min(7, Math.max(0, Math.floor((posX / 100) * 8)));

      if (posY <= 12 || (grid[targetRow] && grid[targetRow][targetCol])) {
        clearInterval(interval);
        handleBubblePlacement(targetCol, currentBubbleColor);
      }
    }, 25);
  };

  const handleBubblePlacement = (targetCol: number, color: string) => {
    setMovingBubble(null);
    setIsShooting(false);

    // Append bubble to lowest available spot in this column
    const newGrid = grid.map(r => [...r]);
    let placedRow = -1;

    for (let r = 0; r < newGrid.length; r++) {
      if (!newGrid[r][targetCol]) {
        newGrid[r][targetCol] = color;
        placedRow = r;
        break;
      }
    }

    if (placedRow === -1) {
      // Create new row
      const newRow = Array(8).fill('');
      newRow[targetCol] = color;
      newGrid.push(newRow);
      placedRow = newGrid.length - 1;
    }

    // Match 3 logic
    let matches: [number, number][] = [[placedRow, targetCol]];
    // Simple neighbor check
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of directions) {
      const nr = placedRow + dr;
      const nc = targetCol + dc;
      if (newGrid[nr] && newGrid[nr][nc] === color) {
        matches.push([nr, nc]);
      }
    }

    if (matches.length >= 3) {
      matches.forEach(([r, c]) => {
        newGrid[r][c] = '';
      });
      setScore(s => s + matches.length * 100 * level);
    }

    setGrid(newGrid);

    // Rotate colors
    setCurrentBubbleColor(nextBubbleColor);
    const numColors = Math.min(COLORS.length, 2 + Math.floor(level / 2));
    setNextBubbleColor(COLORS.slice(0, numColors)[Math.floor(Math.random() * numColors)]);

    const remainingShots = shotsLeft - 1;
    setShotsLeft(remainingShots);

    // Check if grid cleared
    const remainingBubbles = newGrid.flat().filter(b => b && b !== 'stone').length;
    if (remainingBubbles === 0) {
      if (level < 6) {
        setLevelSuccess(true);
      } else {
        onGameOver(score + 1500, 150, 6);
      }
    } else if (remainingShots <= 0 || newGrid.length >= 8) {
      onGameOver(score, 0, level);
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-blue-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-blue-400 text-sm">Bubble Shooter — Nivo {level}</span>
          <span className="block text-[11px] text-slate-400">
            Nòt: <strong className="text-amber-400">{score} pts</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Tir ki rete</span>
          <div className="font-black text-amber-400 text-sm tabular-nums">{shotsLeft}</div>
        </div>
      </div>

      {/* Bubble Board */}
      <div className="relative w-full h-84 my-3 rounded-2xl overflow-hidden border-2 border-blue-600 bg-slate-900 p-2 flex flex-col justify-between">
        {/* Danger Line */}
        <div className="absolute bottom-20 left-0 right-0 border-b-2 border-dashed border-red-500/60 pointer-events-none flex justify-center">
          <span className="text-[9px] text-red-400 font-bold bg-slate-950 px-2 -translate-y-1/2">
            LIY DANJE
          </span>
        </div>

        {/* Bubbles Grid */}
        <div className="space-y-1.5 w-full">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1.5">
              {row.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 shadow-md flex items-center justify-center ${
                    !cell ? 'opacity-0' : ''
                  }`}
                  style={{
                    backgroundColor: cell === 'stone' ? '#475569' : cell || 'transparent',
                  }}
                >
                  {cell === 'stone' && <span className="text-[10px]">🪨</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Flying Bubble */}
        {movingBubble && (
          <div
            className="absolute w-7 h-7 rounded-full border-2 border-white shadow-xl -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${movingBubble.x}%`,
              top: `${movingBubble.y}%`,
              backgroundColor: currentBubbleColor,
            }}
          />
        )}

        {/* Bottom Launcher */}
        <div className="relative w-full flex items-center justify-center pb-2">
          {/* Aim Line */}
          <div
            className="absolute bottom-10 w-0.5 h-20 bg-amber-400/80 origin-bottom pointer-events-none"
            style={{ transform: `rotate(${90 - aimAngle}deg)` }}
          />

          <div className="flex items-center gap-3">
            <div className="text-right text-[10px] text-slate-400">
              Apre sa:
              <div
                className="w-5 h-5 rounded-full border border-white/30 mx-auto mt-0.5"
                style={{ backgroundColor: nextBubbleColor }}
              />
            </div>

            {/* Current loaded bubble */}
            <div
              className="w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center cursor-pointer active:scale-95"
              style={{ backgroundColor: currentBubbleColor }}
              onClick={shoot}
            >
              <span className="text-xs">🎯</span>
            </div>
          </div>
        </div>

        {/* Level Success Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-12 h-12 text-blue-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Reyisi ! 🔵</h3>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full space-y-2.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Vize direksyon tir la:</span>
          <span className="font-bold text-blue-400">{aimAngle}°</span>
        </div>

        <input
          type="range"
          min="35"
          max="145"
          value={aimAngle}
          onChange={(e) => setAimAngle(Number(e.target.value))}
          disabled={isShooting}
          className="w-full accent-blue-500"
        />

        <button
          onClick={shoot}
          disabled={isShooting || shotsLeft <= 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 disabled:opacity-50"
        >
          TIRE BOUL LA 🔵
        </button>
      </div>
    </div>
  );
};
