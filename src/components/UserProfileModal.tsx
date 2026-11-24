import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { api } from '../services/api';
import { X, Check, UserPlus, Heart, MessageSquare, Play, Video, Grid, Award, ShieldCheck, Calendar } from 'lucide-react';
import { notify } from './Toast';
import { VerifiedBadge } from './VerifiedBadge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectVideo?: (postId: string) => void;
  onDataRefresh: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUser,
  onOpenAuth,
  onSelectVideo,
  onDataRefresh,
}) => {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('posts');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setLoading(true);

    api.getUserProfile(userId, currentUser?.id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.user) {
          setProfileUser(res.user);
          setUserPosts(res.posts || []);
          setIsFollowing(!!res.isFollowing);
          setFollowersCount(res.followersCount || 0);
          setFollowingCount(res.followingCount || 0);
        } else {
          notify(res.error || 'Itilizatè pa jwenn nan bazdone a.', 'error');
          onClose();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Profile fetch error:', err);
        notify('Erè nan chaje profil itilizatè sa a.', 'error');
        onClose();
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, currentUser?.id]);

  if (!isOpen || !userId) return null;

  const handleToggleFollow = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (userId === currentUser.id) {
      notify('Ou pa ka swiv pwòp tèt ou.', 'info');
      return;
    }

    setFollowLoading(true);
    try {
      const res = await api.toggleFollow(userId, currentUser.id);
      if (res.success) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
        notify(
          res.isFollowing
            ? `Ou kòmanse swiv ${profileUser?.fullName || 'itilizatè a'} !`
            : `Ou pa swiv ${profileUser?.fullName || 'itilizatè a'} ankò.`,
          'success'
        );
        onDataRefresh();
      } else {
        notify(res.error || 'Erè nan swiv itilizatè a.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè nan koneksyon.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const videoPosts = userPosts.filter(
    (p) => p.mediaType === 'video' || (p.mediaUrl && (p.mediaUrl.endsWith('.mp4') || p.mediaUrl.includes('video') || p.mediaUrl.startsWith('data:video/')))
  );

  const displayedPosts = activeTab === 'videos' ? videoPosts : userPosts;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white">
        {/* Header Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 sm:px-6 pb-6 -mt-14">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-300">W ap chaje profil la...</p>
            </div>
          ) : profileUser ? (
            <>
              {/* Avatar + Main Info Row */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-end gap-3.5">
                  <div className="relative">
                    <img
                      src={profileUser.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={profileUser.fullName}
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-gray-900 shadow-xl bg-gray-800"
                    />
                    {profileUser.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black p-1 rounded-full shadow-md" title="Kont Verifye">
                        <ShieldCheck className="w-4 h-4 fill-black text-cyan-500" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black">{profileUser.fullName}</h3>
                      <VerifiedBadge verified={Boolean(profileUser.verified || profileUser.certificationStatus === 'sètifye' || profileUser.role === 'ADMIN' || profileUser.isAdmin)} size="md" />
                    </div>
                    <p className="text-xs text-gray-400">@{profileUser.username || profileUser.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Nivo {profileUser.level || 1}
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        ★ {profileUser.stars || 1} zetwal
                      </span>
                      {profileUser.isMonetized && (
                        <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          ⭐ Kreyatè Monetize
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Follow Button */}
                {currentUser && currentUser.id !== userId && (
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 ${
                      isFollowing
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-white/10'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span>W ap swiv li</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Swiv</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="mt-4 text-xs text-gray-300 bg-white/5 p-3 rounded-2xl border border-white/5 leading-relaxed">
                  {profileUser.bio}
                </p>
              )}

              {/* Stats Counters (Followers, Following, Posts) */}
              <div className="grid grid-cols-3 gap-2 mt-5 py-3 border-y border-white/10 text-center">
                <div>
                  <span className="block text-lg font-black text-cyan-400">{followersCount}</span>
                  <span className="text-[11px] text-gray-400">Abòne</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-cyan-400">{followingCount}</span>
                  <span className="text-[11px] text-gray-400">Moun li swiv</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-cyan-400">{userPosts.length}</span>
                  <span className="text-[11px] text-gray-400">Piblikasyon</span>
                </div>
              </div>

              {/* Tabs: Posts / Videos */}
              <div className="flex border-b border-white/10 mt-4">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'posts'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>Tout Piblikasyon ({userPosts.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'videos'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Vidéo Feed ({videoPosts.length})</span>
                </button>
              </div>

              {/* Content Grid */}
              <div className="mt-4">
                {displayedPosts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    Itilizatè sa a poko mete okenn {activeTab === 'videos' ? 'vidéo' : 'kontni'}.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {displayedPosts.map((post) => {
                      const isVid = post.mediaType === 'video' || (post.mediaUrl && (post.mediaUrl.endsWith('.mp4') || post.mediaUrl.includes('video')));
                      return (
                        <div
                          key={post.id}
                          onClick={() => {
                            if (isVid && onSelectVideo) {
                              onSelectVideo(post.id);
                              onClose();
                            }
                          }}
                          className={`relative group rounded-2xl overflow-hidden bg-gray-800 border border-white/5 aspect-square cursor-pointer transition-transform hover:scale-[1.02] shadow-md`}
                        >
                          {post.mediaUrl ? (
                            isVid ? (
                              <video
                                src={post.mediaUrl || '/videos/masterplay_gaming.mp4'}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <img
                                src={post.mediaUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full p-3 flex flex-col justify-center items-center bg-gradient-to-br from-gray-800 to-gray-900 text-center">
                              <p className="text-[11px] font-bold line-clamp-3 text-gray-300">
                                {post.title || post.description}
                              </p>
                            </div>
                          )}

                          {/* Video Badge */}
                          {isVid && (
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white shadow-md">
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </div>
                          )}

                          {/* Hover Overlay with stats */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 text-white transition-opacity text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 fill-white" />
                              {post.likes?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 fill-white" />
                              {post.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
