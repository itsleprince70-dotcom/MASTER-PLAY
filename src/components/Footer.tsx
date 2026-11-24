import React from 'react';
import { MasterPlayLogo } from './MasterPlayLogo';
import { TabType } from './Navigation';
import { Shield, Sparkles, Smartphone, Heart, MessageCircle, ExternalLink, Award, Trophy, Gamepad2 } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: TabType) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAdmin: () => void;
  onOpenAndroidApp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAdmin,
  onOpenAndroidApp,
}) => {
  return (
    <footer className="w-full bg-[#070A12] border-t border-slate-800/80 text-slate-300 mt-16 pt-12 pb-24 md:pb-12 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-slate-800/70">
          
          {/* Column 1: Brand & Presentation */}
          <div className="space-y-4">
            <div className="cursor-pointer" onClick={() => onSelectTab('akey')}>
              <MasterPlayLogo size="md" showTagline={true} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Premye platfòm ofisyèl an Ayiti pou jwèt entèaktif, tounwa ak konpetisyon nasyonal, tranzaksyon NatCash an tan reyèl ak defi ant jwè.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sèvè & Peman An Liy 24/7</span>
            </div>
          </div>

          {/* Column 2: Navigasyon Sit */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Navigasyon Sit</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onSelectTab('akey')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>Paj Akèy & Fil Piblikasyon</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('konpetisyon')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>Tout Konpetisyon Ofisyèl</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('jwet')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>Katalog Jwèt (Avion Crash, 11 Balon...)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('klasman')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>Klasman & Pi Bon Jwè</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('pwofil')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>→</span>
                  <span>Pwofil & Balans Kont</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Peman & Tranzaksyon NatCash */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Peman & NatCash</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={onOpenDeposit}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>💰</span>
                  <span>Depo NatCash Rapid (509 4098-7659)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenWithdraw}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <span>💳</span>
                  <span>Demann Retrè Lajan Sou Kont Ou</span>
                </button>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Bonis byenvini 50 HT otomatik pou chak nouvo kont ki kreye avèk siksè.
              </li>
              {onOpenAndroidApp && (
                <li className="pt-2">
                  <button
                    onClick={onOpenAndroidApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Telechaje pou Android / APK</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Sipò Kliyan & Sekirite */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Sipò & Kontak</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-400">
              <p>
                Pou nenpòt kesyon, validasyon depo oswa èd teknik, kontakte ekip sèvis kliyan nou an dirèkteman :
              </p>
              <a
                href="https://wa.me/50940987659?text=Bonjou%20ekip%20MASTER%20PLAY%2C%20mwen%20bezwen%20%C3%A8d%20sou%20sit%20la."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold transition-colors"
              >
                <span>💬</span>
                <span>WhatsApp: +509 4098-7659</span>
              </a>
              <div className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="text-[11px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  <span>Aksè Administratè</span>
                </button>
              </div>
              <div>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Politik Konfidansyalite (Privacy Policy)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Security Guarantee */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-300">MASTER PLAY & Kèkè Challenge</strong>. Tout dwa rezève.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Platfòm Sekirize</span>
            </span>
            <span>•</span>
            <span>Tranzaksyon Verifye</span>
            <span>•</span>
            <span>Ayiti 🇭🇹</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
