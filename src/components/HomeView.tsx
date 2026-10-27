import React, { useState } from 'react';
import { User, Competition, Post, Game } from '../types';
import { api } from '../services/api';
import { MasterPlayLogo } from './MasterPlayLogo';
import { ArrowDownRight, ArrowUpRight, Trophy, Gamepad2, Heart, MessageSquare, Share2, ExternalLink, ChevronRight, Sparkles, Send, Search, Loader2, X } from 'lucide-react';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';
import { SubscribeButton } from './SubscribeButton';

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
}) => {
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});

  // User search state (Requirement 6)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
      await api.addComment(postId, currentUser.id, text.trim());
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      onDataRefresh();
    } catch (err) {
      console.error('Error adding comment:', err);
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
      alert('Lyen piblikasyon an kopye nan clipboard ou !');
    }
  };

  return (
    <div className="space-y-6 pb-14 max-w-3xl mx-auto">
      {/* 1. USER GREETING & BALANCE CARD (Matches Screen 2 from reference image!) */}
      {currentUser ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 shadow-2xl border border-cyan-400/20 text-white relative overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.fullName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40 shadow-md"
              />
              <div>
                <h2 className="text-lg font-black tracking-wide leading-tight">
                  Bonjou, {currentUser.fullName}
                </h2>
                <div className="text-xs text-cyan-100 flex items-center gap-2">
                  <span>{currentUser.phoneNumber}</span>
                  <span className="bg-white/20 px-2 py-0.2 rounded-full font-bold text-[10px]">
                    Nivo {currentUser.level || 1}
                  </span>
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
        /* Welcome CTA for guest */
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-600/30 via-slate-900 to-blue-900/40 border border-amber-500/20 text-center space-y-3">
          <MasterPlayLogo size="md" className="justify-center" />
          <h2 className="text-xl font-black text-white">Byenveni nan MASTER PLAY !</h2>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Konekte oswa kreye kont ou pou w patisipe nan gwo tounwa yo ak genyen kach sou NatCash.
          </p>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
          >
            Konekte / Kreye Kont
          </button>
        </div>
      )}

      {/* 2. BA RECHÈCH ITILIZATÈ (Requirement 6: Chèche yon itilizatè...) */}
      <div className="relative">
        <div className="relative flex items-center bg-[#131B2E] border border-slate-700/80 rounded-2xl p-1.5 shadow-xl focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <div className="p-2.5 text-amber-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Chèche yon itilizatè..."
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
              <button onClick={() => { setSearchQuery(''); setHasSearched(false); }} className="text-amber-400 hover:underline">Fèmen</button>
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
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={usr.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={usr.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                          <span>{usr.fullName}</span>
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

                    {/* Siy + pou abòne dirèkteman (Requirement 5) */}
                    <SubscribeButton
                      targetUserId={usr.id}
                      targetUserName={usr.fullName}
                      currentUser={currentUser}
                      initialIsSubscribed={usr.isSubscribed}
                      onOpenAuth={onOpenAuth}
                      onSubscriptionChange={(id, isSub, count) => {
                        setSearchResults(prev => prev.map(u => u.id === id ? { ...u, isSubscribed: isSub, followersCount: count } : u));
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

      {/* 3. DÈNYE PIBLIKASYON ADMINISTRATÈ A (Posts feed) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Dènye Piblikasyon Ofisyèl</span>
          </h3>
          <span className="text-[11px] text-slate-400">Admin: Prince509</span>
        </div>

        {posts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 text-center text-xs text-slate-500">
            Poko gen piblikasyon kounye a.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
              const commentsOpen = !!openComments[post.id];

              const hasVideo = !!post.videoUrl;
              const images = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : post.mediaUrl ? [post.mediaUrl] : [];

              return (
                <div
                  key={post.id}
                  className="rounded-3xl bg-[#131B2E] border border-slate-800 overflow-hidden shadow-xl"
                >
                  {/* Video Player if video present */}
                  {hasVideo && (
                    <div className="w-full bg-black relative">
                      <video
                        src={post.videoUrl}
                        controls
                        playsInline
                        className="w-full max-h-80 object-contain mx-auto"
                      />
                      {post.pinned && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow z-10">
                          Epinglé
                        </span>
                      )}
                    </div>
                  )}

                  {/* Photo Gallery or Single Image if images present */}
                  {!hasVideo && images.length === 1 && (
                    <div className="w-full h-52 sm:h-64 bg-slate-950 overflow-hidden relative">
                      <img
                        src={images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      {post.pinned && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                          Epinglé
                        </span>
                      )}
                    </div>
                  )}

                  {!hasVideo && images.length > 1 && (
                    <div className="p-3 bg-slate-950 relative">
                      <div className={`grid gap-2 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                        {images.map((imgUrl, i) => (
                          <div key={i} className="h-36 rounded-xl overflow-hidden border border-slate-800">
                            <img src={imgUrl} alt={`${post.title} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </div>
                        ))}
                      </div>
                      {post.pinned && (
                        <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                          Epinglé
                        </span>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-white">{post.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString('ht-HT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* TikTok Button */}
                      {post.tiktokUrl && (
                        <a
                          href={post.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-all active:scale-95"
                          title="Gade sou TikTok"
                        >
                          <span className="text-sm">🎵</span>
                          <span className="text-[11px]">Gade sou TikTok</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {post.description}
                    </p>

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
                                  <div className="font-bold text-amber-400">{c.userName}</div>
                                  {c.userId && c.userId !== currentUser?.id && (
                                    <SubscribeButton
                                      targetUserId={c.userId}
                                      targetUserName={c.userName}
                                      currentUser={currentUser}
                                      size="icon"
                                      onOpenAuth={onOpenAuth}
                                    />
                                  )}
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

      {/* 3. KONPETISYON DISPONIB (Matches Section 2 in reference image!) */}
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

      {/* 4. AKSÈ RAPID NAN JWÈT YO */}
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
              <div className="text-2xl mb-2">
                {game.icon || '🎮'}
              </div>
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

      {/* 5. WHATSAPP SUPPORT BANNER */}
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
