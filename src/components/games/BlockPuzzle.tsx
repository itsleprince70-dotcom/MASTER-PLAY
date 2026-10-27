import React, { useState, useEffect } from 'react';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

// Block shapes represented as relative coords
const SHAPES = [
  { name: 'dot', coords: [[0, 0]], color: '#F59E0B' },
  { name: 'line2', coords: [[0, 0], [0, 1]], color: '#3B82F6' },
  { name: 'line3', coords: [[0, 0], [0, 1], [0, 2]], color: '#10B981' },
  { name: 'vline2', coords: [[0, 0], [1, 0]], color: '#8B5CF6' },
  { name: 'square', coords: [[0, 0], [0, 1], [1, 0], [1, 1]], color: '#EC4899' },
  { name: 'L', coords: [[0, 0], [1, 0], [2, 0], [2, 1]], color: '#EF4444' },
  { name: 'corner', coords: [[0, 0], [0, 1], [1, 0]], color: '#14B8A6' },
];

export const BlockPuzzle: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState<string[][]>(Array(8).fill(null).map(() => Array(8).fill('')));
  const [availableBlocks, setAvailableBlocks] = useState<any[]>([]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const levelConfig = {
    1: { name: 'Nivo 1 : Blòk Senp', targetLines: 2, obstacleCount: 0 },
    2: { name: 'Nivo 2 : Plis Fòm', targetLines: 3, obstacleCount: 0 },
    3: { name: 'Nivo 3 : Liy Miltip', targetLines: 4, obstacleCount: 2 },
    4: { name: 'Nivo 4 : Objektif Avanse', targetLines: 5, obstacleCount: 3 },
    5: { name: 'Nivo 5 : Espas Redui', targetLines: 6, obstacleCount: 5 },
    6: { name: 'Nivo 6 : Defi Mèt Blòk', targetLines: 7, obstacleCount: 7 },
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetLines: 2, obstacleCount: 0 };

  useEffect(() => {
    initLevel(level);
  }, [level]);

  const initLevel = (lvl: number) => {
    const newGrid = Array(8).fill(null).map(() => Array(8).fill(''));
    // Place obstacles if any
    const obstacles = levelConfig.obstacleCount;
    for (let i = 0; i < obstacles; i++) {
      const r = Math.floor(Math.random() * 6) + 1;
      const c = Math.floor(Math.random() * 6) + 1;
      newGrid[r][c] = '#475569'; // stone obstacle
    }
    setGrid(newGrid);
    setLinesCleared(0);
    generateBlocks();
    setLevelSuccess(false);
  };

  const generateBlocks = () => {
    const newBlocks = [
      SHAPES[Math.floor(Math.random() * SHAPES.length)],
      SHAPES[Math.floor(Math.random() * SHAPES.length)],
      SHAPES[Math.floor(Math.random() * SHAPES.length)],
    ];
    setAvailableBlocks(newBlocks);
    setSelectedBlockIdx(0);
  };

  const canPlace = (shapeCoords: number[][], startR: number, startC: number, currentGrid: string[][]) => {
    for (const [dr, dc] of shapeCoords) {
      const r = startR + dr;
      const c = startC + dc;
      if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
      if (currentGrid[r][c] !== '') return false;
    }
    return true;
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedBlockIdx === null || !availableBlocks[selectedBlockIdx]) return;
    const block = availableBlocks[selectedBlockIdx];

    if (!canPlace(block.coords, r, c, grid)) {
      return;
    }

    // Place block
    const newGrid = grid.map(row => [...row]);
    block.coords.forEach(([dr, dc]: [number, number]) => {
      newGrid[r + dr][c + dc] = block.color;
    });

    // Check full rows and cols
    let cleared = 0;
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let i = 0; i < 8; i++) {
      if (newGrid[i].every(cell => cell !== '' && cell !== '#475569')) {
        rowsToClear.push(i);
      }
      let fullCol = true;
      for (let j = 0; j < 8; j++) {
        if (newGrid[j][i] === '' || newGrid[j][i] === '#475569') {
          fullCol = false;
          break;
        }
      }
      if (fullCol) colsToClear.push(i);
    }

    // Clear completed rows
    rowsToClear.forEach(rowIdx => {
      for (let colIdx = 0; colIdx < 8; colIdx++) {
        newGrid[rowIdx][colIdx] = '';
      }
      cleared++;
    });

    // Clear completed cols
    colsToClear.forEach(colIdx => {
      for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
        newGrid[rowIdx][colIdx] = '';
      }
      cleared++;
    });

    setGrid(newGrid);
    const newLinesCleared = linesCleared + cleared;
    setLinesCleared(newLinesCleared);
    setScore(s => s + (cleared > 0 ? cleared * 150 : 20) * level);

    // Consume block
    const nextBlocks = [...availableBlocks];
    nextBlocks[selectedBlockIdx] = null;
    setAvailableBlocks(nextBlocks);

    // If all 3 used, generate new 3
    if (nextBlocks.every(b => b === null)) {
      generateBlocks();
    } else {
      const nextIdx = nextBlocks.findIndex(b => b !== null);
      setSelectedBlockIdx(nextIdx >= 0 ? nextIdx : null);
    }

    // Check level win
    if (newLinesCleared >= levelConfig.targetLines) {
      if (level < 6) {
        setLevelSuccess(true);
      } else {
        onGameOver(score + 1500, 150, 6);
      }
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-pink-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-pink-400 text-sm">{levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Liy disparèt: <strong className="text-emerald-400">{linesCleared} / {levelConfig.targetLines}</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Pwen</span>
          <div className="font-black text-amber-400 text-sm tabular-nums">{score}</div>
        </div>
      </div>

      {/* 8x8 Grid Canvas */}
      <div className="relative w-full my-3 p-3 bg-slate-900 rounded-2xl border-2 border-pink-600 flex flex-col items-center justify-center">
        <div className="grid grid-cols-8 gap-1 w-full max-w-[280px]">
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`aspect-square rounded-md border transition-all ${
                  cell
                    ? 'border-white/30 shadow-sm'
                    : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-700 active:scale-95'
                }`}
                style={{ backgroundColor: cell || undefined }}
              >
                {cell === '#475569' && <span className="text-[8px]">🧱</span>}
              </button>
            ))
          )}
        </div>

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3 rounded-2xl">
            <Trophy className="w-12 h-12 text-pink-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Konplete ! 🧩</h3>
            <button
              onClick={nextLevel}
              className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>Pase nan Nivo {level + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Available Blocks Palette */}
      <div className="w-full space-y-2">
        <div className="text-xs text-slate-400 text-center">
          Chwazi yon blòk epi klike sou tablo a pou mete l :
        </div>

        <div className="flex items-center justify-center gap-3">
          {availableBlocks.map((block, idx) => {
            if (!block) return <div key={idx} className="w-16 h-16 rounded-xl border border-dashed border-slate-800" />;
            const isSelected = selectedBlockIdx === idx;

            return (
              <button
                key={idx}
                onClick={() => setSelectedBlockIdx(idx)}
                className={`p-2 rounded-xl transition-all border-2 flex items-center justify-center min-w-[64px] min-h-[64px] ${
                  isSelected ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md' : 'border-slate-700 bg-slate-850 hover:bg-slate-800'
                }`}
              >
                <div className="grid grid-cols-3 gap-0.5">
                  {block.coords.map(([dr, dc]: [number, number], bIdx: number) => (
                    <div
                      key={bIdx}
                      className="w-3.5 h-3.5 rounded-xs"
                      style={{
                        backgroundColor: block.color,
                        gridRowStart: dr + 1,
                        gridColumnStart: dc + 1,
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
