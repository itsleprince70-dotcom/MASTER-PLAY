import React, { useState, useEffect } from 'react';
import { User, Competition, Post, Game } from '../types';
import { api } from '../services/api';
import { MasterPlayLogo } from './MasterPlayLogo';
import {
  ArrowDownRight,
  ArrowUpRight,
  Trophy,
  Gamepad2,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Send,
  Search,
  Loader2,
  X,
  Swords,
  Video,
  PlusCircle,
  Play,
  Clock,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';
import { SubscribeButton } from './SubscribeButton';
import { VerifiedBadge } from './VerifiedBadge';
import { notify } from './Toast';

interface HomeViewProps {
  currentUser: User | null;
  competitions: Competition[];
  posts: Post[];
  games: Game[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onSelectCompetition: (comp: Competition) => void;
  onSelectGame: (game: Game) => void;
  onViewAllCompetitions: () => void;
  onViewAllGames: () => void;
  onOpenAuth: () => void;
  onDataRefresh: () => void;
  onOpenTikTokFeed?: (initialPostId?: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  onOpenCreatePost?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  competitions,
  posts,
  games,
  onOpenDeposit,
  onOpenWithdraw,
  onSelectCompetition,
  onSelectGame,
  onViewAllCompetitions,
  onViewAllGames,
  onOpenAuth,
  onDataRefresh,
  onOpenTikTokFeed,
  onOpenUserProfile,
  onOpenCreatePost,
}) => {
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 1-Post-per-day status
  const [canPostToday, setCanPostToday] = useState(true);
  const [alreadyPostedToday, setAlreadyPostedToday] = useState(false);

  // Featured matches from all competitions
  const [featuredMatches, setFeaturedMatches] = useState<any[]>([]);
  const [videoErrorMap, setVideoErrorMap] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    // Check if user already posted today
    if (currentUser?.id) {
      api.canUserPostToday(currentUser.id)
        .then((res) => {
          if (res.success) {
            setCanPostToday(res.canPost);
            setAlreadyPostedToday(!!res.alreadyPostedToday);
          }
        })
        .catch(() => {});
    }

    // Extract matches across competitions
    const matchesList: any[] = [];
    (competitions || []).forEach((comp) => {
      (comp.matches || []).forEach((m) => {
        matchesList.push({
          ...m,
          competitionId: comp.id,
          competitionName: comp.name,
          competitionBadge: comp.badge,
          competitionStatus: comp.status,
          votePrice: m.votePrice || comp.votePrice || 15,
        });
      });
    });

    // Also try API
    if (matchesList.length === 0) {
      api.getFeaturedMatches()
        .then((res) => {
          if (res.success && res.matches && res.matches.length > 0) {
            setFeaturedMatches(res.matches);
          }
        })
        .catch(() => {});
    } else {
      // Sort: 'An kou' first, then 'Pwograme'
      matchesList.sort((a, b) => {
        if (a.status === 'An kou' && b.status !== 'An kou') return -1;
        if (b.status === 'An kou' && a.status !== 'An kou') return 1;
        return ((b.votes1 || 0) + (b.votes2 || 0)) - ((a.votes1 || 0) + (a.votes2 || 0));
      });
      setFeaturedMatches(matchesList.slice(0, 4));
    }
  }, [currentUser?.id, competitions]);

  const handleSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await api.searchUsers(queryText.trim(), currentUser?.id);
      if (res.success && res.users) {
        setSearchResults(res.users);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const availableBalance = currentUser ? currentUser.balance - (currentUser.reservedBalance || 0) : 0;

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await api.toggleLike(postId, currentUser.id);
      onDataRefresh();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.addComment(postId, currentUser.id, text.trim());
      if (res.success) {
        setCommentInput((prev) => ({ ...prev, [postId]: '' }));
        onDataRefresh();
      } else {
        notify('Erè nan kòmantè.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè nan kòmantè.', 'error');
    }
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      notify('Lyen piblikasyon an kopye nan clipboard ou !', 'success');
    }
  };

  return (
    <div className="space-y-8 pb-14 max-w-5xl mx-auto">
      {/* 1. USER GREETING & BALANCE CARD */}
      {currentUser ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 shadow-2xl border border-cyan-400/20 text-white relative overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.fullName}
                onClick={() => onOpenUserProfile && onOpenUserProfile(currentUser.id)}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40 shadow-md cursor-pointer hover:scale-105 transition-transform"
                title="Gade Profil Ou"
              />
              <div>
                <h2
                  onClick={() => onOpenUserProfile && onOpenUserProfile(currentUser.id)}
                  className="text-lg font-black tracking-wide leading-tight cursor-pointer hover:underline flex items-center gap-1.5"
                >
                  <span>Bonjou, {currentUser.fullName}</span>
                  <VerifiedBadge verified={Boolean(currentUser.verified || currentUser.certificationStatus === 'sètifye' || currentUser.role === 'ADMIN' || currentUser.isAdmin)} size="sm" />
                </h2>
                <div className="text-xs text-cyan-100 flex items-center gap-2">
                  <span>{currentUser.phoneNumber}</span>
                  <span className="bg-white/20 px-2 py-0.2 rounded-full font-bold text-[10px]">
                    Nivo {currentUser.level || 1}
                  </span>
                  {currentUser.followersCount !== undefined && (
                    <span className="bg-cyan-500/30 px-2 py-0.2 rounded-full font-bold text-[10px]">
                      {currentUser.followersCount} Abòne
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider block">
                Platfòm Ofisyèl
              </span>
              <span className="text-xs font-black text-amber-300">Kèkè Challenge</span>
            </div>
          </div>

          {/* Balance Row */}
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-cyan-100 uppercase tracking-wider">
                Balans kont
              </div>
              <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight mt-0.5">
                {availableBalance.toLocaleString()} HT
              </div>
              {(currentUser.reservedBalance || 0) > 0 && (
                <div className="text-xs text-amber-200 font-semibold mt-0.5">
                  Rezève pou retrè: {currentUser.reservedBalance?.toLocaleString()} HT
                </div>
              )}
            </div>

            {/* Depo & Retrè Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={onOpenDeposit}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                <span>Depo</span>
              </button>
              <button
                onClick={onOpenWithdraw}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>Retrè</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Modern Website Hero Banner for guests */
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0E1528] to-slate-900 border border-amber-500/30 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center space-y-4">
            <MasterPlayLogo size="lg" className="justify-center" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
              <span>🎁 50 HT Bonis Byenvini Pou Chak Nouvo Kont</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white max-w-2xl leading-tight">
              Platfòm Ofisyèl Jwèt & Konpetisyon Kèkè Challenge an Ayiti
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Jwe <strong className="text-amber-400">Avion Crash</strong> ak vrè lajan sou balans ou, monte nivo sou <strong className="text-emerald-400">11 Balon</strong>, defye lòt jwè nan gwo tounwa yo epi retire gany ou fasil sou kont <strong className="text-cyan-400">NatCash</strong> ou.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenAuth}
                className="px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-95"
              >
                Kreye Kont & Resevwa 50 HT
              </button>
              <button
                onClick={onViewAllCompetitions}
                className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all border border-slate-700"
              >
                Gade Tout Konpetisyon yo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS BAR: VIDÉO MASTER FEED BUTTON & POST CREATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Vidéo Master Vertical Video Feed Banner */}
        <div
          onClick={() => onOpenTikTokFeed && onOpenTikTokFeed()}
          className="p-4 rounded-3xl bg-gradient-to-r from-rose-900/60 via-purple-900/50 to-pink-900/60 border border-rose-500/40 hover:border-rose-400/70 cursor-pointer shadow-xl transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-pink-400 tracking-wider">Nouvo Eksperyans</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <h3 className="text-sm font-black text-white group-hover:text-pink-200 transition-colors">
                🎬 Feed Vidéo Master
              </h3>
              <p className="text-[11px] text-gray-300">
                Gade tout videyo kout plein écran, swipe & like ❤️
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Create Post Banner / Status (1 post per day) */}
        <div
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else if (onOpenCreatePost) onOpenCreatePost();
          }}
          className={`p-4 rounded-3xl border shadow-xl cursor-pointer transition-all flex items-center justify-between group ${
            alreadyPostedToday
              ? 'bg-gray-900/70 border-white/10 hover:border-white/20'
              : 'bg-gradient-to-r from-cyan-900/60 via-blue-900/50 to-indigo-900/60 border-cyan-500/40 hover:border-cyan-400/70'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform ${
              alreadyPostedToday ? 'bg-gray-700' : 'bg-gradient-to-tr from-cyan-500 to-blue-500'
            }`}>
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                {alreadyPostedToday ? (
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Limit Jounen an Atènn
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 1 Piblikasyon pa Jou
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white group-hover:text-cyan-200 transition-colors">
                {alreadyPostedToday ? 'Ou Pibliye Jodi a Deja' : 'Pibliye Yon Foto oswa Vidéo'}
              </h3>
              <p className="text-[11px] text-gray-300">
                {alreadyPostedToday
                  ? 'Retounen demen pou pwochen piblikasyon w'
                  : 'Pataje yon bèl kontni sou Master Play'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 2. RECHÈCH ITILIZATÈ */}
      <div className="relative">
        <div className="relative flex items-center bg-[#131B2E] border border-slate-700/80 rounded-2xl p-1.5 shadow-xl focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <div className="p-2.5 text-amber-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Chèche yon itilizatè sou Master Play..."
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-1 py-1"
          />
          {searching && (
            <div className="p-2 text-slate-400 animate-spin">
              <Loader2 className="w-4 h-4" />
            </div>
          )}
          {searchQuery && !searching && (
            <button
              onClick={() => handleSearch('')}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Efase rechèch"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown/Box */}
        {hasSearched && (
          <div className="mt-2 p-3 bg-[#0F172A] border border-amber-500/30 rounded-2xl shadow-2xl space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>Rezilta Rechèch ({searchResults.length})</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setHasSearched(false);
                }}
                className="text-amber-400 hover:underline"
              >
                Fèmen
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Pa gen okenn itilizatè ki koresponn ak « {searchQuery} ».
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchResults.map((usr) => (
                  <div
                    key={usr.id}
                    className="p-2.5 rounded-xl bg-[#131B2E] border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 overflow-hidden cursor-pointer"
                      onClick={() => onOpenUserProfile && onOpenUserProfile(usr.id)}
                    >
                      <img
                        src={usr.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={usr.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-white truncate flex items-center gap-1.5 hover:underline">
                          <span>{usr.fullName}</span>
                          <VerifiedBadge verified={Boolean(usr.verified || usr.certificationStatus === 'sètifye')} size="xs" />
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                            N{usr.level || 1}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{usr.followersCount || 0} abòne</span>
                          <span>•</span>
                          <span className="font-mono text-amber-300/80">{usr.phoneNumber}</span>
                        </div>
                      </div>
                    </div>

                    <SubscribeButton
                      targetUserId={usr.id}
                      targetUserName={usr.fullName}
                      currentUser={currentUser}
                      initialIsSubscribed={usr.isSubscribed}
                      onOpenAuth={onOpenAuth}
                      onSubscriptionChange={(id, isSub, count) => {
                        setSearchResults((prev) =>
                          prev.map((u) => (u.id === id ? { ...u, isSubscribed: isSub, followersCount: count } : u))
                        );
                        onDataRefresh();
                      }}
                      onUpdateCurrentUser={onDataRefresh}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. ⚡ MATCH VS NAN PAJ DAKÈY LA (Requirement 1: Modern & Professional Presentation) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Match VS An Kou & Pwograme</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                  AN KOU
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Defi tèt a tèt ant pi bon jwè yo</p>
            </div>
          </div>
          <button
            onClick={onViewAllCompetitions}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Tout Match yo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {featuredMatches.length === 0 ? (
          <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800 text-center space-y-2">
            <Swords className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-white">Match VS ap prepare</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Administratè a ap pwograme nouvo match tèt a tèt nan konpetisyon yo kounye a. Vizite paj Konpetisyon pou w wè detay yo.
            </p>
            <button
              onClick={onViewAllCompetitions}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs"
            >
              Gade Konpetisyon yo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredMatches.map((m) => {
              const totalVotes = (m.votes1 || 0) + (m.votes2 || 0);
              const p1Pct = totalVotes > 0 ? Math.round(((m.votes1 || 0) / totalVotes) * 100) : 50;
              const p2Pct = 100 - p1Pct;
              const isLive = m.status === 'An kou';

              return (
                <div
                  key={m.id}
                  className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#131B2E] via-[#0F172A] to-[#0B0F19] border border-slate-700/80 hover:border-amber-500/50 shadow-2xl transition-all space-y-4 relative overflow-hidden group"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {m.status}
                      </span>
                      <span className="text-[11px] font-bold text-gray-300 truncate max-w-[160px]">
                        {m.competitionName || 'Kèkè Challenge'}
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400 font-bold">
                      Jwèt: {m.gameTitle}
                    </span>
                  </div>

                  {/* Face to Face Row */}
                  <div className="grid grid-cols-7 gap-2 items-center">
                    {/* Player 1 */}
                    <div
                      className="col-span-3 text-center cursor-pointer p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                      onClick={() => m.player1?.userId && onOpenUserProfile && onOpenUserProfile(m.player1.userId)}
                    >
                      <img
                        src={m.player1?.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={m.player1?.fullName}
                        className="w-12 h-12 rounded-2xl mx-auto object-cover border-2 border-amber-400 shadow-md"
                      />
                      <h5 className="font-black text-xs text-white mt-1.5 truncate flex items-center justify-center gap-1">
                        <span className="truncate">{m.player1?.fullName || 'Jwè 1'}</span>
                        <VerifiedBadge verified={m.player1?.verified} size="xs" />
                      </h5>
                      <span className="text-[10px] text-amber-300 font-mono font-bold block">
                        ★ {m.player1?.stars || 1}
                      </span>
                      <div className="mt-1 text-[11px] font-black text-cyan-300">
                        {m.votes1 || 0} vòt ({p1Pct}%)
                      </div>
                    </div>

                    {/* VS Badge */}
                    <div className="col-span-1 text-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[11px] flex items-center justify-center mx-auto shadow-lg">
                        VS
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div
                      className="col-span-3 text-center cursor-pointer p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                      onClick={() => m.player2?.userId && onOpenUserProfile && onOpenUserProfile(m.player2.userId)}
                    >
                      <img
                        src={m.player2?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={m.player2?.fullName}
                        className="w-12 h-12 rounded-2xl mx-auto object-cover border-2 border-cyan-400 shadow-md"
                      />
                      <h5 className="font-black text-xs text-white mt-1.5 truncate flex items-center justify-center gap-1">
                        <span className="truncate">{m.player2?.fullName || 'Jwè 2'}</span>
                        <VerifiedBadge verified={m.player2?.verified} size="xs" />
                      </h5>
                      <span className="text-[10px] text-cyan-300 font-mono font-bold block">
                        ★ {m.player2?.stars || 1}
                      </span>
                      <div className="mt-1 text-[11px] font-black text-cyan-300">
                        {m.votes2 || 0} vòt ({p2Pct}%)
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar of Votes */}
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex">
                      <div style={{ width: `${p1Pct}%` }} className="bg-amber-400 transition-all duration-500" />
                      <div style={{ width: `${p2Pct}%` }} className="bg-cyan-400 transition-all duration-500" />
                    </div>
                  </div>

                  {/* Action Link to Competition */}
                  <button
                    onClick={onViewAllCompetitions}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4 text-slate-950" />
                    <span>Gade Match la & Vote nan Konpetisyon</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. DÈNYE PIBLIKASYON & VIDÉO FEED (Social Posts) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Piblikasyon & Vidéo Jwè yo
            </h3>
          </div>
          <button
            onClick={() => onOpenTikTokFeed && onOpenTikTokFeed()}
            className="text-xs font-bold text-pink-400 hover:underline flex items-center gap-1"
          >
            <span>Gade sou Vidéo Master</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#131B2E] border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">Poko gen piblikasyon kounye a.</p>
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else if (onOpenCreatePost) onOpenCreatePost();
              }}
              className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs"
            >
              Fè Premye Piblikasyon an
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
              const commentsOpen = !!openComments[post.id];
              const isVideo =
                post.mediaType === 'video' ||
                (post.mediaUrl && (post.mediaUrl.endsWith('.mp4') || post.mediaUrl.includes('video') || post.mediaUrl.startsWith('data:video/'))) ||
                !!post.videoUrl;

              const displayMedia = post.mediaUrl || post.videoUrl;
              const authorId = post.authorId || (post as any).userId;

              return (
                <div
                  key={post.id}
                  className="rounded-3xl bg-[#131B2E] border border-slate-800 overflow-hidden shadow-xl"
                >
                  {/* Post Header: Author Photo & Name */}
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => authorId && onOpenUserProfile && onOpenUserProfile(authorId)}
                    >
                      <img
                        src={post.authorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={post.authorName || 'Otè'}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 group-hover:border-cyan-400 transition-colors"
                      />
                      <div>
                        <h4 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          <span>{post.authorName || 'Itilizatè Master Play'}</span>
                          <VerifiedBadge verified={post.authorVerified} size="xs" />
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString('ht-HT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Follow button if not current user */}
                    {authorId && (!currentUser || currentUser.id !== authorId) && (
                      <SubscribeButton
                        targetUserId={authorId}
                        targetUserName={post.authorName || 'Itilizatè'}
                        currentUser={currentUser}
                        onOpenAuth={onOpenAuth}
                        size="sm"
                      />
                    )}
                  </div>

                  {/* Video Player or Image */}
                  {isVideo && displayMedia && (
                    <div
                      className="w-full bg-black relative group cursor-pointer overflow-hidden"
                      onClick={() => onOpenTikTokFeed && onOpenTikTokFeed(post.id)}
                    >
                      {!videoErrorMap[post.id] ? (
                        <video
                          src={displayMedia}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-96 object-contain mx-auto"
                          onError={() => {
                            setVideoErrorMap((prev) => ({ ...prev, [post.id]: true }));
                          }}
                        />
                      ) : (
                        <div className="w-full h-56 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-center p-5 select-none">
                          <div className="w-14 h-14 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 mb-2">
                            <Play className="w-7 h-7 ml-0.5 fill-pink-400" />
                          </div>
                          <span className="text-xs font-black text-white">{post.title || 'Master Play Vidéo Clip'}</span>
                          <span className="text-[11px] text-pink-400 mt-1">Klike pou gade nan mòd Vidéo Master</span>
                        </div>
                      )}
                      {/* Vidéo Master overlay prompt */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenTikTokFeed) onOpenTikTokFeed(post.id);
                        }}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-pink-600/90 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xl"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Vidéo Master</span>
                      </button>
                    </div>
                  )}

                  {!isVideo && displayMedia && (
                    <div className="w-full max-h-96 bg-slate-950 overflow-hidden relative">
                      <img
                        src={displayMedia}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-5 space-y-3">
                    {post.title && (
                      <h4 className="text-base font-black text-white">{post.title}</h4>
                    )}

                    {post.description && (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.description}
                      </p>
                    )}

                    {/* Social Action Bar (Like, Comment, Share) */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-4">
                        {/* Like button */}
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            isLiked ? 'text-rose-500 font-bold' : 'hover:text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span className="tabular-nums">{post.likes.length}</span>
                        </button>

                        {/* Comment button */}
                        <button
                          onClick={() =>
                            setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                          }
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="tabular-nums">{post.comments.length}</span>
                        </button>
                      </div>

                      {/* Share button */}
                      <button
                        onClick={() => handleShare(post)}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Pataje</span>
                      </button>
                    </div>

                    {/* Comments Drawer */}
                    {commentsOpen && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {post.comments.length === 0 ? (
                            <div className="text-[11px] text-slate-500 italic">
                              Poko gen kòmantè. Ekri premye a !
                            </div>
                          ) : (
                            post.comments.map((c) => (
                              <div key={c.id} className="p-2.5 rounded-xl bg-[#0B0F19] text-xs space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <div
                                    className="font-bold text-amber-400 cursor-pointer hover:underline flex items-center gap-1"
                                    onClick={() => c.userId && onOpenUserProfile && onOpenUserProfile(c.userId)}
                                  >
                                    <span>{c.userName}</span>
                                    <VerifiedBadge verified={c.userVerified} size="xs" />
                                  </div>
                                </div>
                                <div className="text-slate-200">{c.text}</div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add comment input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInput[post.id] || ''}
                            onChange={(e) =>
                              setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                            placeholder="Ekri yon kòmantè..."
                            className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleSendComment(post.id)}
                            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. KONPETISYON DISPONIB */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Konpetisyon Disponib</span>
          </h3>
          <button
            onClick={onViewAllCompetitions}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-0.5"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {competitions.slice(0, 3).map((comp) => {
            const slotsLeft = Math.max(0, comp.maxParticipants - comp.registeredUserIds.length);
            const isUserRegistered = currentUser ? comp.registeredUserIds.includes(currentUser.id) : false;

            return (
              <div
                key={comp.id}
                className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-black text-amber-400">{comp.badge}</span>
                    <span className="font-bold text-white tabular-nums">{comp.entryFee} HT</span>
                  </div>
                  <h4 className="font-black text-white text-sm">{comp.name}</h4>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {comp.startDate.split('-')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold mt-1">
                    Plas ki rete: {slotsLeft}
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80">
                  {isUserRegistered ? (
                    <div className="w-full py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-center font-bold text-[11px]">
                      Enskri ✓
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectCompetition(comp)}
                      className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-wider transition-colors active:scale-95"
                    >
                      Enskri
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. AKSÈ RAPID NAN JWÈT YO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-blue-400" />
            <span>Aksè Rapid nan Jwèt yo</span>
          </h3>
          <button
            onClick={onViewAllGames}
            className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-0.5"
          >
            <span>Tout Jwèt yo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {games.slice(0, 4).map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 hover:border-blue-500/40 text-left transition-all active:scale-95 flex flex-col justify-between group shadow-md"
            >
              <div className="text-2xl mb-2">{game.icon || '🎮'}</div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">
                  {game.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {game.isPaid ? `${game.entryFee} HT` : 'Gratis'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 7. WHATSAPP SUPPORT BANNER */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-white">Bezwen èd sou yon depo oswa yon jwèt ?</h4>
          <p className="text-[11px] text-slate-400">Sipò ofisyèl MASTER PLAY disponib sou WhatsApp.</p>
        </div>
        <WhatsAppSupportButton type="sipò" className="sm:w-auto text-xs py-2 px-3.5" />
      </div>
    </div>
  );
};
