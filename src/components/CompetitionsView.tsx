import React, { useState, useEffect } from 'react';
import { Competition, User, Game, CompetitionMatch, GiftItem } from '../types';
import { api } from '../services/api';
import {
  Trophy, Calendar, Users, Clock, AlertCircle, ArrowRight, ShieldCheck,
  CheckCircle2, ChevronRight, X, Sparkles, Gamepad2, Flame, Crown, Play,
  Check, Lock, Star, ChevronDown, Award, Heart, Gift, ThumbsUp, Send,
  Zap, Info, Coins, ShieldAlert, ArrowLeft, Loader2
} from 'lucide-react';

import { BalonChallenge } from './games/BalonChallenge';
import { JeuDeMots } from './games/JeuDeMots';
import { TubeMaster } from './games/TubeMaster';
import { Dames } from './games/Dames';
import { ParchisiStar } from './games/ParchisiStar';
import { PianoMizikal } from './games/PianoMizikal';
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
import { LaserEscape } from './games/LaserEscape';
import { ParkingGenius } from './games/ParkingGenius';
import { ArrowMaster } from './games/ArrowMaster';
import { MeteorSurvivor } from './games/MeteorSurvivor';
import { CatchIt } from './games/CatchIt';
import { BalloonPopper } from './games/BalloonPopper';
import { SnakeRush } from './games/SnakeRush';
import { CoinJumper } from './games/CoinJumper';
import { SubscribeButton } from './SubscribeButton';

interface CompetitionsViewProps {
  competitions: Competition[];
  games?: Game[];
  currentUser: User | null;
  onOpenDeposit: () => void;
  onOpenAuth: () => void;
  onRegistrationSuccess: (updatedComp: Competition, updatedUser: User) => void;
  onSelectGame?: (game: Game) => void;
  selectedCompId?: string | null;
  onUpdateUser?: (updatedUser: User) => void;
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({
  competitions,
  games = [],
  currentUser,
  onOpenDeposit,
  onOpenAuth,
  onRegistrationSuccess,
  onSelectGame,
  selectedCompId,
  onUpdateUser,
}) => {
  // Main sub-tab switcher: Now includes 'jwet_seleksyone'
  const [activeSubTab, setActiveSubTab] = useState<'tounwa' | 'jwet_seleksyone' | 'top8' | 'match_vot' | 'kado' | 'rezilta'>('tounwa');
  const [selectedComp, setSelectedComp] = useState<Competition>(() => {
    if (selectedCompId) {
      const found = competitions.find((c) => c.id === selectedCompId);
      if (found) return found;
    }
    return competitions[0] || ({} as Competition);
  });

  // State for Competition Mode Game Session
  const [competitionPlayingGame, setCompetitionPlayingGame] = useState<Game | null>(null);
  const [compDifficulty, setCompDifficulty] = useState<'fasil' | 'mwayen' | 'difisil'>('fasil');
  const [compCelebration, setCompCelebration] = useState<{ gameTitle: string; points: number; newTotal: number } | null>(null);

  // Modal detail state
  const [detailModalComp, setDetailModalComp] = useState<Competition | null>(null);
  const [registering, setRegistering] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Voting state
  const [votingModalData, setVotingModalData] = useState<{
    match: CompetitionMatch;
    playerId: string;
    playerName: string;
    playerPhoto: string;
    price: number;
  } | null>(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  // Gifts state
  const [giftsList, setGiftsList] = useState<GiftItem[]>([
    { id: 'gift_chat', name: 'Chat', icon: '🐱', description: 'Yon ti chat bèl pou ankouraje jwè a !', price: 20, isActive: true },
    { id: 'gift_reken', name: 'Reken', icon: '🦈', description: 'Fòs reken pou devore advèsè a !', price: 100, isActive: true },
    { id: 'gift_pistole', name: 'Pistolè', icon: '🔫', description: 'Tir presizyon pou batay la !', price: 300, isActive: true },
    { id: 'gift_lyon', name: 'Lyon', icon: '🦁', description: 'Wa nan forè a pou vre chanpyon an !', price: 400, isActive: true },
  ]);
  const [giftRecipient, setGiftRecipient] = useState<{ id: string; name: string; photo?: string } | null>(null);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [giftCelebration, setGiftCelebration] = useState<{ icon: string; name: string; recipientName: string } | null>(null);

  // States for Requirement 3: Level Score Registration, Exit Confirmation & Daily Replay Block
  const [pendingLevelScore, setPendingLevelScore] = useState<{
    score: number;
    rawScore: number;
    level: number;
    gameId: string;
    gameTitle: string;
  } | null>(null);
  const [recordingLevelScore, setRecordingLevelScore] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [playedLevelsToday, setPlayedLevelsToday] = useState<number[]>([]);
  const [levelSaveMessage, setLevelSaveMessage] = useState<string | null>(null);

  // Fetch played levels for current user and selected game today
  useEffect(() => {
    if (selectedComp?.id && currentUser?.id && competitionPlayingGame?.id) {
      api.getCompetitionPlayedLevels(selectedComp.id, currentUser.id, competitionPlayingGame.id)
        .then(res => {
          if (res.success && res.playedLevels) {
            setPlayedLevelsToday(res.playedLevels);
          }
        })
        .catch(() => {});
    } else {
      setPlayedLevelsToday([]);
    }
  }, [selectedComp?.id, currentUser?.id, competitionPlayingGame?.id]);

  // Load gifts from backend if available
  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const res = await api.getGifts();
        if (res.success && res.gifts && res.gifts.length > 0) {
          setGiftsList(res.gifts);
        }
      } catch (err) {
        // Fallback to default gifts
      }
    };
    fetchGifts();
  }, []);

  // Update selectedComp when competitions list updates
  useEffect(() => {
    if (selectedComp && selectedComp.id) {
      const refreshed = competitions.find(c => c.id === selectedComp.id);
      if (refreshed) setSelectedComp(refreshed);
    } else if (competitions.length > 0) {
      setSelectedComp(competitions[0]);
    }
  }, [competitions]);

  const availableBalance = currentUser ? currentUser.balance - (currentUser.reservedBalance || 0) : 0;

  // Handle Competition Registration
  const handleRegister = async (comp: Competition) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setFeedbackMsg(null);

    if (availableBalance < comp.entryFee) {
      setFeedbackMsg({
        type: 'error',
        text: `Balans ou (${availableBalance.toLocaleString()} HT) pa ase pou peye ${comp.entryFee.toLocaleString()} HT. Tanpri fè yon depo sou NatCash.`
      });
      return;
    }

    setRegistering(true);
    try {
      const res = await api.registerCompetition(comp.id, currentUser.id);
      if (res.success && res.competition && res.user) {
        setFeedbackMsg({
          type: 'success',
          text: res.message || `Ou enskri avèk siksè nan ${comp.name} !`
        });
        onRegistrationSuccess(res.competition, res.user);
        setSelectedComp(res.competition);
        if (detailModalComp?.id === comp.id) {
          setDetailModalComp(res.competition);
        }
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erè pandan enskripsyon an.'
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Erè rezo pandan enskripsyon an.'
      });
    } finally {
      setRegistering(false);
    }
  };

  // Handle Voting
  const handleConfirmVote = async () => {
    if (!votingModalData || !currentUser) return;
    setSubmittingVote(true);
    setFeedbackMsg(null);

    try {
      const res = await api.votePlayer({
        voterId: currentUser.id,
        competitionId: selectedComp.id,
        matchId: votingModalData.match.id,
        playerId: votingModalData.playerId
      });

      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: res.message || `Vòt ou a pou ${votingModalData.playerName} anrejistre avèk siksè !`
        });

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }

        // Update local match votes count
        if (selectedComp.matches) {
          const matchIndex = selectedComp.matches.findIndex(m => m.id === votingModalData.match.id);
          if (matchIndex !== -1) {
            const updatedMatches = [...selectedComp.matches];
            const targetM = { ...updatedMatches[matchIndex] };
            if (targetM.player1.userId === votingModalData.playerId) {
              targetM.votes1 = (targetM.votes1 || 0) + 1;
              targetM.player1.votesCount = (targetM.player1.votesCount || 0) + 1;
            } else {
              targetM.votes2 = (targetM.votes2 || 0) + 1;
              targetM.player2.votesCount = (targetM.player2.votesCount || 0) + 1;
            }
            updatedMatches[matchIndex] = targetM;
            setSelectedComp({ ...selectedComp, matches: updatedMatches });
          }
        }

        setVotingModalData(null);
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erè pandan vòt la.'
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Erè pandan tretman vòt la.'
      });
    } finally {
      setSubmittingVote(false);
    }
  };

  // Handle Sending Gift
  const handleConfirmSendGift = async () => {
    if (!selectedGift || !giftRecipient || !currentUser) return;
    setSendingGift(true);
    setFeedbackMsg(null);

    try {
      const res = await api.sendGift({
        senderId: currentUser.id,
        receiverId: giftRecipient.id,
        giftId: selectedGift.id,
        competitionId: selectedComp?.id
      });

      if (res.success) {
        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }

        // Trigger celebratory animation
        setGiftCelebration({
          icon: selectedGift.icon,
          name: selectedGift.name,
          recipientName: giftRecipient.name
        });
        setTimeout(() => setGiftCelebration(null), 4000);

        setFeedbackMsg({
          type: 'success',
          text: res.message || `Ou voye kado ${selectedGift.icon} ${selectedGift.name} bay ${giftRecipient.name} avèk siksè !`
        });

        // Update participant in local scores
        if (selectedComp?.scores) {
          const updatedScores = selectedComp.scores.map(s => {
            if (s.userId === giftRecipient.id) {
              return {
                ...s,
                giftsCount: (s.giftsCount || 0) + 1,
                giftsValue: (s.giftsValue || 0) + selectedGift.price
              };
            }
            return s;
          });
          setSelectedComp({ ...selectedComp, scores: updatedScores });
        }

        setSelectedGift(null);
      } else {
        setFeedbackMsg({
          type: 'error',
          text: res.error || 'Erè pandan voye kado a.'
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Erè rezo pandan voye kado a.'
      });
    } finally {
      setSendingGift(false);
    }
  };

  // Handle Level Completion / Game Over in Competition Mode (Requirement 3A: Score Staging)
  const handleCompGameOver = (baseScore: number, _prize?: number, levelReached?: number) => {
    if (!competitionPlayingGame || !currentUser) return;
    const lvl = levelReached || 1;

    // Check if this level was already recorded today
    if (playedLevelsToday.includes(lvl)) {
      alert('Ou deja anrejistre pwen ou pou nivo sa a. Ou pa kapab rejwe li pandan jounen sa a.');
      return;
    }

    const mult = compDifficulty === 'fasil' ? 1 : compDifficulty === 'mwayen' ? 1.5 : 2;
    const finalScore = Math.max(10, Math.round(baseScore * mult));

    // Stage score for player's explicit confirmation via "Anrejistre pwen yo"
    setPendingLevelScore({
      score: finalScore,
      rawScore: baseScore,
      level: lvl,
      gameId: competitionPlayingGame.id,
      gameTitle: competitionPlayingGame.title
    });
    setLevelSaveMessage(null);
  };

  // Explicit Save Points Action (Requirement 3A & 3B)
  const handleSavePendingScore = async (onDone?: () => void) => {
    if (!pendingLevelScore || !currentUser || !selectedComp) return;
    if (recordingLevelScore) return; // Prevent double click
    setRecordingLevelScore(true);

    try {
      const res = await api.recordCompetitionLevelScore({
        competitionId: selectedComp.id,
        userId: currentUser.id,
        gameId: pendingLevelScore.gameId,
        level: pendingLevelScore.level,
        score: pendingLevelScore.score
      });

      if (res.success && res.competition) {
        setSelectedComp(res.competition);
        if (res.playedLevelsToday) {
          setPlayedLevelsToday(res.playedLevelsToday);
        } else {
          setPlayedLevelsToday(prev => [...prev, pendingLevelScore.level]);
        }

        // Show official Haitian Creole success confirmation
        setLevelSaveMessage('Pwen ou yo anrejistre avèk siksè !');

        // Sync general game progress in background
        api.saveGameProgress({
          gameId: pendingLevelScore.gameId,
          userId: currentUser.id,
          level: pendingLevelScore.level,
          won: true,
          score: pendingLevelScore.score,
          pointsEarned: pendingLevelScore.score,
          competitionId: selectedComp.id
        }).catch(() => {});

        setTimeout(() => {
          setLevelSaveMessage(null);
          setPendingLevelScore(null);
          setShowExitConfirm(false);
          if (onDone) onDone();
        }, 1200);
      } else {
        alert(res.error || 'Erè nan anrejistreman pwen yo.');
      }
    } catch (err: any) {
      alert(err.message || 'Erè pandan anrejistreman pwen yo.');
    } finally {
      setRecordingLevelScore(false);
    }
  };

  const activeCompetitions = competitions.filter(c => c.status !== 'finished' && c.status !== 'Fini');
  const finishedCompetitions = competitions.filter(c => c.status === 'finished' || c.status === 'Fini');

  // Helpers for status badges
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Enskripsyon ouvè':
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Enskripsyon Ouvè</span>;
      case 'An kou':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">An Kou 🔥</span>;
      case 'Ap vini':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Ap Vini</span>;
      case 'Enskripsyon fèmen':
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Enskripsyon Fèmen</span>;
      case 'An poz':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">An Poz</span>;
      case 'Fini':
      case 'finished':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Fini</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">Aktif</span>;
    }
  };

  // Participants list for gift recipient picking
  const availableRecipients: Array<{ id: string; name: string; photo?: string }> = (selectedComp?.scores || []).map(s => ({
    id: s.userId,
    name: s.fullName,
    photo: s.profilePhoto
  }));

  return (
    <div className="space-y-6 pb-16 relative">
      {/* FLOATING GIFT CELEBRATION ANIMATION */}
      {giftCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-1 rounded-3xl shadow-2xl animate-bounce">
            <div className="bg-[#0B0F19] p-6 rounded-[22px] flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-6xl animate-pulse">{giftCelebration.icon}</span>
              <div className="text-xl font-black text-white">
                KADO {giftCelebration.name.toUpperCase()} VOYE !
              </div>
              <p className="text-xs text-amber-300 font-bold">
                🎉 Felisitasyon bay {giftCelebration.recipientName} !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-lg ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with Haiti Time Notice */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600/30 via-slate-900 to-indigo-950/60 p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-3">
            <Trophy className="w-3.5 h-3.5" />
            <span>Platfòm Konpetisyon, Match VS, Vòt & Kado — MASTER PLAY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Konpetisyon Ofisyèl Kèkè Challenge
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Patisipe nan tounwa yo, gade match fasafas (VS), vote pou jwè ou renmen an, voye kado vityèl ak sipòte talan Ayiti yo !
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Fizo orè: Lè Ayiti (America/Port-au-Prince) • Fèmen otomatikman nan lè limit la</span>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Competition Selector Ribbon if multiple competitions */}
      {competitions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Konpetisyon:
          </span>
          {competitions.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComp(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedComp?.id === c.id
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black scale-105'
                  : 'bg-[#131B2E] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{c.badge || '🏆'} {c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main 6 Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => {
            setActiveSubTab('tounwa');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'tounwa'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">Tounwa</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('jwet_seleksyone');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'jwet_seleksyone'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Jwèt Seleksyone 🎮</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('top8');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'top8'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 shrink-0" />
          <span className="truncate">Top 8</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('match_vot');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'match_vot'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span className="truncate">Match & Vòt</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('kado');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'kado'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-4 h-4 shrink-0" />
          <span className="truncate">Boutik Kado 🎁</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('rezilta');
            setCompetitionPlayingGame(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'rezilta'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span className="truncate">Podium & Règ</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. TOUNWA & ENSKRIPSYON TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'tounwa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {competitions.map((comp) => {
              const registeredCount = comp.registeredUserIds.length;
              const slotsLeft = Math.max(0, comp.maxParticipants - registeredCount);
              const isUserRegistered = currentUser ? comp.registeredUserIds.includes(currentUser.id) : false;
              const isFull = slotsLeft === 0;

              return (
                <div
                  key={comp.id}
                  className="rounded-3xl border border-slate-700/80 bg-gradient-to-b from-[#131B2E] via-[#0F172A] to-[#0B0F19] p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-amber-500/40"
                >
                  <div>
                    {/* Header: Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">
                        {comp.badge || '🏆'} {comp.name}
                      </span>
                      {getStatusBadge(comp.status)}
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-xl font-black text-white">{comp.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {comp.tagline || comp.description}
                    </p>

                    {/* Entry fee pill */}
                    <div className="my-3 p-3 rounded-2xl bg-[#080C16] border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Frè Enskripsyon</span>
                        <span className="text-lg font-black text-amber-400 tabular-nums">
                          {comp.entryFee > 0 ? `${comp.entryFee.toLocaleString()} HT` : 'Gratis'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Plas ki rete</span>
                        <span className="text-sm font-black text-emerald-400 tabular-nums">
                          {slotsLeft} / {comp.maxParticipants}
                        </span>
                      </div>
                    </div>

                    {/* Timing details */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Kòmansman:
                        </span>
                        <span className="font-semibold">{comp.startDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          Lè Fen:
                        </span>
                        <span className="font-semibold">{comp.deadline}</span>
                      </div>
                    </div>

                    {/* Authorized Games Icons */}
                    <div className="my-3 pt-3 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1.5 font-bold">
                        Jwèt Otorize pou Konpetisyon Sa a:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {comp.authorizedGameIds?.slice(0, 5).map((gid) => {
                          const gObj = games.find(g => g.id === gid);
                          return (
                            <span
                              key={gid}
                              className="px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1"
                            >
                              <span>{gObj?.icon || '🎮'}</span>
                              <span className="truncate max-w-[80px]">{gObj?.title || gid}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    {isUserRegistered ? (
                      <button
                        onClick={() => {
                          setSelectedComp(comp);
                          setActiveSubTab('match_vot');
                        }}
                        className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-emerald-500/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ou enskri • Antre nan Match & Vòt</span>
                      </button>
                    ) : isFull ? (
                      <div className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold text-center">
                        Konpetisyon sa a plen
                      </div>
                    ) : comp.status === 'Fini' || comp.status === 'finished' ? (
                      <button
                        onClick={() => {
                          setSelectedComp(comp);
                          setActiveSubTab('rezilta');
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all text-center"
                      >
                        Gade Rezilta Final & Chanpyon
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(comp)}
                        disabled={registering}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 flex items-center justify-center gap-1.5"
                      >
                        <span>Enskri Kounye a ({comp.entryFee} HT)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedComp(comp);
                        setActiveSubTab('top8');
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Gade Top 8 & Klasman</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. JWÈT SELEKSYONE TAB (REQUIREMENT 1, 2, 3, 4) */}
      {/* ======================================================== */}
      {activeSubTab === 'jwet_seleksyone' && (
        <div className="space-y-6">
          {/* CELEBRATION MODAL FOR COMPETITION RESULTS */}
          {compCelebration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#131B2E] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-4xl mx-auto animate-bounce">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-white">Rezilta Konpetisyon Anrejistre !</h3>
                <p className="text-xs text-slate-300">
                  Ou sot fini yon sesyon nan <strong className="text-amber-400">{compCelebration.gameTitle}</strong> pou konpetisyon <strong className="text-white">{selectedComp.name}</strong>.
                </p>
                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">Pwen Ranmase (Difikilte: {compDifficulty.toUpperCase()})</div>
                  <div className="text-3xl font-black text-amber-400 tabular-nums">+{compCelebration.points} pts</div>
                  <div className="text-xs text-emerald-400 font-bold mt-1">
                    Nouvo Total nan Konpetisyon an: {compCelebration.newTotal.toLocaleString()} pts
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCompCelebration(null)}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Kontinye Jwe
                  </button>
                  <button
                    onClick={() => {
                      setCompCelebration(null);
                      setCompetitionPlayingGame(null);
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition"
                  >
                    Lis Jwèt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REQUIREMENT 3B: EXIT CONFIRMATION MODAL */}
          {showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#131B2E] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-2xl">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-white">
                  Ou pral kite jwèt la. Èske ou vle anrejistre pwen ou fè yo anvan ou sòti?
                </h3>
                {pendingLevelScore && (
                  <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 text-xs text-slate-300">
                    Nivo: <strong className="text-white">Nivo {pendingLevelScore.level}</strong> • Pwen: <strong className="text-amber-400">+{pendingLevelScore.score} pts</strong>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => handleSavePendingScore(() => setCompetitionPlayingGame(null))}
                    disabled={recordingLevelScore}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {recordingLevelScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Anrejistre pwen yo</span>
                  </button>
                  <button
                    onClick={() => {
                      setPendingLevelScore(null);
                      setShowExitConfirm(false);
                      setCompetitionPlayingGame(null);
                    }}
                    disabled={recordingLevelScore}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition border border-slate-700"
                  >
                    <span>Kite san anrejistre</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REQUIREMENT 3A: SAVE POINTS AT END OF LEVEL MODAL */}
          {pendingLevelScore && !showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#131B2E] border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl animate-bounce">
                  ⭐
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Nivo {pendingLevelScore.level} Fini !
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    Felisitasyon ! Nivo Konplete
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Ou fin ranpli nivo a nan <strong className="text-amber-400">{pendingLevelScore.gameTitle}</strong> pou konpetisyon <strong className="text-white">{selectedComp.name}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-bold">
                    Pwen Ou Fè Nan Nivo Sa a
                  </div>
                  <div className="text-4xl font-black text-amber-400 tabular-nums">
                    +{pendingLevelScore.score} pts
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Difikilte: <span className="font-bold text-white capitalize">{compDifficulty}</span>
                  </div>
                </div>

                {levelSaveMessage ? (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{levelSaveMessage}</span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleSavePendingScore()}
                      disabled={recordingLevelScore}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      {recordingLevelScore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>N ap anrejistre pwen yo...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Anrejistre pwen yo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowExitConfirm(true)}
                      className="text-xs text-slate-400 hover:text-white transition-colors py-1 block mx-auto"
                    >
                      Kite jwèt la...
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {competitionPlayingGame ? (
            /* ACTIVE COMPETITION PLAYING CONTAINER */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                <button
                  onClick={() => {
                    if (pendingLevelScore) {
                      setShowExitConfirm(true);
                    } else {
                      setCompetitionPlayingGame(null);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retounen nan Jwèt Seleksyone</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{selectedComp.name}</span>
                  </span>
                </div>

                {/* Difikilte Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 px-2">Difikilte:</span>
                  <button
                    onClick={() => setCompDifficulty('fasil')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      compDifficulty === 'fasil'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🟢 Fasil (x1.0)
                  </button>
                  <button
                    onClick={() => setCompDifficulty('mwayen')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      compDifficulty === 'mwayen'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🟡 Mwayen (x1.5)
                  </button>
                  <button
                    onClick={() => setCompDifficulty('difisil')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      compDifficulty === 'difisil'
                        ? 'bg-red-500 text-white font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔴 Difisil (x2.0)
                  </button>
                </div>
              </div>

              {/* Free Access Notice Banner */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  🛡️ <strong>Aksè Gratis Konpetisyon:</strong> Paske ou deja peye frè enskripsyon pou {selectedComp.name}, ou pa peye okenn frè siplemantè pou jwe jwèt sa a. Pwen ou fè ap anrejistre dirèkteman nan klasman konpetisyon an !
                </span>
              </div>

              {/* Mounted Game Engine */}
              <div className="mt-2">
                {competitionPlayingGame.category === 'jeudemots' && (
                  <JeuDeMots
                    currentUser={currentUser}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'tubemaster' && (
                  <TubeMaster
                    currentUser={currentUser}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'dames' && (
                  <Dames
                    currentUser={currentUser}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'parchisi' && (
                  <ParchisiStar
                    currentUser={currentUser}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'pianomizikal' && (
                  <PianoMizikal
                    currentUser={currentUser}
                    game={competitionPlayingGame}
                    onBack={() => setCompetitionPlayingGame(null)}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'balon' && (
                  <BalonChallenge
                    currentUser={currentUser}
                    onGameOver={handleCompGameOver}
                  />
                )}
                {competitionPlayingGame.category === 'football' && (
                  <FootballChallenge onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'basket' && (
                  <BasketChallenge onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'bubble' && (
                  <BubbleShooter onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'memory' && (
                  <MemoryMaster onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'xo' && (
                  <XoArena onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'block' && (
                  <BlockPuzzle onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'hockey' && (
                  <AirHockeyBattle onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'maze' && (
                  <MazeEscape onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'tap' && (
                  <TapMaster onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'potion' && (
                  <PotionLab onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'penalty' && (
                  <PenaltyKing onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'pool' && (
                  <PoolMaster onGameOver={handleCompGameOver} />
                )}
                {competitionPlayingGame.category === 'laserescape' && (
                  <LaserEscape onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'parkinggenius' && (
                  <ParkingGenius onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'arrowmaster' && (
                  <ArrowMaster onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'meteorsurvivor' && (
                  <MeteorSurvivor onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'catchit' && (
                  <CatchIt onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'balloonpopper' && (
                  <BalloonPopper onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'snakerush' && (
                  <SnakeRush onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
                {competitionPlayingGame.category === 'coinjumper' && (
                  <CoinJumper onGameOver={handleCompGameOver} currentUser={currentUser} />
                )}
              </div>
            </div>
          ) : (
            /* LIST OF SELECTED GAMES FOR THIS COMPETITION */
            <div className="space-y-6">
              {/* Header Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#131B2E] to-amber-900/40 p-6 sm:p-7 border border-blue-500/20 shadow-xl">
                <div className="max-w-2xl relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Paj Ofisyèl Jwèt Seleksyone — {selectedComp.name}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Jwèt Seleksyone pou Konpetisyon an
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Administratè a seleksyone jwèt sa yo espesyalman pou konpetisyon sa a. Tout jwè ki deja enskri nan konpetisyon an kapab jwe tout jwèt sa yo san yo pa peye frè antre jwèt la ankò, epi tout pwen yo fè ap monte dirèkteman nan klasman an !
                  </p>
                </div>
              </div>

              {/* Registration Status Banner */}
              {(() => {
                const isRegistered = Boolean(
                  currentUser && selectedComp.registeredUserIds && selectedComp.registeredUserIds.includes(currentUser.id)
                );
                const userScoreObj = (selectedComp.scores || []).find(s => s.userId === currentUser?.id);
                const userRank = userScoreObj?.rank ||
                  ((selectedComp.scores || []).findIndex(s => s.userId === currentUser?.id) !== -1
                    ? (selectedComp.scores || []).findIndex(s => s.userId === currentUser?.id) + 1
                    : '-');

                if (isRegistered) {
                  return (
                    <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#131B2E] to-[#0B0F19] border border-emerald-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                            <span>Ou Enskri nan {selectedComp.name}</span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold">Aksè Gratis Aktif</span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            Ou gen dwa jwe nenpòt nan jwèt seleksyone yo anba a san ou pa peye ankò.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-[#0B0F19] px-4 py-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Pwen Ou</div>
                          <div className="text-sm font-black text-amber-400 tabular-nums">{userScoreObj?.totalScore || 0} pts</div>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Pozisyon</div>
                          <div className="text-sm font-black text-white">#{userRank}</div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#131B2E] to-[#0B0F19] border border-amber-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 text-xl">
                          🔒
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">Ou poko enskri nan {selectedComp.name}</h4>
                          <p className="text-xs text-slate-300 mt-0.5 max-w-md">
                            Pou w ka jwe jwèt seleksyone sa yo gratis epi fè pwen monte nan klasman an, tanpri enskri nan konpetisyon an dabò !
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRegister(selectedComp)}
                        disabled={registering}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
                      >
                        <span>Enskri nan Konpetisyon an ({selectedComp.entryFee} HT)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
              })()}

              {/* Modern Games Grid for Competition */}
              {(() => {
                const isRegistered = Boolean(
                  currentUser && selectedComp.registeredUserIds && selectedComp.registeredUserIds.includes(currentUser.id)
                );
                const userScoreObj = (selectedComp.scores || []).find(s => s.userId === currentUser?.id);

                const authorizedIds = (selectedComp.authorizedGameIds && selectedComp.authorizedGameIds.length > 0)
                  ? selectedComp.authorizedGameIds
                  : ['game_football', 'game_11balon', 'game_jeudemots', 'game_tubemaster', 'game_dames', 'game_parchisi', 'game_pianomizikal', 'game_basket'];

                const filtered = games.filter(g => authorizedIds.includes(g.id));
                const list = filtered.length > 0 ? filtered : games.filter(g => g.isActive);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {list.map((game) => {
                      const gamePoints = userScoreObj?.scoresByGame?.[game.id] || 0;

                      return (
                        <div
                          key={game.id}
                          className="rounded-3xl bg-[#131B2E] border border-slate-800 hover:border-amber-500/40 overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] group"
                        >
                          {/* Banner & Badges */}
                          <div className="p-4 bg-gradient-to-b from-blue-950/40 via-[#131B2E] to-[#0B0F19] relative flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-white/10 flex items-center justify-center text-2xl shadow-lg">
                              {game.icon || '🎮'}
                            </div>

                            <div className="text-right">
                              {isRegistered ? (
                                <span className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ KOUVRI (0 HT)
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                                  {game.entryFee} HT nòmalman
                                </span>
                              )}
                              <div className="text-[10px] text-amber-400 font-bold mt-1">
                                {game.levelsCount || 7} Nivo
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                                  {game.title}
                                </h3>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                {game.description}
                              </p>
                            </div>

                            {/* Participant Score in this game */}
                            <div className="my-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                Pwen ou nan konpetisyon an:
                              </span>
                              <span className="font-bold text-amber-400 tabular-nums">
                                {gamePoints} pts
                              </span>
                            </div>

                            {/* PLAY BUTTON (JWÈ) */}
                            {isRegistered ? (
                              <button
                                onClick={() => setCompetitionPlayingGame(game)}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                              >
                                <Play className="w-4 h-4 fill-slate-950" />
                                <span>JWÈ KOUNYE A (GRATIS)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegister(selectedComp)}
                                disabled={registering}
                                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 active:scale-98"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Enskri pou Jwe</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TOP 8 — JWÈ KALIFYE TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'top8' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#131B2E] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-black text-white">Top 8 — Jwè Kalifye</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                8 pi bon jwè ki akimile plis pwen nan faz kalifikasyon pou {selectedComp?.name}.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Règ Egalite</span>
              <span className="text-xs font-bold text-amber-400">Pi wo pwen match dirèk</span>
            </div>
          </div>

          {/* Qualified Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#131B2E] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                  <th className="py-3 px-4">Plas</th>
                  <th className="py-3 px-4">Jwè</th>
                  <th className="py-3 px-4 text-center">Jwèt Jwe</th>
                  <th className="py-3 px-4 text-center">Nivo Konplete</th>
                  <th className="py-3 px-4 text-center">Vòt</th>
                  <th className="py-3 px-4 text-right font-black text-amber-400">Total Pwen</th>
                  <th className="py-3 px-4 text-center">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(selectedComp?.scores || []).slice(0, selectedComp?.qualificationCount || 8).map((p, idx) => {
                  const isUser = p.userId === currentUser?.id;
                  const gamesPlayed = (p as any).gamesPlayedCount || Object.keys(p.scoresByGame || {}).length || 1;
                  const completedLevels = (p as any).completedLevelsCount || Object.keys(p.scoresByGame || {}).length || 1;
                  return (
                    <tr
                      key={p.userId}
                      className={`transition-colors ${
                        isUser ? 'bg-amber-500/10 font-bold' : idx < 3 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-black">
                        {idx === 0 ? '🥇 1ye' : idx === 1 ? '🥈 2yèm' : idx === 2 ? '🥉 3yèm' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.profilePhoto}
                            alt={p.fullName}
                            className="w-8 h-8 rounded-full object-cover border-2 border-amber-500/40"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white block">
                                {p.fullName} {isUser && '(Ou menm)'}
                              </span>
                              {!isUser && (
                                <SubscribeButton
                                  targetUserId={p.userId}
                                  targetUserName={p.fullName}
                                  currentUser={currentUser}
                                  size="icon"
                                  onOpenAuth={onOpenAuth}
                                />
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 font-bold">Kalifye pou Final ✓</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs tabular-nums">
                          🎮 {gamesPlayed}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs tabular-nums">
                          ⭐ {completedLevels}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-rose-300 font-bold tabular-nums">
                        {p.votesCount || 10}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-400 text-sm tabular-nums">
                        {p.totalScore.toLocaleString()} pts
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setGiftRecipient({ id: p.userId, name: p.fullName, photo: p.profilePhoto });
                            setActiveSubTab('kado');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Kado</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MATCH KONPETISYON & VÒT TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'match_vot' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#131B2E] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-black text-white">Match Konpetisyon & Vòt Ofisyèl</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Gade de jwè k ap fè fas youn ak lòt (VS). Vote pou jwè ou pi renmen an pou {selectedComp?.votePrice || 15} HTG !
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#0B0F19] px-3.5 py-2 rounded-2xl border border-slate-800 text-xs">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Pri Vòt: <strong className="text-amber-400">{selectedComp?.votePrice || 15} HTG</strong></span>
            </div>
          </div>

          {(!selectedComp?.matches || selectedComp.matches.length === 0) ? (
            <div className="p-8 rounded-3xl bg-[#131B2E] border border-slate-800 text-center space-y-3">
              <Clock className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Pa gen match eliminatwa ki pwograme pou kounye a.</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Administratè a ka pwograme match yo oswa kalifye Top 8 la nan paj Jesyon Konpetisyon an.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {selectedComp.matches.map((match) => {
                const totalVotes = (match.votes1 || 0) + (match.votes2 || 0);
                const p1Pct = totalVotes > 0 ? Math.round(((match.votes1 || 0) / totalVotes) * 100) : 50;
                const p2Pct = 100 - p1Pct;
                const votePrice = match.votePrice || selectedComp.votePrice || 15;

                const isP1Winner = match.winnerId === match.player1.userId;
                const isP2Winner = match.winnerId === match.player2.userId;

                return (
                  <div
                    key={match.id}
                    className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#131B2E] via-[#0F172A] to-[#0B0F19] border border-slate-700/80 shadow-2xl space-y-5"
                  >
                    {/* Match Bar: Round, Game Title & Status */}
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black uppercase text-[10px]">
                          {match.round === 'final' ? '👑 GRAN FINAL' : match.round === 'demi' ? '⚡ DEMI-FINAL' : 'TOP 8 MATCH'}
                        </span>
                        <span className="text-slate-300 font-bold">{match.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Jwèt: <strong className="text-white">{match.gameTitle}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          match.status === 'Fini' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>

                    {/* FACE TO FACE (VS) ARENA */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      {/* Player 1 Card */}
                      <div className={`md:col-span-2 p-4 rounded-2xl border transition-all ${
                        isP1Winner ? 'bg-amber-500/10 border-amber-500/50 shadow-lg' : 'bg-[#0B0F19] border-slate-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={match.player1.profilePhoto}
                              alt={match.player1.fullName}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
                            />
                            {isP1Winner && (
                              <span className="absolute -top-2 -right-2 text-base">👑</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-white truncate">{match.player1.fullName}</h4>
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-black">
                                N{match.player1.level || 3}
                              </span>
                              <SubscribeButton
                                targetUserId={match.player1.userId}
                                targetUserName={match.player1.fullName}
                                currentUser={currentUser}
                                size="icon"
                                onOpenAuth={onOpenAuth}
                              />
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>Klasman: #{match.player1.seedRank || 1}</span>
                              <span>•</span>
                              <span>{match.player1.points || 2400} pts</span>
                            </div>
                            <div className="text-[10px] text-amber-400 mt-0.5">
                              👥 {match.player1.followers || 45} abòne • 🎁 {match.player1.giftsCount || 2} kado
                            </div>
                          </div>
                        </div>

                        {/* Player 1 Actions: Vote & Gift */}
                        <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                          <button
                            onClick={() => {
                              if (!currentUser) { onOpenAuth(); return; }
                              setVotingModalData({
                                match,
                                playerId: match.player1.userId,
                                playerName: match.player1.fullName,
                                playerPhoto: match.player1.profilePhoto,
                                price: votePrice
                              });
                            }}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Vote ({votePrice} HT)</span>
                          </button>
                          <button
                            onClick={() => {
                              setGiftRecipient({ id: match.player1.userId, name: match.player1.fullName, photo: match.player1.profilePhoto });
                              setActiveSubTab('kado');
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                            title="Voye yon kado pou jwè sa a"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* VS Center Badge with Match Scores */}
                      <div className="md:col-span-1 flex flex-col items-center justify-center py-2 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-slate-950 font-black text-lg flex items-center justify-center shadow-xl border-2 border-white/20">
                          VS
                        </div>
                        <div className="text-xl font-black text-white mt-2 tabular-nums">
                          {match.player1.score ?? 0} — {match.player2.score ?? 0}
                        </div>
                        {match.winnerId && (
                          <span className="text-[10px] text-amber-400 font-bold mt-1 uppercase">
                            Match Konplete
                          </span>
                        )}
                      </div>

                      {/* Player 2 Card */}
                      <div className={`md:col-span-2 p-4 rounded-2xl border transition-all ${
                        isP2Winner ? 'bg-amber-500/10 border-amber-500/50 shadow-lg' : 'bg-[#0B0F19] border-slate-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={match.player2.profilePhoto}
                              alt={match.player2.fullName}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md"
                            />
                            {isP2Winner && (
                              <span className="absolute -top-2 -right-2 text-base">👑</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-black text-white truncate">{match.player2.fullName}</h4>
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-black">
                                N{match.player2.level || 2}
                              </span>
                              <SubscribeButton
                                targetUserId={match.player2.userId}
                                targetUserName={match.player2.fullName}
                                currentUser={currentUser}
                                size="icon"
                                onOpenAuth={onOpenAuth}
                              />
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>Klasman: #{match.player2.seedRank || 2}</span>
                              <span>•</span>
                              <span>{match.player2.points || 2150} pts</span>
                            </div>
                            <div className="text-[10px] text-amber-400 mt-0.5">
                              👥 {match.player2.followers || 38} abòne • 🎁 {match.player2.giftsCount || 1} kado
                            </div>
                          </div>
                        </div>

                        {/* Player 2 Actions: Vote & Gift */}
                        <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                          <button
                            onClick={() => {
                              if (!currentUser) { onOpenAuth(); return; }
                              setVotingModalData({
                                match,
                                playerId: match.player2.userId,
                                playerName: match.player2.fullName,
                                playerPhoto: match.player2.profilePhoto,
                                price: votePrice
                              });
                            }}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Vote ({votePrice} HT)</span>
                          </button>
                          <button
                            onClick={() => {
                              setGiftRecipient({ id: match.player2.userId, name: match.player2.fullName, photo: match.player2.profilePhoto });
                              setActiveSubTab('kado');
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                            title="Voye yon kado pou jwè sa a"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* LIVE VOTING PROGRESS BAR */}
                    <div className="p-3 bg-[#080C16] rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-amber-400 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-amber-400" />
                          {match.player1.fullName}: {match.votes1 || 0} vòt ({p1Pct}%)
                        </span>
                        <span className="text-blue-400 flex items-center gap-1">
                          {match.player2.fullName}: {match.votes2 || 0} vòt ({p2Pct}%)
                          <Heart className="w-3.5 h-3.5 fill-blue-400" />
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-500"
                          style={{ width: `${p1Pct}%` }}
                        />
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                          style={{ width: `${p2Pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 text-center">
                        Total sipò vòt: {totalVotes} tranzaksyon verifye
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. BOUTIK KADO VITYÈL (GIFT STORE) */}
      {/* ======================================================== */}
      {activeSubTab === 'kado' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#131B2E] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-black text-white">Boutik Kado Vityèl MASTER PLAY</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Chwazi yon kado pou sipòte jwè ou pi renmen an ! Kado a ap parèt sou pwofil li ak nan match li yo.
              </p>
            </div>
            <div className="bg-[#0B0F19] px-4 py-2 rounded-2xl border border-slate-800 text-xs text-right">
              <span className="text-slate-400 block text-[10px]">Balans ou disponib:</span>
              <strong className="text-emerald-400 text-sm font-bold tabular-nums">
                {currentUser ? `${availableBalance.toLocaleString()} HT` : 'Konekte kont ou'}
              </strong>
            </div>
          </div>

          {/* Recipient Selector Banner */}
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Moun w ap voye kado a bay la:</span>
              {giftRecipient && (
                <button
                  onClick={() => setGiftRecipient(null)}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Chanje jwè
                </button>
              )}
            </div>

            {giftRecipient ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                {giftRecipient.photo ? (
                  <img src={giftRecipient.photo} alt={giftRecipient.name} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">👤</div>
                )}
                <div>
                  <div className="text-sm font-black text-white">{giftRecipient.name}</div>
                  <span className="text-[10px] text-emerald-400 font-bold">Resevè kado a chwazi ✓</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableRecipients.slice(0, 8).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setGiftRecipient(rec)}
                    className="p-2.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 flex items-center gap-2 transition-colors text-left"
                  >
                    <img src={rec.photo} alt={rec.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-xs font-bold text-white truncate">{rec.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gift Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {giftsList.map((giftItem) => {
              const isSelected = selectedGift?.id === giftItem.id;
              return (
                <div
                  key={giftItem.id}
                  className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 scale-[1.02] shadow-xl'
                      : 'bg-[#131B2E] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 rounded-3xl bg-[#0B0F19] border border-white/10 mx-auto flex items-center justify-center text-5xl shadow-lg">
                      {giftItem.icon}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{giftItem.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {giftItem.description}
                      </p>
                    </div>
                    <div className="text-xl font-black text-amber-400 tabular-nums">
                      {giftItem.price} HTG
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGift(giftItem)}
                    className={`w-full mt-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>{isSelected ? 'Chwazi ✓' : 'Chwazi Kado Sa a'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Send Gift Action Bar */}
          {selectedGift && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-600/30 via-slate-900 to-rose-950/40 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGift.icon}</span>
                <div>
                  <div className="text-sm font-black text-white">
                    Voye {selectedGift.name} ({selectedGift.price} HTG)
                  </div>
                  <div className="text-xs text-slate-300">
                    Destinatè: <strong className="text-amber-400">{giftRecipient ? giftRecipient.name : 'Chwazi yon jwè anwo a'}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmSendGift}
                disabled={sendingGift || !giftRecipient || availableBalance < selectedGift.price}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{sendingGift ? 'N ap voye...' : `Konfime Voye Kado (${selectedGift.price} HT)`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PODIUM & RÈG TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'rezilta' && (
        <div className="space-y-6">
          {/* Champion Banner if finished */}
          {selectedComp?.champion && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-600/25 border-2 border-amber-500/50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center border border-amber-400 shadow-md">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      CHANPYON OFISYÈL {selectedComp.name}
                    </span>
                    <h3 className="text-2xl font-black text-white">{selectedComp.champion.fullName}</h3>
                    <span className="text-xs text-emerald-400 font-bold">Gwo Prim: {selectedComp.champion.prize}</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Nòt Final</span>
                  <span className="text-lg font-black text-amber-300">{selectedComp.champion.finalScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Podiums */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-[#131B2E] border border-amber-500/40 text-center space-y-2">
              <div className="text-3xl">🥇</div>
              <div className="text-xs font-black uppercase text-amber-400">Premye Plas (1ye)</div>
              <div className="text-sm font-bold text-white">{selectedComp?.champion?.fullName || 'An kou kalifikasyon'}</div>
              <div className="text-xs text-emerald-400 font-bold">{selectedComp?.prizes?.first || '75,000 HT'}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-700 text-center space-y-2">
              <div className="text-3xl">🥈</div>
              <div className="text-xs font-black uppercase text-slate-300">Dezyèm Plas (2yèm)</div>
              <div className="text-sm font-bold text-white">{selectedComp?.runnerUp?.fullName || 'An kou kalifikasyon'}</div>
              <div className="text-xs text-slate-300 font-bold">{selectedComp?.prizes?.second || '35,000 HT'}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-700 text-center space-y-2">
              <div className="text-3xl">🥉</div>
              <div className="text-xs font-black uppercase text-amber-600">Twazyèm Plas (3yèm)</div>
              <div className="text-sm font-bold text-white">Top Demi-Finalis</div>
              <div className="text-xs text-slate-300 font-bold">{selectedComp?.prizes?.third || '15,000 HT'}</div>
            </div>
          </div>

          {/* Official Rules Box */}
          <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3 text-xs text-slate-300">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Règ Ofisyèl ak Kondisyon Patisipasyon
            </h4>
            <p className="leading-relaxed whitespace-pre-line text-slate-200">
              {selectedComp?.rules || 'Chak patisipan dwe respekte orè ofisyèl yo. Tout pwen kalkile dapre jwèt otorize yo.'}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VOTE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {votingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setVotingModalData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <img
                src={votingModalData.playerPhoto}
                alt={votingModalData.playerName}
                className="w-16 h-16 rounded-2xl object-cover mx-auto border-2 border-amber-500/50 shadow-lg"
              />
              <h3 className="text-lg font-black text-white">Konfime Vòt Ou</h3>
              <p className="text-xs text-slate-300">
                W ap vote pou <strong className="text-amber-400">{votingModalData.playerName}</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#080C16] rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pri yon vòt:</span>
                <span className="font-black text-amber-400">{votingModalData.price} HTG</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Balans ou:</span>
                <span className="font-bold text-emerald-400">{availableBalance.toLocaleString()} HT</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setVotingModalData(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase"
              >
                Anile
              </button>
              <button
                onClick={handleConfirmVote}
                disabled={submittingVote || availableBalance < votingModalData.price}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg disabled:opacity-50"
              >
                {submittingVote ? 'N ap vote...' : 'Konfime'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
