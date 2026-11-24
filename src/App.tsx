/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Competition, Post, Game, Transaction, NotificationItem } from './types';
import { api } from './services/api';
import { Navigation, TabType } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { CompetitionsView } from './components/CompetitionsView';
import { GamesView } from './components/GamesView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { NatCashModal } from './components/NatCashModal';
import { AdminPortal } from './components/AdminPortal';
import { NotificationModal } from './components/NotificationModal';
import { AndroidAppModal } from './components/AndroidAppModal';
import { TikTokVideoFeedModal } from './components/TikTokVideoFeedModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreatePostModal } from './components/CreatePostModal';
import { PostRegisterInstallModal } from './components/PostRegisterInstallModal';
import { requestNotificationPermission } from './services/notifications';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { WhatsAppSupportButton } from './components/WhatsAppSupportButton';
import { getCameraPermissionState, requestCameraAndMic } from './utils/mediaPermissions';
import { flushOfflineSyncQueue } from './utils/offlineSyncQueue';
import { useFirebase } from './contexts/FirebaseContext';
import {
  syncUserProfileToFirestore,
  hydrateUserFromFirestore,
  subscribeUserCloudSync,
  signOutFirebase,
} from './services/firebaseSync';

export default function App() {
  const { firebaseUser, authReady } = useFirebase();
  // Navigation & View Mode
  const [currentTab, setCurrentTab] = useState<TabType>('akey');

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('masterplay_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.id === 'string' && parsed.id.trim() && parsed.id !== 'undefined' && parsed.id !== 'null') {
        return parsed;
      }
      localStorage.removeItem('masterplay_user');
      return null;
    } catch {
      return null;
    }
  });

  // App Data States
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNatCashModal, setShowNatCashModal] = useState(false);
  const [natCashInitialTab, setNatCashInitialTab] = useState<'depo' | 'retre' | 'istorik' | 'sekirite'>('depo');
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // TikTok Video Feed & User Profile & Create Post
  const [showTikTokFeed, setShowTikTokFeed] = useState(false);
  const [tikTokInitialPostId, setTikTokInitialPostId] = useState<string | undefined>(undefined);
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Post-Register Install Prompt & Modals
  const [showPostRegisterInstall, setShowPostRegisterInstall] = useState(false);
  const [certificationAlertMsg, setCertificationAlertMsg] = useState<string | null>(null);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [cameraPromptError, setCameraPromptError] = useState<string | null>(null);

  // Selected items for direct navigation
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Initial Data Fetch
  const refreshAllData = async () => {
    try {
      const [compsRes, postsRes, gamesRes] = await Promise.all([
        api.getCompetitions(),
        api.getPosts(),
        api.getGames(),
      ]);

      if (compsRes.success) setCompetitions(compsRes.competitions);
      if (postsRes.success) setPosts(postsRes.posts);
      if (gamesRes.success) setGames(gamesRes.games);

      if (currentUser?.id) {
        const [txRes, notifRes, userRes] = await Promise.all([
          api.getUserTransactions(currentUser.id),
          api.getNotifications(currentUser.id),
          api.getUser(currentUser.id),
        ]);

        if (txRes.success) setUserTransactions(txRes.transactions);
        if (notifRes.success) setNotifications(notifRes.notifications);
        if (userRes.success && userRes.user) {
          const safeUser: User = {
            ...userRes.user,
            balance: typeof userRes.user.balance === 'number' ? userRes.user.balance : 0,
            level: typeof userRes.user.level === 'number' ? userRes.user.level : 1,
            points: typeof userRes.user.points === 'number' ? userRes.user.points : 0,
            stars: typeof userRes.user.stars === 'number' ? userRes.user.stars : 1,
            followingIds: Array.isArray(userRes.user.followingIds) ? userRes.user.followingIds : [],
            followerIds: Array.isArray(userRes.user.followerIds) ? userRes.user.followerIds : [],
            favoritePostIds: Array.isArray(userRes.user.favoritePostIds) ? userRes.user.favoritePostIds : [],
          };
          setCurrentUser(safeUser);
          localStorage.setItem('masterplay_user', JSON.stringify(safeUser));
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentUser?.id]);

  // Real-time Firebase Firestore Cloud Sync & Cross-Device Session Recovery
  useEffect(() => {
    if (!authReady || !firebaseUser?.uid) return;

    let cancelled = false;

    (async () => {
      // 1. If local session is missing or belongs to another UID, restore from Firestore + backend
      if (!currentUser?.id || currentUser.firebaseUid !== firebaseUser.uid) {
        const cloudData = await hydrateUserFromFirestore(firebaseUser.uid);
        if (cancelled) return;
        const syncRes = await api.syncFromFirebase({
          firebaseUid: firebaseUser.uid,
          email: cloudData?.email || firebaseUser.email || undefined,
          fullName: cloudData?.fullName || firebaseUser.displayName || undefined,
          phoneNumber: cloudData?.phoneNumber || undefined,
          profilePhoto: cloudData?.profilePhoto || firebaseUser.photoURL || undefined,
          balance: cloudData?.balance,
          reservedBalance: cloudData?.reservedBalance,
          level: cloudData?.level,
          points: cloudData?.points,
          stars: cloudData?.stars,
          masterPlayId: cloudData?.masterPlayId,
          certificationStatus: cloudData?.certificationStatus,
          verified: cloudData?.verified,
        }).catch(() => null);

        if (!cancelled && syncRes?.success && syncRes.user) {
          const restoredUser: User = {
            ...syncRes.user,
            firebaseUid: firebaseUser.uid,
            followingIds: Array.isArray(syncRes.user.followingIds) ? syncRes.user.followingIds : [],
            followerIds: Array.isArray(syncRes.user.followerIds) ? syncRes.user.followerIds : [],
            favoritePostIds: Array.isArray(syncRes.user.favoritePostIds) ? syncRes.user.favoritePostIds : [],
          };
          setCurrentUser(restoredUser);
          try {
            localStorage.setItem('masterplay_user', JSON.stringify(restoredUser));
          } catch {}
          await syncUserProfileToFirestore(restoredUser, firebaseUser.uid);
        }
        return;
      }

      // 2. Otherwise keep Firestore and local profile mutually synchronized
      await syncUserProfileToFirestore(currentUser, firebaseUser.uid);
      const cloudData = await hydrateUserFromFirestore(firebaseUser.uid);
      if (!cancelled && cloudData) {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const merged: User = {
            ...prev,
            firebaseUid: firebaseUser.uid,
            level: typeof cloudData.level === 'number' ? Math.max(prev.level || 1, cloudData.level) : prev.level,
            points: typeof cloudData.points === 'number' ? Math.max(prev.points || 0, cloudData.points) : prev.points,
            stars: typeof cloudData.stars === 'number' ? Math.max(prev.stars || 1, cloudData.stars) : prev.stars,
          };
          try {
            localStorage.setItem('masterplay_user', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    })();

    if (!currentUser?.id) return () => { cancelled = true; };

    const unsub = subscribeUserCloudSync(
      firebaseUser.uid,
      (partial) => {
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const updated: User = { ...prev, ...partial };
          try {
            localStorage.setItem('masterplay_user', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      },
      (cloudNotifs) => {
        if (cloudNotifs.length > 0) {
          setNotifications((prev) => (prev.length >= cloudNotifs.length ? prev : cloudNotifs));
        }
      }
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [authReady, firebaseUser?.uid, currentUser?.id]);

  // Check camera permission on app launch (non-blocking)
  useEffect(() => {
    try {
      if (localStorage.getItem('mp_camera_prompt_dismissed') === '1') return;
    } catch {}
    getCameraPermissionState().then((state) => {
      if (state === 'prompt') {
        setShowCameraPrompt(true);
      }
    }).catch(() => {});
  }, []);

  // Automatic Global Memory Synchronization on launch and internet reconnect
  useEffect(() => {
    const runSync = async () => {
      const res = await flushOfflineSyncQueue();
      if (res.synced > 0) {
        refreshAllData();
      }
    };
    runSync();
    window.addEventListener('online', runSync);
    return () => window.removeEventListener('online', runSync);
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    const safeUser: User = {
      ...user,
      firebaseUid: user.firebaseUid || firebaseUser?.uid || undefined,
      balance: typeof user.balance === 'number' ? user.balance : 0,
      level: typeof user.level === 'number' ? user.level : 1,
      points: typeof user.points === 'number' ? user.points : 0,
      stars: typeof user.stars === 'number' ? user.stars : 1,
      followingIds: Array.isArray(user.followingIds) ? user.followingIds : [],
      followerIds: Array.isArray(user.followerIds) ? user.followerIds : [],
      favoritePostIds: Array.isArray(user.favoritePostIds) ? user.favoritePostIds : [],
    };
    setCurrentUser(safeUser);
    try {
      localStorage.setItem('masterplay_user', JSON.stringify(safeUser));
    } catch (e) {}

    if (firebaseUser?.uid) {
      syncUserProfileToFirestore(safeUser, firebaseUser.uid).catch(() => {});
    }

    setShowAuthModal(false);
    refreshAllData();

    // Trigger Native Notification permission
    requestNotificationPermission(safeUser.id).catch(() => {});

    // Show Post-Register install prompt if not already dismissed
    try {
      const dismissed = localStorage.getItem('pwa_post_register_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowPostRegisterInstall(true);
        }, 600);
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    // Only clear local session — NEVER delete user data in Firebase or server database
    signOutFirebase().catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('masterplay_user');
    setCurrentTab('akey');
  };

  const ensureCertified = async (): Promise<boolean> => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    if (currentUser.role === 'ADMIN' || currentUser.isAdmin) {
      return true;
    }
    try {
      const res = await api.getUserCertification(currentUser.id);
      if (res.success && res.user) {
        const syncedUser: User = {
          ...currentUser,
          ...res.user,
          certificationStatus: res.certificationStatus || res.user.certificationStatus || 'non_sètifye',
        };
        setCurrentUser(syncedUser);
        try {
          localStorage.setItem('masterplay_user', JSON.stringify(syncedUser));
        } catch {}
        if (syncedUser.certificationStatus === 'sètifye') {
          return true;
        }
      } else if (currentUser.certificationStatus === 'sètifye') {
        return true;
      }
    } catch {
      if (currentUser.certificationStatus === 'sètifye') {
        return true;
      }
    }
    setCertificationAlertMsg(
      'Kont ou poko sètifye. Ou dwe tann validasyon Administratè a anvan ou ka jwenn aksè ak fonksyon sa a.'
    );
    return false;
  };

  // Open NatCash with specified tab
  const handleOpenDeposit = async () => {
    if (!(await ensureCertified())) return;
    setNatCashInitialTab('depo');
    setShowNatCashModal(true);
  };

  const handleOpenWithdraw = async () => {
    if (!(await ensureCertified())) return;
    setNatCashInitialTab('retre');
    setShowNatCashModal(true);
  };

  const handleOpenTransactions = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setNatCashInitialTab('istorik');
    setShowNatCashModal(true);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#080C16] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
        {/* Website Top Header & Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedCompId(null);
            setCurrentTab(tab);
          }}
          currentUser={currentUser}
          notifications={notifications}
          onOpenNotifications={() => setShowNotificationModal(true)}
          onOpenAdmin={() => setShowAdminPortal(true)}
          onOpenDeposit={handleOpenDeposit}
          onOpenWithdraw={handleOpenWithdraw}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAndroidApp={() => setShowAndroidModal(true)}
        />

        {/* Main Website Responsive Content Area */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 min-h-[calc(100vh-140px)]">
          {currentTab === 'akey' && (
            <HomeView
              currentUser={currentUser}
              competitions={competitions}
              posts={posts}
              games={games}
              onOpenDeposit={handleOpenDeposit}
              onOpenWithdraw={handleOpenWithdraw}
              onSelectCompetition={(comp) => {
                setSelectedCompId(comp.id);
                setCurrentTab('konpetisyon');
              }}
              onSelectGame={() => setCurrentTab('jwet')}
              onViewAllCompetitions={() => setCurrentTab('konpetisyon')}
              onViewAllGames={() => setCurrentTab('jwet')}
              onOpenAuth={() => setShowAuthModal(true)}
              onDataRefresh={refreshAllData}
              onOpenTikTokFeed={(initialPostId) => {
                setTikTokInitialPostId(initialPostId);
                setShowTikTokFeed(true);
              }}
              onOpenUserProfile={(userId) => {
                setViewingProfileUserId(userId);
              }}
              onOpenCreatePost={async () => {
                if (await ensureCertified()) {
                  setShowCreatePostModal(true);
                }
              }}
            />
          )}

          {currentTab === 'konpetisyon' && (
            <CompetitionsView
              competitions={competitions}
              games={games}
              currentUser={currentUser}
              onOpenDeposit={handleOpenDeposit}
              onOpenAuth={() => setShowAuthModal(true)}
              selectedCompId={selectedCompId}
              onSelectGame={() => setCurrentTab('jwet')}
              onRegistrationSuccess={(comp, user) => {
                setCurrentUser(user);
                localStorage.setItem('masterplay_user', JSON.stringify(user));
                refreshAllData();
              }}
              onUpdateUser={(updatedUser) => {
                setCurrentUser(updatedUser);
                localStorage.setItem('masterplay_user', JSON.stringify(updatedUser));
              }}
              onDataRefresh={refreshAllData}
            />
          )}

          {currentTab === 'jwet' && (
            <GamesView
              games={games}
              currentUser={currentUser}
              onOpenDeposit={handleOpenDeposit}
              onOpenAuth={() => setShowAuthModal(true)}
              onBalanceUpdate={(newUser) => {
                setCurrentUser(newUser);
                localStorage.setItem('masterplay_user', JSON.stringify(newUser));
                refreshAllData();
              }}
            />
          )}

          {currentTab === 'klasman' && (
            <LeaderboardView
              competitions={competitions}
              games={games}
              currentUser={currentUser}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}

          {currentTab === 'pwofil' && (
            currentUser ? (
              <ProfileView
                user={currentUser}
                transactions={userTransactions}
                competitions={competitions}
                onOpenDeposit={handleOpenDeposit}
                onOpenWithdraw={handleOpenWithdraw}
                onOpenTransactions={handleOpenTransactions}
                onOpenNotifications={() => setShowNotificationModal(true)}
                onOpenCreatePost={async () => {
                  if (await ensureCertified()) {
                    setShowCreatePostModal(true);
                  }
                }}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  localStorage.setItem('masterplay_user', JSON.stringify(updated));
                }}
                onLogout={handleLogout}
              />
            ) : (
              <div className="p-8 text-center space-y-4 max-w-sm mx-auto my-12 bg-[#131B2E] rounded-3xl border border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
                  👤
                </div>
                <h2 className="text-xl font-bold text-white">Konekte pou w wè pwofil ou</h2>
                <p className="text-xs text-slate-400">
                  W ap ka jere balans NatCash ou, gade konpetisyon ou yo ak istorik ou.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Konekte Kounye a
                </button>
              </div>
            )
          )}
        </main>

        {/* Responsive Website Footer */}
        <Footer
          onSelectTab={(tab) => {
            setSelectedCompId(null);
            setCurrentTab(tab);
          }}
          onOpenDeposit={handleOpenDeposit}
          onOpenWithdraw={handleOpenWithdraw}
          onOpenAdmin={() => setShowAdminPortal(true)}
          onOpenAndroidApp={() => setShowAndroidModal(true)}
        />

        {/* FLOATING WHATSAPP BUTTON (Pinned for quick contact on +509 40987659) */}
        <WhatsAppSupportButton variant="floating" />

      {/* --- MODALS --- */}

      {/* Auth Modal (Register / Login / Google) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* NatCash Deposit & Withdrawal Modal */}
      <NatCashModal
        isOpen={showNatCashModal}
        onClose={() => setShowNatCashModal(false)}
        user={currentUser}
        initialTab={natCashInitialTab}
        userTransactions={userTransactions}
        onTransactionSuccess={(updatedUser) => {
          if (updatedUser) {
            setCurrentUser(updatedUser);
            localStorage.setItem('masterplay_user', JSON.stringify(updatedUser));
          }
          refreshAllData();
        }}
      />

      {/* Admin Portal (Server-verified ADMIN account) */}
      {showAdminPortal && (
        <AdminPortal
          currentUser={currentUser}
          onClose={() => setShowAdminPortal(false)}
          onDataChanged={refreshAllData}
        />
      )}

      {/* Notification Drawer Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        onRefresh={refreshAllData}
      />

      {/* Android Studio & PWA APK Modal */}
      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />

      {/* Vidéo Master Fullscreen Vertical Video Feed Modal */}
      <TikTokVideoFeedModal
        isOpen={showTikTokFeed}
        onClose={() => {
          setShowTikTokFeed(false);
          setTikTokInitialPostId(undefined);
        }}
        currentUser={currentUser}
        posts={posts}
        initialPostId={tikTokInitialPostId}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenUserProfile={(userId) => {
          setViewingProfileUserId(userId);
        }}
        onDataRefresh={refreshAllData}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={!!viewingProfileUserId}
        onClose={() => setViewingProfileUserId(null)}
        userId={viewingProfileUserId}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onSelectVideo={(postId) => {
          setViewingProfileUserId(null);
          setTikTokInitialPostId(postId);
          setShowTikTokFeed(true);
        }}
        onDataRefresh={refreshAllData}
      />

      {/* Create Post Modal (1 post per day + content moderation) */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        currentUser={currentUser}
        onPostCreated={(_newPost) => {
          refreshAllData();
        }}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Post-Registration PWA Installation Prompt Modal */}
      <PostRegisterInstallModal
        isOpen={showPostRegisterInstall}
        onClose={() => setShowPostRegisterInstall(false)}
      />

      {/* Certification Required Notice Modal */}
      {certificationAlertMsg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
              🔒
            </div>
            <h3 className="text-lg font-black text-white">Kont Poko Sètifye</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{certificationAlertMsg}</p>
            <button
              type="button"
              onClick={() => setCertificationAlertMsg(null)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors"
            >
              Mwen konprann
            </button>
          </div>
        </div>
      )}
      {/* Camera Permission Prompt on Launch (non-blocking) */}
      {showCameraPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0F172A] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto text-2xl">
              📷
            </div>
            <h3 className="text-lg font-black text-white">Pèmisyon Kamera</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aksè ak kamera telefòn nan nesesè pou w ka anrejistre videyo ak pran foto dirèkteman nan MASTER PLAY.
            </p>
            {cameraPromptError && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-left">
                {cameraPromptError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('mp_camera_prompt_dismissed', '1');
                  } catch {}
                  setShowCameraPrompt(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Pita
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await requestCameraAndMic({ video: true, audio: false });
                  if (res.granted) {
                    try {
                      localStorage.setItem('mp_camera_prompt_dismissed', '1');
                    } catch {}
                    setShowCameraPrompt(false);
                  } else {
                    setCameraPromptError(res.error || 'Ou ka aktive pèmisyon kamera a nan Settings telefòn nan nenpòt lè.');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors"
              >
                Otorize Kamera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
