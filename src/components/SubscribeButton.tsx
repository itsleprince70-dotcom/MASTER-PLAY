import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Plus, Check, Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  targetUserId: string;
  targetUserName?: string;
  currentUser: User | null;
  onOpenAuth?: () => void;
  onSubscriptionChange?: (targetUserId: string, isSubscribed: boolean, newFollowersCount: number) => void;
  onUpdateCurrentUser?: (updatedUser: User) => void;
  initialIsSubscribed?: boolean;
  size?: 'sm' | 'md' | 'icon';
  className?: string;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
  targetUserId,
  targetUserName,
  currentUser,
  onOpenAuth,
  onSubscriptionChange,
  onUpdateCurrentUser,
  initialIsSubscribed,
  size = 'sm',
  className = '',
}) => {
  // Check if current user is already following target user
  const isFollowing = initialIsSubscribed !== undefined
    ? initialIsSubscribed
    : currentUser?.followingIds?.includes(targetUserId) || false;

  const [subscribed, setSubscribed] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  // If viewing one's own profile, do not show follow button
  if (currentUser?.id === targetUserId) {
    return null;
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setLoading(true);
    try {
      const res = await api.toggleSubscribeUser(currentUser.id, targetUserId);
      if (res.success && res.isSubscribed !== undefined) {
        setSubscribed(res.isSubscribed);

        if (res.currentUser && onUpdateCurrentUser) {
          onUpdateCurrentUser(res.currentUser);
        }

        if (onSubscriptionChange) {
          onSubscriptionChange(targetUserId, res.isSubscribed, res.followersCount || 0);
        }
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (size === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        title={subscribed ? `Ou abòne ak ${targetUserName || 'itilizatè sa a'} (Klike pou anile)` : `Abòne ak ${targetUserName || 'itilizatè sa a'}`}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all active:scale-90 shrink-0 ${
          subscribed
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md hover:scale-105'
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : subscribed ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : (
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 font-bold rounded-xl transition-all active:scale-95 shrink-0 ${
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
      } ${
        subscribed
          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : subscribed ? (
        <>
          <Check className="w-3 h-3 stroke-[3]" />
          <span>Deja abòne</span>
        </>
      ) : (
        <>
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>Abòne</span>
        </>
      )}
    </button>
  );
};
