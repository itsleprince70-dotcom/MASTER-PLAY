import React from 'react';
import { MasterPlayLogo } from './MasterPlayLogo';
import { User, NotificationItem } from '../types';
import { Home, User as UserIcon, Trophy, Gamepad2, Award, Bell, Shield, ArrowDownRight, ArrowUpRight, Smartphone } from 'lucide-react';

export type TabType = 'akey' | 'pwofil' | 'konpetisyon' | 'jwet' | 'klasman';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentUser: User | null;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAuth: () => void;
  onOpenAndroidApp?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  notifications,
  onOpenNotifications,
  onOpenAdmin,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAuth,
  onOpenAndroidApp,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const availableBalance = currentUser ? currentUser.balance - (currentUser.reservedBalance || 0) : 0;

  return (
    <>
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Wordmark & Logo */}
          <div className="cursor-pointer shrink-0" onClick={() => onSelectTab('akey')}>
            <MasterPlayLogo size="sm" showSubtitle={false} showTagline={false} />
          </div>

          {/* Desktop Central Website Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => onSelectTab('akey')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'akey'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Akèy</span>
            </button>
            <button
              onClick={() => onSelectTab('konpetisyon')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'konpetisyon'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Konpetisyon</span>
            </button>
            <button
              onClick={() => onSelectTab('jwet')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'jwet'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Jwèt</span>
            </button>
            <button
              onClick={() => onSelectTab('klasman')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'klasman'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Klasman</span>
            </button>
            <button
              onClick={() => onSelectTab('pwofil')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'pwofil'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Pwofil</span>
            </button>
          </nav>

          {/* Right Header Zone: Balance / Auth / Notif / Admin */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser ? (
              <>
                {/* Balance pill / button */}
                <button
                  onClick={onOpenDeposit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 text-xs font-black tabular-nums"
                  title="Fè yon depo NatCash"
                >
                  <span>₦</span>
                  <span>{availableBalance.toLocaleString()} HT</span>
                </button>

                {/* Notifications Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                  aria-label="Notifikasyon"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile quick access avatar */}
                <button
                  onClick={() => onSelectTab('pwofil')}
                  className="flex items-center gap-2 p-1 pl-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <img
                    src={currentUser.profilePhoto}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[90px] truncate">
                    {currentUser.fullName}
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Konekte
              </button>
            )}

            {/* Android App Gateway Button */}
            {onOpenAndroidApp && (
              <button
                onClick={onOpenAndroidApp}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
                title="Aplikasyon Android & Android Studio"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Android</span>
              </button>
            )}

            {/* Admin Portal Gateway Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-all border border-slate-800 hover:border-amber-500/30 flex items-center gap-1.5 text-xs font-bold"
              title="Espas Administrasyon"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Tab Navigation Bar (Mobile only, hidden on desktop screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800/90 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Akèy */}
          <button
            onClick={() => onSelectTab('akey')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-all ${
              currentTab === 'akey' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Akèy</span>
          </button>

          {/* 2. Pwofil */}
          <button
            onClick={() => onSelectTab('pwofil')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-all ${
              currentTab === 'pwofil' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Pwofil</span>
          </button>

          {/* 3. Konpetisyon */}
          <button
            onClick={() => onSelectTab('konpetisyon')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-all ${
              currentTab === 'konpetisyon' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Konpetisyon</span>
          </button>

          {/* 4. Jwèt */}
          <button
            onClick={() => onSelectTab('jwet')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-all ${
              currentTab === 'jwet' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Jwèt</span>
          </button>

          {/* 5. Klasman */}
          <button
            onClick={() => onSelectTab('klasman')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-all ${
              currentTab === 'klasman' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1">Klasman</span>
          </button>
        </div>
      </nav>
    </>
  );
};
