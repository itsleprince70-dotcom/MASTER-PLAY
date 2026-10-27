import React, { useState } from 'react';
import { MasterPlayLogo } from './MasterPlayLogo';
import { api } from '../services/api';
import { User } from '../types';
import { Lock, Phone, User as UserIcon, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'welcome' | 'login' | 'register' | 'google_phone';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'welcome',
}) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register' | 'google_phone'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [googleData, setGoogleData] = useState<{ email: string; name: string; photo: string } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const res = await api.register({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        pin,
      });

      if (res.success && res.user) {
        alert(res.message || 'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.');
        onSuccess(res.user);
      } else {
        setError(res.error || 'Erè pandan enskripsyon an.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè rezo pandan enskripsyon an.');
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
      const res = await api.login({
        phoneNumber: phoneNumber.trim(),
        pin,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Nimewo telefòn oswa kòd la pa kòrèk.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè rezo pandan koneksyon an.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Simulation
  const handleGoogleClick = () => {
    setError('');
    // Prompt Google authentication simulation
    const mockEmail = 'itilizate.google@gmail.com';
    const mockName = 'Nouvo Jwè Google';
    const mockPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    setGoogleData({ email: mockEmail, name: mockName, photo: mockPhoto });
    setFullName(mockName);
    setMode('google_phone');
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
      });

      if (res.success && res.user) {
        if (res.created) {
          alert(res.message || 'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.');
        }
        onSuccess(res.user);
      } else {
        setError(res.error || 'Erè pandan koneksyon Google la.');
      }
    } catch (err: any) {
      setError(err.message || 'Erè pandan koneksyon an.');
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

            {/* Quick Demo Login Shortcut */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2">Opsyon tès rapid:</div>
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber('+509 40128456');
                  setPin('1234');
                  setMode('login');
                }}
                className="text-xs text-amber-400 hover:underline font-semibold"
              >
                Konekte kòm Jean William (Demo)
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

        {/* 4. GOOGLE PHONE LINK */}
        {mode === 'google_phone' && (
          <form onSubmit={handleGoogleComplete} className="w-full space-y-3.5 text-left">
            <div className="text-center pb-1">
              <h3 className="text-lg font-bold text-white">Konfime Nimewo Telefòn</h3>
              <p className="text-xs text-slate-400">
                Pou sekirite tranzaksyon NatCash ak konpetisyon yo
              </p>
            </div>

            <div className="p-3 bg-[#131B2E] rounded-xl border border-slate-800 flex items-center gap-3">
              <img
                src={googleData?.photo}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-slate-700"
              />
              <div className="text-xs">
                <div className="font-bold text-white">{googleData?.name}</div>
                <div className="text-slate-400">{googleData?.email}</div>
              </div>
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

        {/* Footer Guarantee */}
        <div className="mt-5 text-[10px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Done ou yo an sekirite. Kòd sekrè pa janm pataje.</span>
        </div>
      </div>
    </div>
  );
};
