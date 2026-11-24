import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { BalonLevelResult, BalonAdminStats, BalonConfig, BalonProgress, UserGameProgress } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const DB_BACKUP_FILE = path.resolve(DATA_DIR, 'db_backup.json');
const USERS_VAULT_FILE = path.resolve(DATA_DIR, 'db_users_vault.json');
const BACKUP_DIR = path.resolve(DATA_DIR, 'backups');

// Ensure data and backup folders exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Database schema interface
interface DBState {
  adminPin: string;
  users: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    pinHash: string;
    profilePhoto: string;
    balance: number;
    reservedBalance: number;
    level: number;
    stars?: number;
    followersCount?: number;
    followingCount?: number;
    followingIds?: string[];
    followerIds?: string[];
    favoritePostIds?: string[];
    lastPostDate?: string;
    giftsReceivedCount?: number;
    giftsReceivedValue?: number;
    matchesWon?: number;
    matchesPlayed?: number;
    votesReceived?: number;
    points?: number;
    isOnline?: boolean;
    levelHistory?: Array<{ level: number; date: string; reason: string }>;
    createdAt: string;
    isGoogleUser?: boolean;
    email?: string;
    googleId?: string;
    username?: string;
    isVerifiedInDatabase?: boolean;
    verifiedInDatabaseAt?: string;
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
    certificationStatus?: 'non_sètifye' | 'sètifye';
    verified?: boolean;
    certifiedAt?: string;
    certifiedBy?: string;
    firebaseUid?: string;
  }>;
  idGenerator?: {
    nextCounter: number;
    totalCapacity: number;
    allocatedIds: Record<string, string>;
  };
  adminSessions?: Record<string, { userId: string; createdAt: string }>;
  globalMemory?: {
    schemaVersion: number;
    dataVersion: number;
    lastUpdatedAt: string;
    lastBackupAt?: string;
    lastBackupVersion?: number;
    backupSnapshots: Array<{
      version: number;
      createdAt: string;
      fileName: string;
      usersCount: number;
      postsCount: number;
      checksum: string;
    }>;
    events: Array<{
      eventId: string;
      userId: string;
      actionType: string;
      dateTime: string;
      serverTimestamp: number;
      pageOrFeature: string;
      result: 'success' | 'error' | 'pending';
      data?: Record<string, any>;
      clientMutationId?: string;
    }>;
    syncErrors: Array<{
      id: string;
      userId?: string;
      actionType: string;
      error: string;
      timestamp: string;
    }>;
    processedMutationIds: string[];
  };
  competitions: Array<{
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
    stageCount?: number;
    qualificationCount?: number;
    votingEnabled?: boolean;
    votePrice?: number;
    allowMultipleEntries?: boolean;
    revenue?: {
      registrations: number;
      votes: number;
      gifts: number;
    };
    maxParticipants: number;
    registeredUserIds: string[];
    authorizedGameIds?: string[];
    scheduleType?: 'weekly_7days' | 'standard' | 'custom_dates';
    currentDay?: 'Lendi' | 'Madi' | 'Mèkredi' | 'Jedi' | 'Vandredi' | 'Samdi' | 'Dimanch' | string;
    scores?: Array<{
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
    }>;
    top8QualifiedUserIds?: string[];
    matches?: Array<{
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
      status: 'Pwograme' | 'Ap dewoule' | 'Fini' | 'An atant verifikasyon' | 'Anile' | string;
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
    }>;
    tiebreakerRule?: 'pi_wo_pwen_match' | 'premye_enskripsyon' | 'plis_viktwa' | string;
    prizes: {
      first: string;
      second: string;
      third: string;
    };
    status: 'Ap vini' | 'Enskripsyon ouvè' | 'An kou' | 'Enskripsyon fèmen' | 'An poz' | 'Fini' | 'Anile' | 'active' | 'closed' | 'finished' | string;
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
  }>;
  gifts: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    price: number;
    isActive: boolean;
  }>;
  giftTransactions: Array<{
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
    createdAt?: string;
    timestamp: string;
    status: string;
  }>;
  votes: Array<{
    id: string;
    referenceId: string;
    voterId: string;
    voterName: string;
    competitionId: string;
    matchId: string;
    playerId: string;
    playerName: string;
    amount: number;
    createdAt?: string;
    timestamp: string;
    status: string;
  }>;
  posts: Array<{
    id: string;
    title: string;
    description: string;
    mediaType?: 'text' | 'image' | 'video' | 'none';
    mediaUrl?: string;
    mediaUrls?: string[];
    videoUrl?: string;
    tiktokUrl?: string;
    author?: string;
    authorId?: string;
    authorName?: string;
    authorPhoto?: string;
    likes: string[]; // user IDs
    favorites?: string[]; // user IDs
    comments: Array<{
      id: string;
      userId: string;
      userName: string;
      userPhoto?: string;
      text: string;
      createdAt: string;
    }>;
    createdAt: string;
    pinned?: boolean;
    viewsCount?: number;
    sharesCount?: number;
  }>;
  games: Array<{
    id: string;
    title: string;
    category: string;
    icon?: string;
    badge?: string;
    levelsCount?: number;
    description: string;
    rules: string;
    entryFee: number;
    isPaid: boolean;
    isActive: boolean;
    highScores: Array<{
      userId: string;
      userName: string;
      score: number;
      date: string;
    }>;
  }>;
  transactions: Array<{
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
  }>;
  notifications: Array<{
    id: string;
    userId: string; // or 'all'
    title: string;
    message: string;
    type: 'depo' | 'retre' | 'konpetisyon' | 'rezilta' | 'anons' | 'vot' | 'kado';
    isRead: boolean;
    createdAt: string;
    link?: string;
  }>;
  balonProgress: BalonProgress[];
  balonConfig: BalonConfig;
  userGameProgress?: Record<string, UserGameProgress>;
  subscriptions?: Array<{
    id: string;
    subscriberId: string;
    targetUserId: string;
    createdAt: string;
  }>;
  dailyLevelRecords?: Array<{
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
  }>;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    details: string;
    actor: string;
  }>;
  avionCrashConfig?: {
    isActive: boolean;
    isMaintenance: boolean;
    minBet: number;
    maxBet: number;
    houseEdge?: number;
  };
  avionCrashRounds?: Array<{
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
  }>;
  financialLedger?: Array<{
    id: string;
    userId: string;
    type: string;
    amount: number;
    status: string;
    source: string;
    destination: string;
    description: string;
    referenceId: string;
    createdAt: string;
    metadata?: any;
  }>;
  depositRequests?: any[];
  monetizationConfig?: {
    isEnabled: boolean;
    activationFee: number;
    minFollowersRequired: number;
    earningsPer1000Likes: number;
    milestoneFollowersReward?: number;
    followerMilestoneRequired?: number;
    followerMilestoneBonus?: number;
    minPayoutAmount?: number;
    updatedAt?: string;
  };
  algorithmApprovals?: Array<{
    id: string;
    type: 'bloke_kont' | 'efase_piblikasyon' | 'peyman_monetizasyon' | 'chanje_balans' | string;
    targetId: string;
    targetName: string;
    requestedAction: string;
    amount?: number;
    reason: string;
    status: 'an_atant' | 'apwouve' | 'refize' | 'approved' | 'rejected' | string;
    createdAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
  }>;
  liveStreams?: Array<{
    id: string;
    streamerId: string;
    streamerName: string;
    streamerPhoto: string;
    title: string;
    category: string;
    status: 'active' | 'ended';
    viewersCount: number;
    viewerIds: string[];
    likesCount: number;
    giftsReceivedTotal: number;
    streamerEarnings: number;
    platformFee: number;
    startedAt: string;
    endedAt?: string;
  }>;
  liveComments?: Array<{
    id: string;
    streamId: string;
    userId: string;
    userName: string;
    userPhoto: string;
    text: string;
    createdAt: string;
    isMuted?: boolean;
  }>;
  liveGiftTransactions?: Array<{
    id: string;
    referenceId: string;
    streamId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    streamerId: string;
    streamerName: string;
    giftId: string;
    giftName: string;
    giftIcon: string;
    giftPrice: number;
    streamerAmount: number;
    adminFee: number;
    timestamp: string;
  }>;
  liveReports?: Array<{
    id: string;
    streamId: string;
    reporterId: string;
    reporterName: string;
    targetType: 'stream' | 'comment' | 'user';
    targetId: string;
    reason: string;
    status: 'nouvo' | 'trete' | 'rejete';
    createdAt: string;
  }>;
  pushSubscriptions?: Array<{
    id: string;
    userId: string;
    endpoint?: string;
    subscription: any;
    createdAt: string;
  }>;
}

// Initial Seed Data
const defaultInitialState: DBState = {
  adminPin: 'prince509',
  users: [
    {
      id: 'usr_demo_1',
      fullName: 'Jean William',
      phoneNumber: '+509 40128456',
      pinHash: hashPin('1234'),
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      balance: 1250,
      reservedBalance: 0,
      level: 3,
      createdAt: '2025-06-15T10:00:00Z',
    },
    {
      id: 'usr_demo_2',
      fullName: 'Marie Carmelle',
      phoneNumber: '+509 37889922',
      pinHash: hashPin('1234'),
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      balance: 450,
      reservedBalance: 0,
      level: 2,
      createdAt: '2025-06-20T14:30:00Z',
    }
  ],
  competitions: [
    {
      id: 'comp_1',
      name: 'MASTER COUP',
      badge: '👑 MASTER',
      tagline: 'Yon konpetisyon ki mande estrateji, sans gwo patisipasyon. Tounen pi bon nan MASTER COUP !',
      description: 'Pi gwo tounwa sezon an ak pi gwo prim NatCash. Jwe ak pi bon stratèj yo.',
      rules: '1. Chak jwè gen 3 manch.\n2. Ranje nòt ki pi wo a ap kalifye pou final la.\n3. Peman fèt dirèkteman sou balans MASTER PLAY ou.\n4. Pa gen ranbousman si ou rate lè a.',
      entryFee: 1500,
      startDate: '12 Jiyè 2025 - 8:00 PM',
      deadline: '20 Jiyè 2025 - 6:00 PM',
      maxParticipants: 100,
      registeredUserIds: ['usr_demo_1'],
      prizes: {
        first: '75,000 HT + Kouròn MASTER',
        second: '35,000 HT',
        third: '15,000 HT'
      },
      status: 'active'
    },
    {
      id: 'comp_2',
      name: 'COUP DU ROI',
      badge: '⚡ ROI',
      tagline: 'Konpetisyon vitès ak reflèks pou jwenn vre wa a !',
      description: 'Yon batay titanesk sou jwèt ritm ak reflèks Kèkè Challenge.',
      rules: '1. Nòt ki pi wo sou Fresco Run ak Piano Beat.\n2. Tout patisipan dwe verifye kont yo anvan konpetisyon an.\n3. Rezilta ofisyèl yo pibliye 1h apre fen an.',
      entryFee: 1000,
      startDate: '15 Jiyè 2025 - 7:00 PM',
      deadline: '22 Jiyè 2025 - 6:00 PM',
      maxParticipants: 80,
      registeredUserIds: [],
      prizes: {
        first: '50,000 HT',
        second: '25,000 HT',
        third: '10,000 HT'
      },
      status: 'active'
    },
    {
      id: 'comp_3',
      name: 'PRINCE ROYAL',
      badge: '⚜️ PRINCE',
      tagline: 'Defi elit la pou tout nouvo talan k ap monte yo !',
      description: 'Konpetisyon eksklizif pou jwè ki vle demontre talan yo e fè lajan rapid.',
      rules: '1. Enskripsyon louvri pou tout nivo.\n2. 5 jwè ki pi bon yo resevwa prim espesyal.\n3. Transfè prim yo fèt otomatikman sou NatCash.',
      entryFee: 750,
      startDate: '20 Jiyè 2025 - 8:00 PM',
      deadline: '28 Jiyè 2025 - 6:00 PM',
      maxParticipants: 120,
      registeredUserIds: [],
      prizes: {
        first: '35,000 HT',
        second: '18,000 HT',
        third: '8,000 HT'
      },
      status: 'active'
    }
  ],
  posts: [
    {
      id: 'post_1',
      title: 'Nou gen yon nouvo MASTER COUP ! Prepare tèt ou !',
      description: 'Gwo konpetisyon mwa sa a louvri ofisyèlman. Tout plas yo ap ranpli rapid. Gade Vidéo Master nou pou gade videyo demonstrasyon an !',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      tiktokUrl: '',
      likes: ['usr_demo_1', 'usr_demo_2'],
      comments: [
        {
          id: 'c_1',
          userId: 'usr_demo_1',
          userName: 'Jean William',
          text: 'Mwen deja enskri ! Ane sa kouròn nan se pou mwen 🔥',
          createdAt: '2025-06-25T14:10:00Z'
        }
      ],
      createdAt: '2025-06-25T12:00:00Z',
      pinned: true
    },
    {
      id: 'post_2',
      title: 'Regleman NatCash & Verifikasyon Prèv',
      description: 'Chak fwa w ap fè yon depo, toujou verifye nimewo +509 40987659 (MATHURIN KERLINDGE). Voye screenshot la dirèkteman nan aplikasyon an oswa sou WhatsApp nou pou verifikasyon rapid.',
      mediaType: 'none',
      tiktokUrl: '',
      likes: ['usr_demo_2'],
      comments: [],
      createdAt: '2025-06-26T09:00:00Z',
      pinned: false
    }
  ],
  games: [
    {
      id: 'game_football',
      title: 'Football Challenge',
      category: 'football',
      icon: '⚽',
      badge: '⚽ FOUTBÒL',
      description: 'Kontwole jwè a, vize gòl epi chwazi bon direksyon ak fòs pou bat gardyen an sou 6 nivo difikilte !',
      rules: 'Vize gòl la, ajiste fòs frap la epi tire. Bat gardyen an ak defansè yo anvan tan fini pou make kantite gòl ki nesesè a.',
      entryFee: 50,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1200, date: '2025-06-25' }]
    },
    {
      id: 'game_basket',
      title: 'Basket Challenge',
      category: 'basket',
      icon: '🏀',
      badge: '🏀 BASKÈT',
      description: 'Voye boul baskèt la nan panyen an avèk bon ang ak bon fòs sou 6 nivo distans ak obstak !',
      rules: 'Trennen dwèt ou pou mete ang ak fòs lansman an. Fè plis panyen posib ak kantite boul limite ou genyen pou pase nivo a.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 980, date: '2025-06-24' }]
    },
    {
      id: 'game_bubble',
      title: 'Bubble Shooter',
      category: 'bubble',
      icon: '🔵',
      badge: '🔵 BOUL KOULÈ',
      description: 'Tire boul koulè pou mete omwen 3 menm koulè ansanm pou yo pete anvan yo rive nan liy danje a !',
      rules: 'Vize ak lansè a nan pati anba a epi tire. Konekte 3 oswa plis boul menm koulè pou netwaye tablo a.',
      entryFee: 35,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1450, date: '2025-06-25' }]
    },
    {
      id: 'game_memory',
      title: 'Memory Master',
      category: 'memory',
      icon: '🧠',
      badge: '🧠 MEMWA',
      description: 'Sonje pozisyon kat yo epi jwenn tout pè imaj ki menm anvan tan an fini sou 6 nivo difikilte !',
      rules: 'Ouvri 2 kat alafwa. Si imaj yo menm, yo rete louvri. Jwenn tout pè yo nan mwens tan ak mwens tantativ posib.',
      entryFee: 0,
      isPaid: false,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 100, date: '2025-06-25' }]
    },
    {
      id: 'game_xo',
      title: 'XO Arena',
      category: 'xo',
      icon: '❌⭕',
      badge: '❌⭕ XO DEFÌ',
      description: 'Defye advèsè entèlijans atifisyèl la sou 6 nivo soti nan nivo debutan rive nan nivo ekspè san fay !',
      rules: 'Mete 3 senbòl an liy (orizontal, vètikal oswa dyagonal) anvan advèsè a fè sa pou w genyen match la.',
      entryFee: 25,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 750, date: '2025-06-24' }]
    },
    {
      id: 'game_block',
      title: 'Block Puzzle',
      category: 'block',
      icon: '🧩',
      badge: '🧩 BLÒK LOJIK',
      description: 'Mete diferan fòm blòk sou tablo a pou konplete liy orizontal ak vètikal pou fè yo disparèt !',
      rules: 'Trennen blòk yo nan espas ki disponib yo. Chak liy konplè disparèt epi ba w pwen. Pa kite tablo a bloke san espas.',
      entryFee: 30,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1100, date: '2025-06-25' }]
    },
    {
      id: 'game_hockey',
      title: 'Air Hockey Battle',
      category: 'hockey',
      icon: '🥅',
      badge: '🥅 AIR HOCKEY',
      description: 'Frape disk la avèk manch ou pou make nan gòl advèsè a pandan w ap defann pwòp gòl ou sou 6 nivo !',
      rules: 'Glise manch ou avèk dwèt ou pou tire disk la rapid nan gòl advèsè a. Premye jwè ki rive nan kantite gòl obligatwa a genyen.',
      entryFee: 45,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 860, date: '2025-06-25' }]
    },
    {
      id: 'game_maze',
      title: 'Maze Escape',
      category: 'maze',
      icon: '🌀',
      badge: '🌀 LABIRENT',
      description: 'Gide pèsonaj la nan labirent la, ranmase zetwal bonis epi jwenn sòti a anvan tan an fini !',
      rules: 'Sèvi ak kontwòl direksyon yo pou gide pèsonaj la nan labirent la. Jwenn sòti a anvan revèy la rive nan zewo.',
      entryFee: 0,
      isPaid: false,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 920, date: '2025-06-24' }]
    },
    {
      id: 'game_tap',
      title: 'Tap Master',
      category: 'tap',
      icon: '👆',
      badge: '👆 VITÈS REFLÈKS',
      description: 'Teste vitès ak reflèks ou ! Klike rapid sou bon objè yo selon enstriksyon an san w pa peze sou pyèj !',
      rules: 'Suiv enstriksyon ki parèt anwo a. Klike sèlman sou bon objè yo pou ogmante nòt ou ak kombo w anvan tan fini.',
      entryFee: 20,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1300, date: '2025-06-23' }]
    },
    {
      id: 'game_potion',
      title: 'Potion Lab',
      category: 'potion',
      icon: '🧪',
      badge: '🧪 ALCHIMI LAB',
      description: 'Prepare resèt majik nan laboratwa a ! Melanje bon koulè ak engredyan yo pou kreye eliksir yo !',
      rules: 'Gade resèt la epi vide bon engredyan yo nan resipyan an pou jwenn koulè mande a san gaspiye esè.',
      entryFee: 30,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 890, date: '2025-06-25' }]
    },
    {
      id: 'game_penalty',
      title: 'Penalty King',
      category: 'penalty',
      icon: '🏆',
      badge: '🏆 PENALTI 11M',
      description: 'Gran tir penalti 11 mèt ! Chwazi kote w ap mete boul la nan kwen filè a pou bat gardyen an !',
      rules: 'Chwazi kwen gòl la ak fòs tir la. Make kantite penalti ki nesesè pou pase nan nivo siperyè a.',
      entryFee: 50,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1500, date: '2025-06-25' }]
    },
    {
      id: 'game_pool',
      title: 'Pool Master',
      category: 'pool',
      icon: '🎱',
      badge: '🎱 BILYA 8-BALL',
      description: 'Vize boul yo sou tab bilya a, kalkile rebondisman yo epi mete boul sib yo nan twou yo !',
      rules: 'Vize avèk baton an epi ajiste fòs frap la. Fè tout boul sib yo antre nan twou yo nan kantite frap yo ba ou.',
      entryFee: 60,
      isPaid: true,
      isActive: true,
      levelsCount: 6,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1380, date: '2025-06-25' }]
    },
    {
      id: 'game_11balon',
      title: '11 Balon (7 Nivo)',
      category: 'balon',
      icon: '⚽🎟️',
      badge: '🎟️ 11 BALON - 7 NIVO',
      description: 'Chwazi 1 nan 11 balon yo sou teren an epi grate li ! Jwenn balon ki gen 100 pwen an pou debloke pwochen nivo a jiska Nivo 7 !',
      rules: 'Gen 11 balon sou teren an. 1 sèl balon gen 100 pwen. Chwazi yon balon, grate sifas li ak dwèt ou. Si w jwenn 100 pwen yo, ou pase nan pwochen nivo a ! Fini tout 7 nivo yo pou vin chanpyon !',
      entryFee: 50,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 700, date: '2025-06-25' }]
    },
    {
      id: 'game_jeudemots',
      title: 'Jeu de Mots',
      category: 'jeudemots',
      icon: '🔤',
      badge: '🔤 JWÈT MO',
      description: 'Dekouvri mo kache epi fòme bon mo avèk lèt yo ba ou sou 7 nivo difikilte !',
      rules: 'Peze lèt yo pou fòme mo kache yo anvan tan fini. Chwazi endis si w bloke, epi pase tout 7 nivo yo pou genyen pwen !',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 850, date: '2025-06-25' }]
    },
    {
      id: 'game_tubemaster',
      title: 'Tube Master',
      category: 'tubemaster',
      icon: '🧪',
      badge: '🧪 RANJE TIB YO',
      description: 'Triye boul plizyè koulè yo pou mete chak koulè nan pwòp tib transparan pa li sou 7 nivo !',
      rules: 'Klike sou yon tib pou leve boul ki anlè a, epi klike sou tib kote w vle mete l la. Ranje tout boul menm koulè nan menm tib.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 920, date: '2025-06-25' }]
    },
    {
      id: 'game_dames',
      title: 'Dames',
      category: 'dames',
      icon: '♟️',
      badge: '♟️ JWÈT DAMA',
      description: 'Jwèt Dama klasik sou yon damye 8x8 ! Jwe Solo kont entèlijans atifisyèl oswa 2 Jwè sou menm aparèy la sou 7 nivo difikilte !',
      rules: 'Deplase pyès yo sou dyagonal, sote sou pyès advèsè pou pran yo. Rive nan dènye liy lan pou transfòme an dam 👑 !',
      entryFee: 45,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1100, date: '2025-06-25' }]
    },
    {
      id: 'game_parchisi',
      title: 'Parchisi Star',
      category: 'parchisi',
      icon: '🎲',
      badge: '🎲 PARCHISI / LUDO',
      description: 'Lanse zo a, soti pyès ou nan baz la, voye pyès advèsè tounen nan baz yo epi mennen 4 pyès ou nan kay santral la !',
      rules: 'Fè 6 sou zo a pou soti pyès nan baz. Kouri sou chemen an, pwoteje pyès ou sou kare sekirite ⭐ epi rive nan zòn santral la.',
      entryFee: 50,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 1250, date: '2025-06-25' }]
    },
    {
      id: 'game_pianomizikal',
      title: 'Piano Mizikal',
      category: 'pianomizikal',
      icon: '🎹',
      badge: '🎹 PIANO MIZIKAL',
      description: 'Peze bon mozayik piano yo nan bon ritm pou jwe melodi dous, konpa ak mizik klasik sou 7 nivo ritmik !',
      rules: 'Klike sou mozayik yo lè yo rive nan liy anba a pou pwodui bon nòt piano a. Fè gwo kombo san rate pou debloke tout 7 nivo yo !',
      entryFee: 45,
      isPaid: true,
      isActive: true,
      levelsCount: 7,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1400, date: '2025-06-25' }]
    },
    {
      id: 'game_laserescape',
      title: 'Laser Escape',
      category: 'laserescape',
      icon: '⚡',
      badge: '⚡ LABIRENT LAZÈ',
      description: 'Chape anba labirent la san reyon lazè yo pa touche w sou 10 nivo difikilte ak lavi limite !',
      rules: 'Deplase pèsonaj la nan labirent la pou jwenn pòt sòti a. Evite reyon lazè ki limen, ki etenn oswa k ap deplase.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 10,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 850, date: '2025-06-25' }]
    },
    {
      id: 'game_parkinggenius',
      title: 'Parking Genius',
      category: 'parkinggenius',
      icon: '🚗',
      badge: '🚗 DEFI PAKIN',
      description: 'Deplase machin ki nan pakin nan pou libere chemen machin wouj sib la sou 20 nivo rezoud !',
      rules: 'Glise machin orizontal yo agoch/adwat ak machin vètikal yo anlè/anba pou fè machin wouj la soti nan pakin nan.',
      entryFee: 45,
      isPaid: true,
      isActive: true,
      levelsCount: 20,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 1350, date: '2025-06-25' }]
    },
    {
      id: 'game_arrowmaster',
      title: 'Arrow Master',
      category: 'arrowmaster',
      icon: '🏹',
      badge: '🏹 BANZA & FLÈCH',
      description: 'Vize sib yo avèk presizyon, ajiste fòs tir ak ang banza a pou manyen milye sib la sou 15 nivo !',
      rules: 'Ajiste ang vize ak fòs tir la, pran an kont van an epi tire flèch yo pou manyen sib ki fikse oswa k ap deplase.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 15,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 980, date: '2025-06-25' }]
    },
    {
      id: 'game_meteorsurvivor',
      title: 'Meteor Survivor',
      category: 'meteorsurvivor',
      icon: '🚀',
      badge: '🚀 SIVIV METEYÒ',
      description: 'Kontwole veso espasyal la, evite gwo vag meteyò k ap tonbe epi ranmase zetwal bonis sou 10 nivo !',
      rules: 'Deplase agoch ak adwat pou evite meteyò yo pandan tout tan misyon an mande a. Ranmase zetwal pou plis pwen.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 10,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 920, date: '2025-06-25' }]
    },
    {
      id: 'game_catchit',
      title: 'Catch It!',
      category: 'catchit',
      icon: '🧺',
      badge: '🧺 TRAPE BON OBJÈ',
      description: 'Deplase panyen an pou trape bon fwi ak zetwal, pandan w ap evite bonm danjere sou 10 nivo !',
      rules: 'Trape fwi ak kouròn ki tonbe pou fè pwen. Evite bonm nwa yo pou w pa pèdi lavi ak pwen.',
      entryFee: 35,
      isPaid: true,
      isActive: true,
      levelsCount: 10,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1100, date: '2025-06-25' }]
    },
    {
      id: 'game_balloonpopper',
      title: 'Balloon Popper',
      category: 'balloonpopper',
      icon: '🎈',
      badge: '🎈 PETE BALON 60S',
      description: 'Touche balon yo rapid pou fè yo pete anvan 60 segonn fini sou 5 nivo difikilte rapid !',
      rules: 'Touche balon k ap monte yo. Pete balon koulè ak balon bonis pou pwen, evite balon nwa danjere yo.',
      entryFee: 35,
      isPaid: true,
      isActive: true,
      levelsCount: 5,
      highScores: [{ userId: 'usr_demo_2', userName: 'Marie Carmelle', score: 850, date: '2025-06-25' }]
    },
    {
      id: 'game_snakerush',
      title: 'Snake Rush',
      category: 'snakerush',
      icon: '🐍',
      badge: '🐍 KOULÈV RAPID',
      description: 'Gide koulèv la pou manje pòm, grandi epi evite obstak ak pwòp kò li sou 5 nivo difikilte !',
      rules: 'Itilize flèch oswa bouton direksyon pou deplase koulèv la sou kadriyaj la san frape miray oswa kò l.',
      entryFee: 30,
      isPaid: true,
      isActive: true,
      levelsCount: 5,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 650, date: '2025-06-25' }]
    },
    {
      id: 'game_coinjumper',
      title: 'Coin Jumper',
      category: 'coinjumper',
      icon: '🏅',
      badge: '🏅 SOTE PLATFÒM',
      description: 'Sote sou platfòm k ap deplase, kolekte pyès monnen, evite pikan epi rive nan drapo a sou 10 nivo !',
      rules: 'Kouri ak sote pou franchi twou ak pikan. Ranmase tout pyès monnen epi touche drapo vèt la pou fini nivo a.',
      entryFee: 40,
      isPaid: true,
      isActive: true,
      levelsCount: 10,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 1200, date: '2025-06-25' }]
    },
    {
      id: 'game_avioncrash',
      title: 'Avion Crash',
      category: 'avioncrash',
      icon: '✈️',
      badge: '💵 VRÈ LAJAN',
      description: 'Mize ak vrè lajan sou balans ou ! Gade avyon an k ap monte epi retire lajan w anvan l fè aksidan pou miltipliye kòb ou !',
      rules: 'Mize nenpòt montan ant 10 ak 5,000 HTG sou balans ou. Klike "Retire Lajan Mwen" anvan avyon an eksploze pou touche miz ou miltipliye pa miltiplikatè a ! Si avyon an fè aksidan anvan, ou pèdi miz la.',
      entryFee: 10,
      isPaid: true,
      isActive: true,
      levelsCount: 1,
      highScores: [{ userId: 'usr_demo_1', userName: 'Jean William', score: 2500, date: '2025-06-25' }]
    }
  ],
  transactions: [
    {
      id: 'tx_seed_1',
      referenceId: 'DEP-409182',
      userId: 'usr_demo_1',
      userName: 'Jean William',
      userPhone: '+509 40128456',
      type: 'depo',
      amount: 1250,
      natcashName: 'Jean William',
      natcashPhone: '+509 40128456',
      status: 'konfime',
      createdAt: '2025-06-20T10:15:00Z',
      reviewedAt: '2025-06-20T10:20:00Z',
      reviewedBy: 'Prince509'
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_demo_1',
      title: 'Depo konfime avèk siksè !',
      message: 'Depo 1,250 HT ou a sou NatCash te konfime. Balans ou pare pou konpetisyon yo.',
      type: 'depo',
      isRead: false,
      createdAt: '2025-06-20T10:20:00Z'
    },
    {
      id: 'notif_2',
      userId: 'all',
      title: 'Konpetisyon MASTER COUP louvri !',
      message: 'Enskri kounye a pou w ka genyen 75,000 HT ak kouròn MASTER la.',
      type: 'konpetisyon',
      isRead: false,
      createdAt: '2025-06-22T08:00:00Z'
    }
  ],
  gifts: [
    {
      id: 'gift_chat',
      name: 'Chat',
      icon: '🐱',
      description: 'Yon ti chat bèl pou ankouraje jwè a !',
      price: 20,
      isActive: true,
    },
    {
      id: 'gift_reken',
      name: 'Reken',
      icon: '🦈',
      description: 'Fòs reken pou devore advèsè a !',
      price: 100,
      isActive: true,
    },
    {
      id: 'gift_pistole',
      name: 'Pistolè',
      icon: '🔫',
      description: 'Tir presizyon pou batay la !',
      price: 300,
      isActive: true,
    },
    {
      id: 'gift_lyon',
      name: 'Lyon',
      icon: '🦁',
      description: 'Wa nan forè a pou vre chanpyon an !',
      price: 400,
      isActive: true,
    },
  ],
  giftTransactions: [
    {
      id: 'gtx_seed_1',
      referenceId: 'KAD-102938',
      senderId: 'usr_demo_2',
      senderName: 'Marie Carmelle',
      receiverId: 'usr_demo_1',
      receiverName: 'Jean William',
      receiverPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      giftId: 'gift_chat',
      giftName: 'Chat',
      giftIcon: '🐱',
      price: 20,
      competitionId: 'comp_1',
      timestamp: '2025-06-21T14:00:00Z',
      status: 'konfime'
    }
  ],
  votes: [
    {
      id: 'vot_seed_1',
      referenceId: 'VOT-889922',
      voterId: 'usr_demo_2',
      voterName: 'Marie Carmelle',
      competitionId: 'comp_1',
      matchId: 'match_comp_1_top8_1',
      playerId: 'usr_demo_1',
      playerName: 'Jean William',
      amount: 15,
      timestamp: '2025-06-21T15:00:00Z',
      status: 'konfime'
    }
  ],
  balonProgress: [
    {
      userId: 'usr_demo_1',
      currentLevel: 4,
      unlockedLevels: [1, 2, 3, 4],
      completedLevels: [1, 2, 3],
      levelResults: [
        { level: 1, won: true, pointsEarned: 100, chosenBall: 4, winningBall: 4, timestamp: '2025-06-25T14:00:00Z' },
        { level: 2, won: true, pointsEarned: 100, chosenBall: 7, winningBall: 7, timestamp: '2025-06-25T14:05:00Z' },
        { level: 3, won: true, pointsEarned: 100, chosenBall: 2, winningBall: 2, timestamp: '2025-06-25T14:10:00Z' }
      ],
      totalPoints: 300,
      status: 'in_progress',
      sessionPaid: true,
      lastUpdated: '2025-06-25T14:10:00Z'
    }
  ],
  balonConfig: {
    pointsPerWin: 100,
    isActive: true,
    entryFee: 50,
    totalLevels: 7
  },
  auditLogs: [
    {
      id: 'log_1',
      timestamp: '2025-06-20T10:20:00Z',
      action: 'KONFIME_DEPO',
      details: 'Depo DEP-409182 konfime pou Jean William (1,250 HT)',
      actor: 'Prince509'
    }
  ],
  avionCrashConfig: {
    isActive: true,
    isMaintenance: false,
    minBet: 10,
    maxBet: 5000,
    houseEdge: 0.04
  },
  avionCrashRounds: [
    {
      id: 'crash_demo_1',
      userId: 'usr_demo_1',
      userName: 'Jean William',
      userPhone: '+509 40128456',
      betAmount: 100,
      crashMultiplier: 2.35,
      cashoutMultiplier: 1.80,
      payoutAmount: 180,
      netProfit: 80,
      status: 'cashed_out',
      obstacleType: 'loraj',
      startTime: '2026-10-27T10:00:00Z',
      endTime: '2026-10-27T10:00:08Z'
    },
    {
      id: 'crash_demo_2',
      userId: 'usr_demo_2',
      userName: 'Marie Carmelle',
      userPhone: '+509 37889922',
      betAmount: 50,
      crashMultiplier: 1.42,
      payoutAmount: 0,
      netProfit: -50,
      status: 'crashed',
      obstacleType: 'zwazo',
      startTime: '2026-10-27T10:05:00Z',
      endTime: '2026-10-27T10:05:04Z'
    }
  ]
};

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin + 'salt_kekechallenge_2025').digest('hex');
}

function generateRef(prefix: 'DEP' | 'RET' | 'VOT' | 'KAD' | 'CRASH' | string): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${rand}`;
}

// User level calculation helper based on validated score/XP
function calculateUserLevel(totalPoints: number): { level: number; stars: number } {
  let level = 1;
  if (totalPoints >= 8000) level = 6;
  else if (totalPoints >= 5000) level = 5;
  else if (totalPoints >= 3000) level = 4;
  else if (totalPoints >= 1500) level = 3;
  else if (totalPoints >= 500) level = 2;

  let stars = 1;
  if (level >= 6) stars = 5;
  else if (level >= 5) stars = 4;
  else if (level >= 4) stars = 3;
  else if (level >= 3) stars = 2;

  return { level, stars };
}

// Check time authorization for competition (America/Port-au-Prince timezone)
function checkCompetitionTimeWindow(comp: any): { allowed: boolean; reason?: string } {
  if (comp.status === 'An poz') {
    return { allowed: false, reason: 'Konpetisyon an an poz pou kounye a pa administratè a.' };
  }
  if (comp.status === 'Anile') {
    return { allowed: false, reason: 'Konpetisyon an te anile.' };
  }
  if (comp.status === 'Fini' || comp.status === 'finished') {
    return { allowed: false, reason: 'Konpetisyon an fini ofisyèlman. Ou pa ka kontinye jwe nan konpetisyon sa a.' };
  }

  const now = new Date();
  if (comp.startDateTimeISO) {
    const start = new Date(comp.startDateTimeISO);
    if (!isNaN(start.getTime()) && now < start) {
      return {
        allowed: false,
        reason: `Konpetisyon an ap kòmanse a ${start.toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' })}. Li poko ouvè.`
      };
    }
  }

  if (comp.endDateTimeISO) {
    const end = new Date(comp.endDateTimeISO);
    if (!isNaN(end.getTime()) && now > end) {
      comp.status = 'Fini';
      return {
        allowed: false,
        reason: `Lè konpetisyon an te fini a ${end.toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' })}. A 4:31 PM oswa apre lè fen an, jwè yo pa dwe kapab kontinye jwe nan konpetisyon sa a.`
      };
    }
  }

  return { allowed: true };
}

// Explicit content moderation filter
function moderatePostContent(title: string, description: string, mediaUrl?: string): { allowed: boolean; reason?: string } {
  const combined = `${title || ''} ${description || ''} ${mediaUrl || ''}`.toLowerCase();

  const explicitPatterns: RegExp[] = [
    /\b(pòno|pònogra(fi|fik)?|pòn|porn|porno|pornography|pornographique)\b/i,
    /\b(xxx|nsfw|sex(e|ual|y)?|seks|seksyèl)\b/i,
    /\b(koko|zozo|vajen|penis|pénis|vagin)\b/i,
    /\b(boudon\s+toutouni|kale\s+bounda|toutouni|tout\s+ouni|nu\s+intégral|nudité|nude|nudity)\b/i,
    /\b(fè\s+sèks|fè\s+lanmou\s+an\s+dirèk|souse\s+zozo|souse\s+koko|fellation|blowjob|masturb(asyon|ation|er))\b/i,
    /\b(onlyfans|xhamster|pornhub|xvideos|redtube|cam4)\b/i,
    /\b(baise|salope|putain|baisodrome|hardcore\s+sex)\b/i
  ];

  for (const pattern of explicitPatterns) {
    if (pattern.test(combined)) {
      return {
        allowed: false,
        reason: 'Publication sa a pa ka pibliye paske li vyole règ kontni Master Play sou kontni seksyèl ak pònografi.'
      };
    }
  }

  return { allowed: true };
}

function allocateMasterPlayId(db: DBState, userId: string): string {
  if (!db.idGenerator) {
    db.idGenerator = {
      nextCounter: 1,
      totalCapacity: 1500000000,
      allocatedIds: {},
    };
  }

  let seq = db.idGenerator.nextCounter || 1;
  let candidate = `MASTERPLAY-${String(seq).padStart(9, '0')}`;
  while (
    db.idGenerator.allocatedIds[candidate] ||
    db.users.some((u) => u.masterPlayId === candidate)
  ) {
    seq += 1;
    candidate = `MASTERPLAY-${String(seq).padStart(9, '0')}`;
  }

  db.idGenerator.nextCounter = seq + 1;
  db.idGenerator.allocatedIds[candidate] = userId;
  return candidate;
}

// Load DB with multi-tier permanence and Users Vault recovery
function loadDB(): DBState {
  try {
    let rawData: DBState | null = null;
    let fromBackup = false;

    if (fs.existsSync(DB_FILE)) {
      try {
        rawData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (readErr) {
        console.error('Failed reading primary db.json, attempting backup...', readErr);
      }
    }

    if (!rawData && fs.existsSync(DB_BACKUP_FILE)) {
      try {
        rawData = JSON.parse(fs.readFileSync(DB_BACKUP_FILE, 'utf-8'));
        fromBackup = true;
      } catch (bErr) {
        console.error('Failed reading db_backup.json:', bErr);
      }
    }

    if (!rawData) {
      saveDB(defaultInitialState);
      return defaultInitialState;
    }

    const data: DBState = rawData;
    let modified = fromBackup;

    if (!data.users) {
      data.users = [];
      modified = true;
    }

    // Permanent Users Vault Merge: ensures user accounts NEVER disappear
    if (fs.existsSync(USERS_VAULT_FILE)) {
      try {
        const vaultUsers: any[] = JSON.parse(fs.readFileSync(USERS_VAULT_FILE, 'utf-8'));
        if (Array.isArray(vaultUsers) && vaultUsers.length > 0) {
          vaultUsers.forEach(vUser => {
            const cleanVPhone = (vUser.phoneNumber || '').replace(/\D/g, '');
            const existingIdx = data.users.findIndex(u =>
              u.id === vUser.id || (cleanVPhone && (u.phoneNumber || '').replace(/\D/g, '') === cleanVPhone)
            );
            if (existingIdx === -1) {
              data.users.push(vUser);
              modified = true;
            } else {
              // Ensure enriched fields are retained
              if (!data.users[existingIdx].favoritePostIds && vUser.favoritePostIds) {
                data.users[existingIdx].favoritePostIds = vUser.favoritePostIds;
                modified = true;
              }
              if (!data.users[existingIdx].followingIds && vUser.followingIds) {
                data.users[existingIdx].followingIds = vUser.followingIds;
                modified = true;
              }
              if (!data.users[existingIdx].followerIds && vUser.followerIds) {
                data.users[existingIdx].followerIds = vUser.followerIds;
                modified = true;
              }
              if (!data.users[existingIdx].certificationStatus && vUser.certificationStatus) {
                data.users[existingIdx].certificationStatus = vUser.certificationStatus;
                data.users[existingIdx].verified = vUser.verified ?? (vUser.certificationStatus === 'sètifye');
                data.users[existingIdx].certifiedAt = vUser.certifiedAt;
                data.users[existingIdx].certifiedBy = vUser.certifiedBy;
                modified = true;
              }
            }
          });
        }
      } catch (vaultErr) {
        console.error('Error merging users vault:', vaultErr);
      }
    }

    // Ensure gifts exist
    if (!data.gifts || data.gifts.length === 0) {
      data.gifts = defaultInitialState.gifts;
      modified = true;
    } else {
      defaultInitialState.gifts.forEach(dg => {
        if (!data.gifts.some(g => g.id === dg.id)) {
          data.gifts.push(dg);
          modified = true;
        }
      });
    }

    if (!data.giftTransactions) {
      data.giftTransactions = defaultInitialState.giftTransactions;
      modified = true;
    }

    if (!data.votes) {
      data.votes = defaultInitialState.votes;
      modified = true;
    }

    if (!data.balonProgress) {
      data.balonProgress = defaultInitialState.balonProgress || [];
      modified = true;
    }

    if (!data.balonConfig) {
      data.balonConfig = defaultInitialState.balonConfig || { pointsPerWin: 100, isActive: true, entryFee: 50 };
      modified = true;
    }

    if (!data.userGameProgress) {
      data.userGameProgress = {};
      modified = true;
    }

    if (!data.subscriptions) {
      data.subscriptions = [];
      modified = true;
    }

    if (!data.avionCrashConfig) {
      data.avionCrashConfig = defaultInitialState.avionCrashConfig;
      modified = true;
    }

    if (!data.avionCrashRounds) {
      data.avionCrashRounds = defaultInitialState.avionCrashRounds || [];
      modified = true;
    }

    if (!data.posts) {
      data.posts = defaultInitialState.posts;
      modified = true;
    }

    // Ensure posts have social fields
    data.posts.forEach((p: any) => {
      if (!p.likes) p.likes = [];
      if (!p.favorites) p.favorites = [];
      if (!p.comments) p.comments = [];
      if (p.viewsCount === undefined) p.viewsCount = Math.floor(Math.random() * 80) + 12;
      if (p.sharesCount === undefined) p.sharesCount = Math.floor(Math.random() * 15);
      if (!p.authorId) {
        p.authorId = 'usr_admin';
        p.authorName = p.author || 'Admin Prince509';
      }
    });

    // Ensure all users have enriched stats and permanent relationship arrays
    data.users.forEach((u: any) => {
      if (u.stars === undefined) { u.stars = Math.max(1, Math.min(5, u.level || 1)); modified = true; }
      if (!u.followingIds) { u.followingIds = []; modified = true; }
      if (!u.followerIds) { u.followerIds = []; modified = true; }
      if (u.followersCount === undefined) { u.followersCount = u.followerIds.length; modified = true; }
      if (u.followingCount === undefined) { u.followingCount = u.followingIds.length; modified = true; }
      if (!u.favoritePostIds) { u.favoritePostIds = []; modified = true; }
      if (u.giftsReceivedCount === undefined) { u.giftsReceivedCount = 0; modified = true; }
      if (u.giftsReceivedValue === undefined) { u.giftsReceivedValue = 0; modified = true; }
      if (u.matchesWon === undefined) { u.matchesWon = 0; modified = true; }
      if (u.matchesPlayed === undefined) { u.matchesPlayed = 0; modified = true; }
      if (u.votesReceived === undefined) { u.votesReceived = 0; modified = true; }
      if (!u.levelHistory) {
        u.levelHistory = [{ level: u.level || 1, date: u.createdAt || new Date().toISOString(), reason: 'Kreyasyon kont' }];
        modified = true;
      }
      if (u.isMonetized === undefined) { u.isMonetized = false; modified = true; }
      if (u.totalEarnings === undefined) { u.totalEarnings = 0; modified = true; }
      if (u.availableEarnings === undefined) { u.availableEarnings = 0; modified = true; }
      if (u.paidEarnings === undefined) { u.paidEarnings = 0; modified = true; }
      if (u.monetizedLikesCount === undefined) { u.monetizedLikesCount = 0; modified = true; }
      if (u.followerMilestonePaid === undefined) { u.followerMilestonePaid = false; modified = true; }
      if (u.monetizationStatus === undefined) { u.monetizationStatus = 'none'; modified = true; }
    });

    if (!data.monetizationConfig) {
      data.monetizationConfig = {
        isEnabled: true,
        activationFee: 250,
        minFollowersRequired: 1000,
        earningsPer1000Likes: 500,
        milestoneFollowersReward: 1000,
        followerMilestoneRequired: 1000,
        followerMilestoneBonus: 1000,
        minPayoutAmount: 500,
        updatedAt: new Date().toISOString()
      };
      modified = true;
    } else {
      if (data.monetizationConfig.followerMilestoneRequired === undefined) data.monetizationConfig.followerMilestoneRequired = 1000;
      if (data.monetizationConfig.followerMilestoneBonus === undefined) data.monetizationConfig.followerMilestoneBonus = 1000;
      if (data.monetizationConfig.minPayoutAmount === undefined) data.monetizationConfig.minPayoutAmount = 500;
    }

    if (!data.financialLedger) {
      data.financialLedger = [];
      modified = true;
    }

    if (!data.algorithmApprovals) {
      data.algorithmApprovals = [];
      modified = true;
    }

    // Ensure all 12 official games are present without wiping any existing data
    defaultInitialState.games.forEach((officialGame) => {
      const idx = data.games.findIndex((g) => g.id === officialGame.id);
      if (idx === -1) {
        data.games.push(officialGame as any);
        modified = true;
      } else {
        data.games[idx] = { ...officialGame, ...data.games[idx] };
      }
    });

    // Ensure all competitions have enriched fields and matches
    const allGameIds = data.games.map(g => g.id);
    data.competitions.forEach((comp: any) => {
      if (!comp.authorizedGameIds || comp.authorizedGameIds.length === 0) {
        comp.authorizedGameIds = allGameIds.slice(0, 6);
        modified = true;
      }
      if (!comp.scheduleType) {
        comp.scheduleType = 'weekly_7days';
        modified = true;
      }
      if (!comp.currentDay) {
        comp.currentDay = 'Lendi';
        modified = true;
      }
      if (!comp.scores) {
        comp.scores = [];
        modified = true;
      }
      if (!comp.matches) {
        comp.matches = [];
        modified = true;
      }
      if (!comp.top8QualifiedUserIds) {
        comp.top8QualifiedUserIds = [];
        modified = true;
      }
      if (!comp.tiebreakerRule) {
        comp.tiebreakerRule = 'pi_wo_pwen_match';
        modified = true;
      }
      if (comp.votingEnabled === undefined) {
        comp.votingEnabled = true;
        modified = true;
      }
      if (comp.votePrice === undefined) {
        comp.votePrice = 15;
        modified = true;
      }
      if (!comp.qualificationCount) {
        comp.qualificationCount = 8;
        modified = true;
      }

      if (comp.endDateTimeISO) {
        const end = new Date(comp.endDateTimeISO);
        if (!isNaN(end.getTime()) && new Date() > end && comp.status !== 'Fini' && comp.status !== 'finished') {
          comp.status = 'Fini';
          modified = true;
        }
      }

      // Ensure participant scores have level, stars, followers, votes, gifts
      comp.scores.forEach((s: any, idx: number) => {
        if (s.level === undefined) s.level = Math.max(1, Math.min(6, Math.floor(s.totalScore / 500) + 1));
        if (s.stars === undefined) s.stars = Math.max(1, Math.min(5, s.level));
        if (s.followers === undefined) s.followers = Math.floor(Math.random() * 50) + 5;
        if (s.matchesWon === undefined) s.matchesWon = idx < 4 ? 2 : idx < 8 ? 1 : 0;
        if (s.votesCount === undefined) s.votesCount = Math.floor(Math.random() * 35) + 5;
        if (s.giftsCount === undefined) s.giftsCount = Math.floor(Math.random() * 10);
        if (s.giftsValue === undefined) s.giftsValue = s.giftsCount * 50;
      });

      // Ensure matches have voting & gift fields
      comp.matches.forEach((m: any) => {
        if (m.votingEnabled === undefined) m.votingEnabled = true;
        if (m.votePrice === undefined) m.votePrice = comp.votePrice || 15;
        if (m.votes1 === undefined) m.votes1 = 14;
        if (m.votes2 === undefined) m.votes2 = 11;
        if (m.gifts1 === undefined) m.gifts1 = 4;
        if (m.gifts2 === undefined) m.gifts2 = 3;
        if (m.player1) {
          if (m.player1.level === undefined) m.player1.level = 3;
          if (m.player1.stars === undefined) m.player1.stars = 3;
          if (m.player1.followers === undefined) m.player1.followers = 45;
          if (m.player1.points === undefined) m.player1.points = 2400;
          if (m.player1.votesCount === undefined) m.player1.votesCount = m.votes1;
          if (m.player1.giftsCount === undefined) m.player1.giftsCount = m.gifts1;
        }
        if (m.player2) {
          if (m.player2.level === undefined) m.player2.level = 2;
          if (m.player2.stars === undefined) m.player2.stars = 2;
          if (m.player2.followers === undefined) m.player2.followers = 38;
          if (m.player2.points === undefined) m.player2.points = 2150;
          if (m.player2.votesCount === undefined) m.player2.votesCount = m.votes2;
          if (m.player2.giftsCount === undefined) m.player2.giftsCount = m.gifts2;
        }
      });
    });

    if (!data.liveStreams) {
      data.liveStreams = [
        {
          id: 'live_featured_1',
          streamerId: 'usr_demo_1',
          streamerName: 'Jean William',
          streamerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: '🔥 Kèkè Challenge Live - Finalis Match VS & Kado',
          category: 'Gaming & Challenge',
          status: 'active',
          viewersCount: 28,
          viewerIds: ['usr_1', 'usr_2'],
          likesCount: 1420,
          giftsReceivedTotal: 450,
          streamerEarnings: 427.5,
          platformFee: 22.5,
          startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
        }
      ];
      modified = true;
    }

    if (!data.liveComments) {
      data.liveComments = [
        {
          id: 'lcom_1',
          streamId: 'live_featured_1',
          userId: 'usr_2',
          userName: 'Pierre Alex',
          userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          text: 'Bonjou tout moun! Jean William ap kraze jwèt la jodi a! 🔥',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 'lcom_2',
          streamId: 'live_featured_1',
          userId: 'usr_3',
          userName: 'Marie Carmelle',
          userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          text: 'M voye yon Kè pou ou Jean! Bravooo! 💖',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ];
      modified = true;
    }

    if (!data.liveGiftTransactions) {
      data.liveGiftTransactions = [];
      modified = true;
    }

    if (!data.liveReports) {
      data.liveReports = [];
      modified = true;
    }

    if (!data.pushSubscriptions) {
      data.pushSubscriptions = [];
      modified = true;
    }

    if (!data.idGenerator) {
      data.idGenerator = {
        nextCounter: 1,
        totalCapacity: 1500000000,
        allocatedIds: {},
      };
      modified = true;
    }

    if (!data.adminSessions) {
      data.adminSessions = {};
      modified = true;
    }

    // Backfill masterPlayId for any existing user without one
    data.users.forEach((u) => {
      if (!u.masterPlayId) {
        u.masterPlayId = allocateMasterPlayId(data, u.id);
        modified = true;
      }
      if (!u.role) {
        u.role = 'USER';
      }
    });

    // Ensure primary ADMIN account (40987659) exists on server
    const adminPhoneClean = '40987659';
    const existingAdminIdx = data.users.findIndex(
      (u) => u.phoneNumber.replace(/\D/g, '').endsWith(adminPhoneClean)
    );
    const adminPinHash = hashPin('prince509');
    if (existingAdminIdx === -1) {
      const adminId = 'usr_admin_masterplay';
      const adminUser: any = {
        id: adminId,
        masterPlayId: allocateMasterPlayId(data, adminId),
        fullName: 'Administratè MASTER PLAY',
        firstName: 'Administratè',
        lastName: 'MASTER PLAY',
        phoneNumber: adminPhoneClean,
        pinHash: adminPinHash,
        role: 'ADMIN',
        isAdmin: true,
        profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        balance: 0,
        reservedBalance: 0,
        level: 5,
        stars: 5,
        points: 0,
        followersCount: 0,
        followingCount: 0,
        followingIds: [],
        followerIds: [],
        favoritePostIds: [],
        isOnline: true,
        isVerifiedInDatabase: true,
        verifiedInDatabaseAt: new Date().toISOString(),
        certificationStatus: 'sètifye',
        verified: true,
        certifiedAt: new Date().toISOString(),
        certifiedBy: 'Sistèm MASTER PLAY',
        createdAt: new Date().toISOString(),
      };
      data.users.unshift(adminUser);
      modified = true;
    } else {
      const adm = data.users[existingAdminIdx];
      if (adm.role !== 'ADMIN' || !adm.isAdmin || adm.pinHash !== adminPinHash || adm.certificationStatus !== 'sètifye' || adm.verified !== true) {
        adm.role = 'ADMIN';
        adm.isAdmin = true;
        adm.pinHash = adminPinHash;
        adm.certificationStatus = 'sètifye';
        adm.verified = true;
        modified = true;
      }
    }

    // Backfill certificationStatus and verified boolean for existing accounts
    data.users.forEach((u) => {
      if (!u.certificationStatus) {
        if (u.role === 'ADMIN' || u.isAdmin || u.isVerifiedInDatabase) {
          u.certificationStatus = 'sètifye';
          u.verified = true;
          if (!u.certifiedAt) u.certifiedAt = u.verifiedInDatabaseAt || u.createdAt;
        } else {
          u.certificationStatus = 'non_sètifye';
          u.verified = false;
        }
        modified = true;
      } else {
        const expectedVerified = u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || Boolean(u.isAdmin);
        if (u.verified !== expectedVerified) {
          u.verified = expectedVerified;
          modified = true;
        }
      }
    });

    // Initialize & migrate Global App Memory structure without losing existing data
    if (!data.globalMemory) {
      data.globalMemory = {
        schemaVersion: 1,
        dataVersion: 1,
        lastUpdatedAt: new Date().toISOString(),
        backupSnapshots: [],
        events: [],
        syncErrors: [],
        processedMutationIds: [],
      };
      modified = true;
    } else {
      if (!Array.isArray(data.globalMemory.backupSnapshots)) {
        data.globalMemory.backupSnapshots = [];
        modified = true;
      }
      if (!Array.isArray(data.globalMemory.events)) {
        data.globalMemory.events = [];
        modified = true;
      }
      if (!Array.isArray(data.globalMemory.syncErrors)) {
        data.globalMemory.syncErrors = [];
        modified = true;
      }
      if (!Array.isArray(data.globalMemory.processedMutationIds)) {
        data.globalMemory.processedMutationIds = [];
        modified = true;
      }
    }

    if (modified) {
      saveDB(data);
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json, returning default:', err);
    return defaultInitialState;
  }
}

function sanitizeMemoryPayload(raw: any): Record<string, any> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const blocked = new Set(['pin', 'pinhash', 'password', 'confirmpin', 'adminpin', 'admintoken', 'secret']);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (blocked.has(k.toLowerCase())) continue;
    if (typeof v === 'string' && v.length > 500) {
      out[k] = v.slice(0, 500) + '...';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function recordMemoryEvent(
  db: DBState,
  params: {
    userId: string;
    actionType: string;
    pageOrFeature: string;
    result?: 'success' | 'error' | 'pending';
    data?: Record<string, any>;
    clientMutationId?: string;
  }
) {
  if (!db.globalMemory) {
    db.globalMemory = {
      schemaVersion: 1,
      dataVersion: 1,
      lastUpdatedAt: new Date().toISOString(),
      backupSnapshots: [],
      events: [],
      syncErrors: [],
      processedMutationIds: [],
    };
  }
  const now = new Date();
  const evt = {
    eventId: 'evt_' + now.getTime() + '_' + Math.random().toString(36).substring(2, 7),
    userId: params.userId || 'system',
    actionType: params.actionType,
    dateTime: now.toISOString(),
    serverTimestamp: now.getTime(),
    pageOrFeature: params.pageOrFeature,
    result: params.result || 'success',
    data: sanitizeMemoryPayload(params.data),
    clientMutationId: params.clientMutationId,
  };
  db.globalMemory.events.unshift(evt);
  if (db.globalMemory.events.length > 5000) {
    db.globalMemory.events = db.globalMemory.events.slice(0, 5000);
  }
  return evt;
}

function createBackupSnapshot(data: DBState): {
  version: number;
  createdAt: string;
  fileName: string;
  usersCount: number;
  postsCount: number;
  checksum: string;
} | null {
  try {
    if (!data.globalMemory) return null;
    const version = data.globalMemory.dataVersion || 1;
    const nowIso = new Date().toISOString();
    const safeStamp = nowIso.replace(/[:.]/g, '-');
    const fileName = `db_v${version}_${safeStamp}.json`;
    const filePath = path.resolve(BACKUP_DIR, fileName);
    const jsonStr = JSON.stringify(data, null, 2);
    const checksum = crypto.createHash('sha256').update(jsonStr).digest('hex').slice(0, 16);
    fs.writeFileSync(filePath, jsonStr, 'utf-8');

    const meta = {
      version,
      createdAt: nowIso,
      fileName,
      usersCount: Array.isArray(data.users) ? data.users.length : 0,
      postsCount: Array.isArray(data.posts) ? data.posts.length : 0,
      checksum,
    };
    data.globalMemory.lastBackupAt = nowIso;
    data.globalMemory.lastBackupVersion = version;
    data.globalMemory.backupSnapshots.unshift(meta);
    if (data.globalMemory.backupSnapshots.length > 10) {
      const removed = data.globalMemory.backupSnapshots.splice(10);
      removed.forEach((r) => {
        try {
          const oldPath = path.resolve(BACKUP_DIR, r.fileName);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch {}
      });
    }
    return meta;
  } catch (err) {
    console.error('Error creating backup snapshot:', err);
    return null;
  }
}

// Atomic Save DB with corruption protection, versioning, continuous backup, and permanent Users Vault
function saveDB(data: DBState): void {
  try {
    if (!data || typeof data !== 'object' || !Array.isArray(data.users)) {
      console.error('Refusing to save corrupted DB state (missing users array).');
      return;
    }

    // Accidental wipe protection: refuse to overwrite populated DB with empty users array
    if (data.users.length === 0 && fs.existsSync(DB_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (Array.isArray(existing?.users) && existing.users.length > 0) {
          console.error('Refusing to overwrite populated db.json with empty users array!');
          return;
        }
      } catch {}
    }

    if (!data.globalMemory) {
      data.globalMemory = {
        schemaVersion: 1,
        dataVersion: 1,
        lastUpdatedAt: new Date().toISOString(),
        backupSnapshots: [],
        events: [],
        syncErrors: [],
        processedMutationIds: [],
      };
    }
    data.globalMemory.dataVersion = (data.globalMemory.dataVersion || 0) + 1;
    data.globalMemory.lastUpdatedAt = new Date().toISOString();

    if (data.globalMemory.dataVersion % 25 === 0) {
      createBackupSnapshot(data);
    }

    const tempFile = `${DB_FILE}.tmp`;
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // 1. Continuous mirror backup
    try {
      fs.writeFileSync(DB_BACKUP_FILE, jsonStr, 'utf-8');
    } catch (bErr) {
      console.error('Error writing db_backup.json:', bErr);
    }

    // 2. Permanent Users Vault
    try {
      if (Array.isArray(data.users) && data.users.length > 0) {
        fs.writeFileSync(USERS_VAULT_FILE, JSON.stringify(data.users, null, 2), 'utf-8');
      }
    } catch (vErr) {
      console.error('Error writing db_users_vault.json:', vErr);
    }
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Atomically save or update a single user in permanent Users Vault
function saveUserToVault(user: any) {
  try {
    let vaultUsers: any[] = [];
    if (fs.existsSync(USERS_VAULT_FILE)) {
      try {
        vaultUsers = JSON.parse(fs.readFileSync(USERS_VAULT_FILE, 'utf-8'));
      } catch (e) {
        vaultUsers = [];
      }
    }
    const idx = vaultUsers.findIndex((u: any) => u.id === user.id);
    if (idx >= 0) {
      vaultUsers[idx] = { ...vaultUsers[idx], ...user };
    } else {
      vaultUsers.push(user);
    }
    fs.writeFileSync(USERS_VAULT_FILE, JSON.stringify(vaultUsers, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error in saveUserToVault:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Gracefully catch malformed JSON bodies or bad URI encodings without leaking a raw 400 HTML page
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err instanceof SyntaxError || err instanceof URIError || err.status === 400)) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: 'Rekèt la pa valid (fòma JSON oswa URL envalid).' });
      }
      return res.redirect(302, '/');
    }
    return next(err);
  });

  // Guard against malformed percent-encoded URLs on page navigation
  app.use((req, res, next) => {
    try {
      decodeURIComponent(req.path);
      return next();
    } catch {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: 'URL la pa valid.' });
      }
      return res.redirect(302, '/');
    }
  });

  // Helper for audit logs
  function logAudit(db: DBState, action: string, details: string, actor: string = 'Administratè') {
    db.auditLogs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details,
      actor
    });
    if (db.auditLogs.length > 200) {
      db.auditLogs = db.auditLogs.slice(0, 200);
    }
    recordMemoryEvent(db, {
      userId: actor || 'system',
      actionType: action,
      pageOrFeature: 'MASTER PLAY System',
      result: 'success',
      data: { details },
    });
  }

  // Robust helper to locate a user by unique ID, Firebase UID, Master Play ID, clean phone number, email, or Google ID
  function findUserInDB(db: DBState, identifier?: string | null): any {
    if (!identifier || typeof identifier !== 'string') return null;
    const cleanId = identifier.trim();
    if (!cleanId) return null;

    // 1. Direct unique ID match (exact)
    let user = db.users.find(u => u.id === cleanId);
    if (user) return user;

    // 2. Firebase UID match (permanent identity key)
    user = db.users.find(u => u.firebaseUid && u.firebaseUid === cleanId);
    if (user) return user;

    // 3. MASTER PLAY ID match (case-insensitive)
    user = db.users.find(u => u.masterPlayId && u.masterPlayId.toLowerCase() === cleanId.toLowerCase());
    if (user) return user;

    // 4. Case-insensitive ID match
    user = db.users.find(u => u.id.toLowerCase() === cleanId.toLowerCase());
    if (user) return user;

    // 5. Email match (case-insensitive)
    if (cleanId.includes('@')) {
      user = db.users.find(u => (u.email || '').toLowerCase() === cleanId.toLowerCase());
      if (user) return user;
    }

    // 6. Google ID match
    user = db.users.find(u => u.googleId === cleanId);
    if (user) return user;

    // 7. Normalized Phone match (stripping spaces, dashes, parentheses)
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly.length >= 8) {
      user = db.users.find(u => {
        const uDigits = (u.phoneNumber || '').replace(/\D/g, '');
        return uDigits === digitsOnly || (digitsOnly.length === 8 && uDigits.endsWith(digitsOnly)) || (uDigits.length === 8 && digitsOnly.endsWith(uDigits));
      });
      if (user) return user;
    }

    return null;
  }

  // Helper for user notifications
  function addNotification(db: DBState, userId: string, title: string, message: string, type: 'depo' | 'retre' | 'konpetisyon' | 'rezilta' | 'anons' | 'vot' | 'kado') {
    db.notifications.unshift({
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    if (db.notifications.length > 300) {
      db.notifications = db.notifications.slice(0, 300);
    }
  }

  // Central Financial Ledger (Requirements 11 & 12)
  function recordFinancialLedger(
    db: DBState,
    entry: {
      userId: string;
      type: 'depot' | 'retrait' | 'frais_monetizasyon' | 'revni_likes' | 'bonis_abonné' | 'peman_revni' | 'transfe_balans' | 'frai_jwèt' | 'pri_konpetisyon';
      amount: number;
      status: 'pending' | 'completed' | 'rejected';
      source: string;
      destination: string;
      description: string;
      referenceId?: string;
      metadata?: any;
    }
  ) {
    if (!db.financialLedger) db.financialLedger = [];
    const newEntry = {
      id: 'ledg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: entry.userId,
      type: entry.type,
      amount: entry.amount,
      status: entry.status,
      source: entry.source,
      destination: entry.destination,
      description: entry.description,
      referenceId: entry.referenceId || ('REF-' + Date.now().toString(36).toUpperCase()),
      createdAt: new Date().toISOString(),
      metadata: entry.metadata || {}
    };
    db.financialLedger.unshift(newEntry);
    if (db.financialLedger.length > 500) {
      db.financialLedger = db.financialLedger.slice(0, 500);
    }
    return newEntry;
  }

  // Recalculate Monetization Earnings (Sections 7, 8, 9, 10)
  function recalculateMonetizationEarnings(db: DBState, user: any) {
    if (!user || (!user.isMonetized && user.monetizationStatus !== 'active')) return;
    const config = db.monetizationConfig || {
      activationFee: 250,
      minFollowersRequired: 1000,
      earningsPer1000Likes: 500,
      followerMilestoneRequired: 1000,
      followerMilestoneBonus: 1000,
      minPayoutAmount: 500,
      isEnabled: true
    };

    // Calculate total likes on all posts authored by user
    const userPosts = (db.posts || []).filter(p => p.authorId === user.id);
    const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
    user.monetizedLikesCount = totalLikes;

    // Calculate earnings from likes (e.g. 500 G per 1000 likes)
    const ratePer1000 = config.earningsPer1000Likes || 500;
    const likeEarnings = Math.floor(totalLikes / 1000) * ratePer1000;

    // Check 1,000 followers milestone bonus (awarded once)
    const followers = user.followersCount || (user.followerIds ? user.followerIds.length : 0);
    let milestoneBonus = 0;
    if (followers >= (config.followerMilestoneRequired || 1000)) {
      if (!user.followerMilestonePaid) {
        user.followerMilestonePaid = true;
        milestoneBonus = config.followerMilestoneBonus || 1000;
        recordFinancialLedger(db, {
          userId: user.id,
          type: 'bonis_abonné',
          amount: milestoneBonus,
          status: 'completed',
          source: 'Master Play Kreyatè Bonis',
          destination: 'Balans Revni Kreyatè',
          description: `Bonis etap 1,000 Abòne akòde pou kreyatè ${user.fullName || user.id}`
        });
        addNotification(
          db,
          user.id,
          '🎉 Felisitasyon pou 1,000 Abòne !',
          `Ou rive nan etap 1,000 abòne ! Ou resevwa yon bonis espesyal ${milestoneBonus} HT sou revni kreyatè ou.`,
          'anons'
        );
      }
    }

    const previousPaid = user.paidEarnings || 0;
    const milestoneTotal = user.followerMilestonePaid ? (config.followerMilestoneBonus || 1000) : 0;
    user.totalEarnings = likeEarnings + milestoneTotal;
    user.availableEarnings = Math.max(0, user.totalEarnings - previousPaid);

    // Save to users vault
    saveUserToVault(user);
  }

  // Clean Fake Accounts and Normalize Follow Lists
  function cleanFakeAccounts(db: DBState): { removedCount: number; sanitizedFollowersCount: number } {
    const validUserIds = new Set(db.users.map(u => u.id));
    let removedCount = 0;

    // Identify dummy or orphaned accounts if any
    const genuineUsers = db.users.filter(u => {
      const isFake = u.id.startsWith('dummy_') || u.id.startsWith('test_fake_');
      if (isFake) {
        removedCount++;
        return false;
      }
      return true;
    });

    db.users = genuineUsers;
    const currentValidIds = new Set(db.users.map(u => u.id));

    // Sanitize follower and following lists for all remaining users
    let sanitizedFollowersCount = 0;
    db.users.forEach(u => {
      if (u.followerIds) {
        const origLen = u.followerIds.length;
        u.followerIds = u.followerIds.filter((id: string) => currentValidIds.has(id));
        if (origLen !== u.followerIds.length) sanitizedFollowersCount++;
        u.followersCount = u.followerIds.length;
      }
      if (u.followingIds) {
        u.followingIds = u.followingIds.filter((id: string) => currentValidIds.has(id));
        u.followingCount = u.followingIds.length;
      }
      saveUserToVault(u);
    });

    return { removedCount, sanitizedFollowersCount };
  }

  // Algorithm Intelligence: Anomaly Detection, Health Score & Recommendations
  function analyzeSystemData(db: DBState): {
    healthScore: number;
    anomalies: any[];
    recommendations: any[];
    approvals: any[];
  } {
    const anomalies: any[] = [];
    const recommendations: any[] = [];

    // 1. Check for duplicate phone numbers
    const phoneMap = new Map<string, string[]>();
    db.users.forEach(u => {
      const p = (u.phoneNumber || '').replace(/\D/g, '');
      if (p.length >= 8) {
        if (!phoneMap.has(p)) phoneMap.set(p, []);
        phoneMap.get(p)!.push(u.id);
      }
    });
    phoneMap.forEach((uids, phone) => {
      if (uids.length > 1) {
        anomalies.push({
          id: 'anom_dup_phone_' + phone,
          type: 'duplicate_account',
          severity: 'high',
          description: `Plizyè kont detekte ak menm nimewo ${phone}: ${uids.join(', ')}`,
          userId: uids[0],
          timestamp: new Date().toISOString(),
          status: 'detected'
        });
      }
    });

    // 2. Check for negative balances
    db.users.forEach(u => {
      if ((u.balance || 0) < 0) {
        anomalies.push({
          id: 'anom_neg_bal_' + u.id,
          type: 'balance_discrepancy',
          severity: 'critical',
          description: `Itilizatè ${u.fullName} (${u.id}) gen yon balans negatif: ${u.balance} HT`,
          userId: u.id,
          timestamp: new Date().toISOString(),
          status: 'detected'
        });
      }
    });

    // 3. Check for suspicious vote frequencies in Match VS
    const voterMap = new Map<string, number>();
    (db.votes || []).forEach(v => {
      const key = `${v.voterId}_${v.matchId}`;
      voterMap.set(key, (voterMap.get(key) || 0) + 1);
    });
    voterMap.forEach((cnt, key) => {
      if (cnt > 1) {
        const [voterId, matchId] = key.split('_');
        anomalies.push({
          id: 'anom_vote_' + key,
          type: 'suspicious_votes',
          severity: 'medium',
          description: `Votè ${voterId} voye ${cnt} vòt sou match ${matchId}`,
          userId: voterId,
          timestamp: new Date().toISOString(),
          status: 'detected'
        });
      }
    });

    // 4. Check for creators eligible for monetization
    const eligibleCreators = db.users.filter(u => !u.isMonetized && (u.followersCount || 0) >= 1000);
    if (eligibleCreators.length > 0) {
      recommendations.push({
        id: 'rec_monetize_eligible',
        category: 'monetization',
        title: `${eligibleCreators.length} Kreyatè Elijib pou Monetizasyon`,
        description: `Gen ${eligibleCreators.length} kreyatè ki depase 1,000 abòne epi ki kalifye pou touche revni sou videyo yo.`,
        actionLabel: 'Gade Kreyatè yo'
      });
    }

    // 5. Check pending payments/deposits needing admin review
    const pendingDeposits = (db.transactions || []).filter(t => t.type === 'depo' && t.status === 'an_atant');
    if (pendingDeposits.length > 0) {
      recommendations.push({
        id: 'rec_pending_deposits',
        category: 'finance',
        title: `${pendingDeposits.length} Depo NatCash an Atant`,
        description: `Verifye prèv tranzaksyon NatCash yo pou kredite balans jwè yo san reta.`,
        actionLabel: 'Verifye Depo'
      });
    }

    // Calculate overall health score
    let healthScore = 100;
    anomalies.forEach(a => {
      if (a.severity === 'critical') healthScore -= 20;
      else if (a.severity === 'high') healthScore -= 10;
      else if (a.severity === 'medium') healthScore -= 5;
      else healthScore -= 2;
    });
    healthScore = Math.max(10, Math.min(100, healthScore));

    return {
      healthScore,
      anomalies,
      recommendations,
      approvals: db.algorithmApprovals || []
    };
  }

  // --- API ROUTES ---

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    const { firstName, lastName, fullName, phoneNumber, pin, profilePhoto, firebaseUid } = req.body;
    const resolvedFullName = (fullName || `${firstName || ''} ${lastName || ''}`).trim();
    if (!resolvedFullName || !phoneNumber || !pin) {
      return res.status(400).json({ error: 'Tanpri ranpli tout chan yo (Non, Prénom, Telefòn, Modpas).' });
    }

    const cleanPhone = phoneNumber.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      return res.status(400).json({ error: 'Nimewo telefòn nan pa valid. Li dwe gen omwen 8 chif.' });
    }
    if (String(pin).length < 4) {
      return res.status(400).json({ error: 'Modpas la dwe gen omwen 4 karaktè.' });
    }

    const db = loadDB();

    const existingUser = db.users.find(u => u.phoneNumber.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')) ||
      (firebaseUid ? db.users.find(u => u.firebaseUid === firebaseUid) : undefined);
    if (existingUser) {
      return res.status(409).json({ error: 'Nimewo telefòn sa a deja gen yon kont. Tanpri konekte pito.' });
    }

    const nowIso = new Date().toISOString();
    const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const masterPlayId = allocateMasterPlayId(db, newUserId);
    const newUser = {
      id: newUserId,
      firebaseUid: firebaseUid ? String(firebaseUid).trim() : undefined,
      masterPlayId,
      firstName: firstName ? String(firstName).trim() : resolvedFullName.split(' ')[0],
      lastName: lastName ? String(lastName).trim() : resolvedFullName.split(' ').slice(1).join(' '),
      fullName: resolvedFullName,
      phoneNumber: cleanPhone,
      pinHash: hashPin(pin),
      role: 'USER' as const,
      isAdmin: false,
      profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      balance: 50, // Welcome bonus of 50 HT
      welcomeBonusAwarded: true,
      reservedBalance: 0,
      level: 1,
      stars: 1,
      points: 0,
      followersCount: 0,
      followingCount: 0,
      followingIds: [] as string[],
      followerIds: [] as string[],
      favoritePostIds: [] as string[],
      matchesWon: 0,
      matchesPlayed: 0,
      votesReceived: 0,
      isOnline: true,
      isVerifiedInDatabase: true,
      verifiedInDatabaseAt: nowIso,
      certificationStatus: 'non_sètifye' as const,
      verified: false,
      isMonetized: false,
      monetizationStatus: 'none' as const,
      totalEarnings: 0,
      availableEarnings: 0,
      paidEarnings: 0,
      monetizedLikesCount: 0,
      followerMilestonePaid: false,
      createdAt: nowIso
    };

    db.users.push(newUser);
    saveUserToVault(newUser);

    // Record welcome bonus transaction in financial ledger
    const bonusTx = {
      id: 'tx_bonus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: generateRef('DEP'),
      userId: newUser.id,
      userName: newUser.fullName,
      userPhone: newUser.phoneNumber,
      type: 'depo' as const,
      amount: 50,
      natcashName: newUser.fullName,
      natcashPhone: newUser.phoneNumber,
      status: 'konfime' as const,
      metadata: { reason: 'bonis_byenvini', description: 'Bonis byenvini 50 HT nan MASTER PLAY' },
      createdAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: 'Sistèm MASTER PLAY'
    };
    db.transactions.unshift(bonusTx);

    addNotification(
      db,
      newUser.id,
      'Felisitasyon !',
      'Kont ou kreye avèk siksè. Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.',
      'anons'
    );
    logAudit(db, 'ENSKRIPSYON_ITILIZATÈ', `Nouvo itilizatè kreye: ${newUser.fullName} (${newUser.masterPlayId})`, 'Sistèm');
    recordMemoryEvent(db, {
      userId: newUser.id,
      actionType: 'ACCOUNT_CREATED',
      pageOrFeature: 'AuthModal / Register',
      result: 'success',
      data: { masterPlayId: newUser.masterPlayId, fullName: newUser.fullName },
    });
    saveDB(db);

    const { pinHash, ...safeUser } = newUser;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Kont ou kreye avèk siksè.'
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { phoneNumber, pin, firebaseUid } = req.body;
    if (!phoneNumber || !pin) {
      return res.status(400).json({ error: 'Tanpri bay nimewo telefòn ak kòd sekrè w la.' });
    }

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const db = loadDB();

    const user = db.users.find(u => u.phoneNumber.replace(/\s+/g, '') === cleanPhone) || findUserInDB(db, cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'Pa gen okenn kont ki asosye ak nimewo sa a.' });
    }

    if (user.pinHash !== hashPin(pin)) {
      return res.status(401).json({ error: 'Kòd sekrè a pa kòrèk. Tanpri reeseye.' });
    }

    if (firebaseUid && !user.firebaseUid) {
      user.firebaseUid = String(firebaseUid).trim();
      saveUserToVault(user);
    }

    let adminToken: string | undefined;
    if (user.role === 'ADMIN' || user.isAdmin) {
      adminToken = 'adm_' + crypto.randomBytes(24).toString('hex');
      if (!db.adminSessions) db.adminSessions = {};
      db.adminSessions[adminToken] = {
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
    }

    recordMemoryEvent(db, {
      userId: user.id,
      actionType: 'USER_LOGIN',
      pageOrFeature: 'AuthModal / Login',
      result: 'success',
      data: { role: user.role || 'USER' },
    });
    saveDB(db);

    const { pinHash, ...safeUser } = user;
    return res.json({
      success: true,
      user: adminToken ? { ...safeUser, adminToken } : safeUser,
    });
  });

  // Auth: Google Login / Link (Section 4)
  app.post('/api/auth/google', (req, res) => {
    const { email, fullName, photo, phoneNumber, pin, googleId, firebaseUid } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Enfòmasyon Google enkonplè (imèl obligatwa).' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = loadDB();

    // 1. Check if user already exists by Firebase UID, Google email, googleId, or phone
    const cleanPhone = phoneNumber ? phoneNumber.trim().replace(/\s+/g, '') : '';
    let existingUser = db.users.find(u =>
      (firebaseUid && u.firebaseUid === firebaseUid) ||
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (googleId && (u as any).googleId === googleId) ||
      (cleanPhone && u.phoneNumber.replace(/\s+/g, '') === cleanPhone)
    );

    if (existingUser) {
      existingUser.isGoogleUser = true;
      if (!existingUser.email) existingUser.email = cleanEmail;
      if (firebaseUid && !existingUser.firebaseUid) existingUser.firebaseUid = String(firebaseUid).trim();
      if (googleId && !(existingUser as any).googleId) (existingUser as any).googleId = googleId;
      if (photo && (!existingUser.profilePhoto || existingUser.profilePhoto.includes('unsplash'))) {
        existingUser.profilePhoto = photo;
      }
      saveUserToVault(existingUser);
      saveDB(db);
      const { pinHash, ...safeUser } = existingUser;
      return res.json({ success: true, user: safeUser, linked: true, isNew: false });
    }

    // 2. Create new permanent user account
    const nowIso = new Date().toISOString();
    const newUserId = 'usr_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const assignedPhone = cleanPhone || `G-${cleanEmail.split('@')[0]}`;
    const masterPlayId = allocateMasterPlayId(db, newUserId);

    const newUser: any = {
      id: newUserId,
      firebaseUid: firebaseUid ? String(firebaseUid).trim() : undefined,
      masterPlayId,
      fullName: (fullName || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      googleId: googleId || undefined,
      phoneNumber: assignedPhone,
      role: 'USER',
      isAdmin: false,
      pinHash: hashPin(pin || '1234'),
      profilePhoto: photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      balance: 50,
      welcomeBonusAwarded: true,
      reservedBalance: 0,
      level: 1,
      stars: 1,
      followersCount: 0,
      followingCount: 0,
      followerIds: [],
      followingIds: [],
      favoritePostIds: [],
      createdAt: nowIso,
      isGoogleUser: true,
      certificationStatus: 'non_sètifye' as const,
      verified: false,
      isMonetized: false,
      monetizationStatus: 'none',
      totalEarnings: 0,
      availableEarnings: 0,
      paidEarnings: 0,
      monetizedLikesCount: 0,
      followerMilestonePaid: false
    };

    db.users.push(newUser);
    saveUserToVault(newUser);

    // Record welcome bonus transaction in financial ledger
    const bonusTx = {
      id: 'tx_bonus_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: generateRef('DEP'),
      userId: newUser.id,
      userName: newUser.fullName,
      userPhone: newUser.phoneNumber,
      type: 'depo' as const,
      amount: 50,
      natcashName: newUser.fullName,
      natcashPhone: newUser.phoneNumber,
      status: 'konfime' as const,
      metadata: { reason: 'bonis_byenvini', description: 'Bonis byenvini 50 HT nan MASTER PLAY' },
      createdAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: 'Sistèm MASTER PLAY'
    };
    db.transactions.unshift(bonusTx);

    addNotification(
      db,
      newUser.id,
      'Felisitasyon !',
      'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.',
      'anons'
    );
    logAudit(db, 'ENSKRIPSYON_GOOGLE', `Nouvo itilizatè Google kreye: ${newUser.fullName} (${newUser.email}) avèk bonis byenvini 50 HT`, 'Sistèm');
    saveDB(db);

    const { pinHash, ...safeUser } = newUser;
    return res.json({
      success: true,
      user: safeUser,
      created: true,
      isNew: true,
      message: 'Felisitasyon! Ou resevwa 50 HT kòm bonis byenvini nan MASTER PLAY.'
    });
  });

  // Auth: Sync / Restore Account from Firebase Auth & Firestore (Cross-device session continuity)
  app.post('/api/auth/sync-from-firebase', (req, res) => {
    try {
      const {
        firebaseUid,
        email,
        fullName,
        phoneNumber,
        profilePhoto,
        balance,
        reservedBalance,
        level,
        points,
        stars,
        masterPlayId,
        certificationStatus,
        verified
      } = req.body || {};

      if (!firebaseUid) {
        return res.status(400).json({ error: 'firebaseUid obligatwa.' });
      }

      const db = loadDB();
      const cleanUid = String(firebaseUid).trim();
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';
      const cleanPhone = phoneNumber ? String(phoneNumber).trim() : '';

      let user =
        findUserInDB(db, cleanUid) ||
        (cleanEmail ? findUserInDB(db, cleanEmail) : null) ||
        (masterPlayId ? findUserInDB(db, String(masterPlayId)) : null) ||
        (cleanPhone ? findUserInDB(db, cleanPhone) : null);

      if (user) {
        let changed = false;
        if (!user.firebaseUid) {
          user.firebaseUid = cleanUid;
          changed = true;
        }
        if (cleanEmail && !user.email) {
          user.email = cleanEmail;
          changed = true;
        }
        if (cleanPhone && (!user.phoneNumber || String(user.phoneNumber).startsWith('FB-'))) {
          user.phoneNumber = cleanPhone;
          changed = true;
        }
        if (fullName && (!user.fullName || user.fullName === 'Jwè MASTER PLAY')) {
          user.fullName = String(fullName).trim();
          changed = true;
        }
        if (profilePhoto && (!user.profilePhoto || user.profilePhoto.includes('unsplash'))) {
          user.profilePhoto = profilePhoto;
          changed = true;
        }
        if (typeof points === 'number' && points > (user.points || 0)) {
          user.points = points;
          changed = true;
        }
        if (typeof level === 'number' && level > (user.level || 1)) {
          user.level = level;
          changed = true;
        }
        user.isOnline = true;
        if (changed) {
          saveUserToVault(user);
        }
        saveDB(db);
        const { pinHash, ...safeUser } = user;
        return res.json({
          success: true,
          user: {
            ...safeUser,
            verified: Boolean(user.verified || user.certificationStatus === 'sètifye' || user.role === 'ADMIN' || user.isAdmin),
          },
          restored: false
        });
      }

      // Restore or create non-duplicate cloud-linked record
      const nowIso = new Date().toISOString();
      const newUserId = 'usr_fb_' + cleanUid.slice(0, 12);
      const allocatedMasterId = masterPlayId ? String(masterPlayId) : allocateMasterPlayId(db, newUserId);
      const restoredUser: any = {
        id: newUserId,
        firebaseUid: cleanUid,
        masterPlayId: allocatedMasterId,
        fullName: (fullName || (cleanEmail ? cleanEmail.split('@')[0] : 'Jwè MASTER PLAY')).trim(),
        email: cleanEmail || undefined,
        phoneNumber: cleanPhone || `FB-${cleanUid.slice(0, 8)}`,
        pinHash: hashPin('1234'),
        role: 'USER',
        isAdmin: false,
        profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        balance: typeof balance === 'number' && balance >= 0 ? balance : 50,
        reservedBalance: typeof reservedBalance === 'number' && reservedBalance >= 0 ? reservedBalance : 0,
        level: typeof level === 'number' && level >= 1 ? level : 1,
        stars: typeof stars === 'number' && stars >= 1 ? stars : 1,
        points: typeof points === 'number' && points >= 0 ? points : 0,
        followersCount: 0,
        followingCount: 0,
        followingIds: [],
        followerIds: [],
        favoritePostIds: [],
        matchesWon: 0,
        matchesPlayed: 0,
        votesReceived: 0,
        isOnline: true,
        isVerifiedInDatabase: true,
        verifiedInDatabaseAt: nowIso,
        certificationStatus: certificationStatus === 'sètifye' ? 'sètifye' : 'non_sètifye',
        verified: Boolean(verified || certificationStatus === 'sètifye'),
        isMonetized: false,
        monetizationStatus: 'none',
        totalEarnings: 0,
        availableEarnings: 0,
        paidEarnings: 0,
        monetizedLikesCount: 0,
        followerMilestonePaid: false,
        isGoogleUser: Boolean(cleanEmail && !cleanEmail.endsWith('@masterplay.app')),
        createdAt: nowIso
      };

      db.users.push(restoredUser);
      saveUserToVault(restoredUser);
      saveDB(db);
      const { pinHash, ...safeUser } = restoredUser;
      return res.json({ success: true, user: safeUser, restored: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan senkronizasyon Firebase.' });
    }
  });

  // Auth: Update Profile
  app.post('/api/auth/update-profile', (req, res) => {
    const { userId, fullName, profilePhoto } = req.body;
    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

    if (fullName) user.fullName = fullName.trim();
    if (profilePhoto) user.profilePhoto = profilePhoto;

    saveUserToVault(user);
    saveDB(db);
    const { pinHash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // Auth: Change PIN
  app.post('/api/auth/change-pin', (req, res) => {
    const { userId, oldPin, newPin } = req.body;
    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

    if (user.pinHash !== hashPin(oldPin)) {
      return res.status(401).json({ error: 'Ansyen kòd la pa kòrèk.' });
    }

    if (!newPin || newPin.length < 4) {
      return res.status(400).json({ error: 'Nouvo kòd la dwe gen omwen 4 chif.' });
    }

    user.pinHash = hashPin(newPin);
    addNotification(db, user.id, 'Kòd sekirite chanje', 'Kòd pèsonèl ou a te modifye avèk siksè.', 'anons');
    saveUserToVault(user);
    saveDB(db);
    return res.json({ success: true, message: 'Kòd ou a chanje avèk siksè.' });
  });

  // Search Users (Requirement 6: Ba rechèch sou paj dakèy la)
  app.get('/api/users/search', (req, res) => {
    try {
      const q = (req.query.q as string || '').trim().toLowerCase();
      const currentUserId = (req.query.currentUserId as string || '').trim();
      const db = loadDB();

      if (!q) {
        return res.json({ success: true, users: [] });
      }

      const matches = db.users
        .filter(u => {
          const nameMatch = (u.fullName || '').toLowerCase().includes(q);
          const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(q);
          return nameMatch || phoneMatch;
        })
        .slice(0, 15)
        .map(u => {
          const { pinHash, ...safeUser } = u;
          const isSubscribed = currentUserId
            ? (u.followerIds?.includes(currentUserId) ||
               (db.subscriptions && db.subscriptions.some(s => s.subscriberId === currentUserId && s.targetUserId === u.id)))
            : false;
          return {
            ...safeUser,
            verified: Boolean(u.verified || u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin),
            isSubscribed: Boolean(isSubscribed)
          };
        });

      return res.json({ success: true, users: matches });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erè nan rechèch itilizatè.' });
    }
  });

  // Get current user data (Requirement 8 & 2: robust lookup by unique ID or phone)
  app.get('/api/users/:id', (req, res) => {
    const db = loadDB();
    const user = findUserInDB(db, req.params.id);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });
    const { pinHash, ...safeUser } = user;
    return res.json({
      success: true,
      user: {
        ...safeUser,
        verified: Boolean(user.verified || user.certificationStatus === 'sètifye' || user.role === 'ADMIN' || user.isAdmin),
      }
    });
  });

  // Toggle Subscribe / Follow User (Requirement 5: Siy + sou chak pwofil)
  app.post('/api/users/toggle-subscribe', (req, res) => {
    try {
      const { subscriberId, targetUserId } = req.body;
      if (!subscriberId || !targetUserId) {
        return res.status(400).json({ error: 'subscriberId ak targetUserId obligatwa.' });
      }

      if (subscriberId === targetUserId) {
        return res.status(400).json({ error: 'Ou pa kapab abòne ak pwòp tèt ou.' });
      }

      const db = loadDB();
      const subscriber = findUserInDB(db, subscriberId);
      const target = findUserInDB(db, targetUserId);

      if (!subscriber || !target) {
        return res.status(404).json({ error: 'Youn oswa toude itilizatè yo pa jwenn.' });
      }

      if (!db.subscriptions) db.subscriptions = [];
      if (!subscriber.followingIds) subscriber.followingIds = [];
      if (!target.followerIds) target.followerIds = [];

      const existingIndex = db.subscriptions.findIndex(
        s => s.subscriberId === subscriberId && s.targetUserId === targetUserId
      );

      let isSubscribed = false;

      if (existingIndex !== -1 || target.followerIds.includes(subscriberId)) {
        // Unsubscribe
        if (existingIndex !== -1) {
          db.subscriptions.splice(existingIndex, 1);
        }
        subscriber.followingIds = subscriber.followingIds.filter((id: string) => id !== targetUserId);
        target.followerIds = target.followerIds.filter((id: string) => id !== subscriberId);
        target.followersCount = Math.max(0, (target.followersCount || 1) - 1);
        isSubscribed = false;
      } else {
        // Subscribe
        db.subscriptions.push({
          id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          subscriberId,
          targetUserId,
          createdAt: new Date().toISOString()
        });
        if (!subscriber.followingIds.includes(targetUserId)) {
          subscriber.followingIds.push(targetUserId);
        }
        if (!target.followerIds.includes(subscriberId)) {
          target.followerIds.push(subscriberId);
        }
        target.followersCount = (target.followersCount || 0) + 1;
        isSubscribed = true;

        // Send Notification to Target User
        addNotification(
          db,
          targetUserId,
          'Nouvo Abòne !',
          `${subscriber.fullName} fèk abòne ak pwofil ou sou MASTER PLAY !`,
          'anons'
        );
      }

      saveDB(db);

      const { pinHash: _p1, ...safeTarget } = target;
      const { pinHash: _p2, ...safeSubscriber } = subscriber;

      return res.json({
        success: true,
        isSubscribed,
        followersCount: target.followersCount,
        targetUser: { ...safeTarget, isSubscribed },
        currentUser: safeSubscriber,
        message: isSubscribed
          ? `Ou abòne ak ${target.fullName} avèk siksè !`
          : `Ou anile abònman w ak ${target.fullName}.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erè nan jere abònman an.' });
    }
  });

  // Competitions: Get All
  app.get('/api/competitions', (req, res) => {
    const db = loadDB();
    const verifiedMap = new Map<string, boolean>(
      db.users.map((u) => [u.id, Boolean(u.verified || u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin)])
    );
    const enrichedComps = (db.competitions || []).map((c: any) => ({
      ...c,
      scores: Array.isArray(c.scores)
        ? c.scores.map((s: any) => ({ ...s, verified: verifiedMap.get(s.userId) ?? false }))
        : c.scores,
      matches: Array.isArray(c.matches)
        ? c.matches.map((m: any) => ({
            ...m,
            player1: m.player1 ? { ...m.player1, verified: verifiedMap.get(m.player1.userId) ?? false } : m.player1,
            player2: m.player2 ? { ...m.player2, verified: verifiedMap.get(m.player2.userId) ?? false } : m.player2,
          }))
        : c.matches,
    }));
    return res.json({ success: true, competitions: enrichedComps });
  });

  // Competitions: Register (Requirements 1-11: robust user lookup, anti-duplicate registration, persistent state)
  app.post('/api/competitions/register', (req, res) => {
    const { competitionId, userId } = req.body;
    const db = loadDB();

    const comp = db.competitions.find(c => c.id === competitionId);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    // Requirement 3 & 8: Search user with all identification methods before throwing error
    const user = findUserInDB(db, userId);
    if (!user) {
      return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a. Tanpri verifye koneksyon kont ou.' });
    }

    const actualUserId = user.id;

    // Requirement 5 & 7 & 10: Strict Anti-double registration check (checks registeredUserIds and scores array)
    const alreadyRegistered =
      Boolean(comp.registeredUserIds && comp.registeredUserIds.includes(actualUserId)) ||
      Boolean(comp.scores && comp.scores.some((s: any) => s.userId === actualUserId));

    if (alreadyRegistered) {
      const { pinHash, ...safeUser } = user;
      return res.status(400).json({
        error: 'Ou deja enskri nan konpetisyon sa a.',
        alreadyRegistered: true,
        competition: comp,
        user: safeUser
      });
    }

    // Status check
    const allowedStatuses = ['active', 'Enskripsyon ouvè', 'An kou', 'Louvri', 'Aktif', 'louvri', 'aktif'];
    if (!allowedStatuses.includes(comp.status)) {
      return res.status(400).json({ error: `Enskripsyon pa posib pou kounye a (Estati: ${comp.status}).` });
    }

    // Time window check
    const timeCheck = checkCompetitionTimeWindow(comp);
    if (!timeCheck.allowed && comp.status !== 'Enskripsyon ouvè') {
      return res.status(400).json({ error: timeCheck.reason });
    }

    if (comp.registeredUserIds.length >= comp.maxParticipants) {
      return res.status(400).json({ error: 'Tout plas yo gentan ranpli pou konpetisyon sa a.' });
    }

    // Check balance
    const availableBalance = user.balance - (user.reservedBalance || 0);
    if (availableBalance < comp.entryFee) {
      return res.status(400).json({
        error: `Balans ou pa ase (${availableBalance} HT). Pri enskripsyon an se ${comp.entryFee} HT. Tanpri fè yon depo sou NatCash.`
      });
    }

    // Atomic deduction and registration (Requirement 6)
    user.balance -= comp.entryFee;
    comp.registeredUserIds.push(actualUserId);

    // Also initialize participant score in competition scores list
    if (!comp.scores) comp.scores = [];
    if (!comp.scores.some((s: any) => s.userId === actualUserId)) {
      comp.scores.push({
        userId: actualUserId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        level: user.level || 1,
        stars: user.stars || 1,
        followers: user.followersCount || 10,
        scoresByGame: {},
        totalScore: 0,
        matchesWon: 0,
        votesCount: 0,
        giftsCount: 0,
        giftsValue: 0,
        dailyScores: { lendi: 0, madi: 0, mekredi: 0, jedi: 0 },
        registrationDate: new Date().toISOString()
      });
    }

    // Record ledger transaction
    const refId = generateRef('DEP');
    db.transactions.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      userId: actualUserId,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      type: 'enskripsyon_konpetisyon',
      amount: comp.entryFee,
      status: 'konfime',
      createdAt: new Date().toISOString(),
      reviewedBy: 'Sistèm Otomatik',
      reviewedAt: new Date().toISOString(),
      metadata: { competitionId: comp.id, competitionName: comp.name }
    });

    // If slots filled, auto-close
    if (comp.registeredUserIds.length >= comp.maxParticipants) {
      comp.status = 'Enskripsyon fèmen';
    }

    addNotification(
      db,
      actualUserId,
      `Enskripsyon reyisi: ${comp.name}`,
      `Ou enskri avèk siksè nan ${comp.name}. Nou retire ${comp.entryFee} HT nan balans ou.`,
      'konpetisyon'
    );

    logAudit(
      db,
      'ENSKRIPSYON_KONPETISYON',
      `Itilizatè ${user.fullName} (${user.phoneNumber}) enskri nan ${comp.name} pou ${comp.entryFee} HT`,
      'Itilizatè'
    );

    saveDB(db);

    const { pinHash, ...safeUser } = user;
    return res.json({
      success: true,
      competition: comp,
      user: safeUser,
      message: `Felisitasyon ! Enskripsyon ou nan ${comp.name} reyisi.`
    });
  });

  // Competition: Record Participant Score for Competition Game
  app.post('/api/competitions/score', (req, res) => {
    const { competitionId, userId, gameId, score } = req.body;
    const db = loadDB();

    const comp = db.competitions.find(c => c.id === competitionId);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });
    const actualUserId = user.id;

    // Time window control
    const timeCheck = checkCompetitionTimeWindow(comp);
    if (!timeCheck.allowed) {
      return res.status(400).json({ error: timeCheck.reason });
    }

    if (!comp.registeredUserIds.includes(actualUserId)) {
      return res.status(403).json({ error: 'Ou dwe enskri nan konpetisyon an anvan ou ka jwe pou pwen.' });
    }

    // Check if the game is authorized for this competition
    if (comp.authorizedGameIds && comp.authorizedGameIds.length > 0 && !comp.authorizedGameIds.includes(gameId)) {
      return res.status(400).json({ error: 'Jwèt sa a pa otorize pou konpetisyon sa a.' });
    }

    if (!comp.scores) comp.scores = [];
    let pScore = comp.scores.find(s => s.userId === actualUserId);
    if (!pScore) {
      pScore = {
        userId: actualUserId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        level: user.level || 1,
        stars: user.stars || 1,
        followers: user.followersCount || 15,
        scoresByGame: {},
        totalScore: 0,
        matchesWon: 0,
        votesCount: 0,
        giftsCount: 0,
        giftsValue: 0,
        dailyScores: { lendi: 0, madi: 0, mekredi: 0, jedi: 0 },
        registrationDate: new Date().toISOString()
      };
      comp.scores.push(pScore);
    }

    const currentBest = pScore.scoresByGame[gameId] || 0;
    const incomingScore = Math.max(0, Number(score) || 0);

    if (incomingScore > currentBest) {
      const diff = incomingScore - currentBest;
      pScore.scoresByGame[gameId] = incomingScore;
      pScore.totalScore += diff;

      const dayStr = (comp.currentDay || 'Lendi').toLowerCase();
      if (!pScore.dailyScores) pScore.dailyScores = {};
      if (dayStr.includes('lendi')) pScore.dailyScores.lendi = (pScore.dailyScores.lendi || 0) + diff;
      else if (dayStr.includes('madi')) pScore.dailyScores.madi = (pScore.dailyScores.madi || 0) + diff;
      else if (dayStr.includes('mekredi') || dayStr.includes('mèkredi')) pScore.dailyScores.mekredi = (pScore.dailyScores.mekredi || 0) + diff;
      else if (dayStr.includes('jedi')) pScore.dailyScores.jedi = (pScore.dailyScores.jedi || 0) + diff;

      // Update user level based on validated score
      const newLvlStats = calculateUserLevel(pScore.totalScore);
      if (newLvlStats.level > (user.level || 1)) {
        user.level = newLvlStats.level;
        user.stars = newLvlStats.stars;
        pScore.level = newLvlStats.level;
        pScore.stars = newLvlStats.stars;
        if (!user.levelHistory) user.levelHistory = [];
        user.levelHistory.push({
          level: newLvlStats.level,
          date: new Date().toISOString(),
          reason: `Pwen konpetisyon nan ${comp.name} (${pScore.totalScore} pts)`
        });
        addNotification(
          db,
          userId,
          `Ou monte nan Nivo ${newLvlStats.level} !`,
          `Felisitasyon ! Pèfòmans ou nan ${comp.name} fè w monte nan Nivo ${newLvlStats.level} avèk ${newLvlStats.stars} etwal !`,
          'rezilta'
        );
      }
    }

    // Rank participants by totalScore (tiebreaker: earlier registration date or higher single score)
    comp.scores.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const maxScoreA = Math.max(0, ...Object.values(a.scoresByGame || {}));
      const maxScoreB = Math.max(0, ...Object.values(b.scoresByGame || {}));
      if (maxScoreB !== maxScoreA) return maxScoreB - maxScoreA;
      return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
    });

    comp.scores.forEach((s, i) => { s.rank = i + 1; });

    logAudit(db, 'ANREJISTRE_PWEN_KONPETISYON', `Itilizatè ${user.fullName} fè ${incomingScore} pwen nan jwèt ${gameId} pou konpetisyon ${comp.name}`, 'Sistèm');
    saveDB(db);

    return res.json({ success: true, scores: comp.scores, userScore: pScore, competition: comp });
  });

  // Competitions: Get played levels today for a specific game or all games
  app.get('/api/competitions/:compId/played-levels/:userId/:gameId', (req, res) => {
    try {
      const { compId, userId, gameId } = req.params;
      const db = loadDB();
      const comp = db.competitions.find(c => c.id === compId);
      const dayKey = comp?.currentDay || new Date().toISOString().split('T')[0];

      if (!db.dailyLevelRecords) db.dailyLevelRecords = [];
      const userRecordsToday = db.dailyLevelRecords.filter(
        r => r.competitionId === compId && r.userId === userId && r.dayKey === dayKey
      );

      const playedLevels = gameId === 'all'
        ? userRecordsToday.map(r => r.level)
        : userRecordsToday.filter(r => r.gameId === gameId).map(r => r.level);

      const playedGameIds = Array.from(new Set(userRecordsToday.map(r => r.gameId)));
      const gamesRecordCount: { [gId: string]: number } = {};
      userRecordsToday.forEach(r => {
        gamesRecordCount[r.gameId] = (gamesRecordCount[r.gameId] || 0) + 1;
      });

      return res.json({ success: true, dayKey, playedLevels, playedGameIds, gamesRecordCount });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan rekipere nivo jwe yo.' });
    }
  });

  // Competitions: Record Level Score (Requirement 3: Save points at end of level, block replaying same level today, enforce active competition hours)
  app.post('/api/competitions/score-level', (req, res) => {
    try {
      const { competitionId, userId, gameId, level, score } = req.body;
      if (!competitionId || !userId || !gameId || level === undefined) {
        return res.status(400).json({ error: 'competitionId, userId, gameId ak level obligatwa.' });
      }

      const db = loadDB();
      const comp = db.competitions.find(c => c.id === competitionId);
      if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });
      const actualUserId = user.id;

      // Requirement 3D: Respekte lè konpetisyon an
      const timeCheck = checkCompetitionTimeWindow(comp);
      if (!timeCheck.allowed) {
        return res.status(400).json({
          error: 'Tan konpetisyon an fini. Ou pa kapab anrejistre pwen ankò pou jounen sa a.'
        });
      }

      if (!comp.registeredUserIds.includes(actualUserId)) {
        return res.status(403).json({ error: 'Ou dwe enskri nan konpetisyon an anvan ou ka anrejistre pwen.' });
      }

      if (comp.authorizedGameIds && comp.authorizedGameIds.length > 0 && !comp.authorizedGameIds.includes(gameId)) {
        return res.status(400).json({ error: 'Jwèt sa a pa otorize pou konpetisyon sa a.' });
      }

      const lvlNum = Number(level);
      const incomingScore = Math.max(0, Number(score) || 0);
      const dayKey = comp.currentDay || new Date().toISOString().split('T')[0];

      if (!db.dailyLevelRecords) db.dailyLevelRecords = [];

      // Verifikasyon: Yon jwè gen dwa anrejistre pwen li sèlman yon sèl fwa pou chak jwèt nan konpetisyon an jodi a
      const alreadyPlayed = db.dailyLevelRecords.some(
        r => r.competitionId === competitionId && r.userId === actualUserId && r.gameId === gameId && r.dayKey === dayKey
      );

      if (alreadyPlayed) {
        return res.status(400).json({
          error: 'Ou deja anrejistre pwen ou pou jwèt sa a nan konpetisyon an jodi a.'
        });
      }

      const targetGame = db.games.find(g => g.id === gameId);

      // Record this level play for today
      db.dailyLevelRecords.push({
        id: 'dlr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        competitionId,
        competitionName: comp.name,
        userId: actualUserId,
        userName: user.fullName,
        userPhone: user.phoneNumber,
        gameId,
        gameTitle: targetGame?.title || gameId,
        level: lvlNum,
        dayKey,
        score: incomingScore,
        createdAt: new Date().toISOString()
      });

      // Update competition scores
      if (!comp.scores) comp.scores = [];
      let pScore = comp.scores.find(s => s.userId === actualUserId);
      if (!pScore) {
        pScore = {
          userId: actualUserId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          profilePhoto: user.profilePhoto,
          level: user.level || 1,
          stars: user.stars || 1,
          followers: user.followersCount || 15,
          scoresByGame: {},
          totalScore: 0,
          matchesWon: 0,
          votesCount: 0,
          giftsCount: 0,
          giftsValue: 0,
          dailyScores: { lendi: 0, madi: 0, mekredi: 0, jedi: 0 },
          registrationDate: new Date().toISOString()
        };
        comp.scores.push(pScore);
      }

      pScore.scoresByGame[gameId] = (pScore.scoresByGame[gameId] || 0) + incomingScore;
      pScore.totalScore += incomingScore;
      (pScore as any).completedLevelsCount = ((pScore as any).completedLevelsCount || 0) + 1;
      (pScore as any).gamesPlayedCount = Object.keys(pScore.scoresByGame).length;

      const dayStr = (comp.currentDay || 'Lendi').toLowerCase();
      if (!pScore.dailyScores) pScore.dailyScores = {};
      if (dayStr.includes('lendi')) pScore.dailyScores.lendi = (pScore.dailyScores.lendi || 0) + incomingScore;
      else if (dayStr.includes('madi')) pScore.dailyScores.madi = (pScore.dailyScores.madi || 0) + incomingScore;
      else if (dayStr.includes('mekredi') || dayStr.includes('mèkredi')) pScore.dailyScores.mekredi = (pScore.dailyScores.mekredi || 0) + incomingScore;
      else if (dayStr.includes('jedi')) pScore.dailyScores.jedi = (pScore.dailyScores.jedi || 0) + incomingScore;

      // Update user level based on validated score
      const newLvlStats = calculateUserLevel(pScore.totalScore);
      if (newLvlStats.level > (user.level || 1)) {
        user.level = newLvlStats.level;
        user.stars = newLvlStats.stars;
        pScore.level = newLvlStats.level;
        pScore.stars = newLvlStats.stars;
      }

      // Re-rank participants
      comp.scores.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      });
      comp.scores.forEach((s, i) => { s.rank = i + 1; });

      logAudit(
        db,
        'ANREJISTRE_NIVO_KONPETISYON',
        `${user.fullName} anrejistre Nivo ${lvlNum} nan ${gameId} pou ${incomingScore} pts nan ${comp.name}`,
        'Sistèm'
      );

      saveDB(db);

      const playedLevelsToday = db.dailyLevelRecords
        .filter(r => r.competitionId === competitionId && r.userId === userId && r.gameId === gameId && r.dayKey === dayKey)
        .map(r => r.level);

      return res.json({
        success: true,
        message: 'Pwen ou yo anrejistre avèk siksè !',
        pointsAwarded: incomingScore,
        userScore: pScore,
        competition: comp,
        playedLevelsToday
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erè nan anrejistreman pwen nivo a.' });
    }
  });

  // --- GIFTS (Boutik Kado) API ---
  app.get('/api/gifts', (req, res) => {
    const db = loadDB();
    return res.json({ success: true, gifts: db.gifts, transactions: (db.giftTransactions || []).slice(0, 50) });
  });

  app.post('/api/gifts/send', (req, res) => {
    const { senderId, receiverId, giftId, competitionId, matchId } = req.body;
    if (!senderId || !receiverId || !giftId) {
      return res.status(400).json({ error: 'Tanpri chwazi kado a ak moun w ap voye l bay la.' });
    }

    const db = loadDB();
    const sender = findUserInDB(db, senderId);
    if (!sender) return res.status(404).json({ error: 'Moun k ap voye kado a pa jwenn.' });

    const receiver = findUserInDB(db, receiverId);
    if (!receiver) return res.status(404).json({ error: 'Moun k ap resevwa kado a pa jwenn.' });

    const gift = db.gifts.find(g => g.id === giftId);
    if (!gift || !gift.isActive) return res.status(404).json({ error: 'Kado sa a pa disponib kounye a.' });

    const availableBalance = sender.balance - (sender.reservedBalance || 0);
    if (availableBalance < gift.price) {
      return res.status(400).json({
        error: `Balans ou (${availableBalance} HT) pa ase pou voye kado ${gift.name} ki koute ${gift.price} HT. Fè yon depo sou NatCash.`
      });
    }

    // Deduct from sender
    sender.balance -= gift.price;

    // Formula: Vote price is fixed at 15 HT
    // Whole votes = floor(gift.price / 15)
    // Remainder cash = gift.price % 15 (transferred to receiver's balance)
    const VOTE_PRICE = 15;
    const wholeVotes = Math.floor(gift.price / VOTE_PRICE);
    const remainderCash = gift.price % VOTE_PRICE;

    // Credit recipient with remainder cash and votes
    receiver.balance = (receiver.balance || 0) + remainderCash;
    receiver.votesReceived = (receiver.votesReceived || 0) + wholeVotes;
    receiver.giftsReceivedCount = (receiver.giftsReceivedCount || 0) + 1;
    receiver.giftsReceivedValue = (receiver.giftsReceivedValue || 0) + gift.price;

    const nowIso = new Date().toISOString();
    const datePart = nowIso.split('T')[0];
    const timePart = nowIso.split('T')[1].substring(0, 8);
    const refId = generateRef('KAD');

    const newGiftTx = {
      id: 'gtx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      senderId,
      senderName: sender.fullName,
      receiverId,
      receiverName: receiver.fullName,
      receiverPhoto: receiver.profilePhoto,
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.icon,
      price: gift.price,
      wholeVotes,
      remainderCash,
      competitionId,
      matchId,
      date: datePart,
      time: timePart,
      timestamp: nowIso,
      status: 'konfime' as const
    };

    if (!db.giftTransactions) db.giftTransactions = [];
    db.giftTransactions.unshift(newGiftTx);

    // Sender's transaction record
    db.transactions.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      userId: senderId,
      userName: sender.fullName,
      userPhone: sender.phoneNumber,
      type: 'kado',
      amount: gift.price,
      status: 'konfime',
      createdAt: nowIso,
      reviewedBy: 'Sistèm Otomatik',
      reviewedAt: nowIso,
      metadata: {
        giftName: gift.name,
        receiverName: receiver.fullName,
        wholeVotes,
        remainderCash,
        competitionId,
        matchId
      }
    });

    // Admin financial ledger transaction: Admin account receives the FULL gift value (e.g. 200 HT)
    // Records date, time, gift value, sender name, receiver name, votes given, and remainder cash transferred
    const adminRef = generateRef('KAD');
    db.transactions.unshift({
      id: 'tx_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: adminRef,
      userId: 'admin_prince509',
      userName: 'Kont Administratè (Revni Kado)',
      userPhone: '+509 4098 7659',
      type: 'kado',
      amount: gift.price, // Full gift price to admin
      status: 'konfime',
      createdAt: nowIso,
      reviewedBy: 'Sistèm MASTER PLAY',
      reviewedAt: nowIso,
      metadata: {
        description: `Kado ${gift.name} voye pa ${sender.fullName} bay ${receiver.fullName}`,
        date: datePart,
        time: timePart,
        giftValue: gift.price,
        senderName: sender.fullName,
        receiverName: receiver.fullName,
        votesAwarded: wholeVotes,
        remainderCashTransferred: remainderCash,
        votePrice: VOTE_PRICE,
        competitionId,
        matchId
      }
    });

    // If remainder cash > 0, also record remainder transfer in receiver's ledger
    if (remainderCash > 0) {
      db.transactions.unshift({
        id: 'tx_rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        referenceId: generateRef('DEP'),
        userId: receiverId,
        userName: receiver.fullName,
        userPhone: receiver.phoneNumber,
        type: 'depo',
        amount: remainderCash,
        status: 'konfime',
        createdAt: nowIso,
        reviewedBy: 'Sistèm MASTER PLAY',
        reviewedAt: nowIso,
        metadata: {
          reason: 'lajan_restan_kado',
          description: `Lajan restan (${remainderCash} HT) soti nan kado ${gift.name} ki koute ${gift.price} HT`
        }
      });
    }

    // Update match or competition participant if provided
    if (competitionId) {
      const comp = db.competitions.find(c => c.id === competitionId);
      if (comp) {
        if (matchId && comp.matches) {
          const match = comp.matches.find(m => m.id === matchId);
          if (match) {
            if (match.player1.userId === receiverId) {
              match.gifts1 = (match.gifts1 || 0) + 1;
              match.votes1 = (match.votes1 || 0) + wholeVotes;
              match.player1.giftsCount = (match.player1.giftsCount || 0) + 1;
              match.player1.giftsValue = (match.player1.giftsValue || 0) + gift.price;
              match.player1.votesCount = (match.player1.votesCount || 0) + wholeVotes;
            } else if (match.player2.userId === receiverId) {
              match.gifts2 = (match.gifts2 || 0) + 1;
              match.votes2 = (match.votes2 || 0) + wholeVotes;
              match.player2.giftsCount = (match.player2.giftsCount || 0) + 1;
              match.player2.giftsValue = (match.player2.giftsValue || 0) + gift.price;
              match.player2.votesCount = (match.player2.votesCount || 0) + wholeVotes;
            }
          }
        }
        if (comp.scores) {
          const pScore = comp.scores.find(s => s.userId === receiverId);
          if (pScore) {
            pScore.giftsCount = (pScore.giftsCount || 0) + 1;
            pScore.giftsValue = (pScore.giftsValue || 0) + gift.price;
            pScore.votesCount = (pScore.votesCount || 0) + wholeVotes;
          }
        }
      }
    }

    addNotification(
      db,
      receiverId,
      `Ou resevwa yon kado ${gift.icon} ${gift.name} !`,
      `${sender.fullName} voye yon kado ${gift.name} (${gift.price} HT) ba ou! Ou resevwa ${wholeVotes} vòt ${remainderCash > 0 ? `ak ${remainderCash} HT nan balans ou` : ''} !`,
      'kado'
    );

    addNotification(
      db,
      senderId,
      `Kado ${gift.icon} voye avèk siksè !`,
      `Ou voye kado ${gift.name} (${gift.price} HT) bay ${receiver.fullName}. Li resevwa ${wholeVotes} vòt ${remainderCash > 0 ? `ak ${remainderCash} HT restan` : ''}.`,
      'kado'
    );

    logAudit(
      db,
      'VOYE_KADO',
      `${sender.fullName} voye kado ${gift.name} (${gift.price} HT) bay ${receiver.fullName} -> ${wholeVotes} vòt + ${remainderCash} HT restan`,
      'Itilizatè'
    );

    saveDB(db);

    const { pinHash, ...safeSender } = sender;
    return res.json({
      success: true,
      user: safeSender,
      transaction: newGiftTx,
      wholeVotes,
      remainderCash,
      message: `Kado ${gift.icon} ${gift.name} voye bay ${receiver.fullName}! (${wholeVotes} vòt ${remainderCash > 0 ? `+ ${remainderCash} HT restan` : ''})`
    });
  });

  // Admin: Add or edit gift
  app.post('/api/admin/gifts', (req, res) => {
    const { id, name, icon, description, price, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Non ak pri kado a obligatwa.' });
    }

    const db = loadDB();
    if (!db.gifts) db.gifts = [];

    if (id) {
      const gift = db.gifts.find(g => g.id === id);
      if (!gift) return res.status(404).json({ error: 'Kado pa jwenn.' });
      gift.name = name.trim();
      if (icon) gift.icon = icon;
      if (description) gift.description = description;
      gift.price = Math.max(1, Number(price));
      if (isActive !== undefined) gift.isActive = !!isActive;

      logAudit(db, 'MODIFIE_KADO', `Kado ${gift.name} modifye pa admin (${gift.price} HT)`, 'Prince509');
      saveDB(db);
      return res.json({ success: true, gift, gifts: db.gifts });
    } else {
      const newGift = {
        id: 'gift_' + Date.now(),
        name: name.trim(),
        icon: icon || '🎁',
        description: description || 'Kado sipò pou jwè yo',
        price: Math.max(1, Number(price)),
        isActive: isActive !== false
      };
      db.gifts.push(newGift);
      logAudit(db, 'KREYE_KADO', `Nouvo kado ${newGift.name} kreye pa admin (${newGift.price} HT)`, 'Prince509');
      saveDB(db);
      return res.json({ success: true, gift: newGift, gifts: db.gifts });
    }
  });

  // --- VOTING (Vòt Ant De Jwè) API ---
  app.post('/api/competitions/vote', (req, res) => {
    const { voterId, competitionId, matchId, playerId } = req.body;
    if (!voterId || !competitionId || !matchId || !playerId) {
      return res.status(400).json({ error: 'Enfòmasyon vòt enkonplè.' });
    }

    const db = loadDB();
    const voter = findUserInDB(db, voterId);
    if (!voter) return res.status(404).json({ error: 'Itilizatè ki vle vote a pa jwenn.' });

    const comp = db.competitions.find(c => c.id === competitionId);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const match = comp.matches?.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match pa jwenn.' });

    // Section 6: Anpeche menm itilizatè vote plizyè fwa sou menm match la
    if (!db.votes) db.votes = [];
    const alreadyVoted = db.votes.some(v => v.matchId === matchId && v.voterId === voter.id);
    if (alreadyVoted) {
      return res.status(400).json({ error: 'Ou deja vote nan match VS sa a. Règleman MASTER PLAY pèmèt yon sèl vòt pou chak itilizatè sou menm match la.' });
    }

    if (comp.votingEnabled === false || match.votingEnabled === false) {
      return res.status(400).json({ error: 'Vòt la dezaktive pou match sa a pa administratè a.' });
    }

    if (match.votingEndTime) {
      const end = new Date(match.votingEndTime);
      if (!isNaN(end.getTime()) && new Date() > end) {
        return res.status(400).json({ error: 'Peryòd vòt la fini pou match sa a.' });
      }
    }

    const candidate = findUserInDB(db, playerId);
    const candidateName = candidate ? candidate.fullName : (match.player1.userId === playerId ? match.player1.fullName : match.player2.fullName);

    const votePrice = match.votePrice || comp.votePrice || 15;
    const availableBalance = voter.balance - (voter.reservedBalance || 0);

    if (availableBalance < votePrice) {
      return res.status(400).json({
        error: `Balans ou (${availableBalance} HT) pa ase pou peye ${votePrice} HT pou vòt la. Tanpri fè yon depo sou NatCash.`
      });
    }

    // Deduct from voter
    voter.balance -= votePrice;

    if (candidate) {
      candidate.votesReceived = (candidate.votesReceived || 0) + 1;
    }

    // Section 6: Chak fwa yon jwè resevwa 2 vòt, sa konte kòm 1 vòt/1 pwen
    const matchObj = match as any;
    if (matchObj.rawVotes1 === undefined) matchObj.rawVotes1 = (match.votes1 || 0) * 2;
    if (matchObj.rawVotes2 === undefined) matchObj.rawVotes2 = (match.votes2 || 0) * 2;

    if (match.player1.userId === playerId) {
      matchObj.rawVotes1 = (matchObj.rawVotes1 || 0) + 1;
      match.votes1 = Math.floor(matchObj.rawVotes1 / 2);
      match.player1.votesCount = match.votes1;
    } else if (match.player2.userId === playerId) {
      matchObj.rawVotes2 = (matchObj.rawVotes2 || 0) + 1;
      match.votes2 = Math.floor(matchObj.rawVotes2 / 2);
      match.player2.votesCount = match.votes2;
    }

    if (comp.scores) {
      const pScore = comp.scores.find(s => s.userId === playerId);
      if (pScore) {
        pScore.votesCount = (pScore.votesCount || 0) + 1;
      }
    }

    const refId = generateRef('VOT');
    const newVoteTx = {
      id: 'vot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      voterId,
      voterName: voter.fullName,
      competitionId,
      matchId,
      playerId,
      playerName: candidateName,
      amount: votePrice,
      timestamp: new Date().toISOString(),
      status: 'konfime' as const
    };

    if (!db.votes) db.votes = [];
    db.votes.unshift(newVoteTx);

    db.transactions.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      userId: voterId,
      userName: voter.fullName,
      userPhone: voter.phoneNumber,
      type: 'vòt',
      amount: votePrice,
      status: 'konfime',
      createdAt: new Date().toISOString(),
      reviewedBy: 'Sistèm Otomatik',
      reviewedAt: new Date().toISOString(),
      metadata: { competitionId, matchId, candidateName }
    });

    addNotification(
      db,
      voterId,
      `Vòt valide pou ${candidateName} !`,
      `Vòt ${votePrice} HT ou a pou ${candidateName} nan match ${match.player1.fullName} vs ${match.player2.fullName} te konfime avèk siksè !`,
      'vot'
    );

    logAudit(
      db,
      'VÒT_MATCH',
      `${voter.fullName} vote pou ${candidateName} nan match ${match.id} pou ${votePrice} HT`,
      'Itilizatè'
    );

    saveDB(db);

    const { pinHash, ...safeVoter } = voter;
    return res.json({
      success: true,
      user: safeVoter,
      match,
      votesCount: match.player1.userId === playerId ? match.votes1 : match.votes2,
      message: `Vòt ou a pou ${candidateName} anrejistre avèk siksè !`
    });
  });

  // Admin: Toggle voting on competition or match
  app.post('/api/admin/competitions/:id/toggle-voting', (req, res) => {
    const { matchId, votingEnabled, votePrice } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    if (matchId && comp.matches) {
      const match = comp.matches.find(m => m.id === matchId);
      if (match) {
        if (votingEnabled !== undefined) match.votingEnabled = !!votingEnabled;
        if (votePrice !== undefined) match.votePrice = Math.max(1, Number(votePrice));
      }
    } else {
      if (votingEnabled !== undefined) comp.votingEnabled = !!votingEnabled;
      if (votePrice !== undefined) comp.votePrice = Math.max(1, Number(votePrice));
    }

    logAudit(db, 'MODIFIE_VÒT', `Paramèt vòt pou ${comp.name} modifye pa admin (Aktif: ${votingEnabled}, Pri: ${votePrice} HT)`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, competition: comp });
  });

  // Admin: Create custom match between two players
  app.post('/api/admin/competitions/:id/create-match', (req, res) => {
    const { player1Id, player2Id, gameId, round, date, rules, votingEnabled, votePrice } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const p1User = findUserInDB(db, player1Id);
    const p2User = findUserInDB(db, player2Id);

    if (!p1User || !p2User) {
      return res.status(400).json({ error: 'Chwazi de jwè valab pou match la.' });
    }

    const selectedGameId = gameId || (comp.authorizedGameIds && comp.authorizedGameIds[0]) || 'game_football';
    const gameObj = db.games.find(g => g.id === selectedGameId);

    const p1ScoreObj = comp.scores?.find(s => s.userId === player1Id);
    const p2ScoreObj = comp.scores?.find(s => s.userId === player2Id);

    if (!comp.matches) comp.matches = [];

    const newMatch = {
      id: `match_${comp.id}_${Date.now()}`,
      competitionId: comp.id,
      round: round || 'top8',
      matchNumber: comp.matches.length + 1,
      player1: {
        userId: p1User.id,
        fullName: p1User.fullName,
        profilePhoto: p1User.profilePhoto,
        seedRank: p1ScoreObj?.rank || 1,
        level: p1User.level || 1,
        stars: p1User.stars || 1,
        points: p1ScoreObj?.totalScore || 1000,
        followers: p1User.followersCount || 10,
        score: 0,
        votesCount: 0,
        giftsCount: 0,
        giftsValue: 0
      },
      player2: {
        userId: p2User.id,
        fullName: p2User.fullName,
        profilePhoto: p2User.profilePhoto,
        seedRank: p2ScoreObj?.rank || 2,
        level: p2User.level || 1,
        stars: p2User.stars || 1,
        points: p2ScoreObj?.totalScore || 900,
        followers: p2User.followersCount || 10,
        score: 0,
        votesCount: 0,
        giftsCount: 0,
        giftsValue: 0
      },
      gameId: selectedGameId,
      gameTitle: gameObj ? gameObj.title : 'Challenge Match',
      date: date || 'Match Pwograme',
      rules: rules || 'Jwè ki gen pi wo nòt la pase nan pwochen faz la.',
      status: 'Pwograme' as const,
      votingEnabled: votingEnabled !== false,
      votePrice: votePrice ? Number(votePrice) : comp.votePrice || 15,
      votes1: 0,
      votes2: 0,
      gifts1: 0,
      gifts2: 0
    };

    comp.matches.push(newMatch);

    addNotification(db, p1User.id, 'Nouvo match pwograme !', `Ou gen yon match kont ${p2User.fullName} nan ${comp.name}.`, 'konpetisyon');
    addNotification(db, p2User.id, 'Nouvo match pwograme !', `Ou gen yon match kont ${p1User.fullName} nan ${comp.name}.`, 'konpetisyon');

    logAudit(db, 'KREYE_MATCH', `Nouvo match kreye nan ${comp.name}: ${p1User.fullName} VS ${p2User.fullName}`, 'Prince509');
    saveDB(db);

    return res.json({ success: true, competition: comp, match: newMatch });
  });

  // Admin: Update Competition Status (Ap vini, Enskripsyon ouvè, An kou, Enskripsyon fèmen, An poz, Fini, Anile)
  app.post('/api/admin/competitions/:id/status', (req, res) => {
    const { status } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const prevStatus = comp.status;
    comp.status = status;

    logAudit(db, 'CHANJE_ESTATI_KONPETISYON', `Estati ${comp.name} chanje soti ${prevStatus} a ${status}`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, competition: comp });
  });

  // Admin: Competition Financial Ledger Overview
  app.get('/api/admin/finance', (req, res) => {
    const db = loadDB();

    // 1. Calculate revenues
    const regTx = db.transactions.filter(t => t.type === 'enskripsyon_konpetisyon' && t.status === 'konfime');
    const totalRegRevenue = regTx.reduce((acc, t) => acc + (t.amount || 0), 0);

    const voteTx = db.transactions.filter(t => t.type === 'vòt' && t.status === 'konfime');
    const totalVoteRevenue = voteTx.reduce((acc, t) => acc + (t.amount || 0), 0);

    const giftTx = db.transactions.filter(t => t.type === 'kado' && t.status === 'konfime');
    const totalGiftRevenue = giftTx.reduce((acc, t) => acc + (t.amount || 0), 0);

    const grandTotalRevenue = totalRegRevenue + totalVoteRevenue + totalGiftRevenue;

    // 2. Deposits & Withdrawals
    const confirmedDeposits = db.transactions
      .filter(t => t.type === 'depo' && t.status === 'konfime')
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingDeposits = db.transactions
      .filter(t => t.type === 'depo' && t.status === 'an_atant')
      .reduce((acc, t) => acc + t.amount, 0);

    const confirmedWithdrawals = db.transactions
      .filter(t => t.type === 'retre' && t.status === 'konfime')
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingWithdrawals = db.transactions
      .filter(t => t.type === 'retre' && t.status === 'an_atant')
      .reduce((acc, t) => acc + t.amount, 0);

    // 3. Breakdown by Competition
    const compBreakdown = db.competitions.map(c => {
      const cRegs = c.registeredUserIds.length * c.entryFee;
      const cVotes = (db.votes || []).filter((v: any) => v.competitionId === c.id).reduce((acc: number, v: any) => acc + (v.amount || 0), 0);
      const cGifts = (db.giftTransactions || []).filter((g: any) => g.competitionId === c.id).reduce((acc: number, g: any) => acc + (g.price || 0), 0);
      return {
        id: c.id,
        name: c.name,
        badge: c.badge,
        entryFee: c.entryFee,
        participantsCount: c.registeredUserIds.length,
        regRevenue: cRegs,
        voteRevenue: cVotes,
        giftRevenue: cGifts,
        totalRevenue: cRegs + cVotes + cGifts
      };
    });

    return res.json({
      success: true,
      finance: {
        totalRegRevenue,
        totalVoteRevenue,
        totalGiftRevenue,
        grandTotalRevenue,
        confirmedDeposits,
        pendingDeposits,
        confirmedWithdrawals,
        pendingWithdrawals,
        compBreakdown,
        recentTransactions: db.transactions.slice(0, 50)
      }
    });
  });

  // Publications (Posts): Get All
  app.get('/api/posts', (req, res) => {
    const db = loadDB();
    const verifiedMap = new Map<string, boolean>(
      db.users.map((u) => [u.id, Boolean(u.verified || u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin)])
    );
    const enrichedPosts = (db.posts || []).map((p: any) => ({
      ...p,
      authorVerified: p.authorId ? (verifiedMap.get(p.authorId) ?? false) : false,
      comments: Array.isArray(p.comments)
        ? p.comments.map((c: any) => ({
            ...c,
            userVerified: c.userId ? (verifiedMap.get(c.userId) ?? false) : false,
          }))
        : [],
    }));
    return res.json({ success: true, posts: enrichedPosts });
  });

  // Check if user can post today (1 post per day limit)
  app.get('/api/posts/can-post/:userId', (req, res) => {
    const { userId } = req.params;
    const db = loadDB();
    const user = findUserInDB(db, userId);
    const todayStr = new Date().toISOString().split('T')[0];

    const todayPost = (db.posts || []).find(p =>
      (p.authorId === userId || (user && p.authorId === user.id) || (p as any).userId === userId) &&
      p.createdAt && p.createdAt.startsWith(todayStr)
    );

    if (todayPost) {
      return res.json({
        success: true,
        canPost: false,
        alreadyPostedToday: true,
        today: todayStr,
        lastPost: todayPost,
        message: 'Ou deja fè yon piblikasyon jodi a. Règ Master Play bay chak itilizatè dwa fè yon sèl piblikasyon pa jou.'
      });
    }

    return res.json({
      success: true,
      canPost: true,
      alreadyPostedToday: false,
      today: todayStr
    });
  });

  // Create a new post (enforces moderation + 1 post per day limit)
  app.post('/api/posts/create', (req, res) => {
    const { userId, title, description, mediaType, mediaUrl, videoUrl, tiktokUrl } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'UserId obligatwa pou kreye yon piblikasyon.' });
    }

    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Itilizatè sa a pa jwenn nan bazdone Master Play la.' });
    }
    if (user.certificationStatus !== 'sètifye' && user.role !== 'ADMIN' && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'NOT_CERTIFIED',
        error: 'Kont ou poko sètifye. Tanpri tann validasyon Administratè a anvan ou ka fè piblikasyon.'
      });
    }

    // 1. Content moderation check (blocks sexually explicit / pornographic content)
    const combinedMedia = mediaUrl || videoUrl || tiktokUrl || '';
    const moderation = moderatePostContent(title || '', description || '', combinedMedia);
    if (!moderation.allowed) {
      return res.status(400).json({
        success: false,
        error: moderation.reason
      });
    }

    // 2. 1 Post per day check
    const todayStr = new Date().toISOString().split('T')[0];
    const existingPostToday = (db.posts || []).find(p =>
      (p.authorId === user.id || (p as any).userId === user.id || p.authorId === userId) &&
      p.createdAt && p.createdAt.startsWith(todayStr)
    );

    if (existingPostToday) {
      return res.status(429).json({
        success: false,
        error: 'Ou deja fè yon piblikasyon jodi a. Règ Master Play pèmèt yon sèl piblikasyon pa jou pou chak itilizatè pou evite spam ak garanti bon kalite kontni.'
      });
    }

    // Determine media type
    let finalMediaType: 'text' | 'image' | 'video' = 'text';
    if (mediaType === 'video' || (combinedMedia && (combinedMedia.endsWith('.mp4') || combinedMedia.endsWith('.webm') || combinedMedia.includes('video') || combinedMedia.startsWith('data:video/')))) {
      finalMediaType = 'video';
    } else if (mediaType === 'image' || (combinedMedia && (combinedMedia.startsWith('data:image/') || combinedMedia.endsWith('.jpg') || combinedMedia.endsWith('.png') || combinedMedia.endsWith('.webp')))) {
      finalMediaType = 'image';
    } else if (combinedMedia) {
      finalMediaType = 'image';
    }

    const newPost: any = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      authorId: user.id,
      authorName: user.fullName || user.username || 'Itilizatè',
      authorPhoto: user.profilePhoto,
      title: (title || '').trim(),
      description: (description || '').trim(),
      mediaUrl: combinedMedia,
      mediaType: finalMediaType,
      likes: [],
      favorites: [],
      comments: [],
      viewsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString()
    };

    if (!db.posts) db.posts = [];
    db.posts.unshift(newPost);
    user.lastPostDate = todayStr;

    logAudit(db, 'KREYE_PIBLIKASYON', `Nouvo piblikasyon kreye pa ${user.fullName} (${user.id}): "${newPost.title.substring(0, 30)}"`, user.fullName);
    saveDB(db);

    return res.json({ success: true, post: newPost });
  });

  // Like post (toggle)
  app.post('/api/posts/:id/like', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'UserId obligatwa' });

    const db = loadDB();
    const post = (db.posts || []).find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Piblikasyon pa jwenn.' });

    if (!post.likes) post.likes = [];
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    // Recalculate monetization earnings for the author of the post
    const authorId = post.authorId || (post as any).userId;
    if (authorId) {
      const author = findUserInDB(db, authorId);
      if (author) {
        recalculateMonetizationEarnings(db, author);
      }
    }

    saveDB(db);
    return res.json({ success: true, likes: post.likes });
  });

  // Favorite post (toggle)
  app.post('/api/posts/:id/favorite', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'UserId obligatwa' });

    const db = loadDB();
    const post = (db.posts || []).find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Piblikasyon pa jwenn.' });

    const user = findUserInDB(db, userId);
    if (!post.favorites) post.favorites = [];
    if (user && !user.favoritePostIds) user.favoritePostIds = [];

    const index = post.favorites.indexOf(userId);
    let isFavorite = false;
    if (index === -1) {
      post.favorites.push(userId);
      if (user && !user.favoritePostIds.includes(post.id)) {
        user.favoritePostIds.push(post.id);
      }
      isFavorite = true;
    } else {
      post.favorites.splice(index, 1);
      if (user) {
        user.favoritePostIds = user.favoritePostIds.filter((pid: string) => pid !== post.id);
      }
      isFavorite = false;
    }

    saveDB(db);
    return res.json({ success: true, isFavorite, favorites: post.favorites });
  });

  // Comment on post
  app.post('/api/posts/:id/comment', (req, res) => {
    const { userId, text } = req.body;
    if (!userId || !text || !text.trim()) {
      return res.status(400).json({ error: 'Kòmantè pa ka vid.' });
    }

    // Check moderation for comments as well
    const moderation = moderatePostContent('', text, '');
    if (!moderation.allowed) {
      return res.status(400).json({ error: moderation.reason });
    }

    const db = loadDB();
    const post = (db.posts || []).find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Piblikasyon pa jwenn.' });

    const user = findUserInDB(db, userId);
    const newComment = {
      id: 'c_' + Date.now(),
      userId,
      userName: user ? user.fullName : 'Itilizatè',
      userPhoto: user ? user.profilePhoto : undefined,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    saveDB(db);
    return res.json({ success: true, comment: newComment, comments: post.comments });
  });

  // Follow / Unfollow User
  app.post('/api/users/:targetUserId/follow', (req, res) => {
    const { currentUserId, userId } = req.body;
    const cId = currentUserId || userId;
    const { targetUserId } = req.params;

    if (!cId) return res.status(400).json({ error: 'currentUserId obligatwa pou swiv yon itilizatè.' });
    if (cId === targetUserId) return res.status(400).json({ error: 'Ou pa ka swiv pwòp tèt ou.' });

    const db = loadDB();
    const cUser = findUserInDB(db, cId);
    const targetUser = findUserInDB(db, targetUserId);

    if (!cUser || !targetUser) {
      return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });
    }

    if (!cUser.followingIds) cUser.followingIds = [];
    if (!targetUser.followerIds) targetUser.followerIds = [];

    const isFollowing = cUser.followingIds.includes(targetUser.id);

    if (isFollowing) {
      cUser.followingIds = cUser.followingIds.filter((id: string) => id !== targetUser.id);
      targetUser.followerIds = targetUser.followerIds.filter((id: string) => id !== cUser.id);
    } else {
      cUser.followingIds.push(targetUser.id);
      targetUser.followerIds.push(cUser.id);
      addNotification(db, targetUser.id, 'Nouvo Abòne !', `${cUser.fullName || cUser.username} kòmanse swiv ou sou Master Play.`, 'anons');
    }

    cUser.followingCount = cUser.followingIds.length;
    targetUser.followersCount = targetUser.followerIds.length;

    // Recalculate monetization (including milestone bonus for 1000 followers)
    recalculateMonetizationEarnings(db, targetUser);

    saveDB(db);
    saveUserToVault(cUser);
    saveUserToVault(targetUser);

    return res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: targetUser.followersCount,
      followingCount: cUser.followingCount
    });
  });

  // Get User Profile with posts, follow state and monetization status
  app.get('/api/users/:id/profile', (req, res) => {
    const { id } = req.params;
    const currentUserId = req.query.currentUserId as string | undefined;

    const db = loadDB();
    const targetUser = findUserInDB(db, id);

    if (!targetUser) {
      return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone Master Play la.' });
    }

    const followersCount = targetUser.followersCount || (targetUser.followerIds ? targetUser.followerIds.length : 0);
    const followingCount = targetUser.followingCount || (targetUser.followingIds ? targetUser.followingIds.length : 0);
    const isFollowing = currentUserId && targetUser.followerIds ? targetUser.followerIds.includes(currentUserId) : false;

    // Recalculate monetization on profile fetch
    recalculateMonetizationEarnings(db, targetUser);

    // Fetch user's posts
    const userPosts = (db.posts || []).filter(p =>
      p.authorId === targetUser.id || (p as any).userId === targetUser.id
    );

    // Safe user view without password/sensitive fields
    const safeTargetUser: any = {
      id: targetUser.id,
      fullName: targetUser.fullName,
      username: targetUser.username,
      profilePhoto: targetUser.profilePhoto,
      bio: targetUser.bio,
      stars: targetUser.stars,
      level: targetUser.level,
      isVerified: targetUser.isVerified,
      isMonetized: Boolean(targetUser.isMonetized),
      monetizationStatus: targetUser.monetizationStatus || 'none',
      monetizedLikesCount: targetUser.monetizedLikesCount || 0,
      createdAt: targetUser.createdAt,
      followersCount,
      followingCount
    };

    return res.json({
      success: true,
      user: safeTargetUser,
      posts: userPosts,
      isFollowing,
      followersCount,
      followingCount
    });
  });

  // ========================================================
  // USER MONETIZATION SYSTEM (Sections 7, 8, 9, 10, 11, 12)
  // ========================================================

  // 1. Get User Monetization Status
  app.get('/api/monetization/status/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) {
        return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });
      }

      recalculateMonetizationEarnings(db, user);
      saveDB(db);

      const config = db.monetizationConfig || {
        activationFee: 250,
        minFollowersRequired: 1000,
        earningsPer1000Likes: 500,
        followerMilestoneRequired: 1000,
        followerMilestoneBonus: 1000,
        minPayoutAmount: 500,
        isEnabled: true
      };

      const followersCount = user.followersCount || (user.followerIds ? user.followerIds.length : 0);
      const isEligible = followersCount >= (config.minFollowersRequired || 1000);

      return res.json({
        success: true,
        isEligible,
        followersCount,
        minFollowersRequired: config.minFollowersRequired || 1000,
        activationFee: config.activationFee || 250,
        isMonetized: Boolean(user.isMonetized),
        monetizationStatus: user.monetizationStatus || 'none',
        totalEarnings: user.totalEarnings || 0,
        availableEarnings: user.availableEarnings || 0,
        paidEarnings: user.paidEarnings || 0,
        monetizedLikesCount: user.monetizedLikesCount || 0,
        followerMilestonePaid: Boolean(user.followerMilestonePaid),
        userBalance: user.balance || 0,
        config
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje estati monetizasyon.' });
    }
  });

  // 2. Request Monetization
  app.post('/api/monetization/request', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'UserId obligatwa.' });

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });

      const config = db.monetizationConfig || { minFollowersRequired: 1000, activationFee: 250 };
      const followers = user.followersCount || (user.followerIds ? user.followerIds.length : 0);

      if (followers < config.minFollowersRequired) {
        return res.status(400).json({
          error: `Ou bezwen omwen ${config.minFollowersRequired.toLocaleString()} abòne pou kalifye pou monetizasyon. Ou gen ${followers.toLocaleString()} abòne kounye a.`
        });
      }

      user.monetizationStatus = 'pending';
      user.monetizationRequestedAt = new Date().toISOString();
      saveUserToVault(user);
      saveDB(db);

      return res.json({
        success: true,
        message: 'Demann monetizasyon ou anrejistre avèk siksè. Ou ka peye frè aktivasyon an kounye a.',
        monetizationStatus: user.monetizationStatus,
        activationFee: config.activationFee
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan voye demann monetizasyon.' });
    }
  });

  // 3. Activate Monetization (Deduct activation fee from balance)
  app.post('/api/monetization/activate', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'UserId obligatwa.' });

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });

      const config = db.monetizationConfig || { minFollowersRequired: 1000, activationFee: 250, earningsPer1000Likes: 500 };
      const followers = user.followersCount || (user.followerIds ? user.followerIds.length : 0);

      if (followers < config.minFollowersRequired) {
        return res.status(400).json({
          error: `Ou bezwen omwen ${config.minFollowersRequired.toLocaleString()} abòne pou aktive monetizasyon. Ou gen ${followers.toLocaleString()} abòne kounye a.`
        });
      }

      const fee = config.activationFee || 250;
      if ((user.balance || 0) < fee) {
        return res.status(400).json({
          error: `Balans ou pa ase (${user.balance || 0} HT). Frè aktivasyon monetizasyon an se ${fee} HT. Tanpri fè yon depo NatCash pou konplete aktivasyon an.`
        });
      }

      // Deduct activation fee
      user.balance -= fee;
      user.isMonetized = true;
      user.monetizationStatus = 'active';
      user.monetizationApprovedAt = new Date().toISOString();

      // Record in ledger
      recordFinancialLedger(db, {
        userId: user.id,
        type: 'frais_monetizasyon',
        amount: fee,
        status: 'completed',
        source: `Balans Jwèt (${user.fullName})`,
        destination: 'Master Play Kès Administratè',
        description: `Frè aktivasyon monetizasyon kreyatè pou ${user.fullName} (${user.id})`
      });

      // Recalculate earnings
      recalculateMonetizationEarnings(db, user);

      addNotification(
        db,
        user.id,
        '⭐ Monetizasyon Aktive !',
        `Felisitasyon ! Kont ou legalize e monetize sou Master Play. W ap touche 500 G pou chak 1,000 likes sou videyo ou yo.`,
        'anons'
      );

      saveUserToVault(user);
      saveDB(db);

      return res.json({
        success: true,
        message: 'Felisitasyon ! Monetizasyon ou aktive avèk siksè sou Master Play.',
        user: {
          id: user.id,
          isMonetized: user.isMonetized,
          monetizationStatus: user.monetizationStatus,
          balance: user.balance,
          totalEarnings: user.totalEarnings,
          availableEarnings: user.availableEarnings
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan aktive monetizasyon.' });
    }
  });

  // 4. Transfer Monetization Earnings to Main Gaming Balance
  app.post('/api/monetization/transfer-to-balance', (req, res) => {
    try {
      const { userId, amount } = req.body;
      if (!userId) return res.status(400).json({ error: 'UserId obligatwa.' });

      const transferAmount = Number(amount);
      if (!transferAmount || transferAmount <= 0 || isNaN(transferAmount)) {
        return res.status(400).json({ error: 'Montan transfè a dwe valab epi pi gwo pase 0.' });
      }

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });

      recalculateMonetizationEarnings(db, user);

      if ((user.availableEarnings || 0) < transferAmount) {
        return res.status(400).json({
          error: `Revni disponib ou pa ase (${user.availableEarnings || 0} HT disponib).`
        });
      }

      user.paidEarnings = (user.paidEarnings || 0) + transferAmount;
      user.availableEarnings = Math.max(0, (user.totalEarnings || 0) - user.paidEarnings);
      user.balance = (user.balance || 0) + transferAmount;

      recordFinancialLedger(db, {
        userId: user.id,
        type: 'transfe_balans',
        amount: transferAmount,
        status: 'completed',
        source: 'Revni Kreyatè Master Play',
        destination: `Balans Jwèt (${user.fullName})`,
        description: `Transfè revni kreyatè nan balans prensipal pou ${user.fullName}`
      });

      addNotification(
        db,
        user.id,
        '💰 Transfè Revni Reyisi',
        `Ou transfere ${transferAmount} HT soti nan revni kreyatè ou ale nan balans jwèt ou avèk siksè.`,
        'anons'
      );

      saveUserToVault(user);
      saveDB(db);

      return res.json({
        success: true,
        message: `${transferAmount} HT transfere nan balans ou avèk siksè.`,
        user: {
          id: user.id,
          balance: user.balance,
          totalEarnings: user.totalEarnings,
          availableEarnings: user.availableEarnings,
          paidEarnings: user.paidEarnings
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan transfere revni.' });
    }
  });

  // 5. Admin: Get Monetization Overview & Creators
  app.get('/api/admin/monetization', (req, res) => {
    try {
      const db = loadDB();
      const config = db.monetizationConfig || {
        activationFee: 250,
        minFollowersRequired: 1000,
        earningsPer1000Likes: 500,
        followerMilestoneRequired: 1000,
        followerMilestoneBonus: 1000,
        minPayoutAmount: 500,
        isEnabled: true
      };

      // Find all monetized or eligible users
      const creators = db.users
        .filter(u => u.isMonetized || u.monetizationStatus === 'active' || (u.followersCount || 0) >= 1000)
        .map(u => {
          recalculateMonetizationEarnings(db, u);
          return {
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            phoneNumber: u.phoneNumber,
            profilePhoto: u.profilePhoto,
            followersCount: u.followersCount || 0,
            isMonetized: Boolean(u.isMonetized),
            monetizationStatus: u.monetizationStatus || 'none',
            monetizedLikesCount: u.monetizedLikesCount || 0,
            totalEarnings: u.totalEarnings || 0,
            availableEarnings: u.availableEarnings || 0,
            paidEarnings: u.paidEarnings || 0,
            followerMilestonePaid: Boolean(u.followerMilestonePaid),
            balance: u.balance || 0,
            monetizationApprovedAt: u.monetizationApprovedAt
          };
        });

      return res.json({
        success: true,
        config,
        creators,
        totalCreatorsCount: creators.length,
        totalMonetizedCount: creators.filter(c => c.isMonetized).length
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan rekipere done monetizasyon.' });
    }
  });

  // 6. Admin: Update Monetization Config
  app.post('/api/admin/monetization/config', (req, res) => {
    try {
      const { activationFee, minFollowersRequired, earningsPer1000Likes, followerMilestoneBonus, minPayoutAmount, isEnabled } = req.body;
      const db = loadDB();

      if (!db.monetizationConfig) {
        db.monetizationConfig = {
          activationFee: 250,
          minFollowersRequired: 1000,
          earningsPer1000Likes: 500,
          followerMilestoneRequired: 1000,
          followerMilestoneBonus: 1000,
          minPayoutAmount: 500,
          isEnabled: true
        };
      }

      if (activationFee !== undefined) db.monetizationConfig.activationFee = Math.max(0, Number(activationFee));
      if (minFollowersRequired !== undefined) db.monetizationConfig.minFollowersRequired = Math.max(1, Number(minFollowersRequired));
      if (earningsPer1000Likes !== undefined) db.monetizationConfig.earningsPer1000Likes = Math.max(0, Number(earningsPer1000Likes));
      if (followerMilestoneBonus !== undefined) db.monetizationConfig.followerMilestoneBonus = Math.max(0, Number(followerMilestoneBonus));
      if (minPayoutAmount !== undefined) db.monetizationConfig.minPayoutAmount = Math.max(0, Number(minPayoutAmount));
      if (isEnabled !== undefined) db.monetizationConfig.isEnabled = Boolean(isEnabled);

      logAudit(
        db,
        'MODIFIE_MONETIZASYON_CONFIG',
        `Konfigirasyon monetizasyon modifye (Frè: ${db.monetizationConfig.activationFee} HT, 1k Likes: ${db.monetizationConfig.earningsPer1000Likes} G, Bonis 1k Abòne: ${db.monetizationConfig.followerMilestoneBonus} G)`,
        'Prince509'
      );

      saveDB(db);
      return res.json({ success: true, config: db.monetizationConfig });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan mete ajou konfigirasyon monetizasyon.' });
    }
  });

  // 7. Admin: Toggle/Approve/Suspend User Monetization
  app.post('/api/admin/monetization/users/:userId/toggle', (req, res) => {
    try {
      const { userId } = req.params;
      const { status, isMonetized } = req.body;

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      if (status !== undefined) user.monetizationStatus = status;
      if (isMonetized !== undefined) user.isMonetized = Boolean(isMonetized);

      if (user.isMonetized) {
        user.monetizationApprovedAt = user.monetizationApprovedAt || new Date().toISOString();
        recalculateMonetizationEarnings(db, user);
      }

      saveUserToVault(user);
      saveDB(db);

      logAudit(
        db,
        'AJOUTE_MONETIZASYON_STATUS',
        `Monetizasyon pou ${user.fullName} (${user.id}) mete nan estati "${user.monetizationStatus}" (Aktif: ${user.isMonetized})`,
        'Prince509'
      );

      return res.json({ success: true, user });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan modifye estati kreyatè a.' });
    }
  });

  // 8. Admin: Manual Creator Payout
  app.post('/api/admin/monetization/users/:userId/payout', (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, adminPin } = req.body;

      if (adminPin !== 'Prince509') {
        return res.status(403).json({ error: 'Kòd PIN Administratè a pa kòrèk.' });
      }

      const payoutAmount = Number(amount);
      if (!payoutAmount || payoutAmount <= 0) {
        return res.status(400).json({ error: 'Montan peman an dwe pi gwo pase 0.' });
      }

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      recalculateMonetizationEarnings(db, user);

      if ((user.availableEarnings || 0) < payoutAmount) {
        return res.status(400).json({
          error: `Revni disponib kreyatè a (${user.availableEarnings || 0} HT) pa ase pou peman ${payoutAmount} HT sa a.`
        });
      }

      user.paidEarnings = (user.paidEarnings || 0) + payoutAmount;
      user.availableEarnings = Math.max(0, (user.totalEarnings || 0) - user.paidEarnings);

      recordFinancialLedger(db, {
        userId: user.id,
        type: 'peman_revni',
        amount: payoutAmount,
        status: 'completed',
        source: 'Kès Master Play',
        destination: `Peman Kreyatè (${user.fullName})`,
        description: `Peman revni monetizasyon dirèk pa administratè pou ${user.fullName}`
      });

      addNotification(
        db,
        user.id,
        '💵 Peman Revni Fèt !',
        `Administratè a voye ${payoutAmount} HT pou revni kreyatè ou. Mèsi pou kontribisyon ou sou Master Play !`,
        'anons'
      );

      saveUserToVault(user);
      saveDB(db);

      return res.json({ success: true, user });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan fè peman kreyatè a.' });
    }
  });

  // ========================================================
  // ALGORITHM INTELLIGENCE & DECISION SYSTEM (13, 14, 15)
  // ========================================================

  // 1. Get Algorithm Intelligence Dashboard Data
  app.get('/api/admin/algorithm-intelligence', (req, res) => {
    try {
      const db = loadDB();
      const analysis = analyzeSystemData(db);
      return res.json({ success: true, data: analysis });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan analiz sistèm algorithm la.' });
    }
  });

  // 2. Review Algorithm Approvals (Approve/Reject automated suggestions)
  app.post('/api/admin/algorithm-approvals/:id/review', (req, res) => {
    try {
      const { id } = req.params;
      const { action, adminPin, reviewNotes } = req.body;

      if (adminPin !== 'Prince509') {
        return res.status(403).json({ error: 'Kòd PIN Administratè a pa kòrèk.' });
      }

      const db = loadDB();
      const item = (db.algorithmApprovals || []).find(a => a.id === id);
      if (!item) return res.status(404).json({ error: 'Demann apwobasyon pa jwenn.' });

      item.status = action === 'approve' ? 'approved' : 'rejected';
      item.reviewedBy = 'Prince509';
      item.reviewedAt = new Date().toISOString();
      if (reviewNotes) item.reviewNotes = reviewNotes;

      logAudit(
        db,
        'REVIZE_ALGORITHM_APWOBASYON',
        `Demann algorithm ${item.type} (${item.id}) te ${item.status} pa admin.`,
        'Prince509'
      );

      saveDB(db);
      return res.json({ success: true, item });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan revize apwobasyon an.' });
    }
  });

  // 3. Clean Fake Accounts and Sanitize Followers
  app.post('/api/admin/clean-fake-accounts', (req, res) => {
    try {
      const { adminPin } = req.body;
      if (adminPin !== 'Prince509') {
        return res.status(403).json({ error: 'Kòd PIN Administratè a pa kòrèk.' });
      }

      const db = loadDB();
      const result = cleanFakeAccounts(db);

      logAudit(
        db,
        'NETWAYE_FO_KONT',
        `Netwayaj fo kont ak fo abòne fèt: ${result.removedCount} fo kont retire, ${result.sanitizedFollowersCount} lis abòne korije.`,
        'Prince509'
      );

      saveDB(db);
      return res.json({
        success: true,
        message: `Netwayaj la reyisi ! ${result.removedCount} fo kont retire, ${result.sanitizedFollowersCount} relasyon abòne netwaye.`,
        ...result
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan netwaye fo kont yo.' });
    }
  });

  // Featured Matches for Home Page (Match VS sou Home)
  app.get('/api/matches/home-featured', (req, res) => {
    const db = loadDB();
    const featuredMatches: any[] = [];

    (db.competitions || []).forEach(comp => {
      (comp.matches || []).forEach(match => {
        featuredMatches.push({
          ...match,
          competitionId: comp.id,
          competitionName: comp.name,
          competitionStatus: comp.status,
          entryFee: comp.entryFee,
          prizes: comp.prizes,
          votePrice: match.votePrice || comp.votePrice || 15
        });
      });
    });

    // Sort: 'An kou' first, then 'Pwograme', then by total activity
    featuredMatches.sort((a, b) => {
      if (a.status === 'An kou' && b.status !== 'An kou') return -1;
      if (b.status === 'An kou' && a.status !== 'An kou') return 1;
      return ((b.votes1 || 0) + (b.votes2 || 0)) - ((a.votes1 || 0) + (a.votes2 || 0));
    });

    return res.json({
      success: true,
      matches: featuredMatches.slice(0, 4)
    });
  });

  // Games: Get All
  app.get('/api/games', (req, res) => {
    const db = loadDB();
    return res.json({ success: true, games: db.games });
  });

  // Games: Pay Entry Fee before starting game in Games Page
  app.post('/api/games/pay-entry', (req, res) => {
    const { gameId, userId } = req.body;
    const db = loadDB();

    const game = db.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });

    const entryFee = Math.max(0, Number(game.entryFee) || 0);

    if (entryFee > 0) {
      if (user.balance < entryFee) {
        return res.status(400).json({
          error: `Balans ou (${user.balance} HT) pa ase pou peye frè ${entryFee} HT la. Tanpri fè yon depo sou NatCash.`,
          required: entryFee,
          balance: user.balance
        });
      }

      user.balance -= entryFee;

      // Add to transactions ledger
      const tx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        referenceId: generateRef('FEE'),
        userId: user.id,
        userName: user.fullName || user.username,
        userPhone: user.phone || '',
        type: 'frè_jwèt',
        amount: entryFee,
        fee: 0,
        netAmount: entryFee,
        status: 'konfime' as const,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        description: `Peman frè jwèt pou "${game.title}" nan Sal Jwèt (Pri: ${entryFee} HT)`,
        metadata: {
          gameId: game.id,
          gameTitle: game.title,
          source: 'sal_jwet'
        }
      };
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift(tx);

      addNotification(
        db,
        user.id,
        `Peman Jwèt Reyisi (${game.title})`,
        `Ou peye ${entryFee} HT pou w jwe ${game.title} nan Sal Jwèt la. Bon chans!`,
        'anons'
      );

      logAudit(
        db,
        'PEMAN_FRÈ_JWÈT',
        `Itilizatè ${user.fullName} (${user.id}) peye ${entryFee} HT pou jwe jwèt "${game.title}". Nouvo balans: ${user.balance} HT`,
        user.fullName
      );

      saveDB(db);
    }

    const { pinHash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, game, feePaid: entryFee });
  });

  // Games: Play / Record Result
  app.post('/api/games/play', (req, res) => {
    const { gameId, userId, score, wonPrize, skipFee } = req.body;
    const db = loadDB();

    const game = db.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

    // Handle fee if applicable and not already skipped/paid at game start
    if (!skipFee && game.isPaid && game.entryFee > 0) {
      if (user.balance < game.entryFee) {
        return res.status(400).json({ error: `Balans ou pa ase pou peye ${game.entryFee} HT.` });
      }
      user.balance -= game.entryFee;

      const tx = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        referenceId: generateRef('FEE'),
        userId: user.id,
        userName: user.fullName || user.username,
        userPhone: user.phone || '',
        type: 'frè_jwèt',
        amount: game.entryFee,
        fee: 0,
        netAmount: game.entryFee,
        status: 'konfime' as const,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        description: `Peman frè jwèt pou "${game.title}" nan Sal Jwèt (Pri: ${game.entryFee} HT)`,
        metadata: { gameId: game.id, gameTitle: game.title, source: 'sal_jwet' }
      };
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift(tx);
    }

    // If prize won
    if (wonPrize && typeof wonPrize === 'number' && wonPrize > 0) {
      user.balance += wonPrize;
      addNotification(db, user.id, `Gayan nan ${game.title} !`, `Ou genyen ${wonPrize} HT sou jwèt ${game.title} !`, 'rezilta');
    }

    // Update high scores
    if (score && score > 0) {
      if (!game.highScores) game.highScores = [];
      game.highScores.push({
        userId: user.id,
        userName: user.fullName,
        score,
        date: new Date().toISOString().split('T')[0]
      });
      // Sort and keep top 10
      game.highScores.sort((a, b) => b.score - a.score);
      game.highScores = game.highScores.slice(0, 10);
    }

    saveDB(db);
    const { pinHash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, game });
  });

  // Transactions: Get for User
  app.get('/api/transactions/user/:userId', (req, res) => {
    const db = loadDB();
    const userTx = db.transactions.filter(t => t.userId === req.params.userId);
    return res.json({ success: true, transactions: userTx });
  });

  // Transactions: Deposit Request
  app.post('/api/transactions/deposit', (req, res) => {
    const { userId, natcashName, natcashPhone, amount, proofImage } = req.body;
    if (!userId || !natcashName || !natcashPhone || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Tanpri bay tout enfòmasyon transfè a ak montan ki valab.' });
    }

    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });
    if (user.certificationStatus !== 'sètifye' && user.role !== 'ADMIN' && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'NOT_CERTIFIED',
        error: 'Kont ou poko sètifye. Tanpri tann validasyon Administratè a anvan ou ka fè depo.'
      });
    }

    const newTx = {
      id: 'tx_' + Date.now(),
      referenceId: generateRef('DEP'),
      userId,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      type: 'depo' as const,
      amount: Number(amount),
      natcashName: natcashName.trim(),
      natcashPhone: natcashPhone.trim(),
      proofImage,
      status: 'an_atant' as const,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(newTx);

    addNotification(
      db,
      userId,
      `Demann depo soumèt: ${newTx.referenceId}`,
      `Demann depo ${amount} HT ou a an atant verifikasyon administratè a.`,
      'depo'
    );

    logAudit(
      db,
      'DEMANN_DEPO',
      `Nouvo demann depo: ${newTx.referenceId} pa ${user.fullName} (${amount} HT sou NatCash ${natcashPhone})`,
      'Itilizatè'
    );

    saveDB(db);
    return res.json({ success: true, transaction: newTx });
  });

  // Transactions: Withdrawal Request
  app.post('/api/transactions/withdraw', (req, res) => {
    const { userId, recipientName, natcashPhone, amount } = req.body;
    if (!userId || !recipientName || !natcashPhone || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Tanpri ranpli tout chan retrè yo ak yon montan valab.' });
    }

    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });
    if (user.certificationStatus !== 'sètifye' && user.role !== 'ADMIN' && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        code: 'NOT_CERTIFIED',
        error: 'Kont ou poko sètifye. Tanpri tann validasyon Administratè a anvan ou ka fè retrè.'
      });
    }

    const numAmount = Number(amount);
    const availableBalance = user.balance - (user.reservedBalance || 0);

    if (numAmount > availableBalance) {
      return res.status(400).json({
        error: `Balans ou pa ase pou retire ${numAmount} HT. Balans disponib: ${availableBalance} HT.`
      });
    }

    // Atomic reservation of funds
    user.reservedBalance = (user.reservedBalance || 0) + numAmount;

    const newTx = {
      id: 'tx_' + Date.now(),
      referenceId: generateRef('RET'),
      userId,
      userName: user.fullName,
      userPhone: user.phoneNumber,
      type: 'retre' as const,
      amount: numAmount,
      natcashName: recipientName.trim(),
      natcashPhone: natcashPhone.trim(),
      status: 'an_atant' as const,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(newTx);

    addNotification(
      db,
      userId,
      `Demann retrè soumèt: ${newTx.referenceId}`,
      `Demann retrè ${numAmount} HT ou a anrejistre epi l ap trete sou nimewo NatCash ${natcashPhone}.`,
      'retre'
    );

    logAudit(
      db,
      'DEMANN_RETRE',
      `Nouvo demann retrè: ${newTx.referenceId} pa ${user.fullName} (${numAmount} HT)`,
      'Itilizatè'
    );

    saveDB(db);

    const { pinHash, ...safeUser } = user;
    return res.json({ success: true, transaction: newTx, user: safeUser });
  });

  // Notifications: Get User Notifications
  app.get('/api/notifications/:userId', (req, res) => {
    const db = loadDB();
    const notifs = db.notifications.filter(
      n => n.userId === req.params.userId || n.userId === 'all'
    );
    return res.json({ success: true, notifications: notifs });
  });

  // Notifications: Mark as Read
  app.post('/api/notifications/read', (req, res) => {
    const { notificationId } = req.body;
    const db = loadDB();
    const notif = db.notifications.find(n => n.id === notificationId);
    if (notif) notif.isRead = true;
    saveDB(db);
    return res.json({ success: true });
  });

  // --- ADMIN ROUTES ---

  // Admin: Verify PIN
  app.post('/api/admin/verify-pin', (req, res) => {
    const { pin } = req.body;
    const db = loadDB();
    const normalizedInput = String(pin || '').trim().toLowerCase();
    const normalizedAdminPin = String(db.adminPin || 'prince509').trim().toLowerCase();
    if (normalizedInput && normalizedInput === normalizedAdminPin) {
      return res.json({ success: true, authorized: true });
    }
    return res.status(401).json({ error: 'Kòd sekirite administratè a pa kòrèk.' });
  });

  // Admin: Verify Server Session
  app.post('/api/admin/verify-session', (req, res) => {
    const { userId, adminToken } = req.body;
    if (!userId || !adminToken) {
      return res.status(403).json({ success: false, authorized: false, error: 'Paj sa a entèdi.' });
    }
    const db = loadDB();
    const session = db.adminSessions?.[adminToken];
    const user = findUserInDB(db, userId);
    if (!session || !user || session.userId !== user.id || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return res.status(403).json({ success: false, authorized: false, error: 'Paj sa a entèdi.' });
    }
    return res.json({ success: true, authorized: true });
  });

  // Account Certification: Get status from database
  app.get('/api/users/:id/certification', (req, res) => {
    const db = loadDB();
    const user = findUserInDB(db, req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Itilizatè pa jwenn nan bazdone a.' });
    }
    const { pinHash, ...safeUser } = user as any;
    return res.json({
      success: true,
      verified: Boolean(user.verified || user.certificationStatus === 'sètifye' || user.role === 'ADMIN' || user.isAdmin),
      certificationStatus: user.certificationStatus || 'non_sètifye',
      certifiedAt: user.certifiedAt,
      certifiedBy: user.certifiedBy,
      user: safeUser,
    });
  });

  // Admin: Certify a user account
  app.post('/api/admin/certify-user', (req, res) => {
    const { userId, adminId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId obligatwa.' });
    }
    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Itilizatè pa jwenn nan bazdone a.' });
    }

    const nowIso = new Date().toISOString();
    user.certificationStatus = 'sètifye';
    user.verified = true;
    user.certifiedAt = nowIso;
    user.certifiedBy = adminId || 'Administratè MASTER PLAY';
    user.isVerifiedInDatabase = true;
    user.verifiedInDatabaseAt = user.verifiedInDatabaseAt || nowIso;

    saveUserToVault(user);
    addNotification(
      db,
      user.id,
      'Kont ou Sètifye ✅',
      'Felisitasyon! Administratè MASTER PLAY valide epi sètifye kont ou. Kounye a ou gen aksè ak tout fonksyon platfòm nan.',
      'anons'
    );
    logAudit(
      db,
      'SETIFIKASYON_KONT',
      `Kont sètifye pou ${user.fullName} (${user.masterPlayId || user.id})`,
      adminId || 'Administratè'
    );
    saveDB(db);

    const { pinHash, ...safeUser } = user as any;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Kont itilizatè a sètifye avèk siksè.',
    });
  });

  // Admin: Revoke certification from a user account
  app.post('/api/admin/uncertify-user', (req, res) => {
    const { userId, adminId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId obligatwa.' });
    }
    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Itilizatè pa jwenn nan bazdone a.' });
    }
    if (user.role === 'ADMIN' || user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Pa kapab retire sètifikasyon sou kont Administratè a.' });
    }

    user.certificationStatus = 'non_sètifye';
    user.verified = false;
    user.certifiedAt = undefined;
    user.certifiedBy = undefined;

    saveUserToVault(user);
    addNotification(
      db,
      user.id,
      'Sètifikasyon Kont Retire',
      'Administratè MASTER PLAY retire sètifikasyon kont ou pou kounye a.',
      'anons'
    );
    logAudit(
      db,
      'RETIRE_SETIFIKASYON',
      `Sètifikasyon retire pou ${user.fullName} (${user.masterPlayId || user.id})`,
      adminId || 'Administratè'
    );
    saveDB(db);

    const { pinHash, ...safeUser } = user as any;
    return res.json({
      success: true,
      user: safeUser,
      message: 'Sètifikasyon kont la retire avèk siksè.',
    });
  });

  // --- GLOBAL APP MEMORY & SYNCHRONIZATION ROUTES ---

  // Idempotent Sync Endpoint for offline/queued client mutations
  app.post('/api/memory/sync', (req, res) => {
    try {
      const { userId, clientMutationId, actionType, pageOrFeature, data: payloadData } = req.body;
      if (!actionType || !pageOrFeature) {
        return res.status(400).json({ success: false, error: 'actionType ak pageOrFeature obligatwa.' });
      }
      const db = loadDB();
      if (!db.globalMemory) {
        db.globalMemory = {
          schemaVersion: 1,
          dataVersion: 1,
          lastUpdatedAt: new Date().toISOString(),
          backupSnapshots: [],
          events: [],
          syncErrors: [],
          processedMutationIds: [],
        };
      }

      if (clientMutationId && db.globalMemory.processedMutationIds.includes(clientMutationId)) {
        return res.json({
          success: true,
          alreadyProcessed: true,
          dataVersion: db.globalMemory.dataVersion,
        });
      }

      if (userId && userId !== 'system') {
        const user = findUserInDB(db, userId);
        if (!user) {
          db.globalMemory.syncErrors.unshift({
            id: 'syserr_' + Date.now(),
            userId,
            actionType,
            error: 'Itilizatè pa jwenn pandan synchronization',
            timestamp: new Date().toISOString(),
          });
          if (db.globalMemory.syncErrors.length > 200) {
            db.globalMemory.syncErrors = db.globalMemory.syncErrors.slice(0, 200);
          }
          saveDB(db);
          return res.status(404).json({ success: false, error: 'Itilizatè pa jwenn.' });
        }
      }

      const evt = recordMemoryEvent(db, {
        userId: userId || 'system',
        actionType,
        pageOrFeature,
        result: 'success',
        data: payloadData,
        clientMutationId,
      });

      if (clientMutationId) {
        db.globalMemory.processedMutationIds.unshift(clientMutationId);
        if (db.globalMemory.processedMutationIds.length > 2000) {
          db.globalMemory.processedMutationIds = db.globalMemory.processedMutationIds.slice(0, 2000);
        }
      }

      saveDB(db);
      return res.json({
        success: true,
        alreadyProcessed: false,
        event: evt,
        dataVersion: db.globalMemory.dataVersion,
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Erè nan synchronization.' });
    }
  });

  // Single-source-of-truth User Memory Snapshot
  app.get('/api/memory/user/:userId', (req, res) => {
    const db = loadDB();
    const user = findUserInDB(db, req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Itilizatè pa jwenn nan memwa global la.' });
    }
    const { pinHash, ...safeUser } = user as any;
    const events = (db.globalMemory?.events || [])
      .filter((e) => e.userId === user.id)
      .slice(0, 50);
    return res.json({
      success: true,
      user: {
        ...safeUser,
        verified: Boolean(user.verified || user.certificationStatus === 'sètifye' || user.role === 'ADMIN' || user.isAdmin),
      },
      events,
      dataVersion: db.globalMemory?.dataVersion || 1,
    });
  });

  // Admin: Global Memory & Database System Overview
  app.get('/api/admin/memory-overview', (_req, res) => {
    const db = loadDB();
    const posts = db.posts || [];
    const videosCount = posts.filter((p) => p.mediaType === 'video' || p.videoUrl || (p as any).videoMasterUrl || p.tiktokUrl).length;
    let scoresCount = 0;
    (db.competitions || []).forEach((c: any) => {
      if (Array.isArray(c.scores)) scoresCount += c.scores.length;
    });
    (db.games || []).forEach((g: any) => {
      if (Array.isArray(g.highScores)) scoresCount += g.highScores.length;
    });
    const needsVerificationUsers = (db.users || [])
      .filter((u) => !u.verified && u.certificationStatus !== 'sètifye' && u.role !== 'ADMIN' && !u.isAdmin)
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phoneNumber: u.phoneNumber,
        masterPlayId: u.masterPlayId,
        createdAt: u.createdAt,
      }));

    return res.json({
      success: true,
      overview: {
        stats: {
          usersCount: (db.users || []).length,
          publicationsCount: posts.length,
          videosCount,
          competitionsCount: (db.competitions || []).length,
          scoresCount,
          transactionsCount: (db.transactions || []).length,
          eventsCount: (db.globalMemory?.events || []).length,
          needsVerificationCount: needsVerificationUsers.length,
          syncErrorsCount: (db.globalMemory?.syncErrors || []).length,
        },
        backupStatus: {
          schemaVersion: db.globalMemory?.schemaVersion || 1,
          dataVersion: db.globalMemory?.dataVersion || 1,
          lastUpdatedAt: db.globalMemory?.lastUpdatedAt || new Date().toISOString(),
          lastBackupAt: db.globalMemory?.lastBackupAt,
          lastBackupVersion: db.globalMemory?.lastBackupVersion,
          snapshots: db.globalMemory?.backupSnapshots || [],
        },
        recentEvents: (db.globalMemory?.events || []).slice(0, 60),
        syncErrors: (db.globalMemory?.syncErrors || []).slice(0, 30),
        needsVerificationUsers,
      },
    });
  });

  // Admin: Create Immediate Versioned Backup Snapshot
  app.post('/api/admin/memory-backup', (req, res) => {
    const db = loadDB();
    const meta = createBackupSnapshot(db);
    if (!meta) {
      return res.status(500).json({ success: false, error: 'Pa kapab kreye backup la.' });
    }
    recordMemoryEvent(db, {
      userId: req.body?.adminId || 'admin',
      actionType: 'BACKUP_CREATED',
      pageOrFeature: 'AdminPortal / Memwa Database',
      result: 'success',
      data: { fileName: meta.fileName, version: meta.version, checksum: meta.checksum },
    });
    logAudit(db, 'BACKUP_DATABASE', `Nouvo backup v${meta.version} kreye (${meta.fileName})`, req.body?.adminId || 'Administratè');
    saveDB(db);
    return res.json({ success: true, snapshot: meta });
  });

  // Admin: Restore from Versioned Backup Snapshot (requires explicit confirmation)
  app.post('/api/admin/memory-restore', (req, res) => {
    const { fileName, confirmRestore, adminId } = req.body;
    if (!confirmRestore || !fileName) {
      return res.status(400).json({ success: false, error: 'Konfimasyon ak non fichye backup la obligatwa.' });
    }
    const safeName = path.basename(String(fileName));
    const targetPath = path.resolve(BACKUP_DIR, safeName);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ success: false, error: 'Fichye backup sa a pa jwenn.' });
    }
    try {
      const restored: DBState = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      if (!restored || !Array.isArray(restored.users) || restored.users.length === 0) {
        return res.status(400).json({ success: false, error: 'Fichye backup la pa valid oswa li vid.' });
      }
      logAudit(restored, 'RESTORE_DATABASE', `Bazdone restore depi backup ${safeName}`, adminId || 'Administratè');
      recordMemoryEvent(restored, {
        userId: adminId || 'admin',
        actionType: 'BACKUP_RESTORED',
        pageOrFeature: 'AdminPortal / Memwa Database',
        result: 'success',
        data: { fileName: safeName },
      });
      saveDB(restored);
      return res.json({ success: true, message: `Bazdone restore avèk siksè depi ${safeName}.` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erè pandan restore backup la.' });
    }
  });

  // Admin: Change PIN
  app.post('/api/admin/change-pin', (req, res) => {
    const { currentPin, newPin } = req.body;
    const db = loadDB();
    if (currentPin !== db.adminPin) {
      return res.status(401).json({ error: 'Ansyen kòd admin lan pa kòrèk.' });
    }
    if (!newPin || newPin.length < 5) {
      return res.status(400).json({ error: 'Nouvo kòd admin lan dwe gen omwen 5 karaktè.' });
    }
    db.adminPin = newPin;
    logAudit(db, 'CHANJMAN_KÒD_ADMIN', 'Kòd aksè administrasyon an te modifye', 'Prince509');
    saveDB(db);
    return res.json({ success: true, message: 'Kòd administratè a chanje avèk siksè.' });
  });

  // Admin: Get Dashboard Stats & All Data
  app.get('/api/admin/overview', (req, res) => {
    const db = loadDB();
    const totalUsers = db.users.length;
    const pendingDeposits = db.transactions.filter(t => t.type === 'depo' && t.status === 'an_atant');
    const pendingWithdrawals = db.transactions.filter(t => t.type === 'retre' && t.status === 'an_atant');
    const totalCompetitions = db.competitions.length;
    const activeCompetitions = db.competitions.filter(c => c.status === 'active').length;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        pendingDepositsCount: pendingDeposits.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        totalCompetitions,
        activeCompetitions,
      },
      users: db.users.map(({ pinHash, ...u }) => u),
      transactions: db.transactions,
      competitions: db.competitions,
      posts: db.posts,
      games: db.games,
      dailyLevelRecords: (db.dailyLevelRecords || []).slice(-200).reverse(),
      auditLogs: db.auditLogs.slice(0, 50)
    });
  });

  // Admin: Get all recorded competition level scores with filtering
  app.get('/api/admin/competition-score-records', (req, res) => {
    try {
      const db = loadDB();
      const records = (db.dailyLevelRecords || []).map(r => {
        const comp = db.competitions.find(c => c.id === r.competitionId);
        const user = db.users.find(u => u.id === r.userId);
        const game = db.games.find(g => g.id === r.gameId);
        return {
          ...r,
          competitionName: r.competitionName || comp?.name || r.competitionId,
          userName: r.userName || user?.fullName || 'Jwè Enkoni',
          userPhone: r.userPhone || user?.phoneNumber || '',
          gameTitle: r.gameTitle || game?.title || r.gameId
        };
      }).reverse();

      return res.json({ success: true, records });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje nòt konpetisyon yo.' });
    }
  });

  // Admin: Review Transaction (Approve / Reject)
  app.post('/api/admin/transactions/review', (req, res) => {
    const { transactionId, status, rejectReason } = req.body;
    if (!['konfime', 'refize'].includes(status)) {
      return res.status(400).json({ error: 'Estati envalid. Dwe "konfime" oswa "refize".' });
    }

    const db = loadDB();
    const tx = db.transactions.find(t => t.id === transactionId);
    if (!tx) return res.status(404).json({ error: 'Tranzaksyon pa jwenn.' });

    if (tx.status !== 'an_atant') {
      return res.status(400).json({ error: `Tranzaksyon sa a te deja ${tx.status}.` });
    }

    const user = findUserInDB(db, tx.userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

    tx.status = status;
    tx.reviewedAt = new Date().toISOString();
    tx.reviewedBy = 'Prince509';
    if (rejectReason) tx.rejectReason = rejectReason;

    if (tx.type === 'depo') {
      if (status === 'konfime') {
        // Atomic addition to balance
        user.balance += tx.amount;
        addNotification(
          db,
          tx.userId,
          `Depo Konfime ! (${tx.referenceId})`,
          `Depo ${tx.amount} HT ou a sou NatCash te konfime. Nouvo balans ou se ${user.balance} HT.`,
          'depo'
        );
        logAudit(
          db,
          'KONFIME_DEPO',
          `Depo ${tx.referenceId} (${tx.amount} HT) konfime pou ${user.fullName}`,
          'Prince509'
        );
      } else {
        addNotification(
          db,
          tx.userId,
          `Depo Refize (${tx.referenceId})`,
          `Depo ${tx.amount} HT ou a te refize. Rezon: ${rejectReason || 'Prèv transfè pa koresponn ak verifikasyon NatCash.'}`,
          'depo'
        );
        logAudit(
          db,
          'REFIZE_DEPO',
          `Depo ${tx.referenceId} refize pou ${user.fullName}. Rezon: ${rejectReason || 'N/A'}`,
          'Prince509'
        );
      }
    } else if (tx.type === 'retre') {
      if (status === 'konfime') {
        // Deduct from total balance and release reserved balance
        user.balance -= tx.amount;
        user.reservedBalance = Math.max(0, (user.reservedBalance || 0) - tx.amount);
        addNotification(
          db,
          tx.userId,
          `Retrè Konfime ! (${tx.referenceId})`,
          `Nou transfere ${tx.amount} HT sou kont NatCash ${tx.natcashPhone} ou a. Mèsi paske w jwe nan MASTER PLAY !`,
          'retre'
        );
        logAudit(
          db,
          'KONFIME_RETRE',
          `Retrè ${tx.referenceId} (${tx.amount} HT) konfime e voye bay ${user.fullName}`,
          'Prince509'
        );
      } else {
        // Return reserved balance back to available
        user.reservedBalance = Math.max(0, (user.reservedBalance || 0) - tx.amount);
        addNotification(
          db,
          tx.userId,
          `Retrè Refize (${tx.referenceId})`,
          `Demann retrè ${tx.amount} HT ou a te refize. Rezon: ${rejectReason || 'Enfòmasyon NatCash pa kòrèk.'}. Montan an remèt nan balans ou.`,
          'retre'
        );
        logAudit(
          db,
          'REFIZE_RETRE',
          `Retrè ${tx.referenceId} refize pou ${user.fullName}. Rezon: ${rejectReason || 'N/A'}`,
          'Prince509'
        );
      }
    }

    saveDB(db);
    return res.json({ success: true, transaction: tx, userBalance: user.balance });
  });

  // --- ADMIN: GAME PRICING & MANAGEMENT ---
  app.post('/api/admin/games/price', (req, res) => {
    const { gameId, entryFee, isActive, title, category, description, icon, isNew } = req.body;
    const db = loadDB();

    if (isNew) {
      if (!title || entryFee === undefined) {
        return res.status(400).json({ error: 'Tit ak pri jwèt la obligatwa.' });
      }
      const newGame = {
        id: 'game_' + Date.now(),
        title: title.trim(),
        category: category || 'custom',
        icon: icon || '🎮',
        badge: '🎮 NOUVO',
        levelsCount: 6,
        description: description || 'Nouvo jwèt ajoute pa administratè a.',
        rules: 'Suiv enstriksyon pou jwenn pi bon nòt.',
        entryFee: Math.max(0, Number(entryFee)),
        isPaid: Number(entryFee) > 0,
        isActive: isActive !== false,
        highScores: []
      };
      db.games.push(newGame);
      logAudit(db, 'AJOUTE_NOUVO_JWÈT', `Nouvo jwèt "${newGame.title}" ajoute ak pri ${newGame.entryFee} HT`, 'Prince509');
      saveDB(db);
      return res.json({ success: true, game: newGame, games: db.games });
    }

    const game = db.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

    const oldPrice = game.entryFee;
    if (entryFee !== undefined) {
      game.entryFee = Math.max(0, Number(entryFee));
      game.isPaid = game.entryFee > 0;
    }
    if (isActive !== undefined) {
      game.isActive = !!isActive;
    }
    if (title) game.title = title.trim();
    if (description) game.description = description.trim();
    if (icon) game.icon = icon;

    logAudit(db, 'MODIFIE_PRI_JWÈT', `Pri jwèt "${game.title}" chanje de ${oldPrice} HT a ${game.entryFee} HT (Aktif: ${game.isActive})`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, game, games: db.games });
  });

  // Admin: Create / Edit Competition with Authorized Games & 7-Day Schedule
  app.post('/api/admin/competitions', (req, res) => {
    const {
      id,
      name,
      badge,
      tagline,
      description,
      rules,
      entryFee,
      startDate,
      deadline,
      startDateTimeISO,
      endDateTimeISO,
      competitionDays,
      maxParticipants,
      prizes,
      status,
      authorizedGameIds,
      scheduleType,
      currentDay,
      stageCount,
      qualificationCount,
      tiebreakerRule,
      votingEnabled,
      votePrice,
      allowMultipleEntries
    } = req.body;
    const db = loadDB();

    if (!name || entryFee === undefined) {
      return res.status(400).json({ error: 'Non konpetisyon ak pri enskripsyon obligatwa.' });
    }

    if (id) {
      // Edit existing
      const comp = db.competitions.find(c => c.id === id);
      if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

      comp.name = name.trim();
      if (badge) comp.badge = badge;
      if (tagline) comp.tagline = tagline;
      if (description !== undefined) comp.description = description;
      if (rules !== undefined) comp.rules = rules;
      comp.entryFee = Math.max(0, Number(entryFee));
      if (startDate) comp.startDate = startDate;
      if (deadline) comp.deadline = deadline;
      if (startDateTimeISO !== undefined) comp.startDateTimeISO = startDateTimeISO;
      if (endDateTimeISO !== undefined) comp.endDateTimeISO = endDateTimeISO;
      if (competitionDays) comp.competitionDays = competitionDays;
      if (maxParticipants) comp.maxParticipants = Number(maxParticipants);
      if (prizes) comp.prizes = prizes;
      if (status) comp.status = status;
      if (authorizedGameIds) comp.authorizedGameIds = authorizedGameIds;
      if (scheduleType) comp.scheduleType = scheduleType;
      if (currentDay) comp.currentDay = currentDay;
      if (stageCount) comp.stageCount = Number(stageCount);
      if (qualificationCount) comp.qualificationCount = Number(qualificationCount);
      if (tiebreakerRule) comp.tiebreakerRule = tiebreakerRule;
      if (votingEnabled !== undefined) comp.votingEnabled = !!votingEnabled;
      if (votePrice !== undefined) comp.votePrice = Math.max(1, Number(votePrice));
      if (allowMultipleEntries !== undefined) comp.allowMultipleEntries = !!allowMultipleEntries;

      logAudit(db, 'MODIFIE_KONPETISYON', `Konpetisyon "${name}" modifye pa admin`, 'Prince509');
      saveDB(db);
      return res.json({ success: true, competition: comp });
    } else {
      // Create new
      const allGameIds = db.games.map(g => g.id);
      const newComp = {
        id: 'comp_' + Date.now(),
        name: name.trim(),
        badge: badge || '🏆 NOUVO',
        tagline: tagline || 'Nouvo gwo konpetisyon MASTER PLAY',
        description: description || '',
        rules: rules || 'Règ ofisyèl MASTER PLAY aplike.',
        entryFee: Math.max(0, Number(entryFee)),
        startDate: startDate || 'Kòmanse Lendi - 8:00 AM',
        deadline: deadline || 'Fini Dimanch - 8:00 PM',
        startDateTimeISO: startDateTimeISO || '',
        endDateTimeISO: endDateTimeISO || '',
        competitionDays: competitionDays || ['Lendi', 'Madi', 'Mèkredi', 'Jedi', 'Vandredi', 'Samdi', 'Dimanch'],
        maxParticipants: Number(maxParticipants) || 100,
        registeredUserIds: [],
        authorizedGameIds: authorizedGameIds && authorizedGameIds.length > 0 ? authorizedGameIds : allGameIds.slice(0, 6),
        scheduleType: scheduleType || 'weekly_7days',
        currentDay: currentDay || 'Lendi',
        stageCount: Number(stageCount) || 3,
        qualificationCount: Number(qualificationCount) || 8,
        tiebreakerRule: tiebreakerRule || 'pi_wo_pwen_match',
        votingEnabled: votingEnabled !== false,
        votePrice: votePrice ? Number(votePrice) : 15,
        allowMultipleEntries: !!allowMultipleEntries,
        scores: [],
        top8QualifiedUserIds: [],
        matches: [],
        prizes: prizes || { first: '50,000 HT', second: '25,000 HT', third: '10,000 HT' },
        status: status || 'Enskripsyon ouvè'
      };

      db.competitions.push(newComp);
      addNotification(db, 'all', `Nouvo konpetisyon: ${name} !`, `Enskripsyon yo louvri kounye a pou ${name}. Pri: ${entryFee} HT.`, 'konpetisyon');
      logAudit(db, 'KREYE_KONPETISYON', `Nouvo konpetisyon kreye: "${name}" (${entryFee} HT) ak ${newComp.authorizedGameIds.length} jwèt otorize`, 'Prince509');
      saveDB(db);
      return res.json({ success: true, competition: newComp });
    }
  });

  // Admin: Set Authorized Games for a Competition
  app.post('/api/admin/competitions/:id/games', (req, res) => {
    const { authorizedGameIds } = req.body;
    if (!Array.isArray(authorizedGameIds)) {
      return res.status(400).json({ error: 'Lis jwèt otorize dwe yon tablo.' });
    }

    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    comp.authorizedGameIds = authorizedGameIds;
    logAudit(db, 'CHWAZI_JWÈT_KONPETISYON', `Jwèt otorize pou ${comp.name} mete ajou (${authorizedGameIds.length} jwèt)`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, competition: comp });
  });

  // Admin: Update Competition Entry Fee & Prizes (Requirement 2)
  app.post('/api/admin/competitions/:id/pricing-prizes', (req, res) => {
    try {
      const { entryFee, firstPrize, secondPrize, thirdPrize } = req.body;
      const db = loadDB();
      const comp = db.competitions.find(c => c.id === req.params.id);
      if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

      if (entryFee !== undefined) {
        comp.entryFee = Math.max(0, Number(entryFee));
      }

      if (!comp.prizes) {
        comp.prizes = { first: '50,000 HT', second: '25,000 HT', third: '10,000 HT' };
      }

      if (firstPrize !== undefined && String(firstPrize).trim()) {
        comp.prizes.first = String(firstPrize).trim();
      }
      if (secondPrize !== undefined && String(secondPrize).trim()) {
        comp.prizes.second = String(secondPrize).trim();
      }
      if (thirdPrize !== undefined && String(thirdPrize).trim()) {
        comp.prizes.third = String(thirdPrize).trim();
      }

      logAudit(
        db,
        'MODIFIE_PRI_AK_PRIM_KONPETISYON',
        `Pri ak prim modifye pou "${comp.name}" (Pri Enskripsyon: ${comp.entryFee} HT, 1ye: ${comp.prizes.first}, 2èm: ${comp.prizes.second}, 3èm: ${comp.prizes.third})`,
        'Prince509'
      );

      saveDB(db);
      return res.json({
        success: true,
        competition: comp,
        message: 'Pri enskripsyon ak prim konpetisyon an mete ajou avèk siksè nan bazdone a.'
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan modifye pri ak prim yo.' });
    }
  });

  // Admin: Download Competition Results CSV (Requirement 4)
  app.get('/api/admin/competitions/:id/download-results', (req, res) => {
    try {
      const db = loadDB();
      const comp = db.competitions.find(c => c.id === req.params.id);
      if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

      const safeName = comp.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Rezilta_Klasman_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;

      let csv = '\uFEFF'; // UTF-8 BOM for Excel & Mobile compatibility

      // Section 1: Header metadata
      csv += `MASTER PLAY - RAPÒ OFISYÈL REZILTA KONPETISYON\r\n`;
      csv += `Non Konpetisyon,${comp.name.replace(/,/g, ' ')}\r\n`;
      csv += `ID Konpetisyon,${comp.id}\r\n`;
      csv += `Estati Aktyèl,${comp.status || 'Aktif'}\r\n`;
      csv += `Jounen Aktyèl,${comp.currentDay || 'Lendi'}\r\n`;
      csv += `Frè Enskripsyon,${comp.entryFee} HT\r\n`;
      csv += `Total Patisipan Enskri,${comp.registeredUserIds?.length || 0}\r\n`;
      csv += `Prim 1ye Plas,${comp.prizes?.first || '50,000 HT'}\r\n`;
      csv += `Prim 2èm Plas,${comp.prizes?.second || '25,000 HT'}\r\n`;
      csv += `Prim 3èm Plas,${comp.prizes?.third || '10,000 HT'}\r\n`;
      csv += `Dat & Lè Ekstraksyon,${new Date().toISOString()}\r\n\r\n`;

      // Section 2: Leaderboard (Klasman)
      csv += `=== TABLO KLASMAN OFISYÈL (LEADERBOARD) ===\r\n`;
      csv += `Pozisyon,Non Jwè a,ID Itilizatè,Nimewo Telefòn,Total Pwen,Nivo,Etwal,Match Genyen,Vòt Fanatik,Kado Resevwa (Valè HT),Dat Enskripsyon\r\n`;

      const scores = [...(comp.scores || [])].sort((a, b) => b.totalScore - a.totalScore);
      scores.forEach((s, idx) => {
        const rank = s.rank || (idx + 1);
        const fullName = (s.fullName || 'Jwè Enkoni').replace(/,/g, ' ');
        const phone = (s.phoneNumber || '').replace(/,/g, ' ');
        const total = s.totalScore || 0;
        const lvl = s.level || 1;
        const stars = s.stars || 1;
        const matchesWon = s.matchesWon || 0;
        const votes = s.votesCount || 0;
        const giftVal = s.giftsValue || 0;
        const regDate = s.registrationDate || '';
        csv += `${rank},${fullName},${s.userId},${phone},${total},${lvl},${stars},${matchesWon},${votes},${giftVal},${regDate}\r\n`;
      });

      csv += `\r\n`;

      // Section 3: VS Matches
      csv += `=== REZILTA TOUT MATCH FAS-A-FAS (VS MATCHES) ===\r\n`;
      csv += `ID Match,Faz / Round,Non Jwè 1,Nòt Jwè 1,Vòt Jwè 1,Non Jwè 2,Nòt Jwè 2,Vòt Jwè 2,Gayan Match,Rezilta Final,Estati Match,Jwèt Match,Dat / Orè\r\n`;

      const matches = comp.matches || [];
      if (matches.length === 0) {
        csv += `Pa gen match VS ki pwograme pou konpetisyon sa a ankò.\r\n`;
      } else {
        matches.forEach(m => {
          const matchId = m.id;
          const round = (m.round || '').replace(/,/g, ' ');
          const p1Name = (m.player1?.fullName || 'Jwè 1').replace(/,/g, ' ');
          const p1Score = m.player1?.score ?? 0;
          const p1Votes = m.votes1 ?? (m.player1?.votesCount ?? 0);
          const p2Name = (m.player2?.fullName || 'Jwè 2').replace(/,/g, ' ');
          const p2Score = m.player2?.score ?? 0;
          const p2Votes = m.votes2 ?? (m.player2?.votesCount ?? 0);
          const winnerName = m.winnerId
            ? (m.winnerId === m.player1?.userId ? p1Name : p2Name)
            : (m.status === 'Fini' ? (p1Score > p2Score ? p1Name : p2Name) : 'An atant');
          const finalResult = `${p1Score} - ${p2Score}`;
          const status = (m.status || 'Pwograme').replace(/,/g, ' ');
          const gameTitle = (m.gameTitle || '').replace(/,/g, ' ');
          const dateStr = (m.date || m.scheduledTime || '').replace(/,/g, ' ');

          csv += `${matchId},${round},${p1Name},${p1Score},${p1Votes},${p2Name},${p2Score},${p2Votes},${winnerName},${finalResult},${status},${gameTitle},${dateStr}\r\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè pandan telechaje rezilta yo.' });
    }
  });

  // Admin: Advance 7-Day Competition Day
  app.post('/api/admin/competitions/:id/advance-day', (req, res) => {
    const { day } = req.body;
    const validDays = ['Lendi', 'Madi', 'Mèkredi', 'Jedi', 'Vandredi', 'Samdi', 'Dimanch'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ error: 'Jou envalid. Chwazi ant Lendi ak Dimanch.' });
    }

    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const prevDay = comp.currentDay || 'Lendi';
    comp.currentDay = day;

    addNotification(
      db,
      'all',
      `${comp.name} — ${day} !`,
      `Konpetisyon an avanse nan ${day}. Konsilte kalandriye a ak match yo sou paj konpetisyon an !`,
      'konpetisyon'
    );
    logAudit(db, 'AVANSE_JOUNEN_KONPETISYON', `${comp.name} pase soti ${prevDay} rive nan ${day}`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, competition: comp });
  });

  // Admin: Qualify Top 8 on Thursday (Jedi) & Generate Friday Matches
  app.post('/api/admin/competitions/:id/qualify-top8', (req, res) => {
    const { chosenGameId } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    if (!comp.scores || comp.scores.length < 2) {
      return res.status(400).json({ error: 'Pa gen ase patisipan ki gen pwen pou kalifye Top 8.' });
    }

    // Sort participants by totalScore (using tiebreaker if tied)
    comp.scores.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const maxScoreA = Math.max(0, ...Object.values(a.scoresByGame || {}));
      const maxScoreB = Math.max(0, ...Object.values(b.scoresByGame || {}));
      if (maxScoreB !== maxScoreA) return maxScoreB - maxScoreA;
      return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
    });

    comp.scores.forEach((s, idx) => {
      s.rank = idx + 1;
      s.qualifiedTop8 = idx < 8;
      s.eliminated = idx >= 8;
    });

    const top8Participants = comp.scores.slice(0, 8);
    comp.top8QualifiedUserIds = top8Participants.map(p => p.userId);

    // Pick match game
    const selectedGameId = chosenGameId || (comp.authorizedGameIds && comp.authorizedGameIds[0]) || 'game_football';
    const gameObj = db.games.find(g => g.id === selectedGameId);
    const gameTitle = gameObj ? gameObj.title : 'Football Challenge';

    // Generate the 4 Friday Knockout Matches as explicitly defined:
    // Match 1: 1ye vs 2yèm
    // Match 2: 3yèm vs 4yèm
    // Match 3: 5yèm vs 6yèm
    // Match 4: 7yèm vs 8yèm
    const fridayMatches = [];
    for (let i = 0; i < 4; i++) {
      const p1 = top8Participants[i * 2];
      const p2 = top8Participants[i * 2 + 1];

      if (p1 && p2) {
        fridayMatches.push({
          id: `match_${comp.id}_top8_${i + 1}`,
          round: 'top8' as const,
          matchNumber: i + 1,
          player1: {
            userId: p1.userId,
            fullName: p1.fullName,
            profilePhoto: p1.profilePhoto,
            seedRank: p1.rank,
            score: 0
          },
          player2: {
            userId: p2.userId,
            fullName: p2.fullName,
            profilePhoto: p2.profilePhoto,
            seedRank: p2.rank,
            score: 0
          },
          gameId: selectedGameId,
          gameTitle,
          date: 'Vandredi - Match Eliminatwa',
          status: 'Pwograme' as const,
        });
      }
    }

    comp.matches = fridayMatches;
    comp.currentDay = 'Vandredi';

    addNotification(
      db,
      'all',
      `Top 8 Kalifye pou ${comp.name} !`,
      `Kalifikasyon Top 8 la konfime pou faz eliminatwa Vandredi a. Felisitasyon ak 8 gwo jwè yo !`,
      'rezilta'
    );
    logAudit(db, 'KONFIME_KALIFIKASYON_TOP8', `Top 8 kalifye pou ${comp.name}. 4 match Vandredi kreye.`, 'Prince509');
    saveDB(db);

    return res.json({ success: true, competition: comp, matches: comp.matches });
  });

  // Admin: Record or Update Match Result (Vandredi, Samdi, Dimanch)
  app.post('/api/admin/competitions/:id/match-result', (req, res) => {
    const { matchId, score1, score2, winnerId, chosenNextGameId, status } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    if (!comp.matches) comp.matches = [];
    const match = comp.matches.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match pa jwenn.' });

    match.player1.score = Number(score1) || 0;
    match.player2.score = Number(score2) || 0;

    if (winnerId) {
      match.winnerId = winnerId;
      match.status = 'Fini';
    } else if (status) {
      match.status = status;
    } else if (match.player1.score > match.player2.score) {
      match.winnerId = match.player1.userId;
      match.status = 'Fini';
    } else if (match.player2.score > match.player1.score) {
      match.winnerId = match.player2.userId;
      match.status = 'Fini';
    } else {
      match.status = 'An atant verifikasyon';
    }

    match.verifiedBy = 'Prince509';
    match.verifiedAt = new Date().toISOString();

    const selectedNextGameId = chosenNextGameId || (comp.authorizedGameIds && comp.authorizedGameIds[1]) || (comp.authorizedGameIds && comp.authorizedGameIds[0]) || 'game_basket';
    const nextGameObj = db.games.find(g => g.id === selectedNextGameId);
    const nextGameTitle = nextGameObj ? nextGameObj.title : 'Basket Challenge';

    // CHECK IF ALL 4 TOP 8 MATCHES (Vandredi) ARE FINISHED -> GENERATE SATURDAY SEMIFINALS
    const top8Matches = comp.matches.filter(m => m.round === 'top8');
    const demiMatches = comp.matches.filter(m => m.round === 'demi');
    const finalMatch = comp.matches.find(m => m.round === 'final');

    if (top8Matches.length === 4 && top8Matches.every(m => m.status === 'Fini' && m.winnerId) && demiMatches.length === 0) {
      // Find winner objects
      const getWinner = (m: any) => m.winnerId === m.player1.userId ? m.player1 : m.player2;
      const w1 = getWinner(top8Matches[0]);
      const w2 = getWinner(top8Matches[1]);
      const w3 = getWinner(top8Matches[2]);
      const w4 = getWinner(top8Matches[3]);

      comp.matches.push(
        {
          id: `match_${comp.id}_demi_1`,
          round: 'demi',
          matchNumber: 1,
          player1: { ...w1, score: 0 },
          player2: { ...w2, score: 0 },
          gameId: selectedNextGameId,
          gameTitle: nextGameTitle,
          date: 'Samdi - Demi-Final 1',
          status: 'Pwograme'
        },
        {
          id: `match_${comp.id}_demi_2`,
          round: 'demi',
          matchNumber: 2,
          player1: { ...w3, score: 0 },
          player2: { ...w4, score: 0 },
          gameId: selectedNextGameId,
          gameTitle: nextGameTitle,
          date: 'Samdi - Demi-Final 2',
          status: 'Pwograme'
        }
      );
      comp.currentDay = 'Samdi';
      addNotification(db, 'all', `Demi-final ${comp.name} pwograme !`, `4 gayan Vandredi yo pral goumen nan Demi-final Samdi an !`, 'konpetisyon');
    }

    // CHECK IF BOTH SEMIFINALS (Samdi) ARE FINISHED -> GENERATE SUNDAY FINAL
    const updatedDemiMatches = comp.matches.filter(m => m.round === 'demi');
    if (updatedDemiMatches.length === 2 && updatedDemiMatches.every(m => m.status === 'Fini' && m.winnerId) && !finalMatch) {
      const getWinner = (m: any) => m.winnerId === m.player1.userId ? m.player1 : m.player2;
      const f1 = getWinner(updatedDemiMatches[0]);
      const f2 = getWinner(updatedDemiMatches[1]);

      const finalGameId = (comp.authorizedGameIds && comp.authorizedGameIds[2]) || selectedNextGameId;
      const finalGameObj = db.games.find(g => g.id === finalGameId);

      comp.matches.push({
        id: `match_${comp.id}_final`,
        round: 'final',
        matchNumber: 1,
        player1: { ...f1, score: 0 },
        player2: { ...f2, score: 0 },
        gameId: finalGameId,
        gameTitle: finalGameObj ? finalGameObj.title : 'Gran Final Challenge',
        date: 'Dimanch - Gran Final',
        status: 'Pwograme'
      });
      comp.currentDay = 'Dimanch';
      addNotification(db, 'all', `Gran Final ${comp.name} Dimanch !`, `${f1.fullName} kont ${f2.fullName} nan gran final la !`, 'konpetisyon');
    }

    // CHECK IF GRAND FINAL (Dimanch) IS FINISHED -> CROWN CHAMPION!
    const updatedFinalMatch = comp.matches.find(m => m.round === 'final');
    if (updatedFinalMatch && updatedFinalMatch.status === 'Fini' && updatedFinalMatch.winnerId) {
      const championPlayer = updatedFinalMatch.winnerId === updatedFinalMatch.player1.userId
        ? updatedFinalMatch.player1
        : updatedFinalMatch.player2;
      const runnerUpPlayer = updatedFinalMatch.winnerId === updatedFinalMatch.player1.userId
        ? updatedFinalMatch.player2
        : updatedFinalMatch.player1;

      comp.champion = {
        userId: championPlayer.userId,
        fullName: championPlayer.fullName,
        profilePhoto: championPlayer.profilePhoto,
        title: `CHANPYON OFISYÈL ${comp.name}`,
        prize: comp.prizes.first,
        finalScore: `${updatedFinalMatch.player1.score} - ${updatedFinalMatch.player2.score}`,
        wonAt: new Date().toISOString()
      };

      comp.runnerUp = {
        userId: runnerUpPlayer.userId,
        fullName: runnerUpPlayer.fullName,
        profilePhoto: runnerUpPlayer.profilePhoto,
        prize: comp.prizes.second
      };

      comp.status = 'finished';

      addNotification(
        db,
        'all',
        `👑 NOU GEN YON CHANPYON: ${championPlayer.fullName} !`,
        `${championPlayer.fullName} genyen Gran Final ${comp.name} lan ! Felisitasyon ak nouvo Chanpyon an !`,
        'rezilta'
      );

      logAudit(db, 'KOUWONE_CHANPYON', `${championPlayer.fullName} se Chanpyon ${comp.name} (${comp.prizes.first})`, 'Prince509');
    }

    logAudit(db, 'ANREJISTRE_REZILTA_MATCH', `Rezilta anrejistre pou match ${match.id} nan ${comp.name}: ${match.player1.fullName} (${match.player1.score}) vs ${match.player2.fullName} (${match.player2.score})`, 'Prince509');
    saveDB(db);

    return res.json({ success: true, match, matches: comp.matches, competition: comp });
  });

  // Admin: Match Verify or Rectify with Audit Note
  app.post('/api/admin/competitions/:id/match-verify', (req, res) => {
    const { matchId, score1, score2, winnerId, status, auditNote } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const match = comp.matches?.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match pa jwenn.' });

    if (score1 !== undefined) match.player1.score = Number(score1);
    if (score2 !== undefined) match.player2.score = Number(score2);
    if (winnerId !== undefined) match.winnerId = winnerId;
    if (status) match.status = status;
    match.auditNote = auditNote || 'Koreksyon ofisyèl pa administratè a';
    match.verifiedBy = 'Prince509';
    match.verifiedAt = new Date().toISOString();

    logAudit(db, 'KORIJE_MATCH', `Match ${matchId} modifye: P1=${match.player1.score}, P2=${match.player2.score}, Winner=${winnerId}. Rezon: ${match.auditNote}`, 'Prince509');
    saveDB(db);

    return res.json({ success: true, match, competition: comp });
  });

  // Admin: Set Competition Winners & Publish Results
  app.post('/api/admin/competitions/:id/results', (req, res) => {
    const { winners } = req.body;
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    comp.winners = winners;
    comp.status = 'finished';

    addNotification(
      db,
      'all',
      `Rezilta ofisyèl: ${comp.name} !`,
      `Klasman final ${comp.name} pibliye. Gade gayan yo sou paj Klasman an !`,
      'rezilta'
    );

    logAudit(db, 'PIBLIYE_REZILTA', `Rezilta ${comp.name} pibliye avèk gayan yo`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, competition: comp });
  });

  // Admin: 1. Verify / Permanently register user account in database (Requirement 1)
  app.post('/api/admin/users/:id/verify-db', (req, res) => {
    const db = loadDB();
    const user = findUserInDB(db, req.params.id);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn nan bazdone a.' });

    user.isVerifiedInDatabase = true;
    user.verifiedInDatabaseAt = new Date().toISOString();

    addNotification(
      db,
      user.id,
      'Kont verifye nan Bazdone a !',
      'Administratè a verifye epi anrejistre kont ou an pèmanans nan bazdone MASTER PLAY la. Tout done ou yo rete an sekirite.',
      'anons'
    );

    logAudit(db, 'ANREJISTRE_ITILIZATE_BAZDONE', `Kont ${user.fullName} (${user.id}) anrejistre epi verifye nan bazdone a pa Admin`, 'Prince509');
    saveDB(db);

    const { pinHash, ...safeUser } = user;
    return res.json({
      success: true,
      user: safeUser,
      message: `Kont ${user.fullName} anrejistre epi verifye pèmanan nan bazdone a avèk siksè !`
    });
  });

  // Admin: 2A. Delete Competition with Confirmation (Requirement 2)
  app.delete('/api/admin/competitions/:id', (req, res) => {
    const db = loadDB();
    const compIdx = db.competitions.findIndex(c => c.id === req.params.id);
    if (compIdx === -1) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const deletedName = db.competitions[compIdx].name;
    const deletedId = db.competitions[compIdx].id;
    db.competitions.splice(compIdx, 1);

    // Clean up dailyLevelRecords for this competition to keep DB lean
    if (db.dailyLevelRecords) {
      db.dailyLevelRecords = db.dailyLevelRecords.filter(r => r.competitionId !== deletedId);
    }

    logAudit(db, 'EFASE_KONPETISYON', `Konpetisyon "${deletedName}" (${deletedId}) efase nèt pa administratè a`, 'Prince509');
    saveDB(db);

    return res.json({
      success: true,
      message: `Konpetisyon "${deletedName}" efase avèk siksè nan bazdone a.`
    });
  });

  // Admin: 2B. Delete VS Match with Confirmation (Requirement 2)
  app.delete('/api/admin/competitions/:id/matches/:matchId', (req, res) => {
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    if (!comp.matches) comp.matches = [];
    const matchIdx = comp.matches.findIndex(m => m.id === req.params.matchId);
    if (matchIdx === -1) return res.status(404).json({ error: 'Match pa jwenn nan konpetisyon sa a.' });

    const deletedMatch = comp.matches[matchIdx];
    comp.matches.splice(matchIdx, 1);

    logAudit(db, 'EFASE_MATCH_VS', `Match ${deletedMatch.id} (${deletedMatch.player1?.fullName} vs ${deletedMatch.player2?.fullName}) efase nan ${comp.name}`, 'Prince509');
    saveDB(db);

    return res.json({
      success: true,
      competition: comp,
      message: `Match la efase avèk siksè.`
    });
  });

  // Admin: 3. Clean/Reset Leaderboard for Competition (Requirement 3)
  app.post('/api/admin/competitions/:id/reset-leaderboard', (req, res) => {
    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    const prevCount = comp.scores?.length || 0;
    // Reset leaderboard scores and top 8 qualified for this specific competition
    comp.scores = [];
    comp.top8QualifiedUserIds = [];

    // Also reset daily level records for this competition only (does not delete users or accounts)
    if (db.dailyLevelRecords) {
      db.dailyLevelRecords = db.dailyLevelRecords.filter(r => r.competitionId !== comp.id);
    }

    logAudit(db, 'NETWAYE_KLASMAN', `Tablo klasman ${comp.name} netwaye pa administratè a (${prevCount} nòt efase)`, 'Prince509');
    saveDB(db);

    return res.json({
      success: true,
      competition: comp,
      message: `Klasman pou "${comp.name}" netwaye avèk siksè ! Tout kont itilizatè yo konsève entak.`
    });
  });

  // Admin: 4. Pay 1st, 2nd, or 3rd Prize directly to Winner Account (Requirement 4)
  app.post('/api/admin/competitions/:id/pay-prize', (req, res) => {
    const { place } = req.body; // 'first' | 'second' | 'third'
    if (!place || !['first', 'second', 'third'].includes(place)) {
      return res.status(400).json({ error: 'Plas la dwe: first, second oswa third.' });
    }

    const db = loadDB();
    const comp = db.competitions.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Konpetisyon pa jwenn.' });

    if (!comp.prizesPaid) {
      comp.prizesPaid = {};
    }

    // Check if already paid
    if (comp.prizesPaid[place as 'first' | 'second' | 'third']) {
      return res.status(400).json({
        error: `Prim pou ${place === 'first' ? '1ye' : place === 'second' ? '2èm' : '3èm'} plas la deja peye !`
      });
    }

    // Determine target amount from competition configured prizes
    const rawPrizeStr = place === 'first' ? comp.prizes?.first : place === 'second' ? comp.prizes?.second : comp.prizes?.third;
    const parsedAmount = parseInt(String(rawPrizeStr || '').replace(/\D/g, ''), 10);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: `Kantite kòb pou plas ${place} pa valab oswa pa defini nan pri konpetisyon an.` });
    }

    // Determine winner user
    let targetUserId = '';
    let targetUserName = '';

    // Check explicit winners object first
    if (comp.winners && comp.winners[place as 'first' | 'second' | 'third']?.userId) {
      targetUserId = comp.winners[place as 'first' | 'second' | 'third']!.userId;
      targetUserName = comp.winners[place as 'first' | 'second' | 'third']!.name;
    } else if (place === 'first' && comp.champion?.userId) {
      targetUserId = comp.champion.userId;
      targetUserName = comp.champion.fullName;
    } else if (place === 'second' && comp.runnerUp?.userId) {
      targetUserId = comp.runnerUp.userId;
      targetUserName = comp.runnerUp.fullName;
    } else {
      // Fallback: Check leaderboard rankings
      const sortedScores = [...(comp.scores || [])].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
      const targetIdx = place === 'first' ? 0 : place === 'second' ? 1 : 2;
      if (sortedScores[targetIdx]) {
        targetUserId = sortedScores[targetIdx].userId;
        targetUserName = sortedScores[targetIdx].fullName;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({
        error: `Pa gen okenn itilizatè ki idantifye kòm ${place === 'first' ? '1ye' : place === 'second' ? '2èm' : '3èm'} plas nan konpetisyon an.`
      });
    }

    const winnerUser = findUserInDB(db, targetUserId);
    if (!winnerUser) {
      return res.status(404).json({ error: `Kont itilizatè gayan an (${targetUserId}) pa jwenn nan bazdone a.` });
    }

    // Pay money directly to winner's balance
    winnerUser.balance += parsedAmount;

    // Mark prize as paid on the competition
    const nowIso = new Date().toISOString();
    comp.prizesPaid[place as 'first' | 'second' | 'third'] = true;
    if (place === 'first') {
      comp.prizesPaid.firstPaidAt = nowIso;
      comp.prizesPaid.firstRecipientId = winnerUser.id;
    } else if (place === 'second') {
      comp.prizesPaid.secondPaidAt = nowIso;
      comp.prizesPaid.secondRecipientId = winnerUser.id;
    } else if (place === 'third') {
      comp.prizesPaid.thirdPaidAt = nowIso;
      comp.prizesPaid.thirdRecipientId = winnerUser.id;
    }

    // Record formal transaction in financial ledger
    const placeLabel = place === 'first' ? '1ye Plas (Chanpyon)' : place === 'second' ? '2èm Plas (Vis-Chanpyon)' : '3èm Plas';
    const refId = generateRef('DEP');
    db.transactions.unshift({
      id: 'tx_prize_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      referenceId: refId,
      userId: winnerUser.id,
      userName: winnerUser.fullName,
      userPhone: winnerUser.phoneNumber,
      type: 'depo',
      amount: parsedAmount,
      natcashName: winnerUser.fullName,
      natcashPhone: winnerUser.phoneNumber,
      status: 'konfime',
      createdAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: 'Administratè MASTER PLAY',
      metadata: {
        reason: 'prim_konpetisyon',
        competitionId: comp.id,
        competitionName: comp.name,
        place,
        placeLabel,
        description: `Peman prim ofisyèl ${placeLabel} nan ${comp.name}`
      }
    });

    // Notify user
    addNotification(
      db,
      winnerUser.id,
      `Peman Prim ${placeLabel} Resevwa !`,
      `Felisitasyon ${winnerUser.fullName}! Administratè a voye ${parsedAmount.toLocaleString()} HT sou balans ou pou prim ${placeLabel} nan ${comp.name}.`,
      'rezilta'
    );

    logAudit(
      db,
      'PEYE_PRIM_KONPETISYON',
      `Prim ${placeLabel} (${parsedAmount} HT) peye bay ${winnerUser.fullName} (${winnerUser.id}) pou ${comp.name}`,
      'Prince509'
    );

    saveDB(db);

    return res.json({
      success: true,
      competition: comp,
      user: winnerUser,
      amount: parsedAmount,
      place,
      message: `Prim ${parsedAmount.toLocaleString()} HT voye sou kont ${winnerUser.fullName} avèk siksè pou ${placeLabel} !`
    });
  });

  // Admin: Create Post (Text, Photos with preview, Video, TikTok)
  app.post('/api/admin/posts', (req, res) => {
    const { title, description, mediaType, mediaUrl, mediaUrls, videoUrl, tiktokUrl, pinned } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Tit ak deskripsyon obligatwa.' });
    }

    const db = loadDB();
    const newPost = {
      id: 'post_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      mediaType: mediaType || 'text',
      mediaUrl: mediaUrl || (mediaUrls && mediaUrls[0]) || '',
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : mediaUrl ? [mediaUrl] : [],
      videoUrl: videoUrl || '',
      tiktokUrl: tiktokUrl || '',
      author: 'Administratè Prince509',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      pinned: !!pinned
    };

    if (newPost.pinned) {
      db.posts.unshift(newPost);
    } else {
      db.posts.push(newPost);
    }

    addNotification(db, 'all', `Nouvo piblikasyon: ${title}`, description.substring(0, 80) + '...', 'anons');
    logAudit(db, 'KREYE_PIBLIKASYON', `Nouvo piblikasyon kreye (${newPost.mediaType}): "${title}"`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, post: newPost });
  });

  // Admin: Edit Post
  app.put('/api/admin/posts/:id', (req, res) => {
    const { title, description, mediaType, mediaUrl, mediaUrls, videoUrl, tiktokUrl, pinned } = req.body;
    const db = loadDB();
    const post = db.posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Piblikasyon pa jwenn.' });

    if (title) post.title = title.trim();
    if (description) post.description = description.trim();
    if (mediaType) post.mediaType = mediaType;
    if (mediaUrl !== undefined) post.mediaUrl = mediaUrl;
    if (mediaUrls) post.mediaUrls = mediaUrls;
    if (videoUrl !== undefined) post.videoUrl = videoUrl;
    if (tiktokUrl !== undefined) post.tiktokUrl = tiktokUrl;
    if (pinned !== undefined) post.pinned = pinned;

    logAudit(db, 'MODIFIE_PIBLIKASYON', `Piblikasyon "${post.title}" modifye pa admin`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, post });
  });

  // Admin: Delete Post
  app.delete('/api/admin/posts/:id', (req, res) => {
    const db = loadDB();
    const index = db.posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Piblikasyon pa jwenn.' });

    const [deleted] = db.posts.splice(index, 1);
    logAudit(db, 'EFASE_PIBLIKASYON', `Piblikasyon "${deleted.title}" efase`, 'Prince509');
    saveDB(db);
    return res.json({ success: true });
  });

  // Admin: Toggle Game / Update Legacy
  app.post('/api/admin/games/toggle', (req, res) => {
    const { gameId, isActive, entryFee } = req.body;
    const db = loadDB();
    const game = db.games.find(g => g.id === gameId);
    if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

    if (isActive !== undefined) game.isActive = isActive;
    if (entryFee !== undefined) {
      game.entryFee = Number(entryFee);
      game.isPaid = Number(entryFee) > 0;
    }

    logAudit(db, 'MODIFIE_JWÈT', `Jwèt ${game.title} mete ajou (Aktif: ${game.isActive}, Pri: ${game.entryFee} HT)`, 'Prince509');
    saveDB(db);
    return res.json({ success: true, game, games: db.games });
  });

  // Admin: Broadcast Notification
  app.post('/api/admin/notifications/broadcast', (req, res) => {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Tit ak mesaj obligatwa.' });

    const db = loadDB();
    addNotification(db, 'all', title, message, type || 'anons');
    logAudit(db, 'VOYE_NOTIFIKASYON', `Notifikasyon voye bay tout itilizatè: "${title}"`, 'Prince509');
    saveDB(db);
    return res.json({ success: true });
  });

  // Admin: Adjust User Balance
  app.post('/api/admin/users/adjust-balance', (req, res) => {
    const { userId, amount, reason } = req.body;
    const db = loadDB();
    const user = findUserInDB(db, userId);
    if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

    const diff = Number(amount);
    user.balance += diff;

    addNotification(
      db,
      userId,
      'Ajisteman balans',
      `Administratè a ajiste balans ou de ${diff > 0 ? '+' : ''}${diff} HT. Rezon: ${reason || 'Ajisteman ofisyèl'}`,
      'anons'
    );

    logAudit(
      db,
      'AJISTE_BALANS',
      `Balans itilizatè ${user.fullName} (${user.phoneNumber}) ajiste de ${diff} HT. Nouvo balans: ${user.balance} HT`,
      'Prince509'
    );

    saveDB(db);
    const { pinHash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // 11 BALON (7 NIVO) - JWÈT AK ADMINISTRASYON
  // ==========================================

  // 1. Get User Progress & Balon Config
  app.get('/api/games/11balon/progress/:userId', (req, res) => {
    try {
      const db = loadDB();
      const userId = req.params.userId;
      if (!userId) return res.status(400).json({ error: 'ID itilizatè obligatwa.' });

      if (!db.balonProgress) db.balonProgress = [];
      if (!db.balonConfig) {
        db.balonConfig = {
          entryFee: 50,
          pointsPerWin: 100,
          isActive: true,
          totalLevels: 7
        };
      }

      let progress = db.balonProgress.find(p => p.userId === userId);
      if (!progress) {
        progress = {
          userId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          levelResults: [],
          totalPoints: 0,
          status: 'in_progress',
          sessionPaid: false,
          lastUpdated: new Date().toISOString()
        };
        db.balonProgress.push(progress);
        saveDB(db);
      }

      const balonGame = db.games.find(g => g.id === 'game_11balon') || {
        id: 'game_11balon',
        title: '11 Balon (7 Nivo)',
        entryFee: db.balonConfig.entryFee,
        isActive: db.balonConfig.isActive
      };

      return res.json({
        progress,
        config: db.balonConfig,
        game: balonGame
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan rekipere pwogrè 11 Balon.' });
    }
  });

  // 2. Play Level (Server authoritative: pick winning ball, validate level, award points, unlock next level)
  app.post('/api/games/11balon/play-level', (req, res) => {
    try {
      const { userId, level, chosenBallIndex } = req.body;
      if (!userId || level === undefined || chosenBallIndex === undefined) {
        return res.status(400).json({ error: 'userId, level ak chosenBallIndex obligatwa.' });
      }

      const lvlNum = Number(level);
      const chosenIdx = Number(chosenBallIndex);

      if (lvlNum < 1 || lvlNum > 7) {
        return res.status(400).json({ error: 'Nivo a dwe ant 1 ak 7.' });
      }
      if (chosenIdx < 0 || chosenIdx > 10) {
        return res.status(400).json({ error: 'Chwa balon an dwe ant 0 ak 10 (11 balon).' });
      }

      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      if (!db.balonConfig) {
        db.balonConfig = { entryFee: 50, pointsPerWin: 100, isActive: true, totalLevels: 7 };
      }
      if (!db.balonConfig.isActive) {
        return res.status(403).json({ error: 'Jwèt 11 Balon an dezaktive kounye a pa administrasyon an.' });
      }

      if (!db.balonProgress) db.balonProgress = [];
      let progress = db.balonProgress.find(p => p.userId === userId);
      if (!progress) {
        progress = {
          userId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          levelResults: [],
          totalPoints: 0,
          status: 'in_progress',
          sessionPaid: false,
          lastUpdated: new Date().toISOString()
        };
        db.balonProgress.push(progress);
      }

      // Verify level is unlocked
      if (!progress.unlockedLevels.includes(lvlNum)) {
        return res.status(400).json({
          error: `Nivo ${lvlNum} poko debloke ! Ou dwe genyen nivo anvan an dabò.`
        });
      }

      // Handle Entry Fee: Player pays entry fee once to enter the 7-level journey
      if (!progress.sessionPaid && db.balonConfig.entryFee > 0) {
        if (user.balance < db.balonConfig.entryFee) {
          return res.status(400).json({
            error: `Balans ou ensifizan (${user.balance.toFixed(2)} HT). Pri jwèt la se ${db.balonConfig.entryFee} HT. Fè yon depo Natcash.`,
            needDeposit: true
          });
        }
        user.balance -= db.balonConfig.entryFee;
        progress.sessionPaid = true;

        const txRef = `BLN-${Date.now().toString().slice(-6)}`;
        db.transactions.unshift({
          id: `tx_balon_${Date.now()}`,
          referenceId: txRef,
          userId: user.id,
          userName: user.fullName,
          userPhone: user.phoneNumber,
          type: 'frè_jwèt' as any,
          amount: db.balonConfig.entryFee,
          status: 'konfime',
          createdAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Sistèm Otomatik'
        });

        addNotification(
          db,
          user.id,
          'Peman Jwèt 11 Balon',
          `Ou peye ${db.balonConfig.entryFee} HT pou antre nan jwèt 11 Balon an. Bon chans pou tout 7 nivo yo !`,
          'anons'
        );
      }

      // Server authority: exactly 1 ball has points (100 pts), 10 balls have 0 points
      const winningBallIndex = Math.floor(Math.random() * 11);
      const won = chosenIdx === winningBallIndex;
      const pointsPerWin = db.balonConfig.pointsPerWin || 100;
      let pointsEarned = 0;

      if (won) {
        // Prevent duplicate points for same level
        if (!progress.completedLevels.includes(lvlNum)) {
          pointsEarned = pointsPerWin;
          progress.completedLevels.push(lvlNum);
          progress.totalPoints += pointsEarned;
          user.points = (user.points || 0) + pointsEarned;
        }

        // Unlock next level if level < 7
        if (lvlNum < 7) {
          const nextLevel = lvlNum + 1;
          if (!progress.unlockedLevels.includes(nextLevel)) {
            progress.unlockedLevels.push(nextLevel);
          }
          progress.currentLevel = nextLevel;
        } else if (lvlNum === 7) {
          progress.status = 'completed';
          addNotification(
            db,
            user.id,
            '🏆 CHANPYON 11 BALON !',
            `CHAPO ! Ou fini tout 7 nivo yo ! Ou ranmase ${progress.totalPoints} pwen e ou se yon Chanpyon 11 Balon !`,
            'rezilta'
          );
          logAudit(
            db,
            'CHANPYON_11_BALON',
            `Itilizatè ${user.fullName} (${user.phoneNumber}) fini tout 7 nivo 11 Balon avèk ${progress.totalPoints} pwen !`,
            'Sistèm Jwèt'
          );
        }
      }

      // Record result
      const resultItem: BalonLevelResult = {
        level: lvlNum,
        won,
        chosenBall: chosenIdx,
        winningBall: winningBallIndex,
        pointsEarned,
        timestamp: new Date().toISOString()
      };
      progress.levelResults.push(resultItem);
      progress.lastUpdated = new Date().toISOString();

      // Update game high score if applicable
      const game = db.games.find(g => g.id === 'game_11balon');
      if (game) {
        if (!game.highScores) game.highScores = [];
        const existingScore = game.highScores.find(h => h.userId === user.id);
        if (existingScore) {
          if (progress.totalPoints > existingScore.score) {
            existingScore.score = progress.totalPoints;
            existingScore.date = new Date().toISOString().split('T')[0];
          }
        } else {
          game.highScores.push({
            userId: user.id,
            userName: user.fullName,
            score: progress.totalPoints,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }

      saveDB(db);

      return res.json({
        success: true,
        won,
        pointsEarned,
        winningBallIndex,
        chosenBallIndex: chosenIdx,
        progress,
        userBalance: user.balance,
        userPoints: user.points
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè pandan jwe nivo a.' });
    }
  });

  // 3. Reset Session (Play again from Level 1 after completion or when restarting session)
  app.post('/api/games/11balon/reset-session', (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'ID itilizatè obligatwa.' });

      const db = loadDB();
      if (!db.balonProgress) db.balonProgress = [];

      let progress = db.balonProgress.find(p => p.userId === userId);
      if (!progress) {
        progress = {
          userId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          levelResults: [],
          totalPoints: 0,
          status: 'in_progress',
          sessionPaid: false,
          lastUpdated: new Date().toISOString()
        };
        db.balonProgress.push(progress);
      } else {
        progress.currentLevel = 1;
        progress.unlockedLevels = [1];
        progress.completedLevels = [];
        progress.totalPoints = 0;
        progress.status = 'in_progress';
        progress.sessionPaid = false;
        progress.lastUpdated = new Date().toISOString();
      }

      saveDB(db);
      return res.json({ success: true, progress });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan rekoumanse sesyon an.' });
    }
  });

  // 4. Admin: Get 11 Balon Stats & History
  app.get('/api/admin/11balon/stats', (req, res) => {
    try {
      const db = loadDB();
      const progressList = db.balonProgress || [];
      const config = db.balonConfig || {
        entryFee: 50,
        pointsPerWin: 100,
        isActive: true,
        totalLevels: 7
      };

      const levelStats: Record<number, { level: number; plays: number; wins: number; losses: number; playersAtLevel: number }> = {};
      for (let l = 1; l <= 7; l++) {
        levelStats[l] = { level: l, plays: 0, wins: 0, losses: 0, playersAtLevel: 0 };
      }

      let totalPlays = 0;
      let totalWins = 0;
      let totalLosses = 0;

      progressList.forEach(p => {
        if (p.currentLevel >= 1 && p.currentLevel <= 7) {
          levelStats[p.currentLevel].playersAtLevel += 1;
        }
        (p.levelResults || []).forEach(r => {
          if (levelStats[r.level]) {
            levelStats[r.level].plays += 1;
            totalPlays += 1;
            if (r.won) {
              levelStats[r.level].wins += 1;
              totalWins += 1;
            } else {
              levelStats[r.level].losses += 1;
              totalLosses += 1;
            }
          }
        });
      });

      const champions = progressList
        .filter(p => p.status === 'completed' || p.completedLevels.includes(7))
        .map(p => {
          const user = db.users.find(u => u.id === p.userId);
          return {
            userId: p.userId,
            userName: user ? user.fullName : 'Jwè enkoni',
            phoneNumber: user ? user.phoneNumber : '',
            totalPoints: p.totalPoints,
            completedAt: p.lastUpdated
          };
        });

      const recentHistory: Array<BalonLevelResult & { userName: string; userId: string }> = [];
      progressList.forEach(p => {
        const user = db.users.find(u => u.id === p.userId);
        const name = user ? user.fullName : 'Jwè enkoni';
        (p.levelResults || []).forEach(r => {
          recentHistory.push({
            ...r,
            userId: p.userId,
            userName: name
          });
        });
      });

      recentHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const playersProgressSummary = progressList.map(p => {
        const user = db.users.find(u => u.id === p.userId);
        return {
          userId: p.userId,
          userName: user ? user.fullName : 'Jwè enkoni',
          phoneNumber: user ? user.phoneNumber : '',
          currentLevel: p.currentLevel,
          completedLevelsCount: p.completedLevels.length,
          totalPoints: p.totalPoints,
          status: p.status,
          lastUpdated: p.lastUpdated
        };
      });

      const stats: BalonAdminStats = {
        totalPlayers: progressList.length,
        championsCount: champions.length,
        totalPlays,
        totalWins,
        totalLosses,
        levelStats,
        champions,
        recentHistory: recentHistory.slice(0, 50),
        playersProgress: playersProgressSummary
      };

      const balonGame = db.games.find(g => g.id === 'game_11balon');

      return res.json({
        stats,
        config,
        game: balonGame
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje estatistik 11 Balon.' });
    }
  });

  // 5. Admin: Update 11 Balon Config
  app.post('/api/admin/11balon/config', (req, res) => {
    try {
      const { entryFee, pointsPerWin, isActive } = req.body;
      const db = loadDB();

      if (!db.balonConfig) {
        db.balonConfig = { entryFee: 50, pointsPerWin: 100, isActive: true, totalLevels: 7 };
      }

      if (entryFee !== undefined) db.balonConfig.entryFee = Math.max(0, Number(entryFee));
      if (pointsPerWin !== undefined) db.balonConfig.pointsPerWin = Math.max(10, Number(pointsPerWin));
      if (isActive !== undefined) db.balonConfig.isActive = Boolean(isActive);

      // Sync with db.games entry
      const game = db.games.find(g => g.id === 'game_11balon');
      if (game) {
        if (entryFee !== undefined) {
          game.entryFee = Number(db.balonConfig.entryFee);
          game.isPaid = game.entryFee > 0;
        }
        if (isActive !== undefined) {
          game.isActive = Boolean(db.balonConfig.isActive);
        }
      }

      logAudit(
        db,
        'MODIFIE_KONFIG_11_BALON',
        `Konfigirasyon 11 Balon mete ajou (Pri: ${db.balonConfig.entryFee} HT, Pwen: ${db.balonConfig.pointsPerWin}, Aktif: ${db.balonConfig.isActive})`,
        'Prince509'
      );

      saveDB(db);
      return res.json({
        success: true,
        config: db.balonConfig,
        game
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan modifye konfigirasyon 11 Balon.' });
    }
  });

  // ==========================================
  // 5 NOUVO JWÈT - PWOGRÈ (7 NIVO) AK PEMAN
  // ==========================================

  // 1. Get Game Progress for a User
  app.get('/api/games/progress/:gameId/:userId', (req, res) => {
    try {
      const { gameId, userId } = req.params;
      const competitionId = req.query.competitionId as string | undefined;
      const db = loadDB();
      const game = db.games.find(g => g.id === gameId);
      if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

      if (!db.userGameProgress) db.userGameProgress = {};
      const key = `${gameId}_${userId}`;
      let progress = db.userGameProgress[key];

      // Check if user is enrolled in competition with this game authorized
      const isCompCovered = Boolean(
        competitionId &&
        db.competitions.some(c => c.id === competitionId && c.registeredUserIds.includes(userId) && (!c.authorizedGameIds || c.authorizedGameIds.includes(gameId)))
      );

      if (!progress) {
        progress = {
          userId,
          gameId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          highScore: 0,
          totalPoints: 0,
          sessionPaid: isCompCovered || !game.isPaid || game.entryFee === 0,
          lastPlayed: new Date().toISOString()
        };
        db.userGameProgress[key] = progress;
        saveDB(db);
      } else if (isCompCovered && !progress.sessionPaid) {
        progress.sessionPaid = true;
        saveDB(db);
      }

      return res.json({ success: true, progress, game, coveredByCompetition: isCompCovered });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan rekipere pwogrè jwèt la.' });
    }
  });

  // 2. Pay Game Entry Fee for Session (or free for enrolled competition players)
  app.post('/api/games/progress/pay-session', (req, res) => {
    try {
      const { gameId, userId, competitionId } = req.body;
      const db = loadDB();
      const game = db.games.find(g => g.id === gameId);
      if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      if (!db.userGameProgress) db.userGameProgress = {};
      const key = `${gameId}_${userId}`;
      let progress = db.userGameProgress[key];
      if (!progress) {
        progress = {
          userId,
          gameId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          highScore: 0,
          totalPoints: 0,
          sessionPaid: false,
          lastPlayed: new Date().toISOString()
        };
        db.userGameProgress[key] = progress;
      }

      // Check if user is registered in the competition and game is authorized
      const isCompCovered = Boolean(
        competitionId &&
        db.competitions.some(c => c.id === competitionId && c.registeredUserIds.includes(userId) && (!c.authorizedGameIds || c.authorizedGameIds.includes(gameId)))
      );

      if (isCompCovered) {
        // Enrolled competition player does NOT pay again (covered by competition entry fee)
        progress.sessionPaid = true;
        progress.lastPlayed = new Date().toISOString();
        saveDB(db);
        const { pinHash, ...safeUser } = user;
        return res.json({ success: true, user: safeUser, progress, coveredByCompetition: true });
      }

      if (game.isPaid && game.entryFee > 0 && !progress.sessionPaid) {
        if (user.balance < game.entryFee) {
          return res.status(400).json({
            error: `Balans ou ensifizan (${user.balance.toFixed(2)} HT). Pri jwèt la se ${game.entryFee} HT. Fè yon depo NatCash.`,
            needDeposit: true
          });
        }

        user.balance -= game.entryFee;
        progress.sessionPaid = true;

        const ref = generateRef('DEP');
        db.transactions.unshift({
          id: 'tx_game_' + Date.now(),
          referenceId: `JWET-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          userName: user.fullName,
          userPhone: user.phoneNumber,
          type: 'frè_jwèt' as any,
          amount: game.entryFee,
          status: 'konfime',
          createdAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Sistèm Otomatik'
        });

        addNotification(
          db,
          user.id,
          `Aksè nan ${game.title}`,
          `Ou peye ${game.entryFee} HT pou antre nan ${game.title}. Bon chans pou tout 7 nivo yo !`,
          'anons'
        );
      } else {
        progress.sessionPaid = true;
      }

      progress.lastPlayed = new Date().toISOString();
      saveDB(db);

      const { pinHash, ...safeUser } = user;
      return res.json({ success: true, user: safeUser, progress });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan peman jwèt la.' });
    }
  });

  // 3. Save Game Level Result (and competition score if in competition context)
  app.post('/api/games/progress/save', (req, res) => {
    try {
      const { gameId, userId, level, won, score, pointsEarned, stats, competitionId } = req.body;
      const db = loadDB();
      const game = db.games.find(g => g.id === gameId);
      if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      if (!db.userGameProgress) db.userGameProgress = {};
      const key = `${gameId}_${userId}`;
      let progress = db.userGameProgress[key];
      if (!progress) {
        progress = {
          userId,
          gameId,
          currentLevel: 1,
          unlockedLevels: [1],
          completedLevels: [],
          highScore: 0,
          totalPoints: 0,
          sessionPaid: true,
          lastPlayed: new Date().toISOString()
        };
        db.userGameProgress[key] = progress;
      }

      const lvlNum = Number(level) || 1;
      const totalGameLevels = game.levelsCount || 7;

      if (won) {
        if (!progress.completedLevels.includes(lvlNum)) {
          progress.completedLevels.push(lvlNum);
          const pts = Number(pointsEarned) || 100;
          progress.totalPoints = (progress.totalPoints || 0) + pts;
          user.points = (user.points || 0) + pts;
        }

        // Unlock next level
        if (lvlNum < totalGameLevels) {
          const nextLvl = lvlNum + 1;
          if (!progress.unlockedLevels.includes(nextLvl)) {
            progress.unlockedLevels.push(nextLvl);
          }
          progress.currentLevel = nextLvl;
        }
      }

      if (stats) {
        progress.stats = { ...(progress.stats || {}), ...stats };
      }

      const numScore = Number(score) || 0;
      if (numScore > (progress.highScore || 0)) {
        progress.highScore = numScore;
      }

      // Update game high scores leaderboard
      if (numScore > 0) {
        if (!game.highScores) game.highScores = [];
        const existingHs = game.highScores.find(h => h.userId === user.id);
        if (existingHs) {
          if (numScore > existingHs.score) {
            existingHs.score = numScore;
            existingHs.date = new Date().toISOString().split('T')[0];
          }
        } else {
          game.highScores.push({
            userId: user.id,
            userName: user.fullName,
            score: numScore,
            date: new Date().toISOString().split('T')[0]
          });
        }
        game.highScores.sort((a, b) => b.score - a.score);
        game.highScores = game.highScores.slice(0, 10);
      }

      // If playing in context of a competition, update competition leaderboard
      let updatedComp: any = null;
      if (competitionId && numScore > 0) {
        const comp = db.competitions.find(c => c.id === competitionId);
        if (comp && comp.registeredUserIds.includes(userId)) {
          if (!comp.scores) comp.scores = [];
          let pScore = comp.scores.find(s => s.userId === userId);
          if (!pScore) {
            pScore = {
              userId,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              profilePhoto: user.profilePhoto,
              level: user.level || 1,
              stars: user.stars || 1,
              followers: user.followersCount || 15,
              scoresByGame: {},
              totalScore: 0,
              matchesWon: 0,
              votesCount: 0,
              giftsCount: 0,
              giftsValue: 0,
              dailyScores: { lendi: 0, madi: 0, mekredi: 0, jedi: 0 },
              registrationDate: new Date().toISOString()
            };
            comp.scores.push(pScore);
          }

          const currentBest = pScore.scoresByGame[gameId] || 0;
          if (numScore > currentBest) {
            const diff = numScore - currentBest;
            pScore.scoresByGame[gameId] = numScore;
            pScore.totalScore += diff;

            const dayStr = (comp.currentDay || 'Lendi').toLowerCase();
            if (!pScore.dailyScores) pScore.dailyScores = {};
            if (dayStr.includes('lendi')) pScore.dailyScores.lendi = (pScore.dailyScores.lendi || 0) + diff;
            else if (dayStr.includes('madi')) pScore.dailyScores.madi = (pScore.dailyScores.madi || 0) + diff;
            else if (dayStr.includes('mekredi') || dayStr.includes('mèkredi')) pScore.dailyScores.mekredi = (pScore.dailyScores.mekredi || 0) + diff;
            else if (dayStr.includes('jedi')) pScore.dailyScores.jedi = (pScore.dailyScores.jedi || 0) + diff;
          }

          comp.scores.sort((a, b) => b.totalScore - a.totalScore);
          comp.scores.forEach((s, i) => { s.rank = i + 1; });
          updatedComp = comp;
        }
      }

      progress.lastPlayed = new Date().toISOString();
      saveDB(db);

      const { pinHash, ...safeUser } = user;
      return res.json({
        success: true,
        progress,
        user: safeUser,
        game,
        competition: updatedComp
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan anrejistre rezilta jwèt la.' });
    }
  });

  // 4. Admin: Get Stats for any game
  app.get('/api/admin/games/stats/:gameId', (req, res) => {
    try {
      const { gameId } = req.params;
      const db = loadDB();
      const game = db.games.find(g => g.id === gameId);
      if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

      const allProgress = Object.values(db.userGameProgress || {}).filter(p => p.gameId === gameId);

      const playersSummary = allProgress.map(p => {
        const u = db.users.find(usr => usr.id === p.userId);
        return {
          userId: p.userId,
          userName: u ? u.fullName : 'Jwè enkoni',
          phoneNumber: u ? u.phoneNumber : '',
          currentLevel: p.currentLevel,
          completedCount: p.completedLevels.length,
          highScore: p.highScore,
          totalPoints: p.totalPoints,
          lastPlayed: p.lastPlayed
        };
      });

      const totalPlayers = playersSummary.length;
      const championsCount = allProgress.filter(p => p.completedLevels.includes(game.levelsCount || 7)).length;
      const totalRevenue = totalPlayers * (game.entryFee || 0);

      return res.json({
        success: true,
        game,
        stats: {
          totalPlayers,
          championsCount,
          totalRevenue,
          players: playersSummary
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje estatistik jwèt la.' });
    }
  });

  // 5. Admin: Update Full Game Details
  app.post('/api/admin/games/update-details', (req, res) => {
    try {
      const { gameId, title, description, rules, entryFee, isActive, levelsCount } = req.body;
      const db = loadDB();
      const game = db.games.find(g => g.id === gameId);
      if (!game) return res.status(404).json({ error: 'Jwèt pa jwenn.' });

      if (title) game.title = title.trim();
      if (description) game.description = description.trim();
      if (rules) game.rules = rules.trim();
      if (entryFee !== undefined) {
        game.entryFee = Math.max(0, Number(entryFee));
        game.isPaid = game.entryFee > 0;
      }
      if (isActive !== undefined) game.isActive = Boolean(isActive);
      if (levelsCount !== undefined) game.levelsCount = Math.max(1, Number(levelsCount));

      logAudit(
        db,
        'MODIFIE_DETAY_JWET',
        `Jwèt "${game.title}" modifye pa admin (Pri: ${game.entryFee} HT, Aktif: ${game.isActive}, Nivo: ${game.levelsCount})`,
        'Prince509'
      );

      saveDB(db);
      return res.json({ success: true, game, games: db.games });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan modifye detay jwèt la.' });
    }
  });

  // ========================================================
  // AVION CRASH — VRÈ LAJAN (REAL MONEY CRASH GAME ROUTES)
  // ========================================================

  // 1. Get Config & Status
  app.get('/api/avion-crash/config', (req, res) => {
    try {
      const db = loadDB();
      const config = db.avionCrashConfig || {
        isActive: true,
        isMaintenance: false,
        minBet: 10,
        maxBet: 5000,
        houseEdge: 0.04
      };
      return res.json({ success: true, config });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje konfigirasyon Avion Crash.' });
    }
  });

  // 2. Get Crash History (Recent multipliers & User's rounds)
  app.get('/api/avion-crash/history', (req, res) => {
    try {
      const { userId } = req.query;
      const db = loadDB();
      const allRounds = db.avionCrashRounds || [];

      // Last 25 completed multipliers
      const recentMultipliers = allRounds
        .slice(0, 25)
        .map(r => ({
          id: r.id,
          multiplier: r.crashMultiplier,
          status: r.status,
          time: r.startTime
        }));

      // User's personal rounds if userId provided
      let userRounds: any[] = [];
      if (userId && typeof userId === 'string') {
        userRounds = allRounds.filter(r => r.userId === userId).slice(0, 20);
      }

      return res.json({
        success: true,
        recentMultipliers,
        userRounds
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje istwa Avion Crash.' });
    }
  });

  // 2b. Check User Active Round (Recovery on page refresh / connection drop)
  app.get('/api/avion-crash/active-round/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const db = loadDB();
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      const activeRound = (db.avionCrashRounds || []).find(r => r.userId === userId && r.status === 'flying');
      if (!activeRound) {
        return res.json({ success: true, activeRound: null });
      }

      const elapsedSec = (Date.now() - new Date(activeRound.startTime).getTime()) / 1000;
      const currentMult = 1.0 + 0.07 * Math.pow(elapsedSec, 1.5);
      if (currentMult >= activeRound.crashMultiplier || elapsedSec > 45) {
        activeRound.status = 'crashed';
        activeRound.endTime = new Date().toISOString();
        saveDB(db);
        return res.json({
          success: true,
          activeRound,
          hasCrashed: true
        });
      }

      return res.json({
        success: true,
        activeRound,
        hasCrashed: false,
        elapsedSec
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan verifye wonn aktif.' });
    }
  });

  // 3. Place Real Money Bet & Start Round
  app.post('/api/avion-crash/place-bet', (req, res) => {
    try {
      const { userId, betAmount } = req.body;
      if (!userId) return res.status(400).json({ error: 'UserId obligatwa.' });

      const bet = Math.floor(Number(betAmount));
      if (isNaN(bet) || bet <= 0) {
        return res.status(400).json({ error: 'Montan miz la envalid. Antre yon valè pozitif.' });
      }

      const db = loadDB();
      const config = db.avionCrashConfig || {
        isActive: true,
        isMaintenance: false,
        minBet: 10,
        maxBet: 5000,
        houseEdge: 0.04
      };

      if (!config.isActive) {
        return res.status(403).json({ error: 'Avion Crash dezaktive pou kounye a pa administratè a.' });
      }

      if (config.isMaintenance) {
        return res.status(503).json({ error: 'Avion Crash an antretyen pou kounye a. Tanpri eseye pita.' });
      }

      if (bet < config.minBet) {
        return res.status(400).json({ error: `Miz minimòm lan se ${config.minBet} HTG.` });
      }

      if (bet > config.maxBet) {
        return res.status(400).json({ error: `Miz maksimòm lan se ${config.maxBet} HTG.` });
      }

      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      const availableBalance = user.balance - (user.reservedBalance || 0);
      if (availableBalance < bet) {
        return res.status(400).json({
          error: `Balans ou pa ase. Ou genyen ${availableBalance} HTG ki disponib, men ou mande mize ${bet} HTG.`
        });
      }

      // Check if user already has an active flying round to prevent concurrent exploits
      const existingFlying = (db.avionCrashRounds || []).find(r => r.userId === userId && r.status === 'flying');
      if (existingFlying) {
        // Automatically close stale round (> 60s)
        const flightDurationSec = (Date.now() - new Date(existingFlying.startTime).getTime()) / 1000;
        if (flightDurationSec > 60) {
          existingFlying.status = 'crashed';
          existingFlying.endTime = new Date().toISOString();
        } else {
          return res.status(400).json({
            error: 'Ou gen yon wonn ki deja an kou. Fini wonn aktyèl la anvan ou mete yon lòt miz.'
          });
        }
      }

      // Cryptographically secure, provably fair randomized crash engine (Ekstrèmman Difisil)
      const randHex = crypto.randomBytes(8).toString('hex');
      const randInt = parseInt(randHex, 16);
      const r = (randInt % 100000) / 100000; // 0.00000 to 0.99999

      // High difficulty distribution:
      // ~22% instant/early crash (1.00x - 1.15x) -> Very quick crash
      // ~44% low crash (1.16x - 1.55x) -> Tense low crashes
      // ~22% medium crash (1.56x - 2.80x) -> Moderate runs
      // ~9% high crash (2.81x - 5.50x) -> High runs
      // ~3% rare high runs (5.51x - 35.00x) -> Rare stratospheric runs
      let crashMultiplier: number;
      if (r < 0.22) {
        const sub = r / 0.22;
        crashMultiplier = Math.floor((1.00 + sub * 0.15) * 100) / 100;
      } else if (r < 0.66) {
        const sub = (r - 0.22) / 0.44;
        crashMultiplier = Math.floor((1.16 + sub * 0.39) * 100) / 100;
      } else if (r < 0.88) {
        const sub = (r - 0.66) / 0.22;
        crashMultiplier = Math.floor((1.56 + sub * 1.24) * 100) / 100;
      } else if (r < 0.97) {
        const sub = (r - 0.88) / 0.09;
        crashMultiplier = Math.floor((2.81 + sub * 2.69) * 100) / 100;
      } else {
        const sub = (r - 0.97) / 0.03;
        crashMultiplier = Math.floor((5.51 + Math.pow(sub, 2) * 29.49) * 100) / 100;
      }
      crashMultiplier = Math.min(35.0, Math.max(1.00, crashMultiplier));

      // Atmospheric obstacle assignment based on altitude
      let obstacleType = 'zwazo';
      if (crashMultiplier <= 1.15) obstacleType = 'pann_mote';
      else if (crashMultiplier < 1.6) obstacleType = 'zwazo';
      else if (crashMultiplier < 2.8) obstacleType = 'loraj';
      else if (crashMultiplier < 6.0) obstacleType = 'tibilans';
      else obstacleType = 'meteyò';

      // Deduct bet from real balance
      user.balance -= bet;

      // Unique reference & IDs
      const roundId = `crash_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const refId = generateRef('CRASH');

      // Create Financial Transaction for Audit
      db.transactions.unshift({
        id: `tx_${roundId}_bet`,
        referenceId: refId,
        userId: user.id,
        userName: user.fullName,
        userPhone: user.phoneNumber,
        type: 'avion_crash_miz',
        amount: -bet,
        status: 'konfime',
        createdAt: new Date().toISOString(),
        metadata: {
          roundId,
          betAmount: bet,
          type: 'miz_avion_crash'
        }
      });

      // Save Round Record
      if (!db.avionCrashRounds) db.avionCrashRounds = [];
      const newRound = {
        id: roundId,
        userId: user.id,
        userName: user.fullName,
        userPhone: user.phoneNumber,
        betAmount: bet,
        crashMultiplier,
        payoutAmount: 0,
        netProfit: -bet,
        status: 'flying' as const,
        obstacleType,
        startTime: new Date().toISOString(),
        seedHash: crypto.createHash('sha256').update(`${roundId}_${crashMultiplier}_kekechallenge`).digest('hex')
      };
      db.avionCrashRounds.unshift(newRound);

      saveDB(db);

      const { pinHash, ...safeUser } = user;
      return res.json({
        success: true,
        roundId,
        betAmount: bet,
        crashMultiplier,
        obstacleType,
        newBalance: user.balance,
        startTime: newRound.startTime,
        seedHash: newRound.seedHash,
        user: safeUser
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan plase miz la sou sèvè a.' });
    }
  });

  // 4. Cash Out Before Crash
  app.post('/api/avion-crash/cashout', (req, res) => {
    try {
      const { roundId, userId, requestedMultiplier } = req.body;
      if (!roundId || !userId) return res.status(400).json({ error: 'Enfòmasyon wonn manke.' });

      const reqMult = Math.floor(Number(requestedMultiplier) * 100) / 100;
      if (isNaN(reqMult) || reqMult < 1.01) {
        return res.status(400).json({ error: 'Miltiplikatè envalid.' });
      }

      const db = loadDB();
      const round = (db.avionCrashRounds || []).find(r => r.id === roundId);
      if (!round) return res.status(404).json({ error: 'Wonn sa a pa egziste.' });

      if (round.userId !== userId) {
        return res.status(403).json({ error: 'Ou pa gen dwa sou wonn sa a.' });
      }

      // Idempotency: Prevent double cashout
      if (round.status === 'cashed_out') {
        return res.status(400).json({
          error: 'Ou te deja retire lajan w pou wonn sa a !',
          alreadyCashedOut: true,
          payout: round.payoutAmount
        });
      }

      if (round.status === 'crashed') {
        return res.status(400).json({
          error: 'Avyon an te deja fè aksidan ! Ou pa kapab retire lajan ankò.',
          crashed: true,
          crashMultiplier: round.crashMultiplier
        });
      }

      // Check if requested multiplier exceeded server crash multiplier
      if (reqMult > round.crashMultiplier) {
        // Officially crashed!
        round.status = 'crashed';
        round.endTime = new Date().toISOString();
        saveDB(db);
        return res.status(400).json({
          success: false,
          crashed: true,
          crashMultiplier: round.crashMultiplier,
          obstacleType: round.obstacleType,
          error: `Avyon an fè aksidan nan x${round.crashMultiplier.toFixed(2)} anvan retrè a !`
        });
      }

      // Cashout verified and approved!
      const user = findUserInDB(db, userId);
      if (!user) return res.status(404).json({ error: 'Itilizatè pa jwenn.' });

      const payout = Math.round(round.betAmount * reqMult);
      const profit = payout - round.betAmount;

      // Credit winnings directly to real money balance
      user.balance += payout;

      // Mark round completed
      round.status = 'cashed_out';
      round.cashoutMultiplier = reqMult;
      round.payoutAmount = payout;
      round.netProfit = profit;
      round.endTime = new Date().toISOString();

      // Financial Transaction Record
      const refId = generateRef('CRASH');
      db.transactions.unshift({
        id: `tx_${roundId}_win`,
        referenceId: refId,
        userId: user.id,
        userName: user.fullName,
        userPhone: user.phoneNumber,
        type: 'avion_crash_genyen',
        amount: payout,
        status: 'konfime',
        createdAt: new Date().toISOString(),
        metadata: {
          roundId,
          betAmount: round.betAmount,
          multiplier: reqMult,
          profit,
          type: 'genyen_avion_crash'
        }
      });

      // Notification
      addNotification(
        db,
        user.id,
        'Avion Crash: Lajan Kredite !',
        `Ou retire ${payout.toLocaleString()} HTG nan miltiplikatè x${reqMult.toFixed(2)} (Pwofi nèt: +${profit.toLocaleString()} HTG).`,
        'rezilta'
      );

      saveDB(db);

      const { pinHash, ...safeUser } = user;
      return res.json({
        success: true,
        cashedOut: true,
        multiplier: reqMult,
        payout,
        netProfit: profit,
        newBalance: user.balance,
        user: safeUser
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan trete retrè lajan an.' });
    }
  });

  // 5. Plane Crashed (Round Finalization)
  app.post('/api/avion-crash/crash', (req, res) => {
    try {
      const { roundId, userId } = req.body;
      const db = loadDB();
      const round = (db.avionCrashRounds || []).find(r => r.id === roundId);
      if (!round) return res.status(404).json({ error: 'Wonn pa jwenn.' });

      if (round.status === 'flying') {
        round.status = 'crashed';
        round.endTime = new Date().toISOString();
        saveDB(db);
      }

      return res.json({
        success: true,
        crashMultiplier: round.crashMultiplier,
        obstacleType: round.obstacleType,
        status: round.status
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan finalize aksidan an.' });
    }
  });

  // 6. Admin: Get Avion Crash Financial Overview & Analytics
  app.get('/api/avion-crash/admin/stats', (req, res) => {
    try {
      const db = loadDB();
      const config = db.avionCrashConfig || {
        isActive: true,
        isMaintenance: false,
        minBet: 10,
        maxBet: 5000,
        houseEdge: 0.04
      };
      const rounds = db.avionCrashRounds || [];

      const totalRounds = rounds.length;
      const totalWagered = rounds.reduce((sum, r) => sum + (r.betAmount || 0), 0);
      const totalPayouts = rounds.reduce((sum, r) => sum + (r.payoutAmount || 0), 0);
      const netHouseProfit = totalWagered - totalPayouts;
      const realizedRTP = totalWagered > 0 ? (totalPayouts / totalWagered) * 100 : 0;
      const winCount = rounds.filter(r => r.status === 'cashed_out').length;
      const crashCount = rounds.filter(r => r.status === 'crashed').length;

      return res.json({
        success: true,
        config,
        stats: {
          totalRounds,
          totalWagered,
          totalPayouts,
          netHouseProfit,
          realizedRTP: Number(realizedRTP.toFixed(2)),
          winCount,
          crashCount,
          recentRounds: rounds.slice(0, 50)
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan chaje estatistik admin Avion Crash.' });
    }
  });

  // 7. Admin: Update Avion Crash Config (Min/Max bet, Active, Maintenance)
  app.post('/api/avion-crash/admin/config', (req, res) => {
    try {
      const { isActive, isMaintenance, minBet, maxBet } = req.body;
      const db = loadDB();
      if (!db.avionCrashConfig) {
        db.avionCrashConfig = {
          isActive: true,
          isMaintenance: false,
          minBet: 10,
          maxBet: 5000,
          houseEdge: 0.04
        };
      }

      if (isActive !== undefined) db.avionCrashConfig.isActive = Boolean(isActive);
      if (isMaintenance !== undefined) db.avionCrashConfig.isMaintenance = Boolean(isMaintenance);
      if (minBet !== undefined && !isNaN(Number(minBet))) {
        db.avionCrashConfig.minBet = Math.max(1, Number(minBet));
      }
      if (maxBet !== undefined && !isNaN(Number(maxBet))) {
        db.avionCrashConfig.maxBet = Math.max(db.avionCrashConfig.minBet, Number(maxBet));
      }

      logAudit(
        db,
        'MODIFIE_AVION_CRASH_CONFIG',
        `Avion Crash modifye (Aktif: ${db.avionCrashConfig.isActive}, Antretyen: ${db.avionCrashConfig.isMaintenance}, Min: ${db.avionCrashConfig.minBet} HTG, Max: ${db.avionCrashConfig.maxBet} HTG)`,
        'Prince509'
      );

      saveDB(db);
      return res.json({ success: true, config: db.avionCrashConfig });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan modifye konfigirasyon Avion Crash.' });
    }
  });

  // 12. Push Notification Subscription endpoint
  app.post('/api/notifications/subscribe', (req, res) => {
    try {
      const { userId, subscription } = req.body;
      if (!subscription) return res.status(400).json({ error: 'subscription obligatwa.' });

      const db = loadDB();
      if (!db.pushSubscriptions) db.pushSubscriptions = [];

      const existingIdx = db.pushSubscriptions.findIndex(s => s.userId === userId);
      const entry = {
        id: 'push_' + Date.now(),
        userId: userId || 'guest',
        endpoint: subscription.endpoint,
        subscription,
        createdAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        db.pushSubscriptions[existingIdx] = entry;
      } else {
        db.pushSubscriptions.push(entry);
      }

      saveDB(db);
      return res.json({ success: true, message: 'Abònman notifikasyon anrejistre avèk siksè.' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Erè nan anrejistre notifikasyon.' });
    }
  });

  // Play Store Privacy Policy & Account Deletion Page
  app.get(['/privacy', '/privacy-policy'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="ht">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Politik Konfidansyalite — MASTER PLAY</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px 16px; line-height: 1.65; }
    .container { max-width: 780px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 28px; }
    h1 { color: #f8fafc; font-size: 1.75rem; margin-top: 0; border-bottom: 1px solid #334155; padding-bottom: 12px; }
    h2 { color: #38bdf8; font-size: 1.15rem; margin-top: 24px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .badge { display: inline-block; background: #0284c7; color: #fff; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-bottom: 12px; }
    .contact { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-top: 20px; }
    a { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">MASTER PLAY — Kèkè Challenge</span>
    <h1>Politik Konfidansyalite (Privacy Policy)</h1>
    <p><strong>Aplikasyon :</strong> MASTER PLAY - Kèkè Challenge (<code>com.masterplay.kekechallenge</code>)</p>
    <p><strong>Dènye mizajou :</strong> ${new Date().toISOString().split('T')[0]}</p>

    <h2>1. Enfòmasyon Nou Kolekte</h2>
    <p>Pou pèmèt ou jwe, patisipe nan konpetisyon, ak pataje kontni sou MASTER PLAY, nou kolekte enfòmasyon sa yo lè ou kreye kont ou oswa itilize sèvis la :</p>
    <ul>
      <li><strong>Enfòmasyon pwofil :</strong> Non konplè, non itilizatè, nimewo telefòn, ak foto pwofil (opsyonèl).</li>
      <li><strong>Aktivite nan aplikasyon an :</strong> Nòt jwèt (scores), klasman, piblikasyon videyo/foto, kòmantè, likes, ak patisipasyon nan konpetisyon.</li>
      <li><strong>Tranzaksyon :</strong> Referans peman NatCash ak istorik tranzaksyon pou aktivasyon sèvis oswa rekonpans.</li>
    </ul>

    <h2>2. Pèmisyon Aparèy Nou Itilize</h2>
    <p>Aplikasyon Android la mande sèlman pèmisyon ki nesesè pou fonksyonalite li yo :</p>
    <ul>
      <li><strong>Kamera (<code>CAMERA</code>) :</strong> Pou anrejistre videyo ak pran foto pou piblikasyon lè ou chwazi fè sa.</li>
      <li><strong>Mikwofòn (<code>RECORD_AUDIO</code>) :</strong> Pou kaptire son pandan anrejistreman videyo nan Studio.</li>
      <li><strong>Notifikasyon (<code>POST_NOTIFICATIONS</code>) :</strong> Pou avèti ou sou konpetisyon, rezilta, ak mesaj enpòtan.</li>
      <li><strong>Entènèt (<code>INTERNET</code>) :</strong> Pou konekte ak sèvè MASTER PLAY ak sove done kont ou an sekirite.</li>
    </ul>

    <h2>3. Sekirite ak Pataj Done</h2>
    <p>Done ou yo sove sou sèvè nou an ak pwoteksyon modpas chifre. Nou <strong>pa vann</strong> ni lwe enfòmasyon pèsonèl ou bay okenn twazyèm pati. Piblikasyon ak nòt ou chwazi pataje piblikman yo vizib pou lòt jwè sou platfòm nan.</p>

    <h2>4. Sipresyon Kont ak Done (Account & Data Deletion)</h2>
    <p>Ou gen dwa mande pou nou efase kont ou ak tout done pèsonèl ki asosye avè l nenpòt ki lè. Pou fè demand sipresyon kont lan, kontakte ekip sipò nou an avèk nimewo telefòn ak non itilizatè kont ou :</p>
    <div class="contact">
      <p><strong>Imèl Sipò :</strong> <a href="mailto:itsleprince70@gmail.com">itsleprince70@gmail.com</a></p>
      <p><strong>WhatsApp Sipò :</strong> +509 4098-7659</p>
      <p>N ap trete demand ou an epi efase done kont lan nan yon delè maksimòm 7 jou ouvrab.</p>
    </div>
  </div>
</body>
</html>`);
  });

  // Return JSON 404 for unknown /api/* routes instead of falling through to SPA HTML
  app.all('/api/*', (_req, res) => {
    return res.status(404).json({ error: 'Pwen API sa a pa egziste.' });
  });

  // Serve favicon cleanly in both dev & prod
  app.get('/favicon.ico', (_req, res) => {
    const iconSvg = path.resolve(__dirname, 'public', 'icon.svg');
    if (fs.existsSync(iconSvg)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.sendFile(iconSvg);
    }
    return res.status(204).end();
  });

  // Serve static public assets (including videos)
  app.use('/videos', express.static(path.resolve(__dirname, 'public', 'videos')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Vite Integration (Dev Mode)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/manifest.webmanifest', (_req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      return res.json({
        id: '/',
        name: 'MASTER PLAY - Kèkè Challenge',
        short_name: 'MASTER PLAY',
        description: 'Platfòm ofisyèl MASTER PLAY ak Kèkè Challenge pou jwèt, konpetisyon, piblikasyon ak tranzaksyon NatCash an Ayiti.',
        theme_color: '#080C16',
        background_color: '#080C16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      });
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MASTER PLAY backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
