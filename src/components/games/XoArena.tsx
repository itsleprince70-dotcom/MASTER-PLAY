import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, ArrowRight, Award } from 'lucide-react';

interface GameProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
}

export const XoArena: React.FC<GameProps> = ({ onGameOver }) => {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O'>('X');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'tie' | null>(null);
  const [levelSuccess, setLevelSuccess] = useState(false);

  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';

  const levelConfig = {
    1: { name: 'Nivo 1 : Debitan', targetWins: 2, aiMistakeRate: 0.8 },
    2: { name: 'Nivo 2 : Defans Senp', targetWins: 2, aiMistakeRate: 0.5 },
    3: { name: 'Nivo 3 : Taktik debaz', targetWins: 3, aiMistakeRate: 0.3 },
    4: { name: 'Nivo 4 : Estrateji avanse', targetWins: 3, aiMistakeRate: 0.15 },
    5: { name: 'Nivo 5 : Mèt Taktik', targetWins: 3, aiMistakeRate: 0.05 },
    6: { name: 'Nivo 6 : AI Ekspè (San Erè)', targetWins: 4, aiMistakeRate: 0.0 }
  }[level as 1 | 2 | 3 | 4 | 5 | 6] || { name: 'Nivo 1', targetWins: 2, aiMistakeRate: 0.8 };

  const checkWinner = (b: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diags
    ];
    for (const [x, y, z] of lines) {
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        return b[x];
      }
    }
    if (b.every(cell => cell !== '')) return 'tie';
    return null;
  };

  const handleCellClick = (idx: number) => {
    if (!isPlayerTurn || board[idx] || gameResult) return;

    const newBoard = [...board];
    newBoard[idx] = playerSymbol;
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      handleEndMatch(winner);
    } else {
      setIsPlayerTurn(false);
      setTimeout(() => triggerAiMove(newBoard), 400);
    }
  };

  const triggerAiMove = (currentBoard: string[]) => {
    const emptyIndices = currentBoard.map((c, i) => (c === '' ? i : null)).filter(i => i !== null) as number[];
    if (emptyIndices.length === 0) return;

    let move: number;
    const shouldMakeMistake = Math.random() < levelConfig.aiMistakeRate;

    if (shouldMakeMistake) {
      // Pick random empty spot
      move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else {
      // Smart check: 1. Win if possible, 2. Block player, 3. Center, 4. Corner
      let winMove = -1;
      let blockMove = -1;

      for (const idx of emptyIndices) {
        const testB = [...currentBoard];
        testB[idx] = aiSymbol;
        if (checkWinner(testB) === aiSymbol) {
          winMove = idx;
          break;
        }
      }

      if (winMove !== -1) {
        move = winMove;
      } else {
        for (const idx of emptyIndices) {
          const testB = [...currentBoard];
          testB[idx] = playerSymbol;
          if (checkWinner(testB) === playerSymbol) {
            blockMove = idx;
            break;
          }
        }

        if (blockMove !== -1) {
          move = blockMove;
        } else if (emptyIndices.includes(4)) {
          move = 4; // Center
        } else {
          move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
      }
    }

    const nextBoard = [...currentBoard];
    nextBoard[move] = aiSymbol;
    setBoard(nextBoard);

    const winner = checkWinner(nextBoard);
    if (winner) {
      handleEndMatch(winner);
    } else {
      setIsPlayerTurn(true);
    }
  };

  const handleEndMatch = (winner: string) => {
    if (winner === playerSymbol) {
      setGameResult('win');
      const newWins = wins + 1;
      setWins(newWins);
      setScore(s => s + 200 * level);

      if (newWins >= levelConfig.targetWins) {
        if (level < 6) {
          setLevelSuccess(true);
        } else {
          onGameOver(score + 1000, 100, 6);
        }
      }
    } else if (winner === aiSymbol) {
      setGameResult('lose');
      setLosses(l => l + 1);
    } else {
      setGameResult('tie');
      setTies(t => t + 1);
      setScore(s => s + 50);
    }
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(''));
    setGameResult(null);
    setIsPlayerTurn(true);
  };

  const nextLevel = () => {
    setLevel(lvl => lvl + 1);
    setWins(0);
    setLosses(0);
    setTies(0);
    setLevelSuccess(false);
    resetBoard();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-lg mx-auto bg-slate-950 p-4 rounded-3xl border border-red-500/30 text-white select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div>
          <span className="font-black text-amber-400 text-sm">XO Arena — {levelConfig.name}</span>
          <span className="block text-[11px] text-slate-400">
            Viktwa: <strong className="text-emerald-400">{wins} / {levelConfig.targetWins}</strong> • Defèt: {losses} • Egal: {ties}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Total Pwen</span>
          <div className="font-black text-amber-400 text-sm tabular-nums">{score}</div>
        </div>
      </div>

      {/* Grid Board */}
      <div className="relative w-full my-4 flex flex-col items-center justify-center min-h-[300px] bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-3 gap-3 w-64 h-64">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`aspect-square rounded-2xl text-4xl font-black flex items-center justify-center transition-all ${
                cell === 'X'
                  ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500 shadow-md'
                  : cell === 'O'
                  ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 active:scale-95'
              }`}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Match Result Overlay */}
        {gameResult && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl z-10 space-y-3">
            <span
              className={`text-2xl font-black px-5 py-2 rounded-2xl uppercase ${
                gameResult === 'win'
                  ? 'bg-emerald-500 text-slate-950 animate-bounce'
                  : gameResult === 'lose'
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {gameResult === 'win' ? 'OU GENYEN ! 🎉' : gameResult === 'lose' ? 'ADVÈSÈ A GENYEN !' : 'MATCH EGAL ! 🤝'}
            </span>

            {!levelSuccess && (
              <button
                onClick={resetBoard}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
              >
                Rejwe Manch Sa A
              </button>
            )}
          </div>
        )}

        {/* Level Passed Overlay */}
        {levelSuccess && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3 rounded-2xl">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">Nivo {level} Konplete ! ❌⭕</h3>
            <p className="text-xs text-slate-300">Ou bat advèsè a {wins} fwa ! Nivo siperyè a ap pi entèlijan.</p>
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
        Ou se senbòl <strong className="text-rose-400 font-black">{playerSymbol}</strong>. Mete 3 senbòl an liy pou ranpòte manch lan !
      </div>
    </div>
  );
};
