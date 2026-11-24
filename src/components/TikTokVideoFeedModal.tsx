import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { api } from '../services/api';
import { Heart, MessageSquare, Share2, Bookmark, X, Volume2, VolumeX, Play, Pause, ChevronUp, ChevronDown, Music, Check, UserPlus } from 'lucide-react';
import { notify } from './Toast';
import { VerifiedBadge } from './VerifiedBadge';

interface TikTokVideoFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  posts: Post[];
  initialPostId?: string;
  onOpenAuth: () => void;
  onOpenUserProfile: (userId: string) => void;
  onDataRefresh: () => void;
}

// Fallback gaming vertical videos if app has few or no user videos
const SAMPLE_VIDEOS: Partial<Post>[] = [
  {
    id: 'sample_vid_1',
    authorId: 'user_master',
    authorName: 'Master Play Gaming',
    authorPhoto: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    title: '🔥 Kèkè Challenge Gran Finale !',
    description: 'Gade kòman jwè sa a fè 1,250 pwen nan sèlman 45 segonn ! Kiyès ki ka bat rekò sa a jodi a ?',
    mediaUrl: '/videos/masterplay_gaming.mp4',
    mediaType: 'video',
    likes: ['user_master', 'sample_1'],
    favorites: ['user_master'],
    comments: [
      { id: 'c1', userId: 'sample_1', userName: 'Jean Marc', text: 'Sa vrèman cho ! M ap eseye kounye a 🔥', createdAt: new Date().toISOString() },
      { id: 'c2', userId: 'sample_2', userName: 'Naika P.', text: 'Mwen bat rekò a deja wi haha !', createdAt: new Date().toISOString() }
    ],
    viewsCount: 342,
    sharesCount: 54,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample_vid_2',
    authorId: 'user_val',
    authorName: 'Valerie Champion',
    authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    title: '⚡ Match VS En Direct',
    description: 'Mwen pare pou defye nenpòt moun nan Domino Kèkè ! Vote pou mwen nan konpetisyon an 🏆',
    mediaUrl: '/videos/challenge_vs.mp4',
    mediaType: 'video',
    likes: ['sample_1'],
    favorites: [],
    comments: [
      { id: 'c3', userId: 'user_master', userName: 'Master Play', text: 'Bon kouraj chanpyon !', createdAt: new Date().toISOString() }
    ],
    viewsCount: 215,
    sharesCount: 19,
    createdAt: new Date().toISOString()
  }
];

export const TikTokVideoFeedModal: React.FC<TikTokVideoFeedModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  posts,
  initialPostId,
  onOpenAuth,
  onOpenUserProfile,
  onDataRefresh,
}) => {
  // Filter for video posts
  const videoPosts: Post[] = [
    ...posts.filter(p => p.mediaType === 'video' || (p.mediaUrl && (p.mediaUrl.endsWith('.mp4') || p.mediaUrl.includes('video') || p.mediaUrl.startsWith('data:video/')))),
  ];

  // If no uploaded videos, merge sample videos
  const feedItems: (Post | Partial<Post>)[] = videoPosts.length > 0 ? videoPosts : SAMPLE_VIDEOS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState<{ x: number; y: number } | null>(null);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [localLikes, setLocalLikes] = useState<{ [postId: string]: string[] }>({});
  const [localFavorites, setLocalFavorites] = useState<{ [postId: string]: string[] }>({});
  const [followingMap, setFollowingMap] = useState<{ [authorId: string]: boolean }>({});
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  // Initialize initial post index
  useEffect(() => {
    if (initialPostId) {
      const idx = feedItems.findIndex(p => p.id === initialPostId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [initialPostId, feedItems.length]);

  // Sync user following state
  useEffect(() => {
    if (currentUser?.followingIds) {
      const map: { [key: string]: boolean } = {};
      currentUser.followingIds.forEach(id => { map[id] = true; });
      setFollowingMap(map);
    }
  }, [currentUser]);

  const currentPost = feedItems[currentIndex] || SAMPLE_VIDEOS[0];
  const postId = currentPost.id || 'default';
  const authorId = currentPost.authorId || '';

  // Likes & favorites state for current post
  const currentLikes = localLikes[postId] || currentPost.likes || [];
  const isLiked = currentUser ? currentLikes.includes(currentUser.id) : false;

  const currentFavorites = localFavorites[postId] || currentPost.favorites || [];
  const isFavorited = currentUser ? currentFavorites.includes(currentUser.id) : false;

  const isFollowingAuthor = authorId ? (followingMap[authorId] || false) : false;

  // Auto-play / pause when slide changes
  useEffect(() => {
    if (!isOpen) return;
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        // Autoplay policy might require mute
        setIsMuted(true);
        if (videoRef.current) videoRef.current.play().catch(() => {});
      });
    }
  }, [currentIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, feedItems.length]);

  if (!isOpen) return null;

  const goToNext = () => {
    if (currentIndex < feedItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to top
      setCurrentIndex(0);
    }
    setShowCommentsDrawer(false);
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(feedItems.length - 1);
    }
    setShowCommentsDrawer(false);
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) {
      // Swipe Up -> Next
      goToNext();
    } else if (diff < -50) {
      // Swipe Down -> Prev
      goToPrev();
    }
  };

  // Wheel listener for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 40) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Double tap to like
  const handleScreenClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect();
      setShowHeartAnim({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setShowHeartAnim(null), 900);

      if (!isLiked) {
        triggerLike();
      }
    } else {
      // Single tap -> toggle play/pause
      togglePlayPause();
    }
    lastTapRef.current = now;
  };

  const triggerLike = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!postId || postId.startsWith('sample')) {
      // Optimistic like for sample
      setLocalLikes(prev => {
        const current = prev[postId] || currentPost.likes || [];
        const has = current.includes(currentUser.id);
        return {
          ...prev,
          [postId]: has ? current.filter(id => id !== currentUser.id) : [...current, currentUser.id]
        };
      });
      return;
    }

    try {
      const res = await api.toggleLike(postId, currentUser.id);
      if (res.success) {
        setLocalLikes(prev => ({ ...prev, [postId]: res.likes }));
        onDataRefresh();
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const triggerFavorite = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!postId || postId.startsWith('sample')) {
      setLocalFavorites(prev => {
        const cur = prev[postId] || currentPost.favorites || [];
        const has = cur.includes(currentUser.id);
        return {
          ...prev,
          [postId]: has ? cur.filter(id => id !== currentUser.id) : [...cur, currentUser.id]
        };
      });
      notify('Ajoute nan favori !', 'success');
      return;
    }

    try {
      const res = await api.toggleFavorite(postId, currentUser.id);
      if (res.success) {
        setLocalFavorites(prev => ({ ...prev, [postId]: res.favorites || [] }));
        notify(res.isFavorite ? 'Ajoute nan favori ! ⭐' : 'Retire nan favori.', 'info');
        onDataRefresh();
      }
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  const triggerFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!authorId || authorId === currentUser.id) return;

    try {
      const res = await api.toggleFollow(authorId, currentUser.id);
      if (res.success) {
        setFollowingMap(prev => ({ ...prev, [authorId]: res.isFollowing }));
        notify(res.isFollowing ? `Ou kòmanse swiv ${currentPost.authorName || 'itilizatè a'} !` : `Ou pa swiv ${currentPost.authorName || 'itilizatè a'} ankò.`, 'success');
        onDataRefresh();
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const triggerShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.origin;
    if (navigator.share) {
      navigator.share({
        title: currentPost.title || 'Master Play Vidéo',
        text: currentPost.description || 'Gade bèl vidéo sa a sou Master Play !',
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      notify('Lyen vidéo a kopye nan clipboard ou ! 🔗', 'success');
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!commentInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addComment(postId, currentUser.id, commentInput.trim());
      if (res.success) {
        if (!currentPost.comments) currentPost.comments = [];
        currentPost.comments = res.comments;
        setCommentInput('');
        notify('Kòmantè voye avèk siksè !', 'success');
        onDataRefresh();
      } else {
        notify('Erè nan voye kòmantè.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè nan voye kòmantè.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden">
      {/* Top Bar with Close & Indicator */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-black tracking-wider uppercase text-cyan-400">Master Play Feed</span>
          <span className="text-[11px] text-gray-400">
            {currentIndex + 1}/{feedItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/80 transition-transform active:scale-95"
            title={isMuted ? 'Mete Son' : 'Koupe Son'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors active:scale-95"
            title="Fèmen Feed la"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Screen Container (Max 480px width like smartphone screen on desktop, 100% on mobile) */}
      <div
        className="relative w-full max-w-[460px] h-full sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-gray-950 flex items-center justify-center shadow-2xl border border-white/10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Video Element with error boundary fallback */}
        {!videoError && (currentPost.mediaUrl || currentPost.videoUrl) ? (
          <video
            ref={videoRef}
            src={currentPost.mediaUrl || currentPost.videoUrl || '/videos/masterplay_gaming.mp4'}
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            muted={isMuted}
            onClick={handleScreenClick}
            onError={() => {
              setVideoError(true);
            }}
          />
        ) : (
          <div
            onClick={handleScreenClick}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#131B2E] to-purple-950 p-6 text-center cursor-pointer select-none relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-cyan-500/5 to-transparent"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white mb-4 shadow-2xl shadow-pink-500/30 animate-pulse">
                <Play className="w-10 h-10 ml-1 fill-white" />
              </div>
              <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-black text-[10px] uppercase tracking-wider mb-2">
                Master Play Gaming Clip
              </span>
              <h4 className="text-base font-black text-white max-w-xs">{currentPost.title || 'Kèkè Challenge Gran Finale'}</h4>
              <p className="text-xs text-gray-300 mt-2 max-w-xs line-clamp-3 leading-relaxed">{currentPost.description || 'Gade pi bèl aksyon jwèt yo ak nòt rekò sou Master Play !'}</p>
            </div>
          </div>
        )}

        {/* Play / Pause Overlay Icon when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-auto cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-black/60 border border-white/30 backdrop-blur-md flex items-center justify-center text-white animate-scale">
              <Play className="w-10 h-10 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Animated Double-Tap Heart */}
        {showHeartAnim && (
          <div
            className="absolute pointer-events-none z-30 animate-ping"
            style={{ left: showHeartAnim.x - 36, top: showHeartAnim.y - 36 }}
          >
            <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Right Side Vertical Action Bar (Like, Comment, Share, Favorite, Author Avatar) */}
        <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-5 pointer-events-auto">
          {/* 1. Author Avatar & Follow Button */}
          <div className="relative group">
            <button
              onClick={() => authorId && onOpenUserProfile(authorId)}
              className="w-12 h-12 rounded-full border-2 border-cyan-400 p-0.5 bg-black shadow-lg overflow-hidden transform active:scale-90 transition-transform"
              title="Gade Profil"
            >
              <img
                src={currentPost.authorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={currentPost.authorName || 'Otè'}
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {/* Follow + Badge if not current user and not yet following */}
            {currentUser && authorId && authorId !== currentUser.id && !isFollowingAuthor && (
              <button
                onClick={triggerFollow}
                className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 border border-white flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"
                title="Swiv Itilizatè sa a"
              >
                <UserPlus className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 2. Like Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={triggerLike}
              className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg active:scale-75 transition-all ${
                isLiked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
            </button>
            <span className="text-white text-xs font-black mt-1 drop-shadow-md">
              {currentLikes.length}
            </span>
          </div>

          {/* 3. Comment Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowCommentsDrawer(true)}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-75 transition-all"
            >
              <MessageSquare className="w-6 h-6 fill-white/20" />
            </button>
            <span className="text-white text-xs font-black mt-1 drop-shadow-md">
              {currentPost.comments?.length || 0}
            </span>
          </div>

          {/* 4. Favorite Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={triggerFavorite}
              className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg active:scale-75 transition-all ${
                isFavorited ? 'bg-amber-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Bookmark className={`w-6 h-6 ${isFavorited ? 'fill-white' : ''}`} />
            </button>
            <span className="text-white text-xs font-black mt-1 drop-shadow-md">
              {currentFavorites.length}
            </span>
          </div>

          {/* 5. Share Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={triggerShare}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-75 transition-all"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <span className="text-white text-xs font-black mt-1 drop-shadow-md">
              {currentPost.sharesCount || 0}
            </span>
          </div>
        </div>

        {/* Bottom Left Video Info (Author Name, Title, Description, Sound) */}
        <div className="absolute left-4 bottom-5 right-18 z-20 pointer-events-auto text-white space-y-2">
          {/* Author Name */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => authorId && onOpenUserProfile(authorId)}
              className="font-black text-sm hover:underline flex items-center gap-1.5 text-cyan-300 drop-shadow-md"
            >
              <span>@{currentPost.authorName || 'Itilizatè'}</span>
              <VerifiedBadge verified={currentPost.authorVerified} size="xs" />
            </button>

            {isFollowingAuthor && (
              <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-bold text-gray-200">
                W ap swiv li
              </span>
            )}
          </div>

          {/* Post Title & Description */}
          {currentPost.title && (
            <h3 className="font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-md text-white">
              {currentPost.title}
            </h3>
          )}

          {currentPost.description && (
            <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-md leading-relaxed">
              {currentPost.description}
            </p>
          )}

          {/* Sound Track Badge */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-300 drop-shadow-md">
            <Music className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="truncate max-w-[220px]">Son orijinal • Master Play Kèkè 2026</span>
          </div>
        </div>

        {/* Navigation Arrows for Desktop Click */}
        <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-3 z-30 pointer-events-auto">
          <button
            onClick={goToPrev}
            className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-cyan-600 transition-colors"
            title="Vidéo Anvan"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-cyan-600 transition-colors"
            title="Pwochen Vidéo"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Sliding Bottom Comments Drawer */}
        {showCommentsDrawer && (
          <div className="absolute inset-x-0 bottom-0 max-h-[70%] bg-gray-900/95 backdrop-blur-xl border-t border-white/15 rounded-t-3xl z-40 p-4 flex flex-col pointer-events-auto shadow-2xl transition-transform animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <span>Kòmantè ({currentPost.comments?.length || 0})</span>
              </h4>
              <button
                onClick={() => setShowCommentsDrawer(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-[300px]">
              {currentPost.comments && currentPost.comments.length > 0 ? (
                currentPost.comments.map((comm) => (
                  <div key={comm.id} className="flex gap-2.5 items-start">
                    <img
                      src={comm.userPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                      alt={comm.userName}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                    <div className="flex-1 bg-white/5 rounded-2xl p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300 inline-flex items-center gap-1">
                          <span>{comm.userName}</span>
                          <VerifiedBadge verified={comm.userVerified} size="xs" />
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-200 mt-1 leading-normal">{comm.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  Poko gen kòmantè sou vidéo sa a. Se ou menm ki pou kòmanse ! 💬
                </div>
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleSendComment} className="pt-2 flex gap-2 border-t border-white/10">
              <input
                type="text"
                placeholder={currentUser ? 'Ekri yon kòmantè...' : 'Konekte pou ekri kòmantè...'}
                disabled={!currentUser || isSubmittingComment}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-black/50 border border-white/15 rounded-full px-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!currentUser || !commentInput.trim() || isSubmittingComment}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold px-4 py-2 rounded-full text-xs transition-colors"
              >
                Voye
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
