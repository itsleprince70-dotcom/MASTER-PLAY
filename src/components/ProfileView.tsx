import React, { useState } from 'react';
import { User, Transaction, Competition } from '../types';
import { api } from '../services/api';
import { User as UserIcon, Shield, Camera, Lock, ArrowDownRight, ArrowUpRight, Trophy, Bell, Settings, LogOut, Check, AlertCircle, RefreshCw, Star, Heart, Gift, Flame, CheckCircle2 } from 'lucide-react';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';

interface ProfileViewProps {
  user: User;
  transactions: Transaction[];
  competitions: Competition[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransactions: () => void;
  onOpenNotifications: () => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  transactions,
  competitions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransactions,
  onOpenNotifications,
  onUpdateUser,
  onLogout,
}) => {
  const [activeModal, setActiveModal] = useState<'none' | 'edit_profile' | 'change_pin'>('none');

  // Edit Profile state
  const [newName, setNewName] = useState(user.fullName);
  const [newPhoto, setNewPhoto] = useState(user.profilePhoto);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Change PIN state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const userCompetitions = competitions.filter((c) => c.registeredUserIds.includes(user.id));
  const availableBalance = user.balance - (user.reservedBalance || 0);
  const starCount = Math.min(5, Math.max(1, user.stars || user.level || 1));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    try {
      const res = await api.updateProfile({
        userId: user.id,
        fullName: newName.trim(),
        profilePhoto: newPhoto,
      });
      if (res.success && res.user) {
        onUpdateUser(res.user);
        setProfileMsg('Pwofil ou a mete ajou avèk siksè !');
        setTimeout(() => setActiveModal('none'), 1200);
      }
    } catch (err: any) {
      setProfileMsg('Erè pandan mizajou pwofil la.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (newPin !== confirmNewPin) {
      setPinError('De nouvo kòd yo pa koresponn.');
      return;
    }

    if (newPin.length < 4) {
      setPinError('Nouvo kòd la dwe gen omwen 4 chif.');
      return;
    }

    setPinLoading(true);
    try {
      const res = await api.changePin({
        userId: user.id,
        oldPin,
        newPin,
      });

      if (res.success) {
        setPinSuccess('Kòd sekirite ou a chanje avèk siksè !');
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
        setTimeout(() => setActiveModal('none'), 1200);
      } else {
        setPinError(res.error || 'Ansyen kòd la pa kòrèk.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Erè pandan chanjman kòd la.');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-14 max-w-2xl mx-auto">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-[#131B2E] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar with Level Badge & Stars */}
          <div className="relative">
            <img
              src={user.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-500/40 shadow-xl shadow-amber-500/20"
            />
            <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md border border-white/20">
              Nivo {user.level || 1}
            </span>
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
              {user.isOnline && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title="An liy" />
              )}
            </div>
            
            {/* Stars Row */}
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < starCount ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                />
              ))}
              <span className="text-xs text-amber-300 font-bold ml-1.5">{starCount} / 5 Zétwal</span>
            </div>

            <p className="text-xs text-slate-400 mt-1 font-medium">{user.phoneNumber}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="text-[11px] text-slate-500">
                Manm depi:{' '}
                {new Date(user.createdAt).toLocaleDateString('ht-HT', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Kont Verifye
              </span>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setActiveModal('edit_profile')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700 shrink-0"
          >
            Chanje foto / non
          </button>
        </div>

        {/* Balance Card Section */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 shadow-xl border border-white/10 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-cyan-100 font-bold uppercase tracking-wider block">
                Balans Kont Disponib
              </span>
              <div className="text-3xl font-black tabular-nums tracking-tight mt-1">
                {availableBalance.toLocaleString()} HT
              </div>
              {(user.reservedBalance || 0) > 0 && (
                <div className="text-xs text-amber-200 mt-0.5 font-medium">
                  {user.reservedBalance?.toLocaleString()} HT an atant retrè
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onOpenDeposit}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Depo</span>
              </button>
              <button
                onClick={onOpenWithdraw}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Retrè</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fanatik & Match & Kado Stats Card (Requirement 3, 4, 7, 8) */}
      <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Estatistik Jwè & Sipò Fanatik</span>
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">
            Total Pwen: {user.points?.toLocaleString() || 0}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-[#0B0F19] border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Fanatik / Followers</div>
            <div className="text-lg font-black text-rose-400 mt-0.5 flex items-center justify-center gap-1">
              <Heart className="w-4 h-4 fill-rose-500/30 text-rose-400" />
              <span>{user.followersCount?.toLocaleString() || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B0F19] border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Match VS Jwe</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">
              <span>{user.matchesWon || 0}</span>
              <span className="text-xs text-slate-500 font-normal"> / {user.matchesPlayed || 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B0F19] border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Vòt Resevwa</div>
            <div className="text-lg font-black text-blue-400 mt-0.5">
              {user.votesReceived?.toLocaleString() || 0}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B0F19] border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Kado Resevwa</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>{user.giftsReceivedCount || 0}</span>
              <span className="text-[10px] text-emerald-300 font-normal">({user.giftsReceivedValue || 0} HT)</span>
            </div>
          </div>
        </div>

        {/* Level Progression & History */}
        {user.levelHistory && user.levelHistory.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 mb-2">Istorik Pwogresyon Nivo:</div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {user.levelHistory.map((lh, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#080C16] border border-slate-850 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      Nivo {lh.level}
                    </span>
                    <span className="text-slate-300 text-[11px]">{lh.reason}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(lh.date).toLocaleDateString('ht-HT')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onOpenTransactions}
          className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 text-center hover:border-slate-700 transition-all group"
        >
          <div className="text-2xl font-black text-amber-400 tabular-nums">
            {transactions.length}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1 group-hover:text-white">
            Tranzaksyon
          </div>
        </button>

        <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 text-center">
          <div className="text-2xl font-black text-blue-400 tabular-nums">
            {userCompetitions.length}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1">
            Konpetisyon
          </div>
        </div>

        <button
          onClick={onOpenNotifications}
          className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 text-center hover:border-slate-700 transition-all group"
        >
          <div className="text-2xl font-black text-emerald-400 tabular-nums">
            {transactions.filter((t) => t.status === 'konfime').length}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1 group-hover:text-white">
            Viktwa / Peye
          </div>
        </button>
      </div>

      {/* Menu Action List */}
      <div className="rounded-3xl bg-[#131B2E] border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        <button
          onClick={onOpenTransactions}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Istorik Tranzaksyon NatCash</div>
              <div className="text-xs text-slate-400">Tout depo, retrè ak referans ou yo</div>
            </div>
          </div>
          <span className="text-slate-500 font-bold">›</span>
        </button>

        <button
          onClick={onOpenNotifications}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Notifikasyon & Anons</div>
              <div className="text-xs text-slate-400">Mesaj administratè ak rezilta</div>
            </div>
          </div>
          <span className="text-slate-500 font-bold">›</span>
        </button>

        <button
          onClick={() => setActiveModal('change_pin')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Sekirite (Chanje kòd pèsonèl)</div>
              <div className="text-xs text-slate-400">Modifye kòd sekirite kont ou</div>
            </div>
          </div>
          <span className="text-slate-500 font-bold">›</span>
        </button>

        <div className="p-4">
          <WhatsAppSupportButton type="sipò" />
        </div>

        <button
          onClick={onLogout}
          className="w-full p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Dekonekte sou kont sa a</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {activeModal === 'edit_profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Modifye Pwofil Ou</h3>
            {profileMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <img
                  src={newPhoto}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500"
                />
                <label className="cursor-pointer text-xs font-bold text-amber-400 hover:underline flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chanje foto nan galri oswa kamera</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Non konplè</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg"
                >
                  {profileLoading ? 'N ap sove...' : 'Sove Chanjman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {activeModal === 'change_pin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Chanje Kòd Pèsonèl (PIN)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Kòd sa a itilize pou konekte e konfime tranzaksyon ou yo.
            </p>

            {pinError && (
              <div className="mb-3 p-3 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="mb-3 p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ansyen kòd la</label>
                <input
                  type="password"
                  required
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Kòd aktyèl ou"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nouvo kòd la</label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Omwen 4 chif"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Konfime nouvo kòd la</label>
                <input
                  type="password"
                  required
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Tape l ankò"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg"
                >
                  {pinLoading ? 'N ap verifye...' : 'Chanje Kòd'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
