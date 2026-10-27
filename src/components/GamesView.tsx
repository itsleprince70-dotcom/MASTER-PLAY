import React, { useState } from 'react';
import { Game, User } from '../types';
import { api } from '../services/api';
import { Gamepad2, Play, Trophy, Sparkles, ArrowLeft, ShieldCheck, Flame, Star, CheckCircle } from 'lucide-react';

// Import all official game engines
import { FootballChallenge } from './games/FootballChallenge';
import { BasketChallenge } from './games/BasketChallenge';
import { BubbleShooter } from './games/BubbleShooter';
import { MemoryMaster } from './games/MemoryMaster';
import { XoArena } from './games/XoArena';
import { BlockPuzzle } from './games/BlockPuzzle';
import { AirHockeyBattle } from './games/AirHockeyBattle';
import { MazeEscape } from './games/MazeEscape';
import { TapMaster } from './games/TapMaster';
import { PotionLab } from './games/PotionLab';
import { PenaltyKing } from './games/PenaltyKing';
import { PoolMaster } from './games/PoolMaster';
import { BalonChallenge } from './games/BalonChallenge';
import { JeuDeMots } from './games/JeuDeMots';
import { TubeMaster } from './games/TubeMaster';
import { Dames } from './games/Dames';
import { ParchisiStar } from './games/ParchisiStar';
import { PianoMizikal } from './games/PianoMizikal';
import { LaserEscape } from './games/LaserEscape';
import { ParkingGenius } from './games/ParkingGenius';
import { ArrowMaster } from './games/ArrowMaster';
import { MeteorSurvivor } from './games/MeteorSurvivor';
import { CatchIt } from './games/CatchIt';
import { BalloonPopper } from './games/BalloonPopper';
import { SnakeRush } from './games/SnakeRush';
import { CoinJumper } from './games/CoinJumper';
import { AvionCrash } from './games/AvionCrash';

interface GamesViewProps {
  games: Game[];
  currentUser: User | null;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
  onBalanceUpdate: (newUser: User) => void;
}

export const GamesView: React.FC<GamesViewProps> = ({
  games,
  currentUser,
  onOpenDeposit,
  onOpenAuth,
  onBalanceUpdate,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'paid' | 'free'>('all');
  const [activePlayingGame, setActivePlayingGame] = useState<Game | null>(null);
  const [gameDifficulty, setGameDifficulty] = useState<'fasil' | 'mwayen' | 'difisil'>('fasil');

  // Filter games
  const filteredGames = games.filter((g) => {
    if (filter === 'active') return g.isActive;
    if (filter === 'paid') return g.isPaid;
    if (filter === 'free') return !g.isPaid;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {!activePlayingGame ? (
        <>
          {/* Top Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-amber-900/30 p-6 sm:p-8 border border-blue-500/20 shadow-xl">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Sal Jwèt Ofisyèl — Jwèt ak Konkou</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Jwèt MASTER PLAY / Kèkè Challenge
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Jwe Jeu de Mots, Tube Master, Dames, Parchisi Star, Piano Mizikal ak 11 Balon (7 Nivo), ansanm ak tout lòt jwèt yo pou ranmase pwen ak lajan kach !
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400 font-medium">
              Jwèt ki disponib : <strong className="text-amber-400">{filteredGames.length}</strong>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl self-start">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tout ({games.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === 'active' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aktif
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === 'paid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Peye
              </button>
              <button
                onClick={() => setFilter('free')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filter === 'free' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gratis
              </button>
            </div>
          </div>

          {/* 12 Games Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGames.map((game) => (
              <GameItemCard
                key={game.id}
                game={game}
                onPlay={() => setActivePlayingGame(game)}
              />
            ))}
          </div>
        </>
      ) : (
        /* Active Game Engine Container */
        <div>
          {activePlayingGame.category === 'avioncrash' ? (
            <AvionCrash
              currentUser={currentUser}
              onBalanceUpdate={onBalanceUpdate}
              onOpenDeposit={onOpenDeposit}
              onOpenAuth={onOpenAuth}
              onBack={() => setActivePlayingGame(null)}
            />
          ) : ['jeudemots', 'tubemaster', 'dames', 'parchisi', 'pianomizikal'].includes(activePlayingGame.category) ? (
            !currentUser ? (
              <div className="bg-[#131B2E] border border-amber-500/40 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 my-8 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto">
                  🔐
                </div>
                <h3 className="text-xl font-black text-white">Koneksyon Egzije</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ou dwe konekte sou kont ou pou w kapab jwe <b>{activePlayingGame.title}</b>, debloke 7 nivo yo epi sove pwen ou yo.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={onOpenAuth}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
                  >
                    KONEKTE KOUNYE A
                  </button>
                  <button
                    onClick={() => setActivePlayingGame(null)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                  >
                    Retounen nan Meni Jwèt yo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <button
                    onClick={() => setActivePlayingGame(null)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700 active:scale-95"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retounen nan tout jwèt yo</span>
                  </button>

                  {/* DIFFICULTY SELECTOR */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-400 px-2">Difikilte:</span>
                    <button
                      onClick={() => setGameDifficulty('fasil')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gameDifficulty === 'fasil'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🟢 Fasil (x1.0)
                    </button>
                    <button
                      onClick={() => setGameDifficulty('mwayen')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gameDifficulty === 'mwayen'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🟡 Mwayen (x1.5)
                    </button>
                    <button
                      onClick={() => setGameDifficulty('difisil')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        gameDifficulty === 'difisil'
                          ? 'bg-red-500 text-white font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔴 Difisil (x2.0)
                    </button>
                  </div>
                </div>

                {activePlayingGame.category === 'jeudemots' && (
                  <JeuDeMots
                    currentUser={currentUser}
                    onBalanceUpdate={onBalanceUpdate}
                    onGameOver={(score, prize) => {
                      const mult = gameDifficulty === 'fasil' ? 1 : gameDifficulty === 'mwayen' ? 1.5 : 2;
                      const adjusted = Math.round(score * mult);
                      if (prize && onBalanceUpdate && currentUser) {
                        onBalanceUpdate({ ...currentUser, balance: currentUser.balance + prize });
                      }
                      setActivePlayingGame(null);
                    }}
                  />
                )}
                {activePlayingGame.category === 'tubemaster' && (
                  <TubeMaster
                    currentUser={currentUser}
                    onBalanceUpdate={onBalanceUpdate}
                    onGameOver={(score, prize) => {
                      const mult = gameDifficulty === 'fasil' ? 1 : gameDifficulty === 'mwayen' ? 1.5 : 2;
                      const adjusted = Math.round(score * mult);
                      if (prize && onBalanceUpdate && currentUser) {
                        onBalanceUpdate({ ...currentUser, balance: currentUser.balance + prize });
                      }
                      setActivePlayingGame(null);
                    }}
                  />
                )}
                {activePlayingGame.category === 'dames' && (
                  <Dames
                    currentUser={currentUser}
                    onBalanceUpdate={onBalanceUpdate}
                    onGameOver={(score, prize) => {
                      const mult = gameDifficulty === 'fasil' ? 1 : gameDifficulty === 'mwayen' ? 1.5 : 2;
                      const adjusted = Math.round(score * mult);
                      if (prize && onBalanceUpdate && currentUser) {
                        onBalanceUpdate({ ...currentUser, balance: currentUser.balance + prize });
                      }
                      setActivePlayingGame(null);
                    }}
                  />
                )}
                {activePlayingGame.category === 'parchisi' && (
                  <ParchisiStar
                    currentUser={currentUser}
                    onBalanceUpdate={onBalanceUpdate}
                    onGameOver={(score, prize) => {
                      const mult = gameDifficulty === 'fasil' ? 1 : gameDifficulty === 'mwayen' ? 1.5 : 2;
                      const adjusted = Math.round(score * mult);
                      if (prize && onBalanceUpdate && currentUser) {
                        onBalanceUpdate({ ...currentUser, balance: currentUser.balance + prize });
                      }
                      setActivePlayingGame(null);
                    }}
                  />
                )}
                {activePlayingGame.category === 'pianomizikal' && (
                  <PianoMizikal
                    currentUser={currentUser}
                    game={activePlayingGame}
                    onBack={() => setActivePlayingGame(null)}
                    onBalanceUpdate={onBalanceUpdate}
                    onGameOver={(score, prize) => {
                      const mult = gameDifficulty === 'fasil' ? 1 : gameDifficulty === 'mwayen' ? 1.5 : 2;
                      const adjusted = Math.round(score * mult);
                      if (prize && onBalanceUpdate && currentUser) {
                        onBalanceUpdate({ ...currentUser, balance: currentUser.balance + prize });
                      }
                      setActivePlayingGame(null);
                    }}
                  />
                )}
              </div>
            )
          ) : (
            <div>
              <button
                onClick={() => setActivePlayingGame(null)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors mb-4 border border-slate-700 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retounen nan tout jwèt yo</span>
              </button>

              <ActiveGameEngineWrapper
                game={activePlayingGame}
                currentUser={currentUser}
                onOpenDeposit={onOpenDeposit}
                onOpenAuth={onOpenAuth}
                onBalanceUpdate={onBalanceUpdate}
                onExit={() => setActivePlayingGame(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- GAME CARD COMPONENT ---
const GameItemCard: React.FC<{ game: Game; onPlay: () => void }> = ({ game, onPlay }) => {
  const getTheme = (cat: string) => {
    switch (cat) {
      case 'balon':
        return {
          icon: '⚽🎟️',
          gradient: 'from-emerald-950/70 via-green-950/40 to-[#0B0F19]',
          border: 'border-emerald-400/60 hover:border-emerald-300 ring-1 ring-emerald-500/30',
          badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40 font-black',
        };
      case 'football':
      case 'penalty':
        return {
          icon: '⚽',
          gradient: 'from-emerald-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-emerald-500/30 hover:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'basket':
        return {
          icon: '🏀',
          gradient: 'from-orange-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-orange-500/30 hover:border-orange-400',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        };
      case 'bubble':
      case 'hockey':
        return {
          icon: cat === 'bubble' ? '🔵' : '🥅',
          gradient: 'from-blue-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-blue-500/30 hover:border-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      case 'memory':
      case 'potion':
        return {
          icon: cat === 'memory' ? '🧠' : '🧪',
          gradient: 'from-purple-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-purple-500/30 hover:border-purple-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      case 'xo':
        return {
          icon: '❌⭕',
          gradient: 'from-rose-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-rose-500/30 hover:border-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'block':
        return {
          icon: '🧩',
          gradient: 'from-pink-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-pink-500/30 hover:border-pink-400',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        };
      case 'maze':
        return {
          icon: '🌀',
          gradient: 'from-teal-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-teal-500/30 hover:border-teal-400',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        };
      case 'tap':
        return {
          icon: '👆',
          gradient: 'from-yellow-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-yellow-500/30 hover:border-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        };
      case 'jeudemots':
        return {
          icon: '🔤📝',
          gradient: 'from-amber-950/50 via-slate-900 to-[#0B0F19]',
          border: 'border-amber-500/40 hover:border-amber-300 ring-1 ring-amber-500/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'tubemaster':
        return {
          icon: '🧪🔵',
          gradient: 'from-cyan-950/50 via-slate-900 to-[#0B0F19]',
          border: 'border-cyan-500/40 hover:border-cyan-300 ring-1 ring-cyan-500/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      case 'dames':
        return {
          icon: '🏁👑',
          gradient: 'from-slate-900 via-amber-950/30 to-[#0B0F19]',
          border: 'border-amber-400/40 hover:border-amber-300 ring-1 ring-amber-400/20',
          badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
        };
      case 'parchisi':
        return {
          icon: '🎲⭐',
          gradient: 'from-rose-950/50 via-slate-900 to-[#0B0F19]',
          border: 'border-rose-500/40 hover:border-rose-300 ring-1 ring-rose-500/20',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'pianomizikal':
        return {
          icon: '🎹🎵',
          gradient: 'from-indigo-950/50 via-slate-900 to-[#0B0F19]',
          border: 'border-indigo-500/40 hover:border-indigo-300 ring-1 ring-indigo-500/20',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'avioncrash':
        return {
          icon: '✈️💥',
          gradient: 'from-amber-950/70 via-red-950/40 to-[#0B0F19]',
          border: 'border-amber-500/70 hover:border-amber-300 ring-2 ring-amber-500/30 shadow-amber-500/20 shadow-xl',
          badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 font-black',
        };
      case 'pool':
      default:
        return {
          icon: '🎱',
          gradient: 'from-emerald-950/40 via-[#131B2E] to-[#0B0F19]',
          border: 'border-emerald-500/30 hover:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
    }
  };

  const theme = getTheme(game.category);

  return (
    <div
      className={`rounded-3xl bg-[#131B2E] border ${theme.border} overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] group`}
    >
      {/* Banner / Visual */}
      <div className={`p-5 bg-gradient-to-b ${theme.gradient} relative flex items-center justify-between`}>
        <div className="w-14 h-14 rounded-2xl bg-[#0B0F19] border border-white/10 flex items-center justify-center text-3xl shadow-lg">
          {game.icon || theme.icon}
        </div>
        <div className="text-right">
          <span
            className={`inline-block text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${theme.badge}`}
          >
            {game.category === 'avioncrash' ? '💵 VRÈ LAJAN' : game.isPaid ? `${game.entryFee} HT` : 'Gratis'}
          </span>
          <div className="text-[10px] text-amber-400 font-bold mt-1">
            {game.category === 'avioncrash' ? 'Miz 10 - 5,000 HT' : `${game.levelsCount || 6} Nivo Disponib`}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
            {game.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Highscore & Levels Pill */}
        <div className="my-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Top nòt:
          </span>
          <span className="font-bold text-amber-400 tabular-nums">
            {game.highScores[0]?.score || 0} pts
          </span>
        </div>

        {/* Play CTA */}
        <button
          onClick={onPlay}
          disabled={!game.isActive}
          className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-40 ${
            game.category === 'avioncrash'
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black shadow-lg shadow-amber-500/25'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>
            {game.category === 'avioncrash'
              ? 'JWE AK VRÈ LAJAN ❯'
              : game.isActive
              ? `Jwe (${game.levelsCount || 6} Nivo)`
              : 'Fèmen'}
          </span>
        </button>
      </div>
    </div>
  );
};

// --- ACTIVE GAME ENGINE WRAPPER ---
const ActiveGameEngineWrapper: React.FC<{
  game: Game;
  currentUser: User | null;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
  onBalanceUpdate: (newUser: User) => void;
  onExit: () => void;
}> = ({ game, currentUser, onOpenDeposit, onOpenAuth, onBalanceUpdate, onExit }) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [levelReached, setLevelReached] = useState(1);
  const [playError, setPlayError] = useState('');
  const [awardedPrize, setAwardedPrize] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'fasil' | 'mwayen' | 'difisil'>('fasil');

  const startPlaying = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (game.isPaid && currentUser.balance < game.entryFee) {
      setPlayError(`Balans ou (${currentUser.balance} HT) pa ase pou peye ${game.entryFee} HT. Tanpri fè yon depo sou NatCash.`);
      return;
    }

    setPlayError('');
    setAwardedPrize(null);
    setScore(0);
    setGameState('playing');
  };

  const handleGameOver = (baseScore: number, wonPrize?: number, finalLevel?: number) => {
    const mult = difficulty === 'fasil' ? 1 : difficulty === 'mwayen' ? 1.5 : 2;
    const finalScore = Math.round(baseScore * mult);

    setTimeout(async () => {
      setGameState('gameover');
      setScore(finalScore);
      if (finalLevel) setLevelReached(finalLevel);
      if (wonPrize) setAwardedPrize(wonPrize);

      if (currentUser) {
        try {
          const res = await api.playGame(game.id, currentUser.id, finalScore, wonPrize);
          if (res.success && res.user) {
            onBalanceUpdate(res.user);
          }
        } catch (err) {
          console.error('Error saving score:', err);
        }
      }
    }, 0);
  };

  // Render the appropriate mini-game engine
  const renderGameComponent = () => {
    switch (game.category) {
      case 'balon':
        return (
          <BalonChallenge
            onGameOver={handleGameOver}
            currentUser={currentUser}
            onBalanceUpdate={onBalanceUpdate}
            onOpenDeposit={onOpenDeposit}
          />
        );
      case 'football':
        return <FootballChallenge onGameOver={handleGameOver} />;
      case 'basket':
        return <BasketChallenge onGameOver={handleGameOver} />;
      case 'bubble':
        return <BubbleShooter onGameOver={handleGameOver} />;
      case 'memory':
        return <MemoryMaster onGameOver={handleGameOver} />;
      case 'xo':
        return <XoArena onGameOver={handleGameOver} />;
      case 'block':
        return <BlockPuzzle onGameOver={handleGameOver} />;
      case 'hockey':
        return <AirHockeyBattle onGameOver={handleGameOver} />;
      case 'maze':
        return <MazeEscape onGameOver={handleGameOver} />;
      case 'tap':
        return <TapMaster onGameOver={handleGameOver} />;
      case 'potion':
        return <PotionLab onGameOver={handleGameOver} />;
      case 'penalty':
        return <PenaltyKing onGameOver={handleGameOver} />;
      case 'pool':
        return <PoolMaster onGameOver={handleGameOver} />;
      case 'jeudemots':
        return <JeuDeMots onGameOver={handleGameOver} currentUser={currentUser} />;
      case 'tubemaster':
        return <TubeMaster onGameOver={handleGameOver} currentUser={currentUser} />;
      case 'dames':
        return <Dames onGameOver={handleGameOver} currentUser={currentUser} />;
      case 'parchisi':
        return <ParchisiStar onGameOver={handleGameOver} currentUser={currentUser} />;
      case 'pianomizikal':
        return <PianoMizikal onGameOver={handleGameOver} currentUser={currentUser} game={game} onBack={onExit} />;
      case 'laserescape':
        return <LaserEscape onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'parkinggenius':
        return <ParkingGenius onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'arrowmaster':
        return <ArrowMaster onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'meteorsurvivor':
        return <MeteorSurvivor onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'catchit':
        return <CatchIt onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'balloonpopper':
        return <BalloonPopper onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'snakerush':
        return <SnakeRush onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'coinjumper':
        return <CoinJumper onGameOver={handleGameOver} currentUser={currentUser} onBack={onExit} />;
      case 'avioncrash':
        return (
          <AvionCrash
            currentUser={currentUser}
            onBalanceUpdate={onBalanceUpdate}
            onOpenDeposit={onOpenDeposit}
            onOpenAuth={onOpenAuth}
            onBack={onExit}
          />
        );
      default:
        return <FootballChallenge onGameOver={handleGameOver} />;
    }
  };

  return (
    <div className="bg-[#131B2E] border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl max-w-2xl mx-auto">
      {/* Game Title Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{game.icon || '🎮'}</span>
            <h2 className="text-xl font-black text-white">{game.title}</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-md">{game.rules}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-slate-400">Pri Antre:</div>
          <div className="text-base font-black text-amber-400">
            {game.isPaid ? `${game.entryFee} HT` : 'Gratis'}
          </div>
        </div>
      </div>

      {playError && (
        <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center justify-between gap-2">
          <span>{playError}</span>
          <button
            onClick={onOpenDeposit}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shrink-0"
          >
            Fè depo NatCash
          </button>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="my-5">
        {gameState === 'ready' && (
          <div className="min-h-[320px] bg-[#0B0F19] rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mx-auto shadow-xl">
              {game.icon || '🎮'}
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{game.title} ({game.levelsCount || 6} Nivo)</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                {game.isPaid
                  ? `Pri pou jwe manch sa a se ${game.entryFee} HT. Ranpòte nivo yo pou genyen pwen ak prim NatCash !`
                  : `Manch gratis ! Pase tout ${game.levelsCount || 6} nivo yo pou mete non w an premye sou klasman an !`}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: game.levelsCount || 6 }, (_, i) => i + 1).map((lvl) => (
                <span
                  key={lvl}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-700"
                >
                  N{lvl}
                </span>
              ))}
            </div>

            {/* Difikilte Switcher */}
            <div className="p-1 bg-[#131B2E] border border-slate-700 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDifficulty('fasil')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficulty === 'fasil'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 Fasil (x1.0)
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('mwayen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficulty === 'mwayen'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟡 Mwayen (x1.5)
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('difisil')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  difficulty === 'difisil'
                    ? 'bg-red-500 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 Difisil (x2.0)
              </button>
            </div>

            <button
              onClick={startPlaying}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              KÒMANSE JWE KOUNYE A
            </button>
          </div>
        )}

        {gameState === 'playing' && renderGameComponent()}

        {gameState === 'gameover' && (
          <div className="min-h-[320px] bg-[#0B0F19] rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-4xl mx-auto">
              🏆
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Pati a Fini !</h3>
              <div className="text-3xl font-black text-amber-400 my-1 tabular-nums">
                Nòt ou : {score} pts
              </div>
              <p className="text-xs text-slate-400">Ou rive nan Nivo {levelReached} sou 6 !</p>
              {awardedPrize && (
                <div className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  🎉 Bravo ! Ou genyen {awardedPrize} HT sou balans ou !
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={startPlaying}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Rejwe
              </button>
              <button
                onClick={onExit}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Tout Jwèt yo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard for this game */}
      <div className="pt-3 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Pi bon nòt nan {game.title}
        </h4>
        <div className="space-y-1.5">
          {game.highScores.slice(0, 3).map((scoreItem, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-[#0B0F19] text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">#{idx + 1}</span>
                <span className="text-white font-semibold">{scoreItem.userName}</span>
              </div>
              <span className="font-mono font-bold text-amber-300">{scoreItem.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
