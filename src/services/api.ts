import { User, Competition, Post, Game, Transaction, NotificationItem, AuditLog } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async register(data: { fullName: string; phoneNumber: string; pin: string; profilePhoto?: string }): Promise<{ success: boolean; user: User; error?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: { phoneNumber: string; pin: string }): Promise<{ success: boolean; user: User; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async googleAuth(data: { email: string; fullName?: string; photo?: string; phoneNumber?: string; pin?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/google`, {
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
    return res.json();
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
    const res = await fetch(`${API_BASE}/users/${id}`);
    return res.json();
  },

  // Competitions
  async getCompetitions(): Promise<{ success: boolean; competitions: Competition[] }> {
    const res = await fetch(`${API_BASE}/competitions`);
    return res.json();
  },

  async registerCompetition(competitionId: string, userId: string): Promise<{ success: boolean; competition?: Competition; user?: User; error?: string; message?: string }> {
    const res = await fetch(`${API_BASE}/competitions/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId, userId }),
    });
    return res.json();
  },

  // Posts / Publications
  async getPosts(): Promise<{ success: boolean; posts: Post[] }> {
    const res = await fetch(`${API_BASE}/posts`);
    return res.json();
  },

  async toggleLike(postId: string, userId: string): Promise<{ success: boolean; likes: string[] }> {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
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
    return res.json();
  },

  // Games
  async getGames(): Promise<{ success: boolean; games: Game[] }> {
    const res = await fetch(`${API_BASE}/games`);
    return res.json();
  },

  async playGame(gameId: string, userId: string, score: number, wonPrize?: number): Promise<{ success: boolean; user: User; game: Game; error?: string }> {
    const res = await fetch(`${API_BASE}/games/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId, score, wonPrize }),
    });
    return res.json();
  },

  // Transactions
  async getUserTransactions(userId: string): Promise<{ success: boolean; transactions: Transaction[] }> {
    const res = await fetch(`${API_BASE}/transactions/user/${userId}`);
    return res.json();
  },

  async requestDeposit(data: { userId: string; natcashName: string; natcashPhone: string; amount: number; proofImage?: string }): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    const res = await fetch(`${API_BASE}/transactions/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async requestWithdrawal(data: { userId: string; recipientName: string; natcashPhone: string; amount: number }): Promise<{ success: boolean; transaction?: Transaction; user?: User; error?: string }> {
    const res = await fetch(`${API_BASE}/transactions/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(userId: string): Promise<{ success: boolean; notifications: NotificationItem[] }> {
    const res = await fetch(`${API_BASE}/notifications/${userId}`);
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
    return res.json();
  },

  async recordCompetitionScore(data: { competitionId: string; userId: string; gameId: string; score: number }): Promise<{ success: boolean; scores?: any[]; userScore?: any; competition?: Competition; error?: string }> {
    const res = await fetch(`${API_BASE}/competitions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
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
    return res.json();
  },

  async getCompetitionPlayedLevels(competitionId: string, userId: string, gameId: string): Promise<{
    success: boolean;
    dayKey?: string;
    playedLevels?: number[];
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/competitions/${competitionId}/played-levels/${userId}/${gameId}`);
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
    return res.json();
  },

  async createPost(data: any): Promise<{ success: boolean; post?: Post; error?: string }> {
    const res = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
    return res.json();
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
  }
};
