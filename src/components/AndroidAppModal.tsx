import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  X,
  FileCode2,
  Sparkles
} from 'lucide-react';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'studio'>('pwa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText('android');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Aplikasyon Android</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  OFISYÈL
                </span>
              </h2>
              <p className="text-xs text-slate-400">MASTER PLAY & Kèkè Challenge sou telefòn ou</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pwa'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Enstale sou Telefòn (1 Klik)</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Android Studio (APK)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'pwa' ? (
            /* TAB 1: 1-Click Install */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/20 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-amber-500/40 p-2 shrink-0 flex items-center justify-center shadow-lg">
                  <img src="/icon.svg" alt="Master Play" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">MASTER PLAY App</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enstale l dirèkteman sou ekran lakay telefòn ou san w pa bezwen pase pa Play Store.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                      v1.0.0
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Pwoteje & Sekirize
                    </span>
                  </div>
                </div>
              </div>

              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Aplikasyon an deja enstale !</div>
                    <div className="text-[11px] text-emerald-400/80 mt-0.5">
                      Ou deja ap itilize vèsyon aplikasyon an sou telefòn ou.
                    </div>
                  </div>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={install}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Enstale sou Android Kounye a</span>
                </button>
              ) : isIOS ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    Enstriksyon pou iPhone / iPad (Safari):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>Peze bouton <strong>Pataje (Share)</strong> ki anba nan Safari.</li>
                    <li>Desann epi chwazi <strong>« Ajoute sou ekran lakay » (Add to Home Screen)</strong>.</li>
                    <li>Peze <strong>Ajoute</strong> anwo a dwat.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Kijan pou w enstale l sou Chrome Android:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                    <li>Peze <strong>3 ti pwen yo (⋮)</strong> ki anwo a dwat nan navigatè Google Chrome sou telefòn ou.</li>
                    <li>Chwazi <strong>« Enstale aplikasyon an »</strong> oswa <strong>« Ajoute sou ekran lakay »</strong>.</li>
                    <li>Ikon MASTER PLAY ap parèt sou ekran prensipal telefòn ou menm jan ak nenpòt lòt aplikasyon !</li>
                  </ol>
                </div>
              )}

              {/* Features list */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                  <span className="font-bold text-white block">⚡ Rapidite Maksimòm</span>
                  <span className="text-slate-400">Ouvri san ba navigatè Chrome</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                  <span className="font-bold text-white block">🔔 Notifikasyon</span>
                  <span className="text-slate-400">Resevwa rezilta konpetisyon ak depo</span>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: Android Studio Project */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Pwojè Android Studio Entegre
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                    Kotlin + Gradle 8.3
                  </span>
                </div>
                <div className="font-mono text-xs text-amber-400 font-bold">
                  com.masterplay.kekechallenge
                </div>
                <p className="text-[11px] text-slate-400">
                  Tout kòd sous pwojè Android Studio a disponib dirèkteman nan dosye <strong>/android</strong> nan pwojè sa a.
                </p>
              </div>

              {/* Instructions steps */}
              <div className="space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Etap pou ouvri l epi kreye APK nan Android Studio:
                </h4>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                    <strong className="text-amber-400">1. Ouvri Android Studio</strong>
                    <p className="text-slate-300 mt-0.5">
                      Klike sou <strong>File &gt; Open</strong> epi chwazi dosye <strong>`android`</strong> nan pwojè sa a.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                    <strong className="text-amber-400">2. Senkronize Gradle</strong>
                    <p className="text-slate-300 mt-0.5">
                      Android Studio ap telechaje depandans yo otomatikman (SDK 34, AndroidX, WebKit).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                    <strong className="text-amber-400">3. Kreye Fichye APK a</strong>
                    <p className="text-slate-300 mt-0.5">
                      Klike sou <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. Lè li fini, klike sou <strong>locate</strong> pou jwenn <strong>`app-debug.apk`</strong> !
                    </p>
                  </div>
                </div>
              </div>

              {/* Project path copy */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex-1 font-mono text-[11px] text-slate-300 truncate">
                  Dosye pwojè a: <span className="text-amber-400 font-bold">android/</span>
                </div>
                <button
                  onClick={handleCopyPath}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kopye !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopye Chemen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Fèmen
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidAppModal;
