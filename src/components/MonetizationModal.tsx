import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { notify } from './Toast';
import {
  Sparkles,
  Users,
  Heart,
  Award,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Coins,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdate: (updatedUser: User) => void;
  onOpenDeposit?: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenDeposit
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadStatus = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getMonetizationStatus(currentUser.id);
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Erè nan chaje estati monetizasyon.');
      }
    } catch (e: any) {
      setError(e.message || 'Erè rezo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadStatus();
    }
  }, [isOpen, currentUser?.id]);

  if (!isOpen || !currentUser) return null;

  const followersCount = data ? data.followersCount : (currentUser.followersCount || (currentUser.followerIds ? currentUser.followerIds.length : 0));
  const minRequired = data?.minFollowersRequired || 1000;
  const progressPercent = Math.min(100, Math.floor((followersCount / minRequired) * 100));
  const isEligible = followersCount >= minRequired;
  const isMonetized = data ? data.isMonetized : Boolean(currentUser.isMonetized);
  const activationFee = data?.activationFee || 250;
  const earningsPer1000 = data?.config?.earningsPer1000Likes || 500;
  const milestoneBonus = data?.config?.followerMilestoneBonus || 1000;

  const handleActivate = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.activateMonetization(currentUser.id);
      if (res.success && res.user) {
        notify('⭐ Felisitasyon ! Kont ou legalize e monetize sou Master Play !', 'success');
        onUserUpdate({
          ...currentUser,
          ...res.user
        });
        await loadStatus();
      } else {
        setError(res.error || 'Pa ka aktive monetizasyon.');
      }
    } catch (e: any) {
      setError(e.message || 'Erè nan rezo a.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      setError('Tanpri antre yon montan valab.');
      return;
    }
    if (amount > (data?.availableEarnings || 0)) {
      setError('Revni disponib ou pa ase pou montan sa a.');
      return;
    }

    setTransferLoading(true);
    setError('');
    try {
      const res = await api.transferEarningsToBalance(currentUser.id, amount);
      if (res.success && res.user) {
        notify(`💰 ${amount} HT transfere nan balans jwèt ou avèk siksè !`, 'success');
        setTransferAmount('');
        onUserUpdate({
          ...currentUser,
          ...res.user
        });
        await loadStatus();
      } else {
        setError(res.error || 'Pa ka transfere revni an.');
      }
    } catch (e: any) {
      setError(e.message || 'Erè pandan transfè a.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
                Monetizasyon Kreyatè
                {isMonetized && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    Aktif
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Fè kòb ak videyo Master Play ou yo selon likes ak abòne
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ELIGIBILITY TRACKER (Requirement: 1,000 followers) */}
        <div className="mt-5 p-4 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              Kondisyon Abòne (1,000 Abòne)
            </span>
            <span className="font-extrabold text-amber-400">
              {followersCount.toLocaleString()} / {minRequired.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isEligible ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {isEligible ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ou kalifye pou monetizasyon !
                </span>
              ) : (
                <span>Manke {(minRequired - followersCount).toLocaleString()} abòne pou kalifye</span>
              )}
            </span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
        </div>

        {/* 2. REVENUE RULES CARDS */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Heart className="w-5 h-5 fill-pink-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Likes sou Videyo</div>
              <div className="text-base font-black text-amber-400">{earningsPer1000} G</div>
              <div className="text-[10px] text-slate-400">Chak 1,000 likes sou tout videyo w yo</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Bonis 1,000 Abòne</div>
              <div className="text-base font-black text-blue-400">{milestoneBonus} G</div>
              <div className="text-[10px] text-slate-400">Bonis espesyal peye yon sèl fwa</div>
            </div>
          </div>
        </div>

        {/* 3. MONETIZED STATE: EARNINGS & CASHOUT DASHBOARD */}
        {isMonetized ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#131B2E] to-slate-900 border border-amber-500/30">
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-2">
                Tableau de Bord Revni Kreyatè
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Total Revni</div>
                  <div className="text-base font-black text-amber-400">
                    {(data?.totalEarnings || 0).toLocaleString()} HT
                  </div>
                </div>
                <div className="p-2.5 bg-black/40 rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-semibold">Disponib</div>
                  <div className="text-base font-black text-emerald-400">
                    {(data?.availableEarnings || 0).toLocaleString()} HT
                  </div>
                </div>
                <div className="p-2.5 bg-black/40 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">Deja Peye</div>
                  <div className="text-base font-black text-slate-300">
                    {(data?.paidEarnings || 0).toLocaleString()} HT
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span>Total Likes Monetize:</span>
                <span className="font-extrabold text-white">{(data?.monetizedLikesCount || 0).toLocaleString()} likes</span>
              </div>

              {data?.followerMilestonePaid && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Bonis 1,000 abòne ({milestoneBonus} G) deja kredite nan revni w !</span>
                </div>
              )}
            </div>

            {/* Transfer to Main Balance */}
            <form onSubmit={handleTransferToBalance} className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  Transfere Revni nan Balans Jwèt ou
                </span>
                <span className="text-xs text-slate-400">
                  Balans aktyèl: <b className="text-white">{(currentUser.balance || 0).toLocaleString()} HT</b>
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={data?.availableEarnings || 0}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Montan HT pou transfere"
                  className="flex-1 bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setTransferAmount(String(data?.availableEarnings || 0))}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-amber-400 transition-colors"
                >
                  Tout
                </button>
                <button
                  type="submit"
                  disabled={transferLoading || !data?.availableEarnings || data?.availableEarnings <= 0}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
                >
                  {transferLoading ? 'Transfè...' : 'Transfere'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 4. NOT MONETIZED YET */
          <div className="mt-5 space-y-4">
            {isEligible ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Frè Aktivasyon Monetizasyon</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Peye yon frè inik <b className="text-amber-400">{activationFee} HT</b> pou aktive kont kreyatè ou epi kòmanse touche sou tout videyo ak likes ou yo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Balans ou disponib:</span>
                  <span className="font-bold text-white">{(currentUser.balance || 0).toLocaleString()} HT</span>
                </div>

                {(currentUser.balance || 0) >= activationFee ? (
                  <button
                    onClick={handleActivate}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-950/40 text-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Peye {activationFee} HT e Aktive Monetizasyon</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
                      Balans ou pa ase pou peye frè {activationFee} HT a. Tanpri fè yon depo NatCash pou konplete aktivasyon an.
                    </div>
                    {onOpenDeposit && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeposit();
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Fè yon Depo NatCash Kounye a</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-300">
                  Ou bezwen genyen omwen <b className="text-amber-400">1,000 abòne</b> sou pwofil Master Play ou pou kapab aktive monetizasyon an.
                </p>
                <p className="text-[11px] text-slate-500">
                  Pibliye bon kontni ak videyo Master chak jou pou ogmante abòne ou yo rapidman !
                </p>
              </div>
            )}
          </div>
        )}

        {/* Guarantee Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sistèm monetizasyon ofisyèl Master Play — Kalkil revni egzak e transparan.</span>
        </div>
      </div>
    </div>
  );
};
