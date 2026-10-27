export interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePhoto: string;
  balance: number;
  reservedBalance?: number;
  level: number;
  stars?: number;
  points?: number;
  isOnline?: boolean;
  followersCount?: number;
  followingIds?: string[];
  followerIds?: string[];
  isSubscribed?: boolean;
  giftsReceivedCount?: number;
  giftsReceivedValue?: number;
  matchesWon?: number;
  matchesPlayed?: number;
  votesReceived?: number;
  levelHistory?: Array<{ level: number; date: string; reason: string }>;
  createdAt: string;
  isGoogleUser?: boolean;
}

export interface CompetitionMatch {
  id: string;
  competitionId?: string;
  round: 'top16' | 'top8' | 'demi' | 'final' | string;
  matchNumber: number;
  player1: {
    userId: string;
    fullName: string;
    profilePhoto: string;
    seedRank?: number;
    level?: number;
    stars?: number;
    points?: number;
    followers?: number;
    score?: number;
    votesCount?: number;
    giftsCount?: number;
    giftsValue?: number;
  };
  player2: {
    userId: string;
    fullName: string;
    profilePhoto: string;
    seedRank?: number;
    level?: number;
    stars?: number;
    points?: number;
    followers?: number;
    score?: number;
    votesCount?: number;
    giftsCount?: number;
    giftsValue?: number;
  };
  gameId: string;
  gameTitle: string;
  date: string;
  scheduledTime?: string;
  matchDateTimeISO?: string;
  rules?: string;
  status: 'Pwograme' | 'Ap dewoule' | 'Fini' | 'An atant verifikasyon' | 'Anile';
  winnerId?: string;
  score1?: number;
  score2?: number;
  votingEnabled?: boolean;
  votePrice?: number;
  votingStartTime?: string;
  votingEndTime?: string;
  votes1?: number;
  votes2?: number;
  gifts1?: number;
  gifts2?: number;
  verifiedBy?: string;
  verifiedAt?: string;
  auditNote?: string;
}

export interface CompetitionParticipantScore {
  userId: string;
  fullName: string;
  phoneNumber?: string;
  profilePhoto: string;
  level?: number;
  stars?: number;
  followers?: number;
  scoresByGame: { [gameId: string]: number };
  totalScore: number;
  matchesWon?: number;
  votesCount?: number;
  giftsCount?: number;
  giftsValue?: number;
  dailyScores?: {
    lendi?: number;
    madi?: number;
    mekredi?: number;
    jedi?: number;
  };
  qualifiedTop8?: boolean;
  eliminated?: boolean;
  registrationDate: string;
  rank?: number;
}

export interface Competition {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  rules: string;
  entryFee: number;
  startDate: string;
  deadline: string;
  startDateTimeISO?: string;
  endDateTimeISO?: string;
  competitionDays?: string[];
  maxParticipants: number;
  registeredUserIds: string[];
  authorizedGameIds?: string[];
  scheduleType?: 'weekly_7days' | 'standard';
  currentDay?: 'Lendi' | 'Madi' | 'Mèkredi' | 'Jedi' | 'Vandredi' | 'Samdi' | 'Dimanch' | string;
  stageCount?: number;
  qualificationCount?: number;
  scores?: CompetitionParticipantScore[];
  top8QualifiedUserIds?: string[];
  matches?: CompetitionMatch[];
  tiebreakerRule?: 'pi_wo_pwen_match' | 'premye_enskripsyon' | 'plis_viktwa';
  prizes: {
    first: string;
    second: string;
    third: string;
  };
  status: 'Ap vini' | 'Enskripsyon ouvè' | 'An kou' | 'Enskripsyon fèmen' | 'An poz' | 'Fini' | 'Anile' | 'active' | 'closed' | 'finished';
  votingEnabled?: boolean;
  votePrice?: number;
  allowMultipleEntries?: boolean;
  champion?: {
    userId: string;
    fullName: string;
    profilePhoto: string;
    title: string;
    prize: string;
    finalScore: string;
    wonAt: string;
  };
  runnerUp?: {
    userId: string;
    fullName: string;
    profilePhoto: string;
    prize: string;
  };
  winners?: {
    first?: { userId: string; name: string; prize: string };
    second?: { userId: string; name: string; prize: string };
    third?: { userId: string; name: string; prize: string };
  };
  revenue?: {
    registrations: number;
    votes: number;
    gifts: number;
  };
  auditHistory?: Array<{ timestamp: string; action: string; note: string }>;
}

export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface GiftTransaction {
  id: string;
  referenceId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  price: number;
  competitionId?: string;
  matchId?: string;
  timestamp: string;
  status: 'konfime' | 'an_atant' | 'refize';
}

export interface VoteTransaction {
  id: string;
  referenceId: string;
  voterId: string;
  voterName: string;
  competitionId: string;
  matchId: string;
  playerId: string;
  playerName: string;
  amount: number;
  timestamp: string;
  status: 'konfime' | 'anile';
}

export interface BalonLevelResult {
  level: number;
  won: boolean;
  pointsEarned: number;
  chosenBall: number;
  winningBall: number;
  timestamp: string;
}

export interface BalonProgress {
  userId: string;
  currentLevel: number;
  unlockedLevels: number[];
  completedLevels: number[];
  levelResults: BalonLevelResult[];
  totalPoints: number;
  status: 'in_progress' | 'completed';
  sessionPaid?: boolean;
  lastUpdated: string;
}

export interface BalonConfig {
  pointsPerWin: number;
  isActive: boolean;
  entryFee: number;
  totalLevels?: number;
}

export interface BalonChampion {
  userId: string;
  userName: string;
  phoneNumber?: string;
  totalPoints: number;
  completedAt: string;
}

export interface BalonPlayerProgressSummary {
  userId: string;
  userName: string;
  phoneNumber?: string;
  currentLevel: number;
  completedLevelsCount: number;
  totalPoints: number;
  status: string;
  lastUpdated: string;
}

export interface BalonAdminStats {
  totalPlayers: number;
  championsCount: number;
  totalPlays: number;
  totalWins: number;
  totalLosses: number;
  levelStats: Record<number, {
    level: number;
    plays: number;
    wins: number;
    losses: number;
    playersAtLevel: number;
  }>;
  champions: BalonChampion[];
  recentHistory: Array<BalonLevelResult & { userName: string; userId: string }>;
  playersProgress: BalonPlayerProgressSummary[];
}

export interface UserGameProgress {
  userId: string;
  gameId: string;
  currentLevel: number;
  unlockedLevels: number[];
  completedLevels: number[];
  highScore: number;
  totalPoints: number;
  sessionPaid: boolean;
  lastPlayed: string;
  stats?: any;
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  mediaType?: 'text' | 'image' | 'video' | 'none';
  mediaUrl?: string;
  mediaUrls?: string[];
  videoUrl?: string;
  tiktokUrl?: string;
  author?: string;
  likes: string[];
  comments: PostComment[];
  createdAt: string;
  pinned?: boolean;
}

export interface GameScore {
  userId: string;
  userName: string;
  score: number;
  date: string;
}

export interface Game {
  id: string;
  title: string;
  category: string;
  icon?: string;
  badge?: string;
  description: string;
  rules: string;
  entryFee: number;
  isPaid: boolean;
  isActive: boolean;
  levelsCount?: number;
  highScores: GameScore[];
}

export interface Transaction {
  id: string;
  referenceId: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: 'depo' | 'retre' | 'vòt' | 'kado' | 'enskripsyon_konpetisyon' | 'avion_crash_miz' | 'avion_crash_genyen' | string;
  amount: number;
  natcashName?: string;
  natcashPhone?: string;
  proofImage?: string;
  status: 'an_atant' | 'konfime' | 'refize';
  rejectReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  metadata?: any;
}

export interface AvionCrashConfig {
  isActive: boolean;
  isMaintenance: boolean;
  minBet: number;
  maxBet: number;
  houseEdge?: number;
}

export interface AvionCrashRound {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  betAmount: number;
  crashMultiplier: number;
  cashoutMultiplier?: number;
  payoutAmount: number;
  netProfit: number;
  status: 'flying' | 'cashed_out' | 'crashed';
  obstacleType?: string;
  startTime: string;
  endTime?: string;
  seedHash?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'depo' | 'retre' | 'konpetisyon' | 'rezilta' | 'anons' | 'vot' | 'kado';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actor: string;
}
