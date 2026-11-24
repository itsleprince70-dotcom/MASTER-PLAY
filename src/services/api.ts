import { User, Competition, Post, Game, Transaction, NotificationItem, AuditLog, GiftItem } from '../types';
import {
  syncUserProfileToFirestore,
  syncPostToFirestore,
  syncGameScoreToFirestore,
  syncGameProgressToFirestore,
  syncTransactionToFirestore,
  syncPostLikeToFirestore,
  syncPostCommentToFirestore,
  syncFollowToFirestore,
  syncCompetitionParticipationToFirestore,
  syncCompetitionToFirestore,
  syncGameToFirestore,
} from './firebaseSync';
import { auth } from '../firebase';

const API_BASE = '/api';

export const api = {
  // Auth
  async register(data: { firstName?: string; lastName?: string; fullName: string; phoneNumber: string; pin: string; profilePhoto?: string; firebaseUid?: string }): Promise<{ success: boolean; user: User; error?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: { phoneNumber: string; pin: string; firebaseUid?: string }): Promise<{ success: boolean; user: User; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async googleAuth(data: { email: string; fullName?: string; photo?: string; phoneNumber?: string; pin?: string; googleId?: string; firebaseUid?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async syncFromFirebase(data: {
    firebaseUid: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    profilePhoto?: string;
    balance?: number;
    reservedBalance?: number;
    level?: number;
    points?: number;
    stars?: number;
    masterPlayId?: string;
    certificationStatus?: 'non_sètifye' | 'sètifye';
    verified?: boolean;
  }): Promise<{ success: boolean; user?: User; restored?: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/sync-from-firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateProfile(data: { userId: string; fullName?: string; profilePhoto?: string }): Promise<{ success: boolean; user: User; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  async changePin(data: { userId: string; oldPin: string; newPin: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/change-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getUser(id: string): Promise<{ success: boolean; user: User; error?: string }> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`);
    return res.json();
  },

  // Competitions
  async getCompetitions(): Promise<{ success: boolean; competitions: Competition[] }> {
    const res = await fetch(`${API_BASE}/competitions`);
    return res.json();
  },

  async registerCompetition(competitionId: string, userId: string): Promise<{ success: boolean; competition?: Competition; user?: User; error?: string; message?: string; alreadyRegistered?: boolean }> {
    const res = await fetch(`${API_BASE}/competitions/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId, userId }),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
      syncCompetitionParticipationToFirestore(competitionId, json.user, 0).catch(() => {});
    }
    return json;
  },

  // Posts / Publications
  async getPosts(): Promise<{ success: boolean; posts: Post[] }> {
    const res = await fetch(`${API_BASE}/posts`);
    return res.json();
  },

  async getFeaturedMatches(): Promise<{ success: boolean; matches: any[] }> {
    const res = await fetch(`${API_BASE}/matches/home-featured`);
    return res.json();
  },

  async createPost(data: {
    userId?: string;
    title: string;
    description: string;
    mediaType?: 'text' | 'image' | 'video' | 'none';
    mediaUrl?: string;
    mediaUrls?: string[];
    videoUrl?: string;
    tiktokUrl?: string;
    pinned?: boolean;
  }): Promise<{ success: boolean; post?: Post; error?: string }> {
    const endpoint = data.userId ? `${API_BASE}/posts/create` : `${API_BASE}/admin/posts`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.post) {
      syncPostToFirestore(json.post).catch(() => {});
    }
    return json;
  },

  async canUserPostToday(userId: string): Promise<{ success: boolean; canPost: boolean; alreadyPostedToday?: boolean; lastPost?: any; today?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/posts/can-post/${encodeURIComponent(userId)}`);
    return res.json();
  },

  async toggleLike(postId: string, userId: string): Promise<{ success: boolean; likes: string[] }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (json?.success && Array.isArray(json.likes)) {
      const liked = json.likes.includes(userId);
      syncPostLikeToFirestore(postId, liked, json.likes.length).catch(() => {});
    }
    return json;
  },

  async toggleFavorite(postId: string, userId: string): Promise<{ success: boolean; isFavorite: boolean; favorites?: string[]; error?: string }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async addComment(postId: string, userId: string, text: string): Promise<{ success: boolean; comments: any[] }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text }),
    });
    const json = await res.json();
    if (json?.success && Array.isArray(json.comments) && json.comments.length > 0) {
      const latest = json.comments[json.comments.length - 1];
      syncPostCommentToFirestore(
        postId,
        {
          id: latest.id,
          authorName: latest.userName || latest.authorName || auth.currentUser?.displayName || 'Jwè MASTER PLAY',
          text: latest.text || text,
        },
        json.comments.length
      ).catch(() => {});
    }
    return json;
  },

  async toggleFollow(targetUserId: string, currentUserId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; followingCount: number; error?: string }> {
    const res = await fetch(`${API_BASE}/users/${targetUserId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId }),
    });
    const json = await res.json();
    if (json?.success) {
      syncFollowToFirestore(targetUserId, Boolean(json.isFollowing)).catch(() => {});
    }
    return json;
  },

  async getUserProfile(userId: string, currentUserId?: string): Promise<{ success: boolean; user?: User; posts?: Post[]; isFollowing?: boolean; followersCount?: number; followingCount?: number; error?: string }> {
    const encodedId = encodeURIComponent(userId);
    const url = currentUserId
      ? `${API_BASE}/users/${encodedId}/profile?currentUserId=${encodeURIComponent(currentUserId)}`
      : `${API_BASE}/users/${encodedId}/profile`;
    const res = await fetch(url);
    return res.json();
  },

  // Games
  async getGames(): Promise<{ success: boolean; games: Game[] }> {
    const res = await fetch(`${API_BASE}/games`);
    return res.json();
  },

  async payGameEntry(gameId: string, userId: string): Promise<{ success: boolean; user?: User; game?: Game; feePaid?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/games/pay-entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId }),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
      syncGameProgressToFirestore({ gameId, sessionPaid: true }).catch(() => {});
    }
    return json;
  },

  async playGame(gameId: string, userId: string, score: number, wonPrize?: number, skipFee: boolean = false): Promise<{ success: boolean; user: User; game: Game; error?: string }> {
    const res = await fetch(`${API_BASE}/games/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, score, wonPrize, skipFee }),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
      syncGameScoreToFirestore({
        userName: json.user.fullName || json.user.username || 'Jwè MASTER PLAY',
        gameId,
        score,
        pointsEarned: score,
      }).catch(() => {});
    }
    return json;
  },

  // Transactions
  async getUserTransactions(userId: string): Promise<{ success: boolean; transactions: Transaction[] }> {
    const res = await fetch(`${API_BASE}/transactions/user/${encodeURIComponent(userId)}`);
    return res.json();
  },

  async requestDeposit(data: { userId: string; natcashName: string; natcashPhone: string; amount: number; proofImage?: string }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    const res = await fetch(`${API_BASE}/transactions/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.transaction) {
      syncTransactionToFirestore(json.transaction).catch(() => {});
    }
    return json;
  },

  async requestWithdrawal(data: { userId: string; recipientName: string; natcashPhone: string; amount: number }): Promise<{ success: boolean; transaction?: Transaction; user?: User; error?: string }> {
    const res = await fetch(`${API_BASE}/transactions/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.transaction) {
      syncTransactionToFirestore(json.transaction).catch(() => {});
      if (json.user) syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  // Notifications
  async getNotifications(userId: string): Promise<{ success: boolean; notifications: NotificationItem[] }> {
    const res = await fetch(`${API_BASE}/notifications/${encodeURIComponent(userId)}`);
    return res.json();
  },

  async markNotificationRead(notificationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
    return res.json();
  },

  // Admin
  async verifyAdminPin(pin: string): Promise<{ success: boolean; authorized?: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  },

  async changeAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/change-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    });
    return res.json();
  },

  async getAdminOverview(): Promise<{
    success: boolean;
    stats: any;
    users: User[];
    transactions: Transaction[];
    competitions: Competition[];
    posts: Post[];
    games: Game[];
    auditLogs: AuditLog[];
    dailyLevelRecords?: any[];
  }> {
    const res = await fetch(`${API_BASE}/admin/overview`);
    return res.json();
  },

  async reviewTransaction(data: { transactionId: string; status: 'konfime' | 'refize'; rejectReason?: string }): Promise<{ success: boolean; transaction?: Transaction; userBalance?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/transactions/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async saveCompetition(data: any): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.competition) {
      syncCompetitionToFirestore(json.competition).catch(() => {});
    }
    return json;
  },

  async recordCompetitionScore(data: { competitionId: string; userId: string; gameId: string; score: number }): Promise<{ success: boolean; scores?: any[]; userScore?: any; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/competitions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success) {
      syncGameScoreToFirestore({
        userName: json.userScore?.fullName || auth.currentUser?.displayName || 'Jwè MASTER PLAY',
        gameId: data.gameId,
        competitionId: data.competitionId,
        score: data.score,
        pointsEarned: data.score,
      }).catch(() => {});
    }
    return json;
  },

  async recordCompetitionLevelScore(data: {
    competitionId: string;
    userId: string;
    gameId: string;
    level: number;
    score: number;
  }): Promise<{
    success: boolean;
    message?: string;
    pointsAwarded?: number;
    userScore?: any;
    competition?: Competition;
    playedLevelsToday?: number[];
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/competitions/score-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success) {
      syncGameScoreToFirestore({
        userName: json.userScore?.fullName || auth.currentUser?.displayName || 'Jwè MASTER PLAY',
        gameId: data.gameId,
        competitionId: data.competitionId,
        score: data.score,
        pointsEarned: json.pointsAwarded || data.score,
      }).catch(() => {});
    }
    return json;
  },

  async getCompetitionPlayedLevels(competitionId: string, userId: string, gameId: string): Promise<{
    success: boolean;
    dayKey?: string;
    playedLevels?: number[];
    playedGameIds?: string[];
    gamesRecordCount?: { [gameId: string]: number };
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/competitions/${competitionId}/played-levels/${userId}/${gameId}`);
    return res.json();
  },

  async getCompetitionScoreRecords(): Promise<{ success: boolean; records: any[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competition-score-records`);
    return res.json();
  },

  async setCompetitionResults(competitionId: string, winners: any): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winners }),
    });
    return res.json();
  },

  async updateCompetitionGames(competitionId: string, authorizedGameIds: string[]): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizedGameIds }),
    });
    return res.json();
  },

  async updateCompetitionPricingPrizes(
    competitionId: string,
    data: { entryFee: number; firstPrize: string; secondPrize: string; thirdPrize: string }
  ): Promise<{ success: boolean; competition?: Competition; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/pricing-prizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async verifyUserInDB(userId: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/verify-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async deleteCompetition(competitionId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async deleteCompetitionMatch(competitionId: string, matchId: string): Promise<{ success: boolean; competition?: Competition; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/matches/${matchId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async resetCompetitionLeaderboard(competitionId: string): Promise<{ success: boolean; competition?: Competition; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/reset-leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async payCompetitionPrize(competitionId: string, place: 'first' | 'second' | 'third'): Promise<{
    success: boolean;
    competition?: Competition;
    user?: User;
    amount?: number;
    place?: string;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/pay-prize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place }),
    });
    return res.json();
  },

  async advanceCompetitionDay(competitionId: string, day: string): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/advance-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day }),
    });
    return res.json();
  },

  async qualifyTop8(competitionId: string, chosenGameId?: string): Promise<{ success: boolean; competition?: Competition; matches?: any[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/qualify-top8`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosenGameId }),
    });
    return res.json();
  },

  async submitMatchResult(competitionId: string, data: { matchId: string; score1: number; score2: number; winnerId?: string; chosenNextGameId?: string; status?: string }): Promise<{ success: boolean; match?: any; matches?: any[]; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/match-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async verifyMatch(competitionId: string, data: { matchId: string; score1?: number; score2?: number; winnerId?: string; status?: string; auditNote?: string }): Promise<{ success: boolean; match?: any; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/match-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateGamePrice(data: { gameId?: string; entryFee: number; isActive?: boolean; title?: string; category?: string; description?: string; icon?: string; isNew?: boolean }): Promise<{ success: boolean; game?: Game; games?: Game[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/games/price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.game) {
      syncGameToFirestore(json.game).catch(() => {});
    }
    return json;
  },

  async adminCreatePost(data: any): Promise<{ success: boolean; post?: Post; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.post) {
      syncPostToFirestore(json.post).catch(() => {});
    }
    return json;
  },

  async editPost(id: string, data: any): Promise<{ success: boolean; post?: Post; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async toggleGame(data: { gameId: string; isActive?: boolean; entryFee?: number }): Promise<{ success: boolean; game?: Game; games?: Game[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/games/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async broadcastNotification(data: { title: string; message: string; type?: string }): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async adjustUserBalance(data: { userId: string; amount: number; reason?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/users/adjust-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Gifts (Boutik Kado)
  async getGifts(): Promise<{ success: boolean; gifts: any[]; transactions?: any[] }> {
    const res = await fetch(`${API_BASE}/gifts`);
    return res.json();
  },

  async sendGift(data: { senderId: string; receiverId: string; giftId: string; competitionId?: string; matchId?: string }): Promise<{ success: boolean; user?: User; transaction?: any; error?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  async adminSaveGift(data: { id?: string; name: string; icon: string; description?: string; price: number; isActive: boolean }): Promise<{ success: boolean; gift?: any; gifts?: any[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/gifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Votes (Vòt ant de jwè)
  async votePlayer(data: { voterId: string; competitionId: string; matchId: string; playerId: string }): Promise<{ success: boolean; user?: User; match?: any; votesCount?: number; error?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/competitions/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  async toggleVoting(competitionId: string, data: { matchId?: string; votingEnabled: boolean; votePrice?: number }): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/toggle-voting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async createCompetitionMatch(competitionId: string, matchData: any): Promise<{ success: boolean; competition?: Competition; match?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/create-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData),
    });
    return res.json();
  },

  async updateCompetitionStatus(competitionId: string, status: string): Promise<{ success: boolean; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/competitions/${competitionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getAdminFinance(): Promise<{ success: boolean; finance?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/finance`);
    return res.json();
  },

  // 11 Balon (7 Nivo) API
  async getBalonProgress(userId: string): Promise<{ success: boolean; progress?: any; config?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/games/11balon/progress/${userId}`);
    return res.json();
  },

  async submitBalonLevel(data: {
    userId: string;
    level: number;
    chosenBallIndex: number;
  }): Promise<{
    success: boolean;
    won?: boolean;
    pointsEarned?: number;
    winningBallIndex?: number;
    chosenBallIndex?: number;
    progress?: any;
    userBalance?: number;
    userPoints?: number;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/games/11balon/play-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.progress) {
      syncGameProgressToFirestore({
        gameId: 'game_11balon',
        currentLevel: json.progress.currentLevel,
        highScore: json.progress.totalPoints,
        totalPoints: json.progress.totalPoints,
        completedLevelsCount: Array.isArray(json.progress.completedLevels) ? json.progress.completedLevels.length : 0,
        sessionPaid: Boolean(json.progress.sessionPaid),
      }).catch(() => {});
      if (json.won) {
        syncGameScoreToFirestore({
          userName: auth.currentUser?.displayName || 'Jwè MASTER PLAY',
          gameId: 'game_11balon',
          score: json.pointsEarned || 100,
          pointsEarned: json.pointsEarned || 100,
        }).catch(() => {});
      }
    }
    return json;
  },

  async resetBalonSession(userId: string): Promise<{ success: boolean; progress?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/games/11balon/reset-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async getBalonAdminStats(): Promise<{ success: boolean; stats?: any; config?: any; game?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/11balon/stats`);
    return res.json();
  },

  async updateBalonConfig(data: {
    pointsPerWin?: number;
    isActive?: boolean;
    entryFee?: number;
  }): Promise<{ success: boolean; config?: any; game?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/11balon/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // User Search & Subscriptions (Requirements 5 & 6)
  async searchUsers(query: string, currentUserId?: string): Promise<{ success: boolean; users: User[]; error?: string }> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (currentUserId) params.append('currentUserId', currentUserId);
    const res = await fetch(`${API_BASE}/users/search?${params.toString()}`);
    return res.json();
  },

  async toggleSubscribeUser(subscriberId: string, targetUserId: string): Promise<{
    success: boolean;
    isSubscribed?: boolean;
    followersCount?: number;
    targetUser?: User;
    currentUser?: User;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/users/toggle-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriberId, targetUserId }),
    });
    const json = await res.json();
    if (json?.success) {
      syncFollowToFirestore(targetUserId, Boolean(json.isSubscribed)).catch(() => {});
      if (json.currentUser) syncUserProfileToFirestore(json.currentUser).catch(() => {});
    }
    return json;
  },

  // Submit score for Competition Game (Requirements 1, 2, 4)
  async submitCompetitionScore(
    dataOrCompId: { competitionId: string; userId: string; gameId: string; score: number } | string,
    userId?: string,
    score?: number,
    gameId?: string
  ): Promise<{ success: boolean; scores?: any[]; userScore?: any; competition?: Competition; error?: string }> {
    const payload = typeof dataOrCompId === 'object'
      ? dataOrCompId
      : { competitionId: dataOrCompId, userId: userId!, score: score!, gameId: gameId! };

    const res = await fetch(`${API_BASE}/competitions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json?.success) {
      syncGameScoreToFirestore({
        userName: json.userScore?.fullName || auth.currentUser?.displayName || 'Jwè MASTER PLAY',
        gameId: payload.gameId,
        competitionId: payload.competitionId,
        score: payload.score,
        pointsEarned: payload.score,
      }).catch(() => {});
    }
    return json;
  },

  // Generic 7-Level Game Progress & Payments (Supports Competition Bypass)
  async getGameProgress(gameId: string, userId: string, competitionId?: string): Promise<{ success: boolean; progress?: any; game?: any; coveredByCompetition?: boolean; error?: string }> {
    const params = new URLSearchParams();
    if (competitionId) params.append('competitionId', competitionId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/games/progress/${gameId}/${userId}${qs}`);
    return res.json();
  },

  async saveGameProgress(data: {
    gameId: string;
    userId: string;
    level: number;
    won: boolean;
    score: number;
    pointsEarned?: number;
    stats?: any;
    competitionId?: string;
  }): Promise<{ success: boolean; progress?: any; user?: any; game?: any; competition?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/games/progress/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success) {
      if (json.user) syncUserProfileToFirestore(json.user).catch(() => {});
      if (json.progress) {
        syncGameProgressToFirestore({
          gameId: data.gameId,
          currentLevel: json.progress.currentLevel,
          highScore: json.progress.highScore,
          totalPoints: json.progress.totalPoints,
          completedLevelsCount: Array.isArray(json.progress.completedLevels) ? json.progress.completedLevels.length : 0,
          sessionPaid: Boolean(json.progress.sessionPaid),
        }).catch(() => {});
      }
      syncGameScoreToFirestore({
        userName: json.user?.fullName || auth.currentUser?.displayName || 'Jwè MASTER PLAY',
        gameId: data.gameId,
        competitionId: data.competitionId,
        score: data.score,
        pointsEarned: data.pointsEarned || data.score,
      }).catch(() => {});
    }
    return json;
  },

  async payGameSession(gameId: string, userId: string, competitionId?: string): Promise<{
    success: boolean;
    user?: any;
    progress?: any;
    coveredByCompetition?: boolean;
    error?: string;
    needDeposit?: boolean;
  }> {
    const res = await fetch(`${API_BASE}/games/progress/pay-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, competitionId }),
    });
    const json = await res.json();
    if (json?.success) {
      if (json.user) syncUserProfileToFirestore(json.user).catch(() => {});
      syncGameProgressToFirestore({
        gameId,
        currentLevel: json.progress?.currentLevel || 1,
        highScore: json.progress?.highScore || 0,
        totalPoints: json.progress?.totalPoints || 0,
        sessionPaid: true,
      }).catch(() => {});
    }
    return json;
  },

  async getGameAdminStats(gameId: string): Promise<{ success: boolean; game?: any; stats?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/games/stats/${gameId}`);
    return res.json();
  },

  async updateGameDetails(data: {
    gameId: string;
    title?: string;
    description?: string;
    rules?: string;
    entryFee?: number;
    isActive?: boolean;
    levelsCount?: number;
  }): Promise<{ success: boolean; game?: any; games?: any[]; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/games/update-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json?.success && json?.game) {
      syncGameToFirestore(json.game).catch(() => {});
    }
    return json;
  },

  // Avion Crash Real Money API
  async getAvionCrashConfig(): Promise<{ success: boolean; config: any; error?: string }> {
    const res = await fetch(`${API_BASE}/avion-crash/config`);
    return res.json();
  },

  async getAvionCrashHistory(userId?: string): Promise<{ success: boolean; recentMultipliers: any[]; userRounds: any[]; error?: string }> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${API_BASE}/avion-crash/history${query}`);
    return res.json();
  },

  async getActiveAvionCrashRound(userId: string): Promise<{
    success: boolean;
    activeRound?: any;
    hasCrashed?: boolean;
    elapsedSec?: number;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/avion-crash/active-round/${userId}`);
    return res.json();
  },

  async placeAvionCrashBet(userId: string, betAmount: number): Promise<{
    success: boolean;
    roundId?: string;
    betAmount?: number;
    crashMultiplier?: number;
    obstacleType?: string;
    newBalance?: number;
    startTime?: string;
    seedHash?: string;
    user?: User;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/avion-crash/place-bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, betAmount }),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  async cashoutAvionCrash(roundId: string, userId: string, requestedMultiplier: number): Promise<{
    success: boolean;
    cashedOut?: boolean;
    multiplier?: number;
    payout?: number;
    netProfit?: number;
    newBalance?: number;
    user?: User;
    crashed?: boolean;
    crashMultiplier?: number;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/avion-crash/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, userId, requestedMultiplier }),
    });
    const json = await res.json();
    if (json?.success && json?.user) {
      syncUserProfileToFirestore(json.user).catch(() => {});
    }
    return json;
  },

  async notifyAvionCrash(roundId: string, userId: string): Promise<{
    success: boolean;
    crashMultiplier?: number;
    obstacleType?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/avion-crash/crash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, userId }),
    });
    return res.json();
  },

  async getAvionCrashAdminStats(): Promise<{
    success: boolean;
    config: any;
    stats: any;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/avion-crash/admin/stats`);
    return res.json();
  },

  async updateAvionCrashAdminConfig(data: {
    isActive?: boolean;
    isMaintenance?: boolean;
    minBet?: number;
    maxBet?: number;
  }): Promise<{ success: boolean; config?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/avion-crash/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Monetization (Sections 7, 8, 9, 10, 11, 12)
  async getMonetizationStatus(userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/monetization/status/${userId}`);
    return res.json();
  },

  async requestMonetization(userId: string): Promise<{ success: boolean; message?: string; monetizationStatus?: string; activationFee?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/monetization/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async activateMonetization(userId: string): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/monetization/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  async transferEarningsToBalance(userId: string, amount: number): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/monetization/transfer-to-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    return res.json();
  },

  async getAdminMonetization(): Promise<{ success: boolean; config: any; creators: any[]; totalCreatorsCount: number; totalMonetizedCount: number; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/monetization`);
    return res.json();
  },

  async updateAdminMonetizationConfig(config: any): Promise<{ success: boolean; config?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/monetization/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async toggleUserMonetization(userId: string, data: { status?: string; isMonetized?: boolean }): Promise<{ success: boolean; user?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/monetization/users/${userId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async payoutUserMonetization(userId: string, data: { amount: number; adminPin: string }): Promise<{ success: boolean; user?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/monetization/users/${userId}/payout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Algorithm Intelligence
  async getAlgorithmIntelligence(): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/algorithm-intelligence`);
    return res.json();
  },

  async reviewAlgorithmApproval(id: string, data: { action: 'approve' | 'reject'; adminPin: string; reviewNotes?: string }): Promise<{ success: boolean; item?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/algorithm-approvals/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async cleanFakeAccounts(adminPin: string): Promise<{ success: boolean; message?: string; removedCount?: number; sanitizedFollowersCount?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/clean-fake-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin }),
    });
    return res.json();
  },

  async subscribePush(userId: string, subscription: any): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription }),
    });
    return res.json();
  },

  async followUser(targetUserId: string, currentUserId: string): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; followingCount: number; error?: string }> {
    return this.toggleFollow(targetUserId, currentUserId);
  },

  async verifyAdminSession(userId: string, adminToken: string): Promise<{ success: boolean; authorized: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminToken }),
    });
    return res.json();
  },

  async getUserCertification(userId: string): Promise<{ success: boolean; verified?: boolean; certificationStatus?: 'non_sètifye' | 'sètifye'; certifiedAt?: string; certifiedBy?: string; user?: User; error?: string }> {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(userId)}/certification`);
    return res.json();
  },

  async certifyUser(userId: string, adminId?: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/certify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminId }),
    });
    return res.json();
  },

  async uncertifyUser(userId: string, adminId?: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/uncertify-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminId }),
    });
    return res.json();
  },

  async syncMemoryEvent(data: { userId: string; clientMutationId?: string; actionType: string; pageOrFeature: string; data?: Record<string, any> }): Promise<{ success: boolean; alreadyProcessed?: boolean; dataVersion?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/memory/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMemoryUserSnapshot(userId: string): Promise<{ success: boolean; user?: User; events?: any[]; dataVersion?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/memory/user/${userId}`);
    return res.json();
  },

  async getAdminMemoryOverview(): Promise<{ success: boolean; overview?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/memory-overview`);
    return res.json();
  },

  async createAdminMemoryBackup(adminId?: string): Promise<{ success: boolean; snapshot?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/memory-backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    return res.json();
  },

  async restoreAdminMemoryBackup(fileName: string, adminId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/memory-restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, confirmRestore: true, adminId }),
    });
    return res.json();
  }
};

