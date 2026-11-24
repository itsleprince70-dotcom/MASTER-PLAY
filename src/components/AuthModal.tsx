import React, { useState, useEffect } from 'react';
import { MasterPlayLogo } from './MasterPlayLogo';
import { api } from '../services/api';
import { User } from '../types';
import { Lock, Phone, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck, Mail, KeyRound, MessageSquare } from 'lucide-react';
import { notify } from './Toast';
import type { ConfirmationResult } from 'firebase/auth';
import {
  signInWithFirebaseGoogle,
  ensureFirebasePhoneSession,
  syncUserProfileToFirestore,
  hydrateUserFromFirestore,
  signUpWithFirebaseEmail,
  signInWithFirebaseEmail,
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
  clearRecaptchaVerifier,
  normalizeE164Phone,
} from '../services/firebaseSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'welcome' | 'login' | 'register' | 'google_phone' | 'email_auth' | 'phone_otp';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'welcome',
}) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register' | 'google_phone' | 'email_auth' | 'phone_otp'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailAction, setEmailAction] = useState<'login' | 'register'>('login');
  const [smsCode, setSmsCode] = useState('');
  const [otpConfirmation, setOtpConfirmation] = useState<ConfirmationResult | null>(null);
  const [googleData, setGoogleData] = useState<{ email: string; name: string; photo: string; uid?: string } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  // Google Account Picker State (must be declared before early return)
  const [googleAccounts] = useState<Array<{ email: string; name: string; photo: string }>>([
    {
      email: 'jean.william.gaming@gmail.com',
      name: 'Jean William',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    {
      email: 'marie.carmelle.ht@gmail.com',
      name: 'Marie Carmelle',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    }
  ]);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !phoneNumber.trim() || !pin) {
      setError('Tanpri ranpli tout chan yo.');
      return;
    }

    if (pin.length < 4) {
      setError('Kòd sekrè a dwe gen omwen 4 chif.');
      return;
    }

    if (pin !== confirmPin) {
      setError('De kòd pèsonèl yo pa menm. Tanpri verifye yo.');
      return;
    }

    setLoading(true);
    try {
      const fbUser = await ensureFirebasePhoneSession({
        phoneNumber: phoneNumber.trim(),
        pin,
        isRegister: true,
      });

      const res = await api.register({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        pin,
        firebaseUid: fbUser?.uid,
      });

      if (res.success && res.user) {
        const sanitizedUser: User = {
          ...res.user,
          firebaseUid: fbUser?.uid || res.user.firebaseUid,
          balance: typeof res.user.balance === 'number' ? res.user.balance : 0,
          level: typeof res.user.level === 'number' ? res.user.level : 1,
          points: typeof res.user.points === 'number' ? res.user.points : 0,
          stars: typeof res.user.stars === 'number' ? res.user.stars : 1,
          followingIds: Array.isArray(res.user.followingIds) ? res.user.followingIds : [],
          followerIds: Array.isArray(res.user.followerIds) ? res.user.followerIds : [],
          favoritePostIds: Array.isArray(res.user.favoritePostIds) ? res.user.favoritePostIds : [],
          followersCount: typeof res.user.followersCount === 'number' ? res.user.followersCount : 0,
          followingCount: typeof res.user.followingCount === 'number' ? res.user.followingCount : 0,
        };
        if (fbUser?.uid) {
          syncUserProfileToFirestore(sanitizedUser, fbUser.uid).catch(() => {});
        }
        notify(res.message || 'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.', 'success');
        onSuccess(sanitizedUser);
      } else {
        setError(res.error || 'Erè pandan enskripsyon an.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè rezo pandan enskripsyon an. Tanpri eseye ankò.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber.trim() || !pin) {
      setError('Tanpri antre nimewo telefòn ak kòd ou.');
      return;
    }

    setLoading(true);
    try {
      const fbUser = await ensureFirebasePhoneSession({
        phoneNumber: phoneNumber.trim(),
        pin,
        isRegister: false,
      });

      const res = await api.login({
        phoneNumber: phoneNumber.trim(),
        pin,
        firebaseUid: fbUser?.uid,
      });

      if (res.success && res.user) {
        const userWithUid: User = {
          ...res.user,
          firebaseUid: fbUser?.uid || res.user.firebaseUid,
        };
        if (fbUser?.uid) {
          syncUserProfileToFirestore(userWithUid, fbUser.uid).catch(() => {});
        }
        onSuccess(userWithUid);
      } else {
        setError(res.error || 'Nimewo telefòn oswa kòd la pa kòrèk.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè rezo pandan koneksyon an.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger real Firebase Google Sign-In Popup (falls back to picker if popup blocked)
  const handleGoogleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const fbGoogle = await signInWithFirebaseGoogle();
      if (fbGoogle.email) {
        await selectGoogleAccount({
          email: fbGoogle.email,
          name: fbGoogle.fullName,
          photo: fbGoogle.photo,
          uid: fbGoogle.uid,
        });
        return;
      }
    } catch (err: any) {
      // If user closed popup or popup blocked in WebView, fall back to built-in account picker
      if (err?.code === 'auth/popup-closed-by-user') {
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setMode('google_phone');
  };

  const selectGoogleAccount = async (account: { email: string; name: string; photo: string; uid?: string }) => {
    setError('');
    setGoogleData(account);
    setFullName(account.name);
    setLoading(true);

    try {
      // First attempt direct login if account already registered
      const res = await api.googleAuth({
        email: account.email,
        fullName: account.name,
        photo: account.photo,
        phoneNumber: phoneNumber || undefined,
        firebaseUid: account.uid,
      });

      if (res.success && res.user && !res.created) {
        const userWithUid: User = {
          ...res.user,
          firebaseUid: account.uid || res.user.firebaseUid,
        };
        if (account.uid) {
          syncUserProfileToFirestore(userWithUid, account.uid).catch(() => {});
        }
        // Existing user recognized directly by Google ID or email!
        notify(`Byenveni ankò, ${userWithUid.fullName || userWithUid.username} ! Kont ou rekonèt dirèkteman.`, 'success');
        onSuccess(userWithUid);
        return;
      }

      // If new account and needs phone number for NatCash verification
      setMode('google_phone');
    } catch (err: any) {
      // If error or phone needed, proceed to phone confirmation
      setMode('google_phone');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
      setError('Tanpri antre yon adrès imèl Google valab.');
      return;
    }
    const namePart = customGoogleEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const newAccount = {
      email: customGoogleEmail.trim().toLowerCase(),
      name: formattedName,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    selectGoogleAccount(newAccount);
  };

  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleData) return;
    setError('');

    if (!phoneNumber.trim()) {
      setError('Nimewo telefòn obligatwa pou konfime kont lan.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.googleAuth({
        email: googleData.email,
        fullName: fullName || googleData.name,
        photo: googleData.photo,
        phoneNumber: phoneNumber.trim(),
        pin: pin || '1234',
        firebaseUid: googleData.uid,
      });

      if (res.success && res.user) {
        const userWithUid: User = {
          ...res.user,
          firebaseUid: googleData.uid || res.user.firebaseUid,
        };
        if (googleData.uid) {
          syncUserProfileToFirestore(userWithUid, googleData.uid).catch(() => {});
        }
        if (res.created) {
          notify(res.message || 'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.', 'success');
        } else {
          notify(`Byenveni ankò, ${userWithUid.fullName} !`, 'success');
        }
        onSuccess(userWithUid);
      } else {
        setError(res.error || 'Erè pandan koneksyon Google la.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè pandan koneksyon an.');
    } finally {
      setLoading(false);
    }
  };

  // Real Firebase Email & Password Sign-In / Sign-Up
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailInput.trim() || !emailPassword) {
      setError('Tanpri antre adrès imèl ak modpas ou.');
      return;
    }
    if (emailAction === 'register' && emailPassword.length < 6) {
      setError('Modpas la dwe gen omwen 6 karaktè.');
      return;
    }

    setLoading(true);
    try {
      const fbUser =
        emailAction === 'register'
          ? await signUpWithFirebaseEmail(emailInput, emailPassword, fullName)
          : await signInWithFirebaseEmail(emailInput, emailPassword);

      const cloudProfile = await hydrateUserFromFirestore(fbUser.uid).catch(() => null);
      const syncRes = await api.syncFromFirebase({
        firebaseUid: fbUser.uid,
        email: fbUser.email || emailInput.trim().toLowerCase(),
        fullName: cloudProfile?.fullName || fullName.trim() || fbUser.displayName || undefined,
        phoneNumber: cloudProfile?.phoneNumber || (phoneNumber.trim() ? normalizeE164Phone(phoneNumber) : undefined),
        profilePhoto: cloudProfile?.profilePhoto || fbUser.photoURL || undefined,
        balance: cloudProfile?.balance,
        reservedBalance: cloudProfile?.reservedBalance,
        level: cloudProfile?.level,
        points: cloudProfile?.points,
        stars: cloudProfile?.stars,
        masterPlayId: cloudProfile?.masterPlayId,
        certificationStatus: cloudProfile?.certificationStatus,
        verified: cloudProfile?.verified,
      });

      if (syncRes.success && syncRes.user) {
        const finalUser: User = {
          ...syncRes.user,
          firebaseUid: fbUser.uid,
        };
        syncUserProfileToFirestore(finalUser, fbUser.uid).catch(() => {});
        notify(
          syncRes.restored
            ? 'Byenvini nan MASTER PLAY! Kont ou konekte ak Firebase.'
            : `Byenveni ankò, ${finalUser.fullName || finalUser.username} !`,
          'success'
        );
        onSuccess(finalUser);
      } else {
        setError(syncRes.error || 'Erè pandan senkronizasyon kont lan.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erè pandan koneksyon Imèl/Modpas la.');
    } finally {
      setLoading(false);
    }
  };

  // Real Firebase Phone SMS OTP Authentication
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber.trim()) {
      setError('Tanpri antre nimewo telefòn ou (egzanp: +50940123456).');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await sendFirebasePhoneOtp(phoneNumber.trim(), 'firebase-recaptcha-container');
      setOtpConfirmation(confirmation);
      notify('Nou voye yon kòd verifikasyon SMS sou telefòn ou.', 'success');
    } catch (err: any) {
      setError(err?.message || 'Pa kapab voye kòd SMS la.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpConfirmation) return;
    setError('');
    if (!smsCode.trim()) {
      setError('Tanpri antre kòd 6 chif ou resevwa pa SMS la.');
      return;
    }

    setLoading(true);
    try {
      const fbUser = await confirmFirebasePhoneOtp(otpConfirmation, smsCode);
      const cloudProfile = await hydrateUserFromFirestore(fbUser.uid).catch(() => null);
      const verifiedPhone = fbUser.phoneNumber || normalizeE164Phone(phoneNumber);
      const syncRes = await api.syncFromFirebase({
        firebaseUid: fbUser.uid,
        phoneNumber: verifiedPhone,
        fullName: cloudProfile?.fullName || fullName.trim() || undefined,
        profilePhoto: cloudProfile?.profilePhoto || undefined,
        balance: cloudProfile?.balance,
        reservedBalance: cloudProfile?.reservedBalance,
        level: cloudProfile?.level,
        points: cloudProfile?.points,
        stars: cloudProfile?.stars,
        masterPlayId: cloudProfile?.masterPlayId,
        certificationStatus: cloudProfile?.certificationStatus,
        verified: cloudProfile?.verified,
      });

      if (syncRes.success && syncRes.user) {
        const finalUser: User = {
          ...syncRes.user,
          firebaseUid: fbUser.uid,
        };
        syncUserProfileToFirestore(finalUser, fbUser.uid).catch(() => {});
        notify('Telefòn ou verifye avèk siksè atravè Firebase!', 'success');
        onSuccess(finalUser);
      } else {
        setError(syncRes.error || 'Erè pandan senkronizasyon kont telefòn lan.');
      }
    } catch (err: any) {
      setError(err?.message || 'Kòd SMS la pa valide.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center">
          <MasterPlayLogo size="lg" showSubtitle={true} showTagline={true} />
        </div>

        {error && (
          <div className="w-full mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. WELCOME MODE (Initial screen shown in the reference image!) */}
        {mode === 'welcome' && (
          <div className="w-full space-y-3.5">
            <p className="text-sm text-slate-300 font-medium pb-2">
              Byenveni nan platfòm jwèt ak konpetisyon ofisyèl Ayiti a !
            </p>

            <button
              onClick={() => {
                setError('');
                setMode('register');
              }}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-950/40 text-base active:scale-[0.98]"
            >
              Kreye kont
            </button>

            <button
              onClick={() => {
                setError('');
                setMode('login');
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-950/40 text-base active:scale-[0.98]"
            >
              Konekte
            </button>

            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-[#0F172A] px-3 text-xs text-slate-500 font-medium">
                oswa
              </span>
            </div>

            <button
              onClick={handleGoogleClick}
              className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 text-sm active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Konekte ak Google</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('email_auth');
                }}
                className="py-2.5 px-3 bg-[#131B2E] hover:bg-[#1C2640] border border-slate-700/80 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Imèl & Modpas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setOtpConfirmation(null);
                  setSmsCode('');
                  setMode('phone_otp');
                }}
                className="py-2.5 px-3 bg-[#131B2E] hover:bg-[#1C2640] border border-slate-700/80 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Verifikasyon SMS</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="w-full space-y-3.5 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Kreye kont MASTER PLAY</h3>
              <p className="text-xs text-slate-400">Pran mwens pase 1 minit</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Non konplè</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean William"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nimewo telefòn</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+509 4012 3456"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kòd pèsonèl</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4 chif"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Konfime kòd la</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="4 chif"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 tracking-widest"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-950/40 text-sm active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'N ap kreye kont lan...' : 'Konfime e Kreye Kont'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Ou gen yon kont deja ? <span className="text-amber-400 font-bold">Konekte</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="w-full space-y-3.5 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Konekte sou kont ou</h3>
              <p className="text-xs text-slate-400">Antre nimewo telefòn ak kòd ou</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nimewo telefòn</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+509 4012 3456"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kòd pèsonèl (PIN)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Kòd ou"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-950/40 text-sm active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? 'Koneksyon ap fèt...' : 'Konekte Kounye a'}
            </button>

            <div className="text-center pt-2 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('register');
                }}
                className="text-xs text-slate-400 hover:text-white block w-full"
              >
                Ou poko gen kont ? <span className="text-amber-400 font-bold">Kreye kont</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('welcome')}
                className="text-xs text-slate-500 hover:text-slate-300 block w-full"
              >
                Retounen
              </button>
            </div>
          </form>
        )}

        {/* 4. GOOGLE ACCOUNT PICKER & PHONE CONFIRMATION */}
        {mode === 'google_phone' && !googleData && (
          <div className="w-full space-y-3.5 text-left">
            <div className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-lg font-bold text-white">Chwa Kont Google</h3>
              </div>
              <p className="text-xs text-slate-400">
                Chwazi yon kont pou kontinye sou MASTER PLAY
              </p>
            </div>

            {/* Account List */}
            <div className="space-y-2">
              {googleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectGoogleAccount(acc)}
                  disabled={loading}
                  className="w-full p-3 bg-[#131B2E] hover:bg-[#1C2640] border border-slate-700/80 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.photo}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full border border-slate-600 object-cover"
                    />
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                        {acc.name}
                      </div>
                      <div className="text-xs text-slate-400">{acc.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Custom Google Account Option */}
            {!showCustomGoogleInput ? (
              <button
                type="button"
                onClick={() => setShowCustomGoogleInput(true)}
                className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <span>+ Itilize yon lòt kont Google</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="antre.email@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-all"
                >
                  Kontinye ak Imèl sa a
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('welcome');
              }}
              className="text-xs text-slate-500 hover:text-slate-300 block w-full text-center pt-2"
            >
              Anile e Retounen
            </button>
          </div>
        )}

        {/* 5. GOOGLE PHONE LINK (When account is chosen but phone needs binding) */}
        {mode === 'google_phone' && googleData && (
          <form onSubmit={handleGoogleComplete} className="w-full space-y-3.5 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Konfime Nimewo Telefòn</h3>
              <p className="text-xs text-slate-400">
                Pou sekirite tranzaksyon NatCash ak konpetisyon yo
              </p>
            </div>

            <div className="p-3 bg-[#131B2E] rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={googleData.photo}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-slate-700"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">{googleData.name}</div>
                  <div className="text-slate-400">{googleData.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleData(null)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Chanje
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nimewo telefòn ou (Ayiti)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+509 4012 3456"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg text-sm active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'N ap finalize...' : 'Finalize Koneksyon Google'}
            </button>
          </form>
        )}

        {/* 6. FIREBASE EMAIL & PASSWORD AUTH */}
        {mode === 'email_auth' && (
          <form onSubmit={handleEmailAuthSubmit} className="w-full space-y-3 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Koneksyon Imèl & Modpas</h3>
              <p className="text-xs text-slate-400">Otantifikasyon Firebase sekirize</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0F19] border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setEmailAction('login');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  emailAction === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Konekte
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setEmailAction('register');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  emailAction === 'register' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kreye Kont
              </button>
            </div>

            {emailAction === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Non konplè</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean William"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Adrès Imèl</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="nonou@gmail.com"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {emailAction === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nimewo telefòn (opsyonèl)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+509 4012 3456"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Modpas (omwen 6 karaktè)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg text-sm active:scale-[0.98] disabled:opacity-50 mt-1"
            >
              {loading
                ? 'Koneksyon ap fèt...'
                : emailAction === 'register'
                  ? 'Kreye Kont ak Imèl'
                  : 'Konekte ak Imèl'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('welcome');
              }}
              className="text-xs text-slate-500 hover:text-slate-300 block w-full text-center pt-1"
            >
              Retounen
            </button>
          </form>
        )}

        {/* 7. FIREBASE PHONE SMS OTP AUTH */}
        {mode === 'phone_otp' && (
          <div className="w-full space-y-3 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Koneksyon pa SMS (OTP)</h3>
              <p className="text-xs text-slate-400">
                {otpConfirmation
                  ? 'Antre kòd 6 chif ou resevwa sou telefòn ou'
                  : 'Resevwa yon kòd sekirite dirèkteman pa SMS'}
              </p>
            </div>

            {!otpConfirmation ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Non konplè (si se nouvo kont)</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jean William"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nimewo telefòn (ak +509)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+509 4012 3456"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'N ap voye SMS la...' : 'Voye Kòd SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmPhoneOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kòd Verifikasyon SMS</label>
                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white tracking-widest focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg text-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Verifikasyon ap fèt...' : 'Verifye Kòd & Konekte'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearRecaptchaVerifier();
                    setOtpConfirmation(null);
                    setSmsCode('');
                    setError('');
                  }}
                  className="text-xs text-amber-400 hover:underline block w-full text-center"
                >
                  Chanje nimewo oswa revoye kòd
                </button>
              </form>
            )}

            <div id="firebase-recaptcha-container" />

            <button
              type="button"
              onClick={() => {
                clearRecaptchaVerifier();
                setOtpConfirmation(null);
                setError('');
                setMode('welcome');
              }}
              className="text-xs text-slate-500 hover:text-slate-300 block w-full text-center pt-1"
            >
              Retounen
            </button>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-5 text-[10px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Done ou yo an sekirite. Kòd sekrè pa janm pataje.</span>
        </div>
      </div>
    </div>
  );
};
