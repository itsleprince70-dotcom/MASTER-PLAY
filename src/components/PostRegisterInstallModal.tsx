import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface PostRegisterInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostRegisterInstallModal: React.FC<PostRegisterInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('pwa_post_register_dismissed', 'true');
    } catch (e) {
      // ignore storage errors
    }
    onClose();
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
          try {
            localStorage.setItem('pwa_post_register_dismissed', 'true');
          } catch (e) {}
          setTimeout(() => onClose(), 1500);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else if (isIOS) {
      // iOS guides user
    } else {
      // Fallback for browsers
      setInstalled(true);
      setTimeout(() => onClose(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors"
          aria-label="Fèmen"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          <Smartphone className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Eksperyans Mobile Konplè</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
            Enstale Master Play sou telefòn ou pou jwenn pi bon eksperyans
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Aksè dirèk san pase nan navigatè, notifikasyon enstantane sou match, vòt ak kado NatCash.
          </p>
        </div>

        {/* Device specific help */}
        {isIOS ? (
          <div className="w-full bg-[#131B2E] border border-slate-700/80 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <Share className="w-4 h-4 text-blue-400" />
              <span>Pou iPhone / iPad (Safari) :</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li>
                Peze bouton <strong className="text-white">Pataje (Share)</strong> anba nan Safari.
              </li>
              <li>
                Chwazi <strong className="text-amber-400">"Ajoute sou Ekran Akèy la" (Add to Home Screen)</strong>.
              </li>
              <li>Peze <strong className="text-white">Ajoute</strong> pou fini enstalasyon an.</li>
            </ol>
          </div>
        ) : (
          <div className="w-full bg-[#131B2E] border border-slate-700/80 rounded-2xl p-3.5 mb-6 text-left flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Konpatib Android & iOS :</span> Rapid, sekirize, epi pa pran espas nan memwa.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {installed ? (
            <div className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Aplikasyon an enstale avèk siksè !</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-950/40 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Enstale App la</span>
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 font-semibold rounded-2xl transition-all text-xs active:scale-[0.98]"
          >
            Pa kounye a
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Aplikasyon ofisyèl MASTER PLAY</span>
        </div>
      </div>
    </div>
  );
};
