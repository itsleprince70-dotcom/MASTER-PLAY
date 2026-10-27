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
import { WhatsAppSupportButton } from './components/WhatsAppSupportButton';
import { Smartphone, Monitor, Shield } from 'lucide-react';

export default function App() {
  // Navigation & View Mode
  const [currentTab, setCurrentTab] = useState<TabType>('akey');
  const [deviceFrame, setDeviceFrame] = useState<'mobile' | 'responsive'>('responsive');

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('masterplay_user');
      return saved ? JSON.parse(saved) : null;
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
          setCurrentUser(userRes.user);
          localStorage.setItem('masterplay_user', JSON.stringify(userRes.user));
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [currentUser?.id]);

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('masterplay_user', JSON.stringify(user));
    setShowAuthModal(false);
    refreshAllData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('masterplay_user');
    setCurrentTab('akey');
  };

  // Open NatCash with specified tab
  const handleOpenDeposit = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setNatCashInitialTab('depo');
    setShowNatCashModal(true);
  };

  const handleOpenWithdraw = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
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
    <div className="min-h-screen bg-[#080C16] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      
      {/* Viewport Frame Switcher Bar (Useful for developers / users wanting to view exact Android phone view or wide web) */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-[#0B0F19] border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>MASTER PLAY / Kèkè Challenge — Sistèm Reyèl ak Tranzaksyon NatCash</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Mòd Afichaj:</span>
          <button
            onClick={() => setDeviceFrame('mobile')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors font-bold ${
              deviceFrame === 'mobile'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Telefòn Android</span>
          </button>
          <button
            onClick={() => setDeviceFrame('responsive')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors font-bold ${
              deviceFrame === 'responsive'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Ekran Laj</span>
          </button>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <div
        className={`w-full mx-auto transition-all ${
          deviceFrame === 'mobile'
            ? 'max-w-md my-4 border-2 border-slate-700/80 rounded-[40px] shadow-2xl overflow-hidden bg-[#080C16]'
            : 'max-w-6xl'
        }`}
      >
        {/* Navigation Header & Bottom Tabs */}
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
        />

        {/* Tab Body Pages */}
        <main className="p-4 sm:p-6 min-h-[calc(100vh-140px)]">
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
      </div>

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

      {/* Admin Portal (Protected with initial code prince509) */}
      {showAdminPortal && (
        <AdminPortal
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
    </div>
  );
}
