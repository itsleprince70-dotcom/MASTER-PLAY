import React, { useState, useEffect } from 'react';
import { Trophy, Volume2, VolumeX, RotateCcw, User as UserIcon, Bot, Crown, ArrowRight, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { api } from '../../services/api';

interface DamesProps {
  onGameOver: (score: number, prize?: number, levelReached?: number) => void;
  currentUser?: User | null;
  onBalanceUpdate?: (user: User) => void;
}

// Sound Synthesizer for Checkers
class DamesSoundFx {
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

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
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
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  playKing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      [523.25, 659.25, 1046.5].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
      });
    } catch {}
  }
}

const sfx = new DamesSoundFx();

type PieceColor = 'white' | 'black';

interface Piece {
  id: string;
  color: PieceColor;
  isKing: boolean;
}

type BoardState = (Piece | null)[][];

interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  capturedRow?: number;
  capturedCol?: number;
}

// Initial 8x8 Board setup
function getInitialBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { id: `b_${r}_${c}`, color: 'black', isKing: false };
      }
    }
  }

  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = { id: `w_${r}_${c}`, color: 'white', isKing: false };
      }
    }
  }

  return board;
}

export const Dames: React.FC<DamesProps> = ({ onGameOver, currentUser, onBalanceUpdate }) => {
  const [level, setLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [gameMode, setGameMode] = useState<'solo' | 'pvp'>('solo');
  const [board, setBoard] = useState<BoardState>(getInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<Move[]>([]);
  const [mustJumpPieces, setMustJumpPieces] = useState<{ r: number; c: number }[]>([]);
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [capturedWhite, setCapturedWhite] = useState(0);
  const [capturedBlack, setCapturedBlack] = useState(0);

  // Load progress
  useEffect(() => {
    if (currentUser?.id) {
      api.getGameProgress('game_dames', currentUser.id).then(res => {
        if (res.success && res.progress) {
          setUnlockedLevels(res.progress.unlockedLevels || [1]);
          if (res.progress.currentLevel) setLevel(res.progress.currentLevel);
          if (res.progress.highScore) setScore(res.progress.highScore);
        }
      }).catch(err => console.error(err));
    }
  }, [currentUser?.id]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  const resetGame = (lvl: number = level) => {
    setBoard(getInitialBoard());
    setCurrentTurn('white');
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setMustJumpPieces([]);
    setWinner(null);
    setCapturedWhite(0);
    setCapturedBlack(0);
  };

  // Find all possible jumps for a piece
  const getJumpsForPiece = (b: BoardState, r: number, c: number): Move[] => {
    const piece = b[r][c];
    if (!piece) return [];
    const jumps: Move[] = [];
    const dirs = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'white'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const midR = r + dr;
      const midC = c + dc;
      const landR = r + dr * 2;
      const landC = c + dc * 2;

      if (landR >= 0 && landR < 8 && landC >= 0 && landC < 8) {
        const midPiece = b[midR][midC];
        const landPiece = b[landR][landC];
        if (midPiece && midPiece.color !== piece.color && landPiece === null) {
          jumps.push({
            fromRow: r,
            fromCol: c,
            toRow: landR,
            toCol: landC,
            capturedRow: midR,
            capturedCol: midC
          });
        }
      }
    }
    return jumps;
  };

  // Find all normal steps for a piece
  const getStepsForPiece = (b: BoardState, r: number, c: number): Move[] => {
    const piece = b[r][c];
    if (!piece) return [];
    const steps: Move[] = [];
    const dirs = piece.isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'white'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const toR = r + dr;
      const toC = c + dc;
      if (toR >= 0 && toR < 8 && toC >= 0 && toC < 8 && b[toR][toC] === null) {
        steps.push({ fromRow: r, fromCol: c, toRow: toR, toCol: toC });
      }
    }
    return steps;
  };

  // Check forced capture rule for player
  const getAllLegalMovesForColor = (b: BoardState, color: PieceColor) => {
    const allJumps: Move[] = [];
    const allSteps: Move[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === color) {
          const jumps = getJumpsForPiece(b, r, c);
          if (jumps.length > 0) allJumps.push(...jumps);
          else allSteps.push(...getStepsForPiece(b, r, c));
        }
      }
    }

    // Forced capture rule! If any jump exists, ONLY jumps are legal
    if (allJumps.length > 0) {
      return { moves: allJumps, mustJump: true };
    }
    return { moves: allSteps, mustJump: false };
  };

  // Update forced capture state whenever turn changes
  useEffect(() => {
    if (winner) return;
    const { moves, mustJump } = getAllLegalMovesForColor(board, currentTurn);

    if (moves.length === 0) {
      // Current player has no legal moves -> other player wins!
      setWinner(currentTurn === 'white' ? 'black' : 'white');
      return;
    }

    if (mustJump) {
      const jumpOrigins = Array.from(new Set(moves.map(m => `${m.fromRow}_${m.fromCol}`)))
        .map(key => {
          const [r, c] = key.split('_').map(Number);
          return { r, c };
        });
      setMustJumpPieces(jumpOrigins);
    } else {
      setMustJumpPieces([]);
    }

    // If Solo Mode and Black's turn -> Run AI move
    if (gameMode === 'solo' && currentTurn === 'black') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        executeAiMove(moves);
        setIsAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, board, winner, gameMode]);

  // AI Decision Logic (levels 1 to 7)
  const executeAiMove = (legalMoves: Move[]) => {
    if (legalMoves.length === 0) {
      setWinner('white');
      return;
    }

    let chosenMove = legalMoves[0];
    if (level <= 2) {
      // Random move among legal moves
      chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
      // Heuristic: prioritize jumps, then kinging, then advancing
      legalMoves.sort((a, b) => {
        let scoreA = a.capturedRow !== undefined ? 10 : 0;
        let scoreB = b.capturedRow !== undefined ? 10 : 0;
        if (a.toRow === 7) scoreA += 5;
        if (b.toRow === 7) scoreB += 5;
        return scoreB - scoreA;
      });
      chosenMove = legalMoves[0];
    }

    applyMove(chosenMove);
  };

  // Apply a move to board
  const applyMove = async (move: Move) => {
    const piece = board[move.fromRow][move.fromCol];
    if (!piece) return;

    const newBoard = board.map(row => [...row]);
    newBoard[move.fromRow][move.fromCol] = null;

    let isCrowned = piece.isKing;
    // Check king transformation
    if ((piece.color === 'white' && move.toRow === 0) || (piece.color === 'black' && move.toRow === 7)) {
      isCrowned = true;
      sfx.playKing();
    }

    newBoard[move.toRow][move.toCol] = { ...piece, isKing: isCrowned };

    // If capture took place
    if (move.capturedRow !== undefined && move.capturedCol !== undefined) {
      newBoard[move.capturedRow][move.capturedCol] = null;
      sfx.playCapture();
      if (piece.color === 'white') setCapturedBlack(c => c + 1);
      else setCapturedWhite(c => c + 1);

      // Check for multi-jump from landing square
      const subsequentJumps = getJumpsForPiece(newBoard, move.toRow, move.toCol);
      if (subsequentJumps.length > 0) {
        setBoard(newBoard);
        setSelectedSquare({ r: move.toRow, c: move.toCol });
        setLegalMovesForSelected(subsequentJumps);
        setMustJumpPieces([{ r: move.toRow, c: move.toCol }]);
        return; // Continue same player's turn for multi-jump!
      }
    } else {
      sfx.playMove();
    }

    setBoard(newBoard);
    setSelectedSquare(null);
    setLegalMovesForSelected([]);
    setMustJumpPieces([]);

    // Check victory
    const nextColor: PieceColor = piece.color === 'white' ? 'black' : 'white';
    const nextMoves = getAllLegalMovesForColor(newBoard, nextColor);
    if (nextMoves.moves.length === 0) {
      const winColor = piece.color;
      setWinner(winColor);
      if (winColor === 'white') {
        const earned = 150 + level * 25;
        const newScore = score + earned;
        setScore(newScore);

        if (currentUser?.id) {
          try {
            const res = await api.saveGameProgress({
              gameId: 'game_dames',
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
          } catch (err) {
            console.error(err);
          }
        }
      }
      return;
    }

    setCurrentTurn(nextColor);
  };

  // Square click handler
  const handleSquareClick = (r: number, c: number) => {
    if (winner || isAiThinking) return;
    if (gameMode === 'solo' && currentTurn === 'black') return;

    const clickedPiece = board[r][c];

    // If square has player's piece -> Select it
    if (clickedPiece && clickedPiece.color === currentTurn) {
      if (mustJumpPieces.length > 0 && !mustJumpPieces.some(p => p.r === r && p.c === c)) {
        // Player MUST jump with pieces that have a jump!
        return;
      }

      setSelectedSquare({ r, c });
      const { moves } = getAllLegalMovesForColor(board, currentTurn);
      const pieceMoves = moves.filter(m => m.fromRow === r && m.fromCol === c);
      setLegalMovesForSelected(pieceMoves);
      sfx.playMove();
      return;
    }

    // If an active square was selected, check if (r, c) is a legal destination
    if (selectedSquare) {
      const chosenMove = legalMovesForSelected.find(m => m.toRow === r && m.toCol === c);
      if (chosenMove) {
        applyMove(chosenMove);
      }
    }
  };

  const handleNextLevel = () => {
    if (level < 7) {
      const next = level + 1;
      setLevel(next);
      resetGame(next);
    } else {
      onGameOver(score, 0, 7);
    }
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-4 sm:p-6 text-white space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">♟️</span>
          <div>
            <h3 className="text-base font-black text-white">Dames (Damye 8x8)</h3>
            <div className="text-xs text-slate-400">
              {gameMode === 'solo' ? `Solo kont IA · Nivo ${level}` : '2 Jwè Lokal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => { setGameMode('solo'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'solo' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Solo (IA)
            </button>
            <button
              onClick={() => { setGameMode('pvp'); resetGame(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gameMode === 'pvp' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              2 Jwè
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

      {/* 7 Levels Selector (Solo mode) */}
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
                    resetGame(lvl);
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

      {/* Turn indicator & Captures */}
      <div className="flex items-center justify-between text-xs px-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">Tou :</span>
          <span className={`px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 border ${
            currentTurn === 'white'
              ? 'bg-slate-100 text-slate-950 border-white'
              : 'bg-slate-950 text-white border-slate-700'
          }`}>
            <span className={`w-3 h-3 rounded-full ${currentTurn === 'white' ? 'bg-white border border-slate-400' : 'bg-rose-600 border border-rose-300'}`} />
            <span>{currentTurn === 'white' ? 'Blan (Ou menm)' : (gameMode === 'solo' ? 'Nwa (IA)' : 'Nwa (Jwè 2)')}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono">
          <span>Pran: ⚪ {capturedBlack}</span>
          <span>🔴 {capturedWhite}</span>
        </div>
      </div>

      {/* Forced Jump Alert */}
      {mustJumpPieces.length > 0 && !winner && (
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-center font-bold animate-pulse">
          ⚡ Atansyon : Ou oblije sote sou pyès advèsè a dapre règ jwèt la !
        </div>
      )}

      {/* 8x8 Board Container */}
      <div className="flex justify-center p-2">
        <div className="grid grid-cols-8 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] border-4 border-[#2b1f13] rounded-2xl overflow-hidden shadow-2xl bg-[#3a2b1c]">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
              const isLegalTarget = legalMovesForSelected.some(m => m.toRow === r && m.toCol === c);
              const mustJump = mustJumpPieces.some(p => p.r === r && p.c === c);

              return (
                <button
                  key={`${r}_${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  disabled={!isDark}
                  className={`relative flex items-center justify-center transition-all ${
                    isDark ? 'bg-[#5c3e21]' : 'bg-[#e2cbaf]'
                  } ${isSelected ? 'ring-2 ring-amber-400 bg-[#7a532d]' : ''} ${
                    isLegalTarget ? 'hover:bg-[#855f36]' : ''
                  }`}
                >
                  {/* Legal move indicator dot */}
                  {isLegalTarget && (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/80 animate-ping absolute pointer-events-none" />
                  )}

                  {/* Piece */}
                  {cell && (
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 transition-transform ${
                        cell.color === 'white'
                          ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 border-white shadow-slate-900/50'
                          : 'bg-gradient-to-br from-rose-600 to-rose-950 text-white border-rose-400 shadow-rose-950/80'
                      } ${mustJump ? 'ring-2 ring-amber-400 animate-pulse' : ''} ${
                        isSelected ? 'scale-110' : ''
                      }`}
                    >
                      {cell.isKing && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Victory / Defeat Modal */}
      {winner && (
        <div className="p-5 rounded-2xl bg-[#131B2E] border-2 border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95">
          <div className="text-3xl">
            {winner === 'white' ? '🏆' : '💀'}
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {winner === 'white' ? 'Felisitasyon ! Ou Genyen Match la !' : 'Advèsè a Ranpòte Match la !'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {winner === 'white'
                ? `Ou bat opozan an nan Nivo ${level} la e ou ranmase ${score} pwen !`
                : 'Pa dekouraje, eseye yon lòt estrateji pou pran revanch ou !'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {winner === 'white' && level < 7 ? (
              <button
                onClick={handleNextLevel}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <span>Pwochen Nivo (Nivo {level + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={() => resetGame()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejwe Match la</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
