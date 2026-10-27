import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppSupportButtonProps {
  referenceId?: string;
  type?: 'depo' | 'retre' | 'sipò' | 'konpetisyon';
  customMessage?: string;
  className?: string;
  variant?: 'floating' | 'button' | 'compact';
}

export const WhatsAppSupportButton: React.FC<WhatsAppSupportButtonProps> = ({
  referenceId,
  type = 'sipò',
  customMessage,
  className = '',
  variant = 'button',
}) => {
  const phone = '50940987659';

  let defaultMsg = `Bonjou Sipò MASTER PLAY / Kèkè Challenge,`;
  if (type === 'depo' && referenceId) {
    defaultMsg = `Bonjou Admin MATHURIN KERLINDGE, mwen sot fè yon depo NatCash. Referans mwen se: ${referenceId}. Tanpri verifye l pou mwen sou nimewo +509 40987659.`;
  } else if (type === 'retre' && referenceId) {
    defaultMsg = `Bonjou Admin, mwen gen yon demann retrè NatCash an atant. Referans mwen se: ${referenceId}.`;
  } else if (type === 'konpetisyon' && referenceId) {
    defaultMsg = `Bonjou, mwen bezwen asistans pou konpetisyon ${referenceId} nan MASTER PLAY.`;
  } else if (customMessage) {
    defaultMsg = customMessage;
  } else {
    defaultMsg = `Bonjou Sipò MASTER PLAY, mwen bezwen yon enfòmasyon sou aplikasyon an.`;
  }

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMsg)}`;

  if (variant === 'floating') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-20 right-4 md:right-8 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-2xl shadow-green-500/30 transition-transform active:scale-95 group border border-white/20 ${className}`}
        aria-label="Sipò WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white text-white" />
        <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">
          WhatsApp +509 40987659
        </span>
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center p-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 transition-colors ${className}`}
        title="Kontakte sipò sou WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-current" />
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-4 py-3 rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-[0.98] ${className}`}
    >
      <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
      <span className="text-sm">Kontakte nou sou WhatsApp (+509 40987659)</span>
    </a>
  );
};
