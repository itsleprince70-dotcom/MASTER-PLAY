export interface User {
  id: string;
  firebaseUid?: string;
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
  isVerifiedInDatabase?: boolean;
  verifiedInDatabaseAt?: string;
  isVerified?: boolean;
  username?: string;
  bio?: string;
  email?: string;
  googleId?: string;
  followingCount?: number;
  favoritePostIds?: string[];
  lastPostDate?: string;
  // Monetization fields
  isMonetized?: boolean;
  monetizationStatus?: 'none' | 'an_atant' | 'aksepte' | 'refize' | 'active' | 'pending' | 'rejected' | 'suspended';
  monetizationRequestedAt?: string;
  monetizationApprovedAt?: string;
  totalEarnings?: number;
  availableEarnings?: number;
  paidEarnings?: number;
  monetizedLikesCount?: number;
  followerMilestonePaid?: boolean;
  masterPlayId?: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN';
  isAdmin?: boolean;
  adminToken?: string;
  certificationStatus?: 'non_sètifye' | 'sètifye';
  verified?: boolean;
  certifiedAt?: string;
  certifiedBy?: string;
}

export interface MonetizationConfig {
  isEnabled: boolean;
  activationFee: number;
  minFollowersRequired: number;
  earningsPer1000Likes: number;
  milestoneFollowersReward: number;
  updatedAt?: string;
}

export interface AlgorithmAnomaly {
  id: string;
  type: 'duplicate_account' | 'suspicious_votes' | 'like_spam' | 'financial_discrepancy' | 'rapid_action';
  severity: 'ba' | 'mwayen' | 'wo';
  title: string;
  description: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
  status: 'aktif' | 'rezoud' | 'inore';
}

export interface AlgorithmApproval {
  id: string;
  type: 'bloke_kont' | 'efase_piblikasyon' | 'peyman_monetizasyon' | 'chanje_balans';
  targetId: string;
  targetName: string;
  requestedAction: string;
  amount?: number;
  reason: string;
  status: 'an_atant' | 'apwouve' | 'refize';
  createdAt: string;
}

export interface AlgorithmIntelligenceData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalVideos: number;
    totalVotes: number;
    totalTransactions: number;
    monetizedUsersCount: number;
    totalMonetizationEarnings: number;
    integrityScore: number;
    anomaliesCount: number;
  };
  anomalies: AlgorithmAnomaly[];
  recommendations: string[];
  pendingApprovals: AlgorithmApproval[];
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
    verified?: boolean;
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
    verified?: boolean;
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
  verified?: boolean;
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
  prizesPaid?: {
    first?: boolean;
    second?: boolean;
    third?: boolean;
    firstPaidAt?: string;
    secondPaidAt?: string;
    thirdPaidAt?: string;
    firstRecipientId?: string;
    secondRecipientId?: string;
    thirdRecipientId?: string;
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
  userVerified?: boolean;
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
  videoMasterUrl?: string;
  tiktokUrl?: string;
  author?: string;
  authorId?: string;
  authorName?: string;
  authorPhoto?: string;
  authorVerified?: boolean;
  likes: string[];
  favorites?: string[];
  comments: PostComment[];
  createdAt: string;
  pinned?: boolean;
  viewsCount?: number;
  sharesCount?: number;
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

export interface DailyScoreRecord {
  id: string;
  competitionId: string;
  competitionName?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  gameId: string;
  gameTitle?: string;
  level: number;
  dayKey: string;
  score: number;
  createdAt: string;
}

export interface GlobalMemoryEvent {
  eventId: string;
  userId: string;
  actionType: string;
  dateTime: string;
  serverTimestamp: number;
  pageOrFeature: string;
  result: 'success' | 'error' | 'pending';
  data?: Record<string, any>;
  clientMutationId?: string;
}

export interface BackupSnapshotMeta {
  version: number;
  createdAt: string;
  fileName: string;
  usersCount: number;
  postsCount: number;
  checksum: string;
}

export interface GlobalMemoryOverview {
  stats: {
    usersCount: number;
    publicationsCount: number;
    videosCount: number;
    competitionsCount: number;
    scoresCount: number;
    transactionsCount: number;
    eventsCount: number;
    needsVerificationCount: number;
    syncErrorsCount: number;
  };
  backupStatus: {
    schemaVersion: number;
    dataVersion: number;
    lastUpdatedAt: string;
    lastBackupAt?: string;
    lastBackupVersion?: number;
    snapshots: BackupSnapshotMeta[];
  };
  recentEvents: GlobalMemoryEvent[];
  syncErrors: Array<{
    id: string;
    userId?: string;
    actionType: string;
    error: string;
    timestamp: string;
  }>;
  needsVerificationUsers: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    masterPlayId?: string;
    createdAt: string;
  }>;
}

export interface SyncQueueItem {
  clientMutationId: string;
  userId: string;
  actionType: string;
  pageOrFeature: string;
  endpoint: string;
  method: 'POST' | 'PUT';
  payload: Record<string, any>;
  createdAt: string;
  retries: number;
}


