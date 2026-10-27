import React from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { Bell, X, Check, ArrowDownRight, ArrowUpRight, Trophy, Sparkles, MessageCircle } from 'lucide-react';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'depo':
        return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
      case 'retre':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'konpetisyon':
        return <Trophy className="w-4 h-4 text-blue-400" />;
      case 'rezilta':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'anons':
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 bg-[#131B2E] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Sant Notifikasyon</h3>
              <p className="text-[11px] text-slate-400">Tranzaksyon, konpetisyon ak anons ofisyèl</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Ou pa gen okenn notifikasyon pou kounye a.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-[#0B0F19] border-slate-800/80 opacity-75'
                    : 'bg-[#131B2E] border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotifIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block">
                      {new Date(item.createdAt).toLocaleDateString('ht-HT', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom WhatsApp bar */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F19]">
          <WhatsAppSupportButton type="sipò" />
        </div>
      </div>
    </div>
  );
};
