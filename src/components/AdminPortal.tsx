import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Competition, Transaction, Post, Game, AuditLog, CompetitionMatch, GiftItem, BalonAdminStats, BalonConfig, AvionCrashConfig, AvionCrashRound, DailyScoreRecord } from '../types';
import {
  Shield, KeyRound, Users, Trophy, Newspaper, Gamepad2, ArrowDownUp, Bell,
  Settings, Check, X, AlertCircle, Search, RefreshCw, Plus, Trash2, Edit3,
  ExternalLink, Calendar, Flame, Image as ImageIcon, Video as VideoIcon,
  FileText, ArrowRight, CheckCircle2, ChevronRight, Crown, Sparkles, Filter, Lock,
  Gift, ThumbsUp, DollarSign, Clock, Coins, Play, Pause, XCircle, Heart, Target,
  Plane, Download, Save, Award, Medal
} from 'lucide-react';
import { notify } from './Toast';
import { VerifiedBadge } from './VerifiedBadge';
import { useFirebase } from '../contexts/FirebaseContext';
import { signInWithFirebaseGoogle, syncAdminMigrationToFirestore } from '../services/firebaseSync';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminPortalProps {
  currentUser: User | null;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onClose, onDataChanged }) => {
  const [authorized, setAuthorized] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Admin Data State
  const [overview, setOverview] = useState<{
    stats: any;
    users: User[];
    transactions: Transaction[];
    competitions: Competition[];
    posts: Post[];
    games: Game[];
    dailyLevelRecords?: DailyScoreRecord[];
    auditLogs: AuditLog[];
  } | null>(null);

  const [scoreRecordsList, setScoreRecordsList] = useState<DailyScoreRecord[]>([]);
  const [scoreFilterComp, setScoreFilterComp] = useState<string>('all');
  const [scoreFilterGame, setScoreFilterGame] = useState<string>('all');
  const [scoreSearchUser, setScoreSearchUser] = useState<string>('');

  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const [certFilter, setCertFilter] = useState<'non_sètifye' | 'sètifye' | 'tout'>('non_sètifye');
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [certifyingUserIds, setCertifyingUserIds] = useState<Record<string, boolean>>({});

  const { firebaseUser } = useFirebase();
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncSummary, setCloudSyncSummary] = useState<string | null>(null);
  const [memoryOverview, setMemoryOverview] = useState<any>(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'avion_crash_admin' | 'balon_admin' | 'monetizasyon' | 'algorithm_intelligence' | 'tranzaksyon' | 'konpetisyon' | 'match_vot' | 'boutik_kado' | 'finans_konpetisyon' | 'piblikasyon' | 'itilizate' | 'setifikasyon' | 'memwa_database' | 'jwet' | 'notifikasyon' | 'anviwonman'
  >('overview');

  // --- MONETIZATION ADMIN STATE ---
  const [monetizationData, setMonetizationData] = useState<any>(null);
  const [loadingMonetization, setLoadingMonetization] = useState(false);
  const [monetizationActivationFeeInput, setMonetizationActivationFeeInput] = useState('250');
  const [monetization1kLikesInput, setMonetization1kLikesInput] = useState('500');
  const [monetizationMilestoneInput, setMonetizationMilestoneInput] = useState('1000');
  const [monetizationMinFollowersInput, setMonetizationMinFollowersInput] = useState('1000');
  const [savingMonetizationConfig, setSavingMonetizationConfig] = useState(false);
  const [monetizationMsg, setMonetizationMsg] = useState('');
  const [payoutModalCreator, setPayoutModalCreator] = useState<any>(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');
  const [payoutPinInput, setPayoutPinInput] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // --- ALGORITHM INTELLIGENCE STATE ---
  const [algorithmData, setAlgorithmData] = useState<any>(null);
  const [loadingAlgorithm, setLoadingAlgorithm] = useState(false);
  const [algorithmMsg, setAlgorithmMsg] = useState('');
  const [cleaningFakeAccounts, setCleaningFakeAccounts] = useState(false);
  const [cleanFakeAccountsPin, setCleanFakeAccountsPin] = useState('');
  const [showCleanModal, setShowCleanModal] = useState(false);

  const [loadingData, setLoadingData] = useState(false);

  // --- AVION CRASH (VRÈ LAJAN) ADMIN STATE ---
  const [crashAdminStats, setCrashAdminStats] = useState<any>(null);
  const [crashAdminConfig, setCrashAdminConfig] = useState<AvionCrashConfig>({
    isActive: true,
    isMaintenance: false,
    minBet: 10,
    maxBet: 5000,
  });
  const [crashMinBetInput, setCrashMinBetInput] = useState('10');
  const [crashMaxBetInput, setCrashMaxBetInput] = useState('5000');
  const [crashActiveInput, setCrashActiveInput] = useState(true);
  const [crashMaintenanceInput, setCrashMaintenanceInput] = useState(false);
  const [savingCrashConfig, setSavingCrashConfig] = useState(false);
  const [crashConfigMsg, setCrashConfigMsg] = useState('');

  // --- 11 BALON ADMIN STATE ---
  const [balonStats, setBalonStats] = useState<BalonAdminStats | null>(null);
  const [balonConfig, setBalonConfig] = useState<BalonConfig>({
    entryFee: 50,
    pointsPerWin: 100,
    isActive: true,
    totalLevels: 7
  });
  const [balonFeeInput, setBalonFeeInput] = useState('50');
  const [balonPointsInput, setBalonPointsInput] = useState('100');
  const [balonActiveInput, setBalonActiveInput] = useState(true);
  const [savingBalonConfig, setSavingBalonConfig] = useState(false);
  const [balonConfigMsg, setBalonConfigMsg] = useState('');

  // Review modal state
  const [reviewingTx, setReviewingTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // --- GAME PRICING STATE ---
  const [editingGamePrice, setEditingGamePrice] = useState<{ [gameId: string]: string }>({});
  const [savingGameId, setSavingGameId] = useState<string | null>(null);
  const [gameSuccessMsg, setGameSuccessMsg] = useState('');
  const [selectedGameForStats, setSelectedGameForStats] = useState<Game | null>(null);
  const [gameStatsModalData, setGameStatsModalData] = useState<any>(null);
  const [loadingGameStats, setLoadingGameStats] = useState(false);

  // Add new custom game state
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [newGameCategory, setNewGameCategory] = useState('custom');
  const [newGameIcon, setNewGameIcon] = useState('🎮');
  const [newGameFee, setNewGameFee] = useState('50');
  const [newGameDesc, setNewGameDesc] = useState('');
  const [addingGame, setAddingGame] = useState(false);

  // --- POSTS STATE (Text, Photo Gallery, Video) ---
  const [postMode, setPostMode] = useState<'text' | 'image' | 'video'>('text');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostTiktok, setNewPostTiktok] = useState('');
  const [newPostPinned, setNewPostPinned] = useState(false);
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostVideo, setNewPostVideo] = useState<string>('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // --- COMPETITION MANAGEMENT STATE ---
  const [selectedCompManageId, setSelectedCompManageId] = useState<string | null>(null);
  const [newCompName, setNewCompName] = useState('');
  const [newCompBadge, setNewCompBadge] = useState('🏆 NOUVO');
  const [newCompTagline, setNewCompTagline] = useState('');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [newCompRules, setNewCompRules] = useState('');
  const [newCompFee, setNewCompFee] = useState('500');
  const [newCompSlots, setNewCompSlots] = useState('100');
  const [newCompSelectedGames, setNewCompSelectedGames] = useState<string[]>([]);
  const [newCompTiebreaker, setNewCompTiebreaker] = useState<'pi_wo_pwen_match' | 'premye_enskripsyon' | 'plis_viktwa'>('pi_wo_pwen_match');
  const [newCompStartDateTime, setNewCompStartDateTime] = useState('');
  const [newCompEndDateTime, setNewCompEndDateTime] = useState('');
  const [newCompDays, setNewCompDays] = useState<string[]>(['Lendi', 'Madi', 'Mèkredi', 'Jedi', 'Vandredi', 'Samdi', 'Dimanch']);
  const [newCompStatus, setNewCompStatus] = useState<string>('Enskripsyon ouvè');
  const [newCompQualificationCount, setNewCompQualificationCount] = useState<number>(8);
  const [newCompVotingEnabled, setNewCompVotingEnabled] = useState<boolean>(true);
  const [newCompVotePrice, setNewCompVotePrice] = useState<string>('15');
  const [creatingComp, setCreatingComp] = useState(false);

  // --- COMPETITION ENTRY FEE & PRIZES EDITING STATE (Requirement 2 & 4) ---
  const [compFeeInput, setCompFeeInput] = useState<string>('500');
  const [compPrize1Input, setCompPrize1Input] = useState<string>('50,000 HT');
  const [compPrize2Input, setCompPrize2Input] = useState<string>('25,000 HT');
  const [compPrize3Input, setCompPrize3Input] = useState<string>('10,000 HT');
  const [savingCompPricing, setSavingCompPricing] = useState<boolean>(false);
  const [downloadingResultsId, setDownloadingResultsId] = useState<string | null>(null);

  // --- NEW FEATURES (Turn 2): User DB Verification, Delete Comp/Match, Reset Leaderboard, Pay Prizes ---
  const [verifyingUserIds, setVerifyingUserIds] = useState<{ [id: string]: boolean }>({});
  const [deletingCompId, setDeletingCompId] = useState<string | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [resettingLeaderboard, setResettingLeaderboard] = useState<boolean>(false);
  const [payingPrizePlace, setPayingPrizePlace] = useState<'first' | 'second' | 'third' | null>(null);

  // --- MATCH & VOTING STATE ---
  const [managingMatch, setManagingMatch] = useState<CompetitionMatch | null>(null);
  const [matchScore1, setMatchScore1] = useState('0');
  const [matchScore2, setMatchScore2] = useState('0');
  const [matchWinnerId, setMatchWinnerId] = useState('');
  const [matchStatus, setMatchStatus] = useState<string>('Fini');
  const [matchAuditNote, setMatchAuditNote] = useState('');
  const [matchNextGameId, setMatchNextGameId] = useState('');
  const [submittingMatch, setSubmittingMatch] = useState(false);

  // Create match modal state
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [newMatchPlayer1Id, setNewMatchPlayer1Id] = useState('');
  const [newMatchPlayer2Id, setNewMatchPlayer2Id] = useState('');
  const [newMatchGameId, setNewMatchGameId] = useState('');
  const [newMatchRound, setNewMatchRound] = useState('Kèkè VS - Kar de Final');
  const [newMatchTime, setNewMatchTime] = useState('4:00 PM');
  const [newMatchVotingEnabled, setNewMatchVotingEnabled] = useState(true);
  const [newMatchVotePrice, setNewMatchVotePrice] = useState('15');
  const [creatingMatch, setCreatingMatch] = useState(false);

  // --- GIFTS (BOUTIK KADO) STATE ---
  const [giftsList, setGiftsList] = useState<GiftItem[]>([]);
  const [giftTransactions, setGiftTransactions] = useState<any[]>([]);
  const [showAddGiftModal, setShowAddGiftModal] = useState(false);
  const [newGiftName, setNewGiftName] = useState('');
  const [newGiftIcon, setNewGiftIcon] = useState('🎁');
  const [newGiftPrice, setNewGiftPrice] = useState('50');
  const [newGiftDesc, setNewGiftDesc] = useState('');
  const [editingGiftPrices, setEditingGiftPrices] = useState<{ [id: string]: string }>({});
  const [savingGiftId, setSavingGiftId] = useState<string | null>(null);

  // --- FINANCE STATE ---
  const [financeData, setFinanceData] = useState<any>(null);

  // Broadcast notif state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');

  // User search
  const [userQuery, setUserQuery] = useState('');

  // Change Admin PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  // Verify Admin Session automatically via server
  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      setCheckingSession(true);
      if (!currentUser?.id || !currentUser?.adminToken) {
        if (active) {
          setAuthorized(false);
          setCheckingSession(false);
        }
        return;
      }
      try {
        const res = await api.verifyAdminSession(currentUser.id, currentUser.adminToken);
        if (active) {
          if (res.success && res.authorized) {
            setAuthorized(true);
            loadAdminData();
          } else {
            setAuthorized(false);
          }
        }
      } catch {
        if (active) setAuthorized(false);
      } finally {
        if (active) setCheckingSession(false);
      }
    };
    checkAdmin();
    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.adminToken]);

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [res, giftsRes, financeRes, balonRes, crashRes, monetRes, algoRes, memRes] = await Promise.all([
        api.getAdminOverview(),
        api.getGifts(),
        api.getAdminFinance(),
        api.getBalonAdminStats().catch(() => null),
        api.getAvionCrashAdminStats().catch(() => null),
        api.getAdminMonetization().catch(() => null),
        api.getAlgorithmIntelligence().catch(() => null),
        api.getAdminMemoryOverview().catch(() => null),
      ]);

      if (memRes && memRes.success) {
        setMemoryOverview(memRes.overview);
      }

      if (monetRes && monetRes.success) {
        setMonetizationData(monetRes);
        if (monetRes.config) {
          setMonetizationActivationFeeInput(String(monetRes.config.activationFee || 250));
          setMonetization1kLikesInput(String(monetRes.config.earningsPer1000Likes || 500));
          setMonetizationMilestoneInput(String(monetRes.config.followerMilestoneBonus || 1000));
          setMonetizationMinFollowersInput(String(monetRes.config.minFollowersRequired || 1000));
        }
      }

      if (algoRes && algoRes.success) {
        setAlgorithmData(algoRes.data);
      }

      if (res.success) {
        setOverview(res);
        // Initialize game price inputs
        const priceMap: { [id: string]: string } = {};
        res.games.forEach((g: Game) => {
          priceMap[g.id] = g.entryFee.toString();
        });
        setEditingGamePrice(priceMap);

        // Default selected competition to first active one if none selected
        if (!selectedCompManageId && res.competitions.length > 0) {
          setSelectedCompManageId(res.competitions[0].id);
        }

        // Initialize default selected games for new comp form if empty
        if (newCompSelectedGames.length === 0 && res.games.length > 0) {
          setNewCompSelectedGames(res.games.slice(0, 6).map((g: Game) => g.id));
        }

        if (res.dailyLevelRecords) {
          setScoreRecordsList(res.dailyLevelRecords);
        } else {
          api.getCompetitionScoreRecords().then(r => {
            if (r.success && r.records) setScoreRecordsList(r.records);
          }).catch(() => {});
        }
      }

      if (giftsRes && giftsRes.success) {
        setGiftsList(giftsRes.gifts || []);
        setGiftTransactions(giftsRes.transactions || []);
        const giftPrices: { [id: string]: string } = {};
        (giftsRes.gifts || []).forEach((g: any) => {
          giftPrices[g.id] = g.price.toString();
        });
        setEditingGiftPrices(giftPrices);
      }

      if (financeRes && financeRes.success) {
        setFinanceData(financeRes.finance);
      }

      if (balonRes && balonRes.stats) {
        setBalonStats(balonRes.stats);
        if (balonRes.config) {
          setBalonConfig(balonRes.config);
          setBalonFeeInput(balonRes.config.entryFee.toString());
          setBalonPointsInput(balonRes.config.pointsPerWin.toString());
          setBalonActiveInput(balonRes.config.isActive);
        }
      }

      if (crashRes && crashRes.success) {
        if (crashRes.stats) {
          setCrashAdminStats(crashRes.stats);
        }
        if (crashRes.config) {
          setCrashAdminConfig(crashRes.config);
          setCrashMinBetInput(crashRes.config.minBet.toString());
          setCrashMaxBetInput(crashRes.config.maxBet.toString());
          setCrashActiveInput(crashRes.config.isActive);
          setCrashMaintenanceInput(!!crashRes.config.isMaintenance);
        }
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // --- AVION CRASH (VRÈ LAJAN) ADMIN ACTIONS ---
  const handleSaveCrashConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingCrashConfig(true);
    setCrashConfigMsg('');
    try {
      const min = Number(crashMinBetInput);
      const max = Number(crashMaxBetInput);
      const res = await api.updateAvionCrashAdminConfig({
        isActive: crashActiveInput,
        isMaintenance: crashMaintenanceInput,
        minBet: isNaN(min) ? 10 : Math.max(1, min),
        maxBet: isNaN(max) ? 5000 : Math.max(10, max),
      });
      if (res && res.success) {
        setCrashAdminConfig(res.config);
        setCrashConfigMsg('Konfigirasyon Avion Crash mete ajou avèk siksè !');
        loadAdminData();
        onDataChanged();
      }
    } catch (err: any) {
      notify(err.message || 'Erè nan mete ajou konfigirasyon Avion Crash.');
    } finally {
      setSavingCrashConfig(false);
    }
  };

  // --- 11 BALON ADMIN ACTIONS ---
  const handleSaveBalonConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingBalonConfig(true);
    setBalonConfigMsg('');
    try {
      const fee = Number(balonFeeInput);
      const pts = Number(balonPointsInput);
      const res = await api.updateBalonConfig({
        entryFee: isNaN(fee) ? 50 : Math.max(0, fee),
        pointsPerWin: isNaN(pts) ? 100 : Math.max(10, pts),
        isActive: balonActiveInput,
      });
      if (res && res.success) {
        setBalonConfig(res.config);
        setBalonConfigMsg('Konfigirasyon 11 Balon an mete ajou avèk siksè !');
        loadAdminData();
        onDataChanged();
      }
    } catch (err: any) {
      notify(err.message || 'Erè nan mete ajou konfigirasyon 11 Balon.');
    } finally {
      setSavingBalonConfig(false);
    }
  };

  // --- 1. GAME PRICING ACTIONS ---
  const handleSaveGamePrice = async (game: Game) => {
    const rawVal = editingGamePrice[game.id];
    const newFee = Number(rawVal);
    if (isNaN(newFee) || newFee < 0) {
      notify('Tanpri mete yon pri ki valab (0 oswa plis).');
      return;
    }
    setSavingGameId(game.id);
    setGameSuccessMsg('');
    try {
      const res = await api.updateGamePrice({
        gameId: game.id,
        entryFee: newFee,
        isActive: game.isActive,
      });
      if (res.success) {
        setGameSuccessMsg(`Pri pou ${game.title} mete ajou a ${newFee} HT !`);
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè pandan anrejistreman pri a.');
    } finally {
      setSavingGameId(null);
    }
  };

  const handleToggleGameActive = async (game: Game) => {
    try {
      const res = await api.updateGamePrice({
        gameId: game.id,
        entryFee: game.entryFee,
        isActive: !game.isActive,
      });
      if (res.success) {
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè pandan aktivasyon jwèt la.');
    }
  };

  const handleAddNewGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameTitle.trim()) return;
    setAddingGame(true);
    try {
      const res = await api.updateGamePrice({
        title: newGameTitle,
        category: newGameCategory,
        icon: newGameIcon,
        entryFee: Number(newGameFee) || 0,
        description: newGameDesc,
        isNew: true,
      });
      if (res.success) {
        setShowAddGameModal(false);
        setNewGameTitle('');
        setNewGameDesc('');
        loadAdminData();
        onDataChanged();
        notify('Nouvo jwèt la ajoute avèk siksè nan lis pri a !');
      }
    } catch (err) {
      notify('Erè pandan kreyasyon jwèt la.');
    } finally {
      setAddingGame(false);
    }
  };

  const handleOpenGameStats = async (game: Game) => {
    setSelectedGameForStats(game);
    setLoadingGameStats(true);
    setGameStatsModalData(null);
    try {
      const res = await api.getGameAdminStats(game.id);
      setGameStatsModalData(res);
    } catch (err: any) {
      console.error('Failed to load game stats:', err);
      notify(err.message || 'Erè nan chaje estatistik jwèt la.');
    } finally {
      setLoadingGameStats(false);
    }
  };

  // --- 2. COMPETITION AUTHORIZED GAMES & 7-DAY BRACKET ACTIONS ---
  const selectedComp = overview?.competitions.find(c => c.id === selectedCompManageId) || overview?.competitions[0];

  // Synchronize inputs when selected competition changes (Requirement 2)
  React.useEffect(() => {
    if (selectedComp) {
      setCompFeeInput(String(selectedComp.entryFee ?? 0));
      setCompPrize1Input(selectedComp.prizes?.first || '50,000 HT');
      setCompPrize2Input(selectedComp.prizes?.second || '25,000 HT');
      setCompPrize3Input(selectedComp.prizes?.third || '10,000 HT');
    }
  }, [selectedComp?.id, selectedComp?.entryFee, selectedComp?.prizes?.first, selectedComp?.prizes?.second, selectedComp?.prizes?.third]);

  // Handler to update entry fee & prizes (Requirement 2)
  const handleSaveCompPricingAndPrizes = async () => {
    if (!selectedComp) return;
    const feeNum = Number(compFeeInput);
    if (isNaN(feeNum) || feeNum < 0) {
      notify('Tanpri antre yon pri enskripsyon valab (0 oswa plis).', 'error');
      return;
    }
    setSavingCompPricing(true);
    try {
      const res = await api.updateCompetitionPricingPrizes(selectedComp.id, {
        entryFee: feeNum,
        firstPrize: compPrize1Input.trim() || '50,000 HT',
        secondPrize: compPrize2Input.trim() || '25,000 HT',
        thirdPrize: compPrize3Input.trim() || '10,000 HT',
      });
      if (res.success) {
        loadAdminData();
        onDataChanged();
        notify(`Pri enskripsyon (${feeNum} HT) ak prim yo modifye avèk siksè pou ${selectedComp.name} !`, 'success');
      } else {
        notify(res.error || 'Erè pandan mizajou pri ak prim yo.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan anrejistreman pri ak prim yo.', 'error');
    } finally {
      setSavingCompPricing(false);
    }
  };

  // Monetization Handlers
  const handleSaveMonetizationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMonetizationConfig(true);
    setMonetizationMsg('');
    try {
      const res = await api.updateAdminMonetizationConfig({
        activationFee: Number(monetizationActivationFeeInput),
        earningsPer1000Likes: Number(monetization1kLikesInput),
        followerMilestoneBonus: Number(monetizationMilestoneInput),
        minFollowersRequired: Number(monetizationMinFollowersInput),
      });
      if (res.success) {
        setMonetizationMsg('Konfigirasyon monetizasyon mete ajou avèk siksè !');
        notify('Konfigirasyon monetizasyon anrejistre !', 'success');
        loadAdminData();
      } else {
        notify(res.error || 'Erè nan anrejistreman.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè rezo.', 'error');
    } finally {
      setSavingMonetizationConfig(false);
    }
  };

  const handleToggleCreatorStatus = async (creatorId: string, currentStatus: string, isCurrentlyMonetized: boolean) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const nextMonetized = nextStatus === 'active';
    try {
      const res = await api.toggleUserMonetization(creatorId, {
        status: nextStatus,
        isMonetized: nextMonetized,
      });
      if (res.success) {
        notify(`Estati kreyatè a chanje an "${nextStatus}" avèk siksè !`, 'success');
        loadAdminData();
      } else {
        notify(res.error || 'Erè nan chanje estati kreyatè a.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè rezo.', 'error');
    }
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalCreator) return;
    const amount = Number(payoutAmountInput);
    if (!amount || amount <= 0) {
      notify('Tanpri antre yon montan valab.', 'error');
      return;
    }
    if (!payoutPinInput.trim()) {
      notify('Kòd PIN Administratè a obligatwa pou peman.', 'error');
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await api.payoutUserMonetization(payoutModalCreator.id, {
        amount,
        adminPin: payoutPinInput.trim(),
      });
      if (res.success) {
        notify(`Peman ${amount} HT pou ${payoutModalCreator.fullName} reyisi avèk siksè !`, 'success');
        setPayoutModalCreator(null);
        setPayoutAmountInput('');
        setPayoutPinInput('');
        loadAdminData();
      } else {
        notify(res.error || 'Erè nan ekzekite peman an.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan peman an.', 'error');
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleRunCleanFakeAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanFakeAccountsPin.trim()) {
      notify('Kòd PIN Administratè a obligatwa.', 'error');
      return;
    }

    setCleaningFakeAccounts(true);
    try {
      const res = await api.cleanFakeAccounts(cleanFakeAccountsPin.trim());
      if (res.success) {
        notify(res.message || 'Netwayaj fo kont reyisi !', 'success');
        setShowCleanModal(false);
        setCleanFakeAccountsPin('');
        loadAdminData();
      } else {
        notify(res.error || 'Erè nan netwaye fo kont.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan netwayaj la.', 'error');
    } finally {
      setCleaningFakeAccounts(false);
    }
  };

  // Handler 1: Verify & Permanently register user account in database (Requirement 1)
  const handleVerifyUserInDB = async (u: User) => {
    setVerifyingUserIds(prev => ({ ...prev, [u.id]: true }));
    try {
      const res = await api.verifyUserInDB(u.id);
      if (res.success) {
        notify(`Kont ${u.fullName} anrejistre epi verifye nan bazdone a avèk siksè !`, 'success');
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Erè pandan anrejistreman kont lan.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan anrejistreman kont lan.', 'error');
    } finally {
      setVerifyingUserIds(prev => ({ ...prev, [u.id]: false }));
    }
  };

  // Handler 2A: Delete Competition with Confirmation (Requirement 2)
  const handleDeleteCompetition = async (comp: Competition) => {
    const confirmed = window.confirm(`Èske ou sèten ou vle efase konpetisyon "${comp.name}" la nèt nan bazdone a ? Aksyon sa a pa ka anile.`);
    if (!confirmed) return;

    setDeletingCompId(comp.id);
    try {
      const res = await api.deleteCompetition(comp.id);
      if (res.success) {
        notify(res.message || `Konpetisyon "${comp.name}" efase avèk siksè.`, 'success');
        setSelectedCompManageId(null);
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Erè pandan efasman konpetisyon an.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan efasman konpetisyon an.', 'error');
    } finally {
      setDeletingCompId(null);
    }
  };

  // Handler 2B: Delete VS Match with Confirmation (Requirement 2)
  const handleDeleteCompetitionMatch = async (comp: Competition, match: CompetitionMatch) => {
    const matchLabel = `${match.player1?.fullName || 'Jwè 1'} vs ${match.player2?.fullName || 'Jwè 2'}`;
    const confirmed = window.confirm(`Èske ou sèten ou vle efase match "${matchLabel}" la nan ${comp.name} ?`);
    if (!confirmed) return;

    setDeletingMatchId(match.id);
    try {
      const res = await api.deleteCompetitionMatch(comp.id, match.id);
      if (res.success) {
        notify(`Match "${matchLabel}" efase avèk siksè !`, 'success');
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Erè pandan efasman match la.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan efasman match la.', 'error');
    } finally {
      setDeletingMatchId(null);
    }
  };

  // Handler 3: Clean/Reset Leaderboard for Competition (Requirement 3)
  const handleResetLeaderboard = async (comp: Competition) => {
    const confirmed = window.confirm(`Èske ou sèten ou vle netwaye/reset tablo klasman pou "${comp.name}" ? Tout nòt patisipan yo pral remèt a zewo pou nouvo tounwa a. Kont itilizatè yo pap efase.`);
    if (!confirmed) return;

    setResettingLeaderboard(true);
    try {
      const res = await api.resetCompetitionLeaderboard(comp.id);
      if (res.success) {
        notify(`Tablo klasman pou "${comp.name}" netwaye avèk siksè !`, 'success');
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Erè pandan netwayaj klasman an.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan netwayaj klasman an.', 'error');
    } finally {
      setResettingLeaderboard(false);
    }
  };

  // Handler 4: Pay Prize directly to Winner Account (Requirement 4)
  const handlePayCompetitionPrize = async (comp: Competition, place: 'first' | 'second' | 'third') => {
    const placeLabel = place === 'first' ? '1ye Plas' : place === 'second' ? '2èm Plas' : '3èm Plas';
    const rawPrize = place === 'first' ? comp.prizes?.first : place === 'second' ? comp.prizes?.second : comp.prizes?.third;
    const confirmed = window.confirm(`Èske ou vle peye prim ${placeLabel} (${rawPrize}) dirèkteman sou balans kont gayan an nan ${comp.name} ?`);
    if (!confirmed) return;

    setPayingPrizePlace(place);
    try {
      const res = await api.payCompetitionPrize(comp.id, place);
      if (res.success) {
        notify(res.message || `Prim ${placeLabel} peye avèk siksè sou kont jwè a !`, 'success');
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || `Erè pandan peman prim ${placeLabel} an.`, 'error');
      }
    } catch (err: any) {
      notify(err.message || `Erè pandan peman prim ${placeLabel} an.`, 'error');
    } finally {
      setPayingPrizePlace(null);
    }
  };

  // Helper function to generate and download a high-res image of the Leaderboard and Results (PNG)
  const generateCompetitionResultsImage = async (comp: Competition) => {
    const scores = [...(comp.scores || [])].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const matches = comp.matches || [];

    // Calculate dimensions
    const width = 1200;
    const headerHeight = 240;
    const rowHeight = 44;
    const scoresSectionHeight = Math.max(1, scores.length) * rowHeight + 90;
    const matchRowHeight = 40;
    const matchesSectionHeight = matches.length > 0 ? (matches.length * matchRowHeight + 90) : 70;
    const footerHeight = 70;
    const totalHeight = headerHeight + scoresSectionHeight + matchesSectionHeight + footerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
    bgGrad.addColorStop(0, '#070B14');
    bgGrad.addColorStop(0.5, '#0D1527');
    bgGrad.addColorStop(1, '#080C16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, totalHeight);

    // Decorative top accent border
    const topAccent = ctx.createLinearGradient(0, 0, width, 0);
    topAccent.addColorStop(0, '#F59E0B');
    topAccent.addColorStop(0.5, '#EF4444');
    topAccent.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = topAccent;
    ctx.fillRect(0, 0, width, 8);

    // 2. Header Box
    ctx.fillStyle = '#111827';
    ctx.fillRect(40, 30, width - 80, 180);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 30, width - 80, 180);

    // Brand Name
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('⚡ MASTER PLAY', 65, 75);

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('RAPÒ OFISYÈL REZILTA & TABLO KLASMAN', 290, 75);

    // Competition Title
    ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(comp.name, 65, 120);

    // Badges / Metadata
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText(`Enskripsyon: ${comp.entryFee} HTG`, 65, 155);

    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`1ye Plas: ${comp.prizes?.first || '50,000 HT'}`, 260, 155);

    ctx.fillStyle = '#CBD5E1';
    ctx.fillText(`2èm Plas: ${comp.prizes?.second || '25,000 HT'}`, 480, 155);

    ctx.fillStyle = '#F97316';
    ctx.fillText(`3èm Plas: ${comp.prizes?.third || '10,000 HT'}`, 680, 155);

    // Status & Date info
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    const dateStr = new Date().toLocaleString('ht-HT', { dateStyle: 'long', timeStyle: 'short' });
    ctx.fillText(`Estati: ${comp.status || 'Aktif'} • Jounen: ${comp.currentDay || 'Lendi'} • Total Patisipan: ${scores.length}`, 65, 185);
    ctx.fillText(`Ekstrè sou aparèy admin la: ${dateStr}`, width - 420, 185);

    let curY = 240;

    // 3. Section Title: Leaderboard
    ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('🏆 TABLO KLASMAN OFISYÈL (LEADERBOARD)', 40, curY);
    curY += 15;

    // Table Header
    curY += 15;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(40, curY, width - 80, 36);
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('RANG', 55, curY + 23);
    ctx.fillText('NON JWÈ A', 140, curY + 23);
    ctx.fillText('TELEFÒN', 390, curY + 23);
    ctx.fillText('LENDI', 540, curY + 23);
    ctx.fillText('MADI', 620, curY + 23);
    ctx.fillText('MÈKREDI', 700, curY + 23);
    ctx.fillText('JEDI', 785, curY + 23);
    ctx.fillText('VÒT', 860, curY + 23);
    ctx.fillText('TOTAL PWEN', 950, curY + 23);
    ctx.fillText('ESTATI', 1075, curY + 23);
    curY += 36;

    if (scores.length === 0) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(40, curY, width - 80, 44);
      ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Poko gen patisipan ki anrejistre nòt nan konpetisyon sa a.', 60, curY + 27);
      curY += 44;
    } else {
      scores.forEach((s, idx) => {
        const isTop8 = idx < 8;
        const isPodium = idx < 3;
        ctx.fillStyle = idx % 2 === 0 ? '#0B1120' : '#111827';
        if (isPodium) {
          ctx.fillStyle = idx === 0 ? 'rgba(245, 158, 11, 0.12)' : idx === 1 ? 'rgba(203, 213, 225, 0.08)' : 'rgba(217, 119, 6, 0.08)';
        }
        ctx.fillRect(40, curY, width - 80, rowHeight);

        // Divider
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, curY + rowHeight);
        ctx.lineTo(width - 40, curY + rowHeight);
        ctx.stroke();

        // Rank Badge
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        if (idx === 0) {
          ctx.fillStyle = '#FBBF24';
          ctx.fillText('🥇 1ye', 55, curY + 27);
        } else if (idx === 1) {
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText('🥈 2yèm', 55, curY + 27);
        } else if (idx === 2) {
          ctx.fillStyle = '#D97706';
          ctx.fillText('🥉 3yèm', 55, curY + 27);
        } else {
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(`${idx + 1}yèm`, 55, curY + 27);
        }

        // Player Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const pName = (s.fullName || 'Jwè Enkoni').substring(0, 26);
        ctx.fillText(pName, 140, curY + 27);

        // Phone
        ctx.fillStyle = '#94A3B8';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(s.phoneNumber || '-', 390, curY + 27);

        // Daily scores
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText(String(s.dailyScores?.lendi ?? 0), 540, curY + 27);
        ctx.fillText(String(s.dailyScores?.madi ?? 0), 620, curY + 27);
        ctx.fillText(String(s.dailyScores?.mekredi ?? 0), 700, curY + 27);
        ctx.fillText(String(s.dailyScores?.jedi ?? 0), 785, curY + 27);

        // Votes
        ctx.fillStyle = '#A78BFA';
        ctx.fillText(String(s.votesCount ?? 0), 860, curY + 27);

        // Total Points
        ctx.fillStyle = '#FBBF24';
        ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${(s.totalScore || 0).toLocaleString()} pts`, 950, curY + 27);

        // Top 8 Status badge
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        if (isTop8) {
          ctx.fillStyle = '#34D399';
          ctx.fillText('TOP 8 KALIFYE', 1075, curY + 27);
        } else {
          ctx.fillStyle = '#64748B';
          ctx.fillText('Elimine', 1075, curY + 27);
        }

        curY += rowHeight;
      });
    }

    curY += 30;

    // 4. Section Title: VS Matches
    ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#EF4444';
    ctx.fillText('🔥 REZILTA MATCH FAS-A-FAS (VS MATCHES)', 40, curY);
    curY += 15;

    curY += 15;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(40, curY, width - 80, 36);
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('FAZ / ROUND', 55, curY + 23);
    ctx.fillText('JWÈ 1', 250, curY + 23);
    ctx.fillText('NÒT', 470, curY + 23);
    ctx.fillText('JWÈ 2', 530, curY + 23);
    ctx.fillText('NÒT', 750, curY + 23);
    ctx.fillText('GAYAN MATCH', 820, curY + 23);
    ctx.fillText('ESTATI', 1060, curY + 23);
    curY += 36;

    if (matches.length === 0) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(40, curY, width - 80, 44);
      ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Poko gen match VS ki pwograme pou konpetisyon sa a.', 60, curY + 27);
      curY += 44;
    } else {
      matches.forEach((m, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#0B1120' : '#111827';
        ctx.fillRect(40, curY, width - 80, matchRowHeight);

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, curY + matchRowHeight);
        ctx.lineTo(width - 40, curY + matchRowHeight);
        ctx.stroke();

        const roundLabel = m.round === 'final'
          ? '👑 GRAN FINAL'
          : m.round === 'demi'
          ? `Demi-Final ${m.matchNumber || ''}`
          : `Top 8 (Match ${m.matchNumber || idx + 1})`;

        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = m.round === 'final' ? '#FBBF24' : '#E2E8F0';
        ctx.fillText(roundLabel, 55, curY + 25);

        // Player 1
        ctx.fillStyle = m.winnerId === m.player1?.userId ? '#34D399' : '#FFFFFF';
        ctx.fillText((m.player1?.fullName || 'Jwè 1').substring(0, 22), 250, curY + 25);

        // Score 1
        ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#FBBF24';
        ctx.fillText(String(m.player1?.score ?? '-'), 470, curY + 25);

        // Player 2
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = m.winnerId === m.player2?.userId ? '#34D399' : '#FFFFFF';
        ctx.fillText((m.player2?.fullName || 'Jwè 2').substring(0, 22), 530, curY + 25);

        // Score 2
        ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#FBBF24';
        ctx.fillText(String(m.player2?.score ?? '-'), 750, curY + 25);

        // Winner
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const winnerName = m.winnerId
          ? (m.winnerId === m.player1?.userId ? m.player1?.fullName : m.player2?.fullName)
          : 'An atant';
        ctx.fillStyle = m.winnerId ? '#34D399' : '#94A3B8';
        ctx.fillText((winnerName || '').substring(0, 24), 820, curY + 25);

        // Status
        ctx.fillStyle = m.status === 'Fini' ? '#34D399' : '#FBBF24';
        ctx.fillText(m.status || 'Pwograme', 1060, curY + 25);

        curY += matchRowHeight;
      });
    }

    // 5. Footer Signature Box
    curY += 20;
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(40, curY, width - 80, 40);
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('MASTER PLAY • Sistèm Otomatik Konpetisyon & Klasman • Sètifye pa Panèl Administratè a', 60, curY + 25);

    // Convert Canvas to PNG Blob & Trigger Download
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas blob generation failed'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const safeName = comp.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        a.download = `Klasman_Imaj_${safeName}_${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        resolve();
      }, 'image/png');
    });
  };

  // Handler to download competition results image (PNG) on phone/desktop
  const handleDownloadCompetitionResults = async (comp: Competition) => {
    setDownloadingResultsId(comp.id);
    try {
      await generateCompetitionResultsImage(comp);
      notify(`Imaj klasman konplè pou "${comp.name}" telechaje avèk siksè sou telefòn ou !`, 'success');
    } catch (err: any) {
      console.error('Error generating competition results image:', err);
      // Fallback: Download via server CSV/Text if canvas fails
      try {
        const response = await fetch(`/api/admin/competitions/${comp.id}/download-results`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const safeName = comp.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          a.download = `Rezilta_Klasman_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          notify(`Fichye rezilta klasman pou "${comp.name}" telechaje sou telefòn ou !`, 'success');
          return;
        }
      } catch (fallbackErr) {}
      notify('Erè pandan telechajman imaj klasman an.', 'error');
    } finally {
      setDownloadingResultsId(null);
    }
  };

  const handleToggleGameForComp = async (compId: string, gameId: string) => {
    if (!selectedComp) return;
    const current = selectedComp.authorizedGameIds || [];
    const updated = current.includes(gameId)
      ? current.filter(id => id !== gameId)
      : [...current, gameId];

    if (updated.length === 0) {
      notify('Konpetisyon an dwe gen omwen 1 jwèt otorize.');
      return;
    }

    try {
      const res = await api.updateCompetitionGames(compId, updated);
      if (res.success) {
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè pandan mizajou jwèt konpetisyon an.');
    }
  };

  const handleAdvanceDay = async (compId: string, day: string) => {
    try {
      const res = await api.advanceCompetitionDay(compId, day);
      if (res.success) {
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè pandan chanjman jounen an.');
    }
  };

  const handleQualifyTop8 = async (compId: string) => {
    if (!confirm('Èske w sèten ou vle konfime kalifikasyon Top 8 la kounye a? Sa pral bloke klasman Jedi a epi pwograme 4 match Vandredi yo.')) return;
    try {
      const res = await api.qualifyTop8(compId);
      if (res.success) {
        loadAdminData();
        onDataChanged();
        notify('Felisitasyon ! Top 8 la konfime epi 4 match eliminatwa Vandredi yo pwograme.');
      } else {
        notify(res.error || 'Erè pandan kalifikasyon an.');
      }
    } catch (err: any) {
      notify(err.message || 'Erè rezo.');
    }
  };

  const handleOpenMatchModal = (match: CompetitionMatch) => {
    setManagingMatch(match);
    setMatchScore1((match.player1.score || 0).toString());
    setMatchScore2((match.player2.score || 0).toString());
    setMatchWinnerId(match.winnerId || '');
    setMatchStatus(match.status || 'Fini');
    setMatchAuditNote(match.auditNote || '');
    setMatchNextGameId(selectedComp?.authorizedGameIds?.[1] || selectedComp?.authorizedGameIds?.[0] || 'game_basket');
  };

  const handleSaveMatchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp || !managingMatch) return;
    setSubmittingMatch(true);
    try {
      const s1 = Number(matchScore1) || 0;
      const s2 = Number(matchScore2) || 0;
      const determinedWinner = matchWinnerId || (s1 > s2 ? managingMatch.player1.userId : s2 > s1 ? managingMatch.player2.userId : undefined);

      const res = await api.submitMatchResult(selectedComp.id, {
        matchId: managingMatch.id,
        score1: s1,
        score2: s2,
        winnerId: determinedWinner,
        status: matchStatus,
        chosenNextGameId: matchNextGameId,
      });

      if (res.success) {
        setManagingMatch(null);
        loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Erè anrejistreman rezilta.');
      }
    } catch (err) {
      notify('Erè pandan anrejistreman rezilta match la.');
    } finally {
      setSubmittingMatch(false);
    }
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompSelectedGames.length === 0) {
      notify('Tanpri chwazi omwen 1 jwèt pou konpetisyon sa a.');
      return;
    }
    setCreatingComp(true);
    try {
      const res = await api.saveCompetition({
        name: newCompName,
        badge: newCompBadge,
        tagline: newCompTagline,
        description: newCompDesc,
        rules: newCompRules || 'Règ ofisyèl MASTER PLAY aplike. Lè Ayiti (America/Port-au-Prince).',
        entryFee: Number(newCompFee),
        maxParticipants: Number(newCompSlots),
        authorizedGameIds: newCompSelectedGames,
        scheduleType: 'custom_dates',
        currentDay: newCompDays[0] || 'Lendi',
        competitionDays: newCompDays,
        status: newCompStatus,
        qualificationCount: newCompQualificationCount,
        votingEnabled: newCompVotingEnabled,
        votePrice: Number(newCompVotePrice) || 15,
        startDateTimeISO: newCompStartDateTime || new Date().toISOString(),
        endDateTimeISO: newCompEndDateTime || new Date(Date.now() + 7 * 86400000).toISOString(),
        startDate: newCompStartDateTime ? new Date(newCompStartDateTime).toLocaleDateString('ht-HT') : 'Jodi a',
        deadline: newCompEndDateTime ? new Date(newCompEndDateTime).toLocaleDateString('ht-HT') : 'Nan 7 jou',
        tiebreakerRule: newCompTiebreaker,
        prizes: { first: '50,000 HT', second: '25,000 HT', third: '10,000 HT' },
      });

      if (res.success && res.competition) {
        setNewCompName('');
        setNewCompTagline('');
        setNewCompDesc('');
        setSelectedCompManageId(res.competition.id);
        loadAdminData();
        onDataChanged();
        notify('Nouvo konpetisyon an kreye avèk siksè !');
      }
    } catch (err) {
      notify('Erè pandan kreyasyon konpetisyon an.');
    } finally {
      setCreatingComp(false);
    }
  };

  const handleUpdateCompStatus = async (compId: string, status: string) => {
    try {
      const res = await api.updateCompetitionStatus(compId, status);
      if (res.success) {
        loadAdminData();
        onDataChanged();
        notify(`Estati konpetisyon an chanje a: "${status}"`);
      } else {
        notify(res.error || 'Erè chanjman estati.');
      }
    } catch (err: any) {
      notify(err.message || 'Erè rezo.');
    }
  };

  const handleToggleCompVoting = async (compId: string, votingEnabled: boolean, votePrice?: number) => {
    try {
      const res = await api.toggleVoting(compId, { votingEnabled, votePrice });
      if (res.success) {
        loadAdminData();
        onDataChanged();
        notify(`Sistèm vòt la ${votingEnabled ? 'louvri' : 'fèmen'} avèk siksè !`);
      }
    } catch (err: any) {
      notify(err.message || 'Erè pandan mizajou vòt la.');
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp) return;
    if (!newMatchPlayer1Id || !newMatchPlayer2Id) {
      notify('Tanpri chwazi de jwè diferan.');
      return;
    }
    if (newMatchPlayer1Id === newMatchPlayer2Id) {
      notify('Ou pa ka chwazi menm jwè a pou tou de bò yo.');
      return;
    }
    setCreatingMatch(true);
    try {
      const res = await api.createCompetitionMatch(selectedComp.id, {
        player1Id: newMatchPlayer1Id,
        player2Id: newMatchPlayer2Id,
        chosenGameId: newMatchGameId || selectedComp.authorizedGameIds?.[0] || 'game_football',
        roundName: newMatchRound,
        matchDateTimeISO: newMatchTime,
        votingEnabled: newMatchVotingEnabled,
        votePrice: Number(newMatchVotePrice) || 15,
      });

      if (res.success) {
        setShowCreateMatchModal(false);
        setNewMatchPlayer1Id('');
        setNewMatchPlayer2Id('');
        loadAdminData();
        onDataChanged();
        notify('Match fas-a-fas la pwograme avèk siksè !');
      } else {
        notify(res.error || 'Erè pandan kreyasyon match la.');
      }
    } catch (err: any) {
      notify(err.message || 'Erè rezo.');
    } finally {
      setCreatingMatch(false);
    }
  };

  // --- GIFTS (BOUTIK KADO) HANDLERS ---
  const handleSaveGiftPrice = async (gift: GiftItem) => {
    const rawVal = editingGiftPrices[gift.id];
    const newPrice = Number(rawVal);
    if (isNaN(newPrice) || newPrice <= 0) {
      notify('Tanpri mete yon pri pozitif.');
      return;
    }
    setSavingGiftId(gift.id);
    try {
      const res = await api.adminSaveGift({
        id: gift.id,
        name: gift.name,
        icon: gift.icon,
        description: gift.description,
        price: newPrice,
        isActive: gift.isActive,
      });
      if (res.success) {
        loadAdminData();
        onDataChanged();
        notify(`Pri pou ${gift.name} ${gift.icon} mete ajou a ${newPrice} HT !`);
      }
    } catch (err) {
      notify('Erè anrejistreman pri kado a.');
    } finally {
      setSavingGiftId(null);
    }
  };

  const handleToggleGiftActive = async (gift: GiftItem) => {
    try {
      const res = await api.adminSaveGift({
        id: gift.id,
        name: gift.name,
        icon: gift.icon,
        description: gift.description,
        price: gift.price,
        isActive: !gift.isActive,
      });
      if (res.success) {
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè chanjman estati kado a.');
    }
  };

  const handleAddNewGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftName.trim()) return;
    try {
      const res = await api.adminSaveGift({
        name: newGiftName.trim(),
        icon: newGiftIcon.trim() || '🎁',
        description: newGiftDesc.trim(),
        price: Number(newGiftPrice) || 50,
        isActive: true,
      });
      if (res.success) {
        setShowAddGiftModal(false);
        setNewGiftName('');
        setNewGiftDesc('');
        loadAdminData();
        onDataChanged();
        notify('Nouvo kado a ajoute avèk siksè nan Boutik Kado a !');
      }
    } catch (err) {
      notify('Erè pandan kreyasyon kado a.');
    }
  };

  // --- 3. POST CREATION WITH PHONE GALLERY (IMAGES & VIDEOS) ---
  const handleImagePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewPostImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewPostVideo(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPost(true);
    try {
      if (editingPost) {
        // Edit existing post
        const res = await api.editPost(editingPost.id, {
          title: newPostTitle,
          description: newPostDesc,
          mediaType: postMode,
          mediaUrl: newPostImages[0] || '',
          mediaUrls: newPostImages,
          videoUrl: newPostVideo,
          tiktokUrl: newPostTiktok,
          pinned: newPostPinned,
        });
        if (res.success) {
          setEditingPost(null);
          resetPostForm();
          loadAdminData();
          onDataChanged();
          notify('Piblikasyon an modifye avèk siksè !');
        }
      } else {
        // Create new post
        const res = await api.createPost({
          title: newPostTitle,
          description: newPostDesc,
          mediaType: postMode,
          mediaUrl: newPostImages[0] || '',
          mediaUrls: newPostImages,
          videoUrl: newPostVideo,
          tiktokUrl: newPostTiktok,
          pinned: newPostPinned,
        });

        if (res.success) {
          resetPostForm();
          loadAdminData();
          onDataChanged();
          notify('Piblikasyon an afiche avèk siksè nan fil aplikasyon an !');
        }
      }
    } catch (err) {
      notify('Erè pandan kreyasyon piblikasyon an.');
    } finally {
      setCreatingPost(false);
    }
  };

  const resetPostForm = () => {
    setNewPostTitle('');
    setNewPostDesc('');
    setNewPostImages([]);
    setNewPostVideo('');
    setNewPostTiktok('');
    setNewPostPinned(false);
    setEditingPost(null);
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPostTitle(post.title);
    setNewPostDesc(post.description);
    setPostMode((post.mediaType as any) || (post.videoUrl ? 'video' : post.mediaUrls?.length ? 'image' : 'text'));
    setNewPostImages(post.mediaUrls || (post.mediaUrl ? [post.mediaUrl] : []));
    setNewPostVideo(post.videoUrl || '');
    setNewPostTiktok(post.tiktokUrl || '');
    setNewPostPinned(!!post.pinned);
    setActiveSection('piblikasyon');
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Èske w sèten ou vle efase piblikasyon sa a ?')) return;
    try {
      await api.deletePost(id);
      loadAdminData();
      onDataChanged();
    } catch (err) {
      notify('Erè pandan efasman an.');
    }
  };

  // Review Transaction
  const handleReview = async (status: 'konfime' | 'refize') => {
    if (!reviewingTx) return;
    setSubmittingReview(true);
    try {
      const res = await api.reviewTransaction({
        transactionId: reviewingTx.id,
        status,
        rejectReason: status === 'refize' ? rejectReason : undefined,
      });

      if (res.success) {
        setReviewingTx(null);
        setRejectReason('');
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      notify('Erè pandan revizyon tranzaksyon an.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Broadcast Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingNotif(true);
    setNotifSuccess('');
    try {
      const res = await api.broadcastNotification({
        title: notifTitle,
        message: notifMessage,
        type: 'anons',
      });
      if (res.success) {
        setNotifTitle('');
        setNotifMessage('');
        setNotifSuccess('Notifikasyon an voye bay tout itilizatè yo !');
        loadAdminData();
      }
    } catch (err) {
      notify('Erè pandan voye notifikasyon an.');
    } finally {
      setSendingNotif(false);
    }
  };

  // Change Admin PIN
  const handleChangeAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinSuccess('');
    try {
      const res = await api.changeAdminPin(currentPin, newAdminPin);
      if (res.success) {
        setPinSuccess('Kòd admin lan chanje avèk siksè !');
        setCurrentPin('');
        setNewAdminPin('');
      } else {
        setPinChangeError(res.error || 'Erè pandan chanjman kòd la.');
      }
    } catch (err: any) {
      setPinChangeError(err.message || 'Erè pandan chanjman kòd la.');
    }
  };

  // 1. SERVER-VERIFIED ACCESS CONTROL
  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
            <Shield className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-300">Verifikasyon aksè administratè...</p>
        </div>
      </div>
    );
  }

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput.trim()) {
      setAdminPinError('Tanpri antre kòd sekirite administratè a.');
      return;
    }
    setVerifyingPin(true);
    setAdminPinError('');
    try {
      const res = await api.verifyAdminPin(adminPinInput.trim());
      if (res.success && res.authorized) {
        setAuthorized(true);
        setAdminPinInput('');
        loadAdminData();
      } else {
        setAdminPinError(res.error || 'Kòd sekirite administratè a pa kòrèk.');
      }
    } catch {
      setAdminPinError('Erè koneksyon. Tanpri reeseye.');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleCertifyUser = async (targetUser: User) => {
    setCertifyingUserIds((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.certifyUser(targetUser.id, currentUser?.fullName || currentUser?.id);
      if (res.success) {
        notify(`Kont ${targetUser.fullName} sètifye avèk siksè!`, 'success');
        await loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Pa kapab sètifye kont sa a.', 'error');
      }
    } catch {
      notify('Erè pandan sètifikasyon kont lan.', 'error');
    } finally {
      setCertifyingUserIds((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const handleUncertifyUser = async (targetUser: User) => {
    setCertifyingUserIds((prev) => ({ ...prev, [targetUser.id]: true }));
    try {
      const res = await api.uncertifyUser(targetUser.id, currentUser?.fullName || currentUser?.id);
      if (res.success) {
        notify(`Sètifikasyon pou ${targetUser.fullName} retire.`, 'success');
        await loadAdminData();
        onDataChanged();
      } else {
        notify(res.error || 'Pa kapab retire sètifikasyon kont sa a.', 'error');
      }
    } catch {
      notify('Erè pandan retire sètifikasyon kont lan.', 'error');
    } finally {
      setCertifyingUserIds((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  if (!authorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="w-full max-w-sm bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Aksè Administrasyon</h2>
            <p className="text-xs text-slate-400 mt-2">
              Antre kòd sekirite administratè a pou aksede espas jesyon MASTER PLAY la.
            </p>
          </div>

          <form onSubmit={handleAdminPinSubmit} className="space-y-3 text-left">
            <div>
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Antre kòd administratè a..."
                className="w-full bg-[#080C16] border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                autoFocus
              />
            </div>

            {adminPinError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adminPinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingPin}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors disabled:opacity-50"
            >
              {verifyingPin ? 'Verifikasyon...' : 'Ouvri Paj Admin'}
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Retounen
          </button>
        </div>
      </div>
    );
  }

  // 2. MAIN ADMIN PORTAL INTERFACE
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080C16] text-slate-100 overflow-hidden">
      {/* Admin Top Bar */}
      <div className="h-16 px-6 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
            👑
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>Paj Administrasyon</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.2 rounded-full">
                Admin: {currentUser?.fullName || 'Administratè'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Kontwòl santral MASTER PLAY & Kèkè Challenge</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Rafrechi done yo"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700"
          >
            Fèmen
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 bg-[#0B0F19] border-r border-slate-800/80 p-4 space-y-1.5 overflow-y-auto hidden md:block shrink-0">
          {[
            { id: 'overview', label: 'Apèsi & Estatistik', icon: Shield },
            { id: 'avion_crash_admin', label: 'Avion Crash (Vrè Lajan)', icon: Plane, badge: crashAdminStats?.totalRounds },
            { id: 'balon_admin', label: '11 Balon (7 Nivo)', icon: Target, badge: balonStats?.totalPlayers },
            { id: 'jwet', label: 'Jesyon Pri Jwèt yo', icon: Gamepad2, badge: overview?.games?.length },
            { id: 'konpetisyon', label: 'Jesyon Konpetisyon', icon: Trophy, badge: overview?.competitions?.length },
            { id: 'match_vot', label: 'Match VS & Vòt Fanatik', icon: ThumbsUp },
            { id: 'boutik_kado', label: 'Boutik Kado (Gifts)', icon: Gift, badge: giftsList.length },
            { id: 'finans_konpetisyon', label: 'Finans Konpetisyon', icon: Coins },
            { id: 'piblikasyon', label: 'Piblikasyon (Foto/Vid)', icon: Newspaper, badge: overview?.posts?.length },
            {
              id: 'tranzaksyon',
              label: 'Tranzaksyon NatCash',
              icon: ArrowDownUp,
              badge: (overview?.stats?.pendingDepositsCount || 0) + (overview?.stats?.pendingWithdrawalsCount || 0),
            },
            { id: 'itilizate', label: 'Itilizatè yo', icon: Users, badge: overview?.users?.length },
            {
              id: 'setifikasyon',
              label: 'Sètifikasyon Kont',
              icon: CheckCircle2,
              badge: overview?.users?.filter((u) => u.certificationStatus !== 'sètifye' && u.role !== 'ADMIN' && !u.isAdmin).length,
            },
            {
              id: 'memwa_database',
              label: 'Memwa / Database System',
              icon: Shield,
              badge: memoryOverview?.stats?.eventsCount,
            },
            { id: 'monetizasyon', label: 'Monetizasyon Kreyatè', icon: Sparkles, badge: monetizationData?.creators?.length },
            { id: 'algorithm_intelligence', label: '🧠 Algorithm Master', icon: Shield, badge: algorithmData?.anomalies?.length },
            { id: 'notifikasyon', label: 'Voye Notifikasyon', icon: Bell },
            { id: 'anviwonman', label: 'Sekirite Admin & PIN', icon: Settings },
          ].map((item: any) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080C16]">
          {/* Mobile sub-menu switcher */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-800 scrollbar-none">
            {[
              { id: 'overview', label: 'Apèsi' },
              { id: 'avion_crash_admin', label: '✈️ Avion Crash' },
              { id: 'balon_admin', label: '⚽ 11 Balon' },
              { id: 'jwet', label: 'Pri Jwèt' },
              { id: 'konpetisyon', label: 'Konpetisyon' },
              { id: 'match_vot', label: 'Match & Vòt' },
              { id: 'boutik_kado', label: 'Kado' },
              { id: 'finans_konpetisyon', label: 'Finans' },
              { id: 'piblikasyon', label: 'Piblikasyon' },
              { id: 'tranzaksyon', label: 'NatCash' },
              { id: 'itilizate', label: 'Itilizatè' },
              { id: 'setifikasyon', label: '✅ Sètifikasyon' },
              { id: 'memwa_database', label: '💾 Memwa/DB' },
              { id: 'monetizasyon', label: '⭐ Monetizasyon' },
              { id: 'algorithm_intelligence', label: '🧠 Algorithm' },
              { id: 'notifikasyon', label: 'Notif' },
              { id: 'anviwonman', label: 'PIN' },
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  activeSection === tab.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && overview && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Tablo Administrasyon Ofisyèl</h2>
                <p className="text-xs text-slate-400">
                  Rezime operasyon, demann NatCash, konpetisyon ak piblikasyon aktif.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Itilizatè Enskri</div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">
                    {overview.stats.totalUsers}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-amber-500/30">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Depo an Atant</div>
                  <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
                    {overview.stats.pendingDepositsCount}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-blue-500/30">
                  <div className="text-[10px] uppercase font-bold text-blue-400">Retrè an Atant</div>
                  <div className="text-2xl font-black text-blue-400 mt-1 tabular-nums">
                    {overview.stats.pendingWithdrawalsCount}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Konpetisyon Aktif</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                    {overview.stats.activeCompetitions}
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveSection('avion_crash_admin')}
                  className="p-4 rounded-2xl bg-[#131B2E] hover:bg-[#1a253e] border border-amber-500/30 text-left transition-all group"
                >
                  <Plane className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Avion Crash</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">VRÈ LAJAN</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Kontwole miz min/max, estati aktif/antretyen ak tout wonn lajan reyèl.</div>
                </button>

                <button
                  onClick={() => setActiveSection('jwet')}
                  className="p-4 rounded-2xl bg-[#131B2E] hover:bg-[#1a253e] border border-slate-800 text-left transition-all group"
                >
                  <Gamepad2 className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Jesyon Pri Jwèt yo</div>
                  <div className="text-xs text-slate-400 mt-0.5">Modifye pri chak jwèt endividyèlman oswa ajoute nouvo.</div>
                </button>

                <button
                  onClick={() => setActiveSection('konpetisyon')}
                  className="p-4 rounded-2xl bg-[#131B2E] hover:bg-[#1a253e] border border-slate-800 text-left transition-all group"
                >
                  <Trophy className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Kalandriye 7 Jou & Match</div>
                  <div className="text-xs text-slate-400 mt-0.5">Jere Lendi rive Dimanch, Top 8, ak match eliminatwa yo.</div>
                </button>

                <button
                  onClick={() => setActiveSection('piblikasyon')}
                  className="p-4 rounded-2xl bg-[#131B2E] hover:bg-[#1a253e] border border-slate-800 text-left transition-all group"
                >
                  <Newspaper className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Kreye Piblikasyon (Foto/Vid)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Chwazi foto ak videyo nan galri telefòn ou pou poste.</div>
                </button>
              </div>

              {/* Recent Audit Logs */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dènye Aksyon & Tras Istorik Sistèm lan
                </h3>
                <div className="space-y-2 text-xs">
                  {overview.auditLogs.slice(0, 6).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-amber-400 mr-2">[{log.action}]</span>
                        <span className="text-slate-200">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: JESYON 11 BALON (7 NIVO) */}
          {activeSection === 'balon_admin' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="text-2xl">⚽</span>
                    <span>Jesyon Jwèt 11 Balon (7 Nivo)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Modifye pri antre, pwen pa viktwa, aktive/dezaktive jwèt la, epi konsilte estatistik 7 nivo yo ak lis chanpyon yo.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    balonConfig.isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {balonConfig.isActive ? '● JWÈT LA AKTIF' : '○ DEZAKTIK'}
                  </span>
                </div>
              </div>

              {/* Success Message */}
              {balonConfigMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{balonConfigMsg}</span>
                </div>
              )}

              {/* 1. Configuration Box */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Konfigirasyon Pri & Règleman Jwèt la</span>
                </h3>

                <form onSubmit={handleSaveBalonConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Estati Jwèt la :</label>
                    <button
                      type="button"
                      onClick={() => setBalonActiveInput(!balonActiveInput)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        balonActiveInput
                          ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-600/30 hover:bg-red-600/40 text-red-300 border-red-500/40'
                      }`}
                    >
                      {balonActiveInput ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Jwèt la Aktif (Ouvè)</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-400" />
                          <span>Jwèt la Fèmen (Dezaktive)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Entry Fee */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Pri Antre (HT) :</label>
                    <input
                      type="number"
                      min="0"
                      value={balonFeeInput}
                      onChange={(e) => setBalonFeeInput(e.target.value)}
                      placeholder="50"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                    <div className="text-[10px] text-slate-500">Pri jwè a peye yon sèl fwa pou tout 7 nivo yo</div>
                  </div>

                  {/* Points per win */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Pwen pa Viktwa (pa defo: 100) :</label>
                    <input
                      type="number"
                      min="10"
                      value={balonPointsInput}
                      onChange={(e) => setBalonPointsInput(e.target.value)}
                      placeholder="100"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                    <div className="text-[10px] text-slate-500">100 pwen pa nivo (jiska 700 pts nan Nivo 7)</div>
                  </div>

                  <div className="sm:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingBalonConfig}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {savingBalonConfig && (
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>Anrejistre Modifikasyon 11 Balon</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. Global Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Jwè ki Antre</div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">
                    {balonStats?.totalPlayers || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-amber-500/30">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Chanpyon (7/7)</div>
                  <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
                    {balonStats?.championsCount || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-blue-500/30">
                  <div className="text-[10px] uppercase font-bold text-blue-400">Total Pati Jwe</div>
                  <div className="text-2xl font-black text-blue-400 mt-1 tabular-nums">
                    {balonStats?.totalPlays || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Total Viktwa</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                    {balonStats?.totalWins || 0}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-[#131B2E] border border-red-500/30">
                  <div className="text-[10px] uppercase font-bold text-red-400">Total Defèt</div>
                  <div className="text-2xl font-black text-red-400 mt-1 tabular-nums">
                    {balonStats?.totalLosses || 0}
                  </div>
                </div>
              </div>

              {/* 3. Table: Breakdown pa Nivo (Nivo 1 rive Nivo 7) */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Estatistik Detaye pa Nivo (Nivo 1 rive Nivo 7)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Nivo</th>
                        <th className="p-3">Jwè nan Nivo a</th>
                        <th className="p-3">Manch Jwe</th>
                        <th className="p-3">Viktwa</th>
                        <th className="p-3">Defèt</th>
                        <th className="p-3">Pousantaj Siksè</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                        const st = balonStats?.levelStats?.[lvl] || {
                          plays: 0,
                          wins: 0,
                          losses: 0,
                          playersAtLevel: 0
                        };
                        const winRate = st.plays > 0 ? Math.round((st.wins / st.plays) * 100) : 0;

                        return (
                          <tr key={lvl} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                                {lvl}
                              </span>
                              <span>Nivo {lvl}</span>
                            </td>
                            <td className="p-3 text-slate-300 font-mono font-bold">
                              {st.playersAtLevel}
                            </td>
                            <td className="p-3 text-slate-300 font-mono">{st.plays}</td>
                            <td className="p-3 text-emerald-400 font-mono font-bold">{st.wins}</td>
                            <td className="p-3 text-red-400 font-mono">{st.losses}</td>
                            <td className="p-3 font-mono font-bold">
                              <span className={winRate > 15 ? 'text-emerald-400' : 'text-amber-400'}>
                                {winRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Table: Champions List (Fini tout 7 nivo yo) */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Lis Chanpyon 11 Balon (Fini tout 7 Nivo yo)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {balonStats?.champions?.length || 0} chanpyon
                  </span>
                </div>

                {(!balonStats?.champions || balonStats.champions.length === 0) ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Poko gen jwè ki fini tout 7 nivo yo pou kounye a.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Jwè</th>
                          <th className="p-3">Telefòn</th>
                          <th className="p-3">Total Pwen</th>
                          <th className="p-3">Dat Fini</th>
                          <th className="p-3">Estati</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {balonStats.champions.map((champ, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                              <span>🏆</span>
                              <span>{champ.userName}</span>
                            </td>
                            <td className="p-3 text-slate-300 font-mono">{champ.phoneNumber}</td>
                            <td className="p-3 text-amber-400 font-mono font-black">
                              {champ.totalPoints} pts
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(champ.completedAt).toLocaleDateString('ht-HT')}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold text-[10px]">
                                CHANPYON OFISYÈL
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. Table: All Players Progress */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Pwogrè Tout Jwè 11 Balon</span>
                </h3>

                {(!balonStats?.playersProgress || balonStats.playersProgress.length === 0) ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Poko gen jwè ki kòmanse jwèt la.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Jwè</th>
                          <th className="p-3">Telefòn</th>
                          <th className="p-3">Nivo Aktyèl</th>
                          <th className="p-3">Nivo Genyen</th>
                          <th className="p-3">Total Pwen</th>
                          <th className="p-3">Dènye Mizajou</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {balonStats.playersProgress.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white">{p.userName}</td>
                            <td className="p-3 text-slate-300 font-mono">{p.phoneNumber}</td>
                            <td className="p-3 font-mono font-bold text-amber-400">
                              Nivo {p.currentLevel}
                            </td>
                            <td className="p-3 text-emerald-400 font-mono font-bold">
                              {p.completedLevelsCount} / 7
                            </td>
                            <td className="p-3 text-amber-300 font-mono font-bold">{p.totalPoints} pts</td>
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(p.lastUpdated).toLocaleString('ht-HT')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 6. Recent Results Audit History */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Istwa Dènye Manch & Rezilta Gratay</span>
                </h3>

                {(!balonStats?.recentHistory || balonStats.recentHistory.length === 0) ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Poko gen manch ki anrejistre nan istwa a.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Lè & Dat</th>
                          <th className="p-3">Jwè</th>
                          <th className="p-3">Nivo</th>
                          <th className="p-3">Balon Chwazi</th>
                          <th className="p-3">Balon Genyen</th>
                          <th className="p-3">Rezilta</th>
                          <th className="p-3">Pwen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {balonStats.recentHistory.slice(0, 30).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 text-slate-400 text-[11px]">
                              {new Date(r.timestamp).toLocaleTimeString('ht-HT')}
                            </td>
                            <td className="p-3 font-bold text-white">{r.userName}</td>
                            <td className="p-3 font-mono font-bold text-amber-400">Nivo {r.level}</td>
                            <td className="p-3 text-slate-300 font-mono">Boul #{r.chosenBall + 1}</td>
                            <td className="p-3 text-slate-400 font-mono">Boul #{r.winningBall + 1}</td>
                            <td className="p-3">
                              {r.won ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                                  ✓ GENYEN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-[10px]">
                                  ✗ PÈDI
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {r.pointsEarned > 0 ? (
                                <span className="text-amber-400">+{r.pointsEarned} pts</span>
                              ) : (
                                <span className="text-slate-500">0 pts</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: JESYON AVION CRASH — VRÈ LAJAN (REAL MONEY) */}
          {activeSection === 'avion_crash_admin' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Plane className="w-5 h-5" />
                    </span>
                    <span>Jesyon Avion Crash — Vrè Lajan (HTG)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Siveyans finansye, kontwòl limit miz, mòd antretyen, ak rapò tout wonn vole an tan reyèl.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      crashAdminConfig.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {crashAdminConfig.isActive ? '● JWÈT LA AKTIF' : '○ DEZAKTIK'}
                  </span>
                  {crashAdminConfig.isMaintenance && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚠️ MÒD ANTRETYEN
                    </span>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {crashConfigMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{crashConfigMsg}</span>
                </div>
              )}

              {/* 1. Financial KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] uppercase font-bold">Miz Total Jwè Yo</span>
                    <Coins className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {(crashAdminStats?.totalWagered || 0).toLocaleString()} <span className="text-xs text-amber-400 font-bold">HTG</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Lajan reyèl antre nan wonn yo</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-emerald-500/30">
                  <div className="flex items-center justify-between text-emerald-400 mb-1">
                    <span className="text-[10px] uppercase font-bold">Total Lajan Retire</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                    {(crashAdminStats?.totalPayouts || 0).toLocaleString()} <span className="text-xs text-emerald-300 font-bold">HTG</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Peman remèt jwè ki fè retrè a tan</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-amber-500/30">
                  <div className="flex items-center justify-between text-amber-400 mb-1">
                    <span className="text-[10px] uppercase font-bold">Benefis Nèt Kazino</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
                    {(crashAdminStats?.netHouseProfit || 0).toLocaleString()} <span className="text-xs text-amber-400 font-bold">HTG</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Retansyon platfòm MASTER PLAY</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#131B2E] border border-blue-500/30">
                  <div className="flex items-center justify-between text-blue-400 mb-1">
                    <span className="text-[10px] uppercase font-bold">Taux Retounen (RTP)</span>
                    <Flame className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                    {crashAdminStats?.realizedRTP ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {crashAdminStats?.totalRounds || 0} wonn ({crashAdminStats?.winCount || 0} retrè, {crashAdminStats?.crashCount || 0} aksidan)
                  </div>
                </div>
              </div>

              {/* 2. Configuration Settings Form */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Konfigirasyon Pri & Kondisyon Avion Crash</span>
                </h3>

                <form onSubmit={handleSaveCrashConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Estati Jwèt la :</label>
                    <button
                      type="button"
                      onClick={() => setCrashActiveInput(!crashActiveInput)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        crashActiveInput
                          ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-600/30 hover:bg-red-600/40 text-red-300 border-red-500/40'
                      }`}
                    >
                      {crashActiveInput ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Jwèt la Aktif (Ouvè)</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-400" />
                          <span>Jwèt la Fèmen (Dezaktive)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Maintenance Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Mòd Antretyen :</label>
                    <button
                      type="button"
                      onClick={() => setCrashMaintenanceInput(!crashMaintenanceInput)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        crashMaintenanceInput
                          ? 'bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {crashMaintenanceInput ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Antretyen Aktif</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-slate-400" />
                          <span>Nòmal (San Antretyen)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Min Bet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Miz Minimòm (HTG) :</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={crashMinBetInput}
                        onChange={(e) => setCrashMinBetInput(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        placeholder="10"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-bold">HTG</span>
                    </div>
                  </div>

                  {/* Max Bet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Miz Maksimòm (HTG) :</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        value={crashMaxBetInput}
                        onChange={(e) => setCrashMaxBetInput(e.target.value)}
                        className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                        placeholder="5000"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-500 font-bold">HTG</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingCrashConfig}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      {savingCrashConfig ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Ap anrejistre...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Anrejistre Konfigirasyon Avion Crash</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Live Real-Money Rounds Audit Table */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Istwa Tout Wonn Vrè Lajan (Dènye 50 Wonn)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chak miz anrejistre dirèkteman sou balans kont itilizatè a sou kòd tranzaksyon NatCash.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {crashAdminStats?.recentRounds?.length || 0} wonn anrejistre
                  </span>
                </div>

                {(!crashAdminStats?.recentRounds || crashAdminStats.recentRounds.length === 0) ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <Plane className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p>Poko gen okenn wonn Avion Crash ki jwe pou kounye a.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Wonn ID</th>
                          <th className="p-3">Jwè</th>
                          <th className="p-3">Telefòn</th>
                          <th className="p-3">Miz (HTG)</th>
                          <th className="p-3">Aksidan</th>
                          <th className="p-3">Retrè</th>
                          <th className="p-3">Peman (HTG)</th>
                          <th className="p-3">Pwofi Nèt</th>
                          <th className="p-3">Estati</th>
                          <th className="p-3">Dat & Lè</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {crashAdminStats.recentRounds.map((rnd: any) => {
                          const isCashedOut = rnd.status === 'cashed_out';
                          const isCrashed = rnd.status === 'crashed';
                          return (
                            <tr key={rnd.id} className="hover:bg-slate-800/40">
                              <td className="p-3 font-mono text-[10px] text-slate-400">
                                {rnd.id.substring(0, 16)}...
                              </td>
                              <td className="p-3 font-bold text-white whitespace-nowrap">
                                {rnd.userName || 'Jwè'}
                              </td>
                              <td className="p-3 text-slate-300 font-mono text-[11px]">
                                {rnd.userPhone || '—'}
                              </td>
                              <td className="p-3 font-mono font-bold text-amber-400">
                                {(rnd.betAmount || 0).toLocaleString()} HTG
                              </td>
                              <td className="p-3 font-mono font-black text-red-400">
                                x{(rnd.crashMultiplier || 1.0).toFixed(2)}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {rnd.cashoutMultiplier ? (
                                  <span className="text-emerald-400">x{rnd.cashoutMultiplier.toFixed(2)}</span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-white">
                                {rnd.payoutAmount > 0 ? `${rnd.payoutAmount.toLocaleString()} HTG` : '0 HTG'}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {rnd.netProfit > 0 ? (
                                  <span className="text-emerald-400">+{rnd.netProfit.toLocaleString()} HTG</span>
                                ) : (
                                  <span className="text-red-400">{rnd.netProfit.toLocaleString()} HTG</span>
                                )}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {isCashedOut && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                                    ✓ RETIRE LAJAN
                                  </span>
                                )}
                                {isCrashed && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-[10px]">
                                    💥 AKSIDAN
                                  </span>
                                )}
                                {!isCashedOut && !isCrashed && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[10px]">
                                    ✈️ AP VOLE
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">
                                {rnd.startTime ? new Date(rnd.startTime).toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: JESYON PRI JWÈT YO (REQUIREMENT 1) */}
          {activeSection === 'jwet' && overview && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-amber-400" />
                    <span>Jesyon Pri Jwèt yo</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chanje pri chak jwèt endividyèlman, aktive/dezaktive yo, oswa ajoute nouvo jwèt san pèdi done jwè yo.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddGameModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajoute yon Nouvo Jwèt</span>
                </button>
              </div>

              {gameSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{gameSuccessMsg}</span>
                </div>
              )}

              {/* Games Price Table / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.games.map((g) => {
                  const currentInput = editingGamePrice[g.id] ?? g.entryFee.toString();
                  const isModified = Number(currentInput) !== g.entryFee;
                  const isSaving = savingGameId === g.id;

                  return (
                    <div
                      key={g.id}
                      className={`p-4 rounded-3xl bg-[#131B2E] border ${
                        g.isActive ? 'border-slate-800' : 'border-red-900/40 opacity-70'
                      } flex flex-col justify-between shadow-xl space-y-4`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-[#0B0F19] rounded-2xl border border-slate-700">
                            {g.icon || '🎮'}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{g.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                g.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {g.isActive ? 'Aktif' : 'Dezaktive'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {g.description}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price Control Section */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Pri Aktyèl:</span>
                          <span className="font-black text-amber-400 tabular-nums">
                            {g.entryFee} HT ({g.entryFee > 0 ? 'Peye' : 'Gratis'})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              value={currentInput}
                              onChange={(e) =>
                                setEditingGamePrice((prev) => ({ ...prev, [g.id]: e.target.value }))
                              }
                              className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white tabular-nums font-bold"
                              placeholder="Pri an HT"
                            />
                            <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">
                              HT
                            </span>
                          </div>

                          <button
                            onClick={() => handleSaveGamePrice(g)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isModified
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSaving ? '...' : isModified ? 'Sove' : 'Mete ajou'}
                          </button>
                        </div>
                      </div>

                      {/* Active/Deactivate toggle & Stats inspection */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <button
                          onClick={() => handleOpenGameStats(g)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-colors flex items-center gap-1"
                        >
                          <Trophy className="w-3 h-3 text-blue-400" />
                          <span>Estatistik & Nivo</span>
                        </button>
                        <button
                          onClick={() => handleToggleGameActive(g)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                            g.isActive
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                          }`}
                        >
                          {g.isActive ? 'Dezaktive' : 'Aktive'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Game Stats & Level Progress Modal */}
              {selectedGameForStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
                  <div className="w-full max-w-lg bg-[#0F172A] border border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedGameForStats.icon || '🎮'}</span>
                        <div>
                          <h3 className="text-base font-black text-white">{selectedGameForStats.title}</h3>
                          <span className="text-[11px] text-blue-300">Estatistik detaye & pwogrè jwè yo</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGameForStats(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {loadingGameStats ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Chaje estatistik yo...
                      </div>
                    ) : gameStatsModalData ? (
                      <div className="space-y-4 text-xs">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jwè Total</span>
                            <span className="text-lg font-black text-white">{gameStatsModalData.totalPlayers || 0}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sesyon Peye</span>
                            <span className="text-lg font-black text-emerald-400">{gameStatsModalData.totalSessions || 0}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Revni Total</span>
                            <span className="text-lg font-black text-amber-400">{gameStatsModalData.totalRevenue || 0} HT</span>
                          </div>
                        </div>

                        {/* Champions count */}
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-300">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="font-bold">Jwè ki Fini Tout 7 Nivo Yo:</span>
                          </div>
                          <span className="font-black text-amber-400 font-mono text-sm">{gameStatsModalData.completedCount || 0}</span>
                        </div>

                        {/* Level distribution */}
                        <div>
                          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
                            Distribisyon Jwè pa Nivo
                          </h4>
                          <div className="grid grid-cols-7 gap-1.5 text-center">
                            {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                              const count = gameStatsModalData.levelDistribution?.[lvl] || 0;
                              return (
                                <div key={lvl} className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                                  <div className="text-[10px] font-bold text-slate-400">N{lvl}</div>
                                  <div className="text-xs font-black text-white mt-0.5">{count}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Players table */}
                        <div>
                          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
                            Dènye Jwè yo & Rezilta yo
                          </h4>
                          {gameStatsModalData.players?.length === 0 ? (
                            <p className="text-slate-500 italic py-2">Poko gen jwè ki kòmanse jwe jwèt sa a.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {gameStatsModalData.players?.map((p: any) => (
                                <div
                                  key={p.userId}
                                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-white text-xs">{p.userName}</div>
                                    <div className="text-[10px] text-slate-400">
                                      Nivo {p.currentLevel} | Pwen: {p.totalPoints || 0}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      Max: {p.highScore || 0} pts
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedGameForStats(null)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Fèmen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Custom Game Modal */}
              {showAddGameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                  <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h3 className="text-base font-black text-white">Ajoute yon Nouvo Jwèt</h3>
                      <button onClick={() => setShowAddGameModal(false)} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleAddNewGame} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Non / Tit Jwèt la</label>
                        <input
                          type="text"
                          required
                          value={newGameTitle}
                          onChange={(e) => setNewGameTitle(e.target.value)}
                          placeholder="Egzanp: Speed Runner Kèkè"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Emoji / Icon</label>
                          <input
                            type="text"
                            value={newGameIcon}
                            onChange={(e) => setNewGameIcon(e.target.value)}
                            className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Pri Enskripsyon (HT)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={newGameFee}
                            onChange={(e) => setNewGameFee(e.target.value)}
                            className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsyon Jwèt la</label>
                        <textarea
                          rows={2}
                          value={newGameDesc}
                          onChange={(e) => setNewGameDesc(e.target.value)}
                          placeholder="Kout deskripsyon sou kijan pou jwe..."
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddGameModal(false)}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                        >
                          Anile
                        </button>
                        <button
                          type="submit"
                          disabled={addingGame}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
                        >
                          {addingGame ? 'Ajoute...' : 'Ajoute Jwèt'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: KONPETISYON & KALANDRIYE 7 JOU & MATCH (REQUIREMENTS 2, 4, 5) */}
          {activeSection === 'konpetisyon' && overview && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>Konpetisyon & Kalandriye 7 Jou (Lendi - Dimanch)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chwazi jwèt pou chak konpetisyon, kontwole jounen yo, kalifye Top 8 Jedi, epi jere match eliminatwa yo.
                  </p>
                </div>
              </div>

              {/* Competition Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                {overview.competitions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompManageId(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      (selectedCompManageId || overview.competitions[0].id) === c.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.badge}</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-75">({c.currentDay || 'Lendi'})</span>
                  </button>
                ))}
              </div>

              {/* ACTIVE SELECTED COMPETITION MANAGEMENT DASHBOARD */}
              {selectedComp && (
                <div className="space-y-6">
                  {/* Competition Header Info */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#131B2E] to-amber-950/30 border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
                            {selectedComp.badge}
                          </span>
                          <h3 className="text-lg font-black text-white">{selectedComp.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">ID: {selectedComp.id}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{selectedComp.tagline}</p>
                        <div className="text-xs text-slate-400 mt-2 flex flex-wrap gap-3">
                          <span>Pri Enskripsyon: <strong className="text-amber-400">{selectedComp.entryFee} HT</strong></span>
                          <span>Patisipan: <strong className="text-white">{selectedComp.registeredUserIds.length} / {selectedComp.maxParticipants}</strong></span>
                          <span>Estati Aktyèl: <strong className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{selectedComp.status}</strong></span>
                        </div>
                      </div>

                      {/* Day Selector Buttons: Lendi to Dimanch */}
                      <div className="bg-[#0B0F19] p-2.5 rounded-2xl border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chanje Jounen Konpetisyon an (Lendi - Dimanch):</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Lendi', 'Madi', 'Mèkredi', 'Jedi', 'Vandredi', 'Samdi', 'Dimanch'].map((day) => {
                            const isCurrent = (selectedComp.currentDay || 'Lendi') === day;
                            return (
                              <button
                                key={day}
                                onClick={() => handleAdvanceDay(selectedComp.id, day)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* STATUS MANAGEMENT BAR (Requirement 1) */}
                    <div className="p-3 rounded-2xl bg-[#080C16] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                          <Settings className="w-3.5 h-3.5 text-amber-400" />
                          <span>Chanje Estati Konpetisyon an (Kontwòl Admin):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'Ap vini', color: 'bg-blue-600/30 text-blue-300 border-blue-500/40' },
                            { id: 'Enskripsyon ouvè', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' },
                            { id: 'Enskripsyon fèmen', color: 'bg-amber-600/30 text-amber-300 border-amber-500/40' },
                            { id: 'An kou', color: 'bg-green-600 text-white font-bold' },
                            { id: 'An poz', color: 'bg-orange-600/30 text-orange-300 border-orange-500/40' },
                            { id: 'Fini', color: 'bg-slate-700 text-slate-200' },
                            { id: 'Anile', color: 'bg-red-600/30 text-red-300 border-red-500/40' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              onClick={() => handleUpdateCompStatus(selectedComp.id, st.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                selectedComp.status === st.id
                                  ? `${st.color} ring-2 ring-amber-400 font-black`
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {selectedComp.status === st.id ? `✓ ${st.id}` : st.id}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Haiti Timezone & Voting Settings */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-800 md:pl-3">
                        <div className="text-right text-[11px] text-slate-400">
                          <div>Lè Ayiti (America/Port-au-Prince):</div>
                          <div className="font-mono text-amber-300 font-bold">
                            {selectedComp.startDateTimeISO
                              ? new Date(selectedComp.startDateTimeISO).toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' })
                              : '8:00 AM'}{' '}
                            -{' '}
                            {selectedComp.endDateTimeISO
                              ? new Date(selectedComp.endDateTimeISO).toLocaleTimeString('ht-HT', { hour: '2-digit', minute: '2-digit' })
                              : '8:00 PM'}
                          </div>
                        </div>

                        {/* Télécharger Résultats Image Button */}
                        <button
                          onClick={() => handleDownloadCompetitionResults(selectedComp)}
                          disabled={downloadingResultsId === selectedComp.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                          title="Telechaje yon imaj (PNG) konplè sou telefòn ou ki gen tout rezilta ak klasman konpetisyon an"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                          <span>{downloadingResultsId === selectedComp.id ? 'Jenerasyon Imaj...' : 'Télécharger Résultats (Imaj)'}</span>
                        </button>

                        {/* Voting Toggle Button */}
                        <button
                          onClick={() => handleToggleCompVoting(selectedComp.id, !selectedComp.votingEnabled, selectedComp.votePrice || 15)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            selectedComp.votingEnabled
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                          title="Aktive oswa fèmen vòt fanatik pou konpetisyon sa a"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Vòt Fanatik: {selectedComp.votingEnabled ? `Aktif (${selectedComp.votePrice || 15} HT)` : 'Fèmen'}</span>
                        </button>

                        {/* Open Create Match Modal */}
                        <button
                          onClick={() => {
                            setNewMatchGameId(selectedComp.authorizedGameIds?.[0] || 'game_football');
                            setShowCreateMatchModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Kreye Match VS</span>
                        </button>

                        {/* Requirement 2: Bouton « Efase » devan chak compétition */}
                        <button
                          onClick={() => handleDeleteCompetition(selectedComp)}
                          disabled={deletingCompId === selectedComp.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs flex items-center gap-1 transition-all shadow-md disabled:opacity-50"
                          title="Efase konpetisyon sa a nèt nan bazdone a (avèk konfimasyon)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingCompId === selectedComp.id ? 'Efasman...' : 'Efase'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. PRI ENSKRIPSYON AK PRIM KONPETISYON (ADMIN MODIFICATION) */}
                  <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Pri Enskripsyon ak Prim Konpetisyon</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Modifye pri enskripsyon jwè yo peye ak montan kach prim pou 1ye, 2èm ak 3èm plas konpetisyon sa a.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveCompPricingAndPrizes}
                        disabled={savingCompPricing}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md self-start sm:self-auto disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingCompPricing ? 'Ap anrejistre...' : 'Anrejistre Pri & Prim'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      {/* Entry Fee */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800">
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Pri Enskripsyon (HTG)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={compFeeInput}
                            onChange={(e) => setCompFeeInput(e.target.value)}
                            placeholder="Egzanp: 250"
                            className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">HTG</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Montan jwè a ap peze pou enskri.</p>
                      </div>

                      {/* 1st Prize */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-amber-500/30">
                        <label className="block text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Prim 1ye Plas (HTG)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={compPrize1Input}
                            onChange={(e) => setCompPrize1Input(e.target.value)}
                            placeholder="Egzanp: 5000"
                            className="w-full bg-[#131B2E] border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-black focus:outline-none focus:border-amber-400"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-amber-500/70 font-bold">HTG</span>
                        </div>
                        <p className="text-[10px] text-amber-400/70 mt-1">Gwo chèk pou Chanpyon an.</p>
                      </div>

                      {/* 2nd Prize */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-400/30">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-400" />
                          <span>Prim 2èm Plas (HTG)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={compPrize2Input}
                            onChange={(e) => setCompPrize2Input(e.target.value)}
                            placeholder="Egzanp: 2500"
                            className="w-full bg-[#131B2E] border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono font-black focus:outline-none focus:border-slate-400"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">HTG</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Prim pou Vis-Chanpyon an.</p>
                      </div>

                      {/* 3rd Prize */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-amber-700/30">
                        <label className="block text-[11px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                          <Medal className="w-3 h-3 text-amber-600" />
                          <span>Prim 3èm Plas (HTG)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={compPrize3Input}
                            onChange={(e) => setCompPrize3Input(e.target.value)}
                            placeholder="Egzanp: 1000"
                            className="w-full bg-[#131B2E] border border-amber-800/50 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-black focus:outline-none focus:border-amber-600"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-amber-700 font-bold">HTG</span>
                        </div>
                        <p className="text-[10px] text-amber-600/80 mt-1">Prim pou 3èm loreya a.</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. CHWAZI JWÈT KONPETISYON AN (REQUIREMENT 2) */}
                  <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4" />
                          <span>Chwazi Jwèt Konpetisyon an ({selectedComp.authorizedGameIds?.length || 0} jwèt chwazi)</span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Jwè yo kapab jwe sèlman jwèt ou koche anba yo pandan konpetisyon an.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
                      {overview.games.map((g) => {
                        const isChosen = selectedComp.authorizedGameIds?.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            onClick={() => handleToggleGameForComp(selectedComp.id, g.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              isChosen
                                ? 'bg-amber-500/20 border-amber-500/50 text-white'
                                : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xl">{g.icon || '🎮'}</span>
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold truncate">{g.title}</div>
                              <div className="text-[10px] text-amber-400 font-mono">
                                {isChosen ? '✓ Otorize' : '+ Chwazi'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. PHASE 1: PARTICIPANTS LEADERBOARD (LENDI - JEDI) */}
                  <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <span>Klasman Premye Faz (Lendi - Jedi)</span>
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                            {selectedComp.scores?.length || 0} Patisipan
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Sistèm nan akimile pwen chak jou. Jedi apremidi, 8 premye jwè yo ap kalifye pou faz eliminatwa Vandredi.
                        </p>
                      </div>

                      {/* ACTION BUTTONS: QUALIFY TOP 8, DOWNLOAD RESULTS & RESET LEADERBOARD */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {/* Requirement 3: Bouton « Netwaye klasman » */}
                        <button
                          onClick={() => handleResetLeaderboard(selectedComp)}
                          disabled={resettingLeaderboard || (selectedComp.scores?.length || 0) === 0}
                          className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-black text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
                          title="Netwaye done klasman konpetisyon sa a sèlman lè konpetisyon an fini (avèk konfimasyon)"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{resettingLeaderboard ? 'Netwayaj...' : 'Netwaye klasman'}</span>
                        </button>

                        <button
                          onClick={() => handleDownloadCompetitionResults(selectedComp)}
                          disabled={downloadingResultsId === selectedComp.id}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                          title="Telechaje yon imaj (PNG) konplè sou telefòn ou ki gen tout rezilta ak klasman konpetisyon an"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-300" />
                          <span>{downloadingResultsId === selectedComp.id ? 'Jenerasyon Imaj...' : 'Télécharger Résultats (Imaj)'}</span>
                        </button>

                        <button
                          onClick={() => handleQualifyTop8(selectedComp.id)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Konfime & Kalifye Top 8 pou Vandredi</span>
                        </button>
                      </div>
                    </div>

                    {/* Requirement 4: Distribisyon & Peman Prim pou 1ye, 2yèm ak 3èm plas */}
                    <div className="p-4 rounded-2xl bg-[#0B0F19] border border-amber-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>Peman Ofisyèl Prim Konpetisyon (Voye Lajan sou Kont Jwè Gagnant yo)</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Peman yo antre dirèkteman sou balans kont jwè a ak tranzaksyon verifye.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1st Place Payment */}
                        {(() => {
                          const isPaid = Boolean(selectedComp.prizesPaid?.first);
                          const firstWinner = selectedComp.champion || (selectedComp.scores && selectedComp.scores[0]);
                          return (
                            <div className="p-3 rounded-xl bg-[#131B2E] border border-amber-500/40 flex flex-col justify-between gap-2">
                              <div>
                                <div className="text-[11px] font-black text-amber-400 flex items-center justify-between">
                                  <span>🥇 1ye Plas: {selectedComp.prizes?.first || '50,000 HT'}</span>
                                  {isPaid && (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                                      ✓ PEYE
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-white mt-1 truncate">
                                  Gayan: {firstWinner?.fullName || 'Poko defini'}
                                </div>
                              </div>
                              <button
                                onClick={() => handlePayCompetitionPrize(selectedComp, 'first')}
                                disabled={isPaid || payingPrizePlace === 'first' || !firstWinner}
                                className={`w-full py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow ${
                                  isPaid
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                                } disabled:opacity-50`}
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>
                                  {payingPrizePlace === 'first' ? 'Ap peye...' : isPaid ? 'Pri 1ye deja peye' : 'Peye 1ye'}
                                </span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* 2nd Place Payment */}
                        {(() => {
                          const isPaid = Boolean(selectedComp.prizesPaid?.second);
                          const secondWinner = selectedComp.runnerUp || (selectedComp.scores && selectedComp.scores[1]);
                          return (
                            <div className="p-3 rounded-xl bg-[#131B2E] border border-slate-700 flex flex-col justify-between gap-2">
                              <div>
                                <div className="text-[11px] font-black text-slate-300 flex items-center justify-between">
                                  <span>🥈 2yèm Plas: {selectedComp.prizes?.second || '25,000 HT'}</span>
                                  {isPaid && (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                                      ✓ PEYE
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-white mt-1 truncate">
                                  Gayan: {secondWinner?.fullName || 'Poko defini'}
                                </div>
                              </div>
                              <button
                                onClick={() => handlePayCompetitionPrize(selectedComp, 'second')}
                                disabled={isPaid || payingPrizePlace === 'second' || !secondWinner}
                                className={`w-full py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow ${
                                  isPaid
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                                    : 'bg-slate-200 hover:bg-white text-slate-950 active:scale-95'
                                } disabled:opacity-50`}
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>
                                  {payingPrizePlace === 'second' ? 'Ap peye...' : isPaid ? 'Pri 2èm deja peye' : 'Peye 2yèm'}
                                </span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* 3rd Place Payment */}
                        {(() => {
                          const isPaid = Boolean(selectedComp.prizesPaid?.third);
                          const thirdWinner = selectedComp.winners?.third ? { fullName: selectedComp.winners.third.name } : (selectedComp.scores && selectedComp.scores[2]);
                          return (
                            <div className="p-3 rounded-xl bg-[#131B2E] border border-amber-800/40 flex flex-col justify-between gap-2">
                              <div>
                                <div className="text-[11px] font-black text-amber-500 flex items-center justify-between">
                                  <span>🥉 3yèm Plas: {selectedComp.prizes?.third || '10,000 HT'}</span>
                                  {isPaid && (
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                                      ✓ PEYE
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-bold text-white mt-1 truncate">
                                  Gayan: {thirdWinner?.fullName || 'Poko defini'}
                                </div>
                              </div>
                              <button
                                onClick={() => handlePayCompetitionPrize(selectedComp, 'third')}
                                disabled={isPaid || payingPrizePlace === 'third' || !thirdWinner}
                                className={`w-full py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow ${
                                  isPaid
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                                    : 'bg-amber-700 hover:bg-amber-600 text-white active:scale-95'
                                } disabled:opacity-50`}
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>
                                  {payingPrizePlace === 'third' ? 'Ap peye...' : isPaid ? 'Pri 3èm deja peye' : 'Peye 3yèm'}
                                </span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Participants Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2 px-3">Rang</th>
                            <th className="py-2 px-3">Jwè</th>
                            <th className="py-2 px-3">Telefòn</th>
                            <th className="py-2 px-3 text-right">Lendi</th>
                            <th className="py-2 px-3 text-right">Madi</th>
                            <th className="py-2 px-3 text-right">Mèkredi</th>
                            <th className="py-2 px-3 text-right">Jedi</th>
                            <th className="py-2 px-3 text-right font-bold text-amber-400">Total Pwen</th>
                            <th className="py-2 px-3 text-center">Kalifikasyon</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {selectedComp.scores?.map((s, idx) => {
                            const isTop8 = idx < 8;
                            return (
                              <tr
                                key={s.userId}
                                className={`hover:bg-slate-900/60 transition-colors ${
                                  isTop8 ? 'bg-amber-500/5' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 font-bold">
                                  {idx === 0 ? '🥇 1ye' : idx === 1 ? '🥈 2yèm' : idx === 2 ? '🥉 3yèm' : `${idx + 1}yèm`}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={s.profilePhoto}
                                      alt={s.fullName}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-700"
                                    />
                                    <span className="font-bold text-white">{s.fullName}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">{s.phoneNumber || 'N/A'}</td>
                                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{s.dailyScores?.lendi || 0}</td>
                                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{s.dailyScores?.madi || 0}</td>
                                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{s.dailyScores?.mekredi || 0}</td>
                                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{s.dailyScores?.jedi || 0}</td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-400 text-sm tabular-nums">
                                  {s.totalScore.toLocaleString()} pts
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isTop8 ? (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      TOP 8 KALIFYE
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                      Elimine
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. PHASE 2: MATCH ELIMINATWA YO (VANDREDI, SAMDI, DIMANCH) */}
                  <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span>Match Eliminatwa: Vandredi (Top 8) • Samdi (Demi-Final) • Dimanch (Gran Final)</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Chak match gen 2 jwè, yon jwèt, yon estati ak yon rezilta. Ou kapab tape nòt yo pou pase gayan an otomatikman.
                      </p>
                    </div>

                    {(!selectedComp.matches || selectedComp.matches.length === 0) ? (
                      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                        <div className="text-xs font-bold text-white">Match yo poko pwograme pou konpetisyon sa a.</div>
                        <div className="text-[11px] text-slate-400">
                          Klike sou bouton "Konfime & Kalifye Top 8 pou Vandredi" anlè a pou kreye 4 match Vandredi yo otomatikman.
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedComp.matches.map((m) => {
                          const isTop8 = m.round === 'top8';
                          const isDemi = m.round === 'demi';
                          const isFinal = m.round === 'final';

                          const roundLabel = isTop8
                            ? `Match ${m.matchNumber} Vandredi (Top 8)`
                            : isDemi
                            ? `Demi-Final ${m.matchNumber} Samdi`
                            : '👑 GRAN FINAL DIMANCH';

                          const p1Won = m.winnerId === m.player1.userId;
                          const p2Won = m.winnerId === m.player2.userId;

                          return (
                            <div
                              key={m.id}
                              className={`p-4 rounded-2xl border ${
                                isFinal
                                  ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-[#0B0F19]'
                                  : 'border-slate-800 bg-[#0B0F19]'
                              } flex flex-col justify-between space-y-3`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-black ${isFinal ? 'text-amber-400' : 'text-slate-300'}`}>
                                  {roundLabel}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.status === 'Fini'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : m.status === 'An atant verifikasyon'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}>
                                  {m.status}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Jwèt: <strong className="text-white">{m.gameTitle}</strong></span>
                              </div>

                              {/* Two Players confrontation */}
                              <div className="space-y-2 py-1">
                                {/* Player 1 */}
                                <div className={`flex items-center justify-between p-2 rounded-xl ${
                                  p1Won ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-[#131B2E]'
                                }`}>
                                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                                    <img src={m.player1.profilePhoto} alt={m.player1.fullName} className="w-6 h-6 rounded-full object-cover" />
                                    <span>{m.player1.fullName}</span>
                                    {p1Won && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                                  </div>
                                  <div className="text-sm font-black tabular-nums text-white">
                                    {m.player1.score ?? '-'}
                                  </div>
                                </div>

                                {/* Player 2 */}
                                <div className={`flex items-center justify-between p-2 rounded-xl ${
                                  p2Won ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-[#131B2E]'
                                }`}>
                                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                                    <img src={m.player2.profilePhoto} alt={m.player2.fullName} className="w-6 h-6 rounded-full object-cover" />
                                    <span>{m.player2.fullName}</span>
                                    {p2Won && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                                  </div>
                                  <div className="text-sm font-black tabular-nums text-white">
                                    {m.player2.score ?? '-'}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Mete Rezilta & Efase Match */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenMatchModal(m)}
                                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Mete Rezilta / Korije</span>
                                </button>

                                {/* Requirement 2: Bouton « Efase » devan chak match VS */}
                                <button
                                  onClick={() => handleDeleteCompetitionMatch(selectedComp, m)}
                                  disabled={deletingMatchId === m.id}
                                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                                  title="Efase match sa a (avèk konfimasyon)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{deletingMatchId === m.id ? '...' : 'Efase'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 5. OFFICIAL CHAMPION CARD IF FINISHED */}
                  {selectedComp.champion && (
                    <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg">
                          👑
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase text-amber-400 tracking-wider">
                            {selectedComp.champion.title}
                          </div>
                          <div className="text-2xl font-black text-white">
                            {selectedComp.champion.fullName}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">
                            Prim: <strong className="text-emerald-400 font-bold">{selectedComp.champion.prize}</strong> • Nòt Final: {selectedComp.champion.finalScore}
                          </div>
                        </div>
                      </div>

                      {selectedComp.runnerUp && (
                        <div className="text-right text-xs bg-black/40 p-3 rounded-2xl border border-white/10">
                          <div className="text-slate-400 font-bold">2yèm Plas (Vice-Chanpyon):</div>
                          <div className="text-sm font-black text-white">{selectedComp.runnerUp.fullName}</div>
                          <div className="text-amber-300 font-bold">{selectedComp.runnerUp.prize}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. TABLO ANREJISTREMAN PWEN CHAK JWÈ (REKÈT ADMIN #7) */}
                  <div className="p-5 rounded-3xl bg-[#131B2E] border border-emerald-500/30 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <span>Istorik Ofisyèl Pwen Anrejistre pou Jwèt Konpetisyon yo</span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                            {scoreRecordsList.length} Anrejistreman
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Admin nan kapab verifye tout nòt jwè yo anrejistre, non yo, nimewo telefòn yo, jwèt yo jwe, nivo ak dat/lè egzak anrejistreman an.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.getCompetitionScoreRecords();
                            if (res.success && res.records) {
                              setScoreRecordsList(res.records);
                              notify('Lis anrejistreman pwen yo rafrechi !', 'success');
                            }
                          } catch (e: any) {
                            notify(e.message || 'Erè rafrechisman.', 'error');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Rafrechi Lis Pwen</span>
                      </button>
                    </div>

                    {/* Filter bar for score records */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Filtre Konpetisyon:</label>
                        <select
                          value={scoreFilterComp}
                          onChange={(e) => setScoreFilterComp(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="all">Tout Konpetisyon yo</option>
                          {overview?.competitions.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Filtre Jwèt:</label>
                        <select
                          value={scoreFilterGame}
                          onChange={(e) => setScoreFilterGame(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="all">Tout Jwèt yo</option>
                          {overview?.games.map((g) => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Chèche Jwè:</label>
                        <input
                          type="text"
                          value={scoreSearchUser}
                          onChange={(e) => setScoreSearchUser(e.target.value)}
                          placeholder="Non jwè oswa nimewo telefòn..."
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Table of recorded score events */}
                    {(() => {
                      const filtered = scoreRecordsList.filter((r) => {
                        if (scoreFilterComp !== 'all' && r.competitionId !== scoreFilterComp) return false;
                        if (scoreFilterGame !== 'all' && r.gameId !== scoreFilterGame) return false;
                        if (scoreSearchUser.trim()) {
                          const q = scoreSearchUser.toLowerCase();
                          const matchName = (r.userName || '').toLowerCase().includes(q);
                          const matchPhone = (r.userPhone || '').includes(q);
                          if (!matchName && !matchPhone) return false;
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800 text-center text-xs text-slate-400">
                            Pa gen okenn anrejistreman pwen ki koresponn ak filtè sa yo kounye a.
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-2xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#0B0F19] border-b border-slate-800 text-slate-400">
                              <tr>
                                <th className="py-2 px-3">Dat & Lè</th>
                                <th className="py-2 px-3">Konpetisyon</th>
                                <th className="py-2 px-3">Jwè</th>
                                <th className="py-2 px-3">Telefòn</th>
                                <th className="py-2 px-3">Jwèt</th>
                                <th className="py-2 px-3 text-center">Nivo</th>
                                <th className="py-2 px-3 text-right font-black text-amber-400">Pwen Anrejistre</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 bg-[#0F172A]">
                              {filtered.map((rec) => {
                                const dt = new Date(rec.createdAt);
                                const dateFormatted = isNaN(dt.getTime())
                                  ? rec.createdAt
                                  : dt.toLocaleDateString('fr-HT', { month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('fr-HT', { hour: '2-digit', minute: '2-digit' });

                                return (
                                  <tr key={rec.id} className="hover:bg-slate-800/50 transition">
                                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{dateFormatted}</td>
                                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                                      {rec.competitionName || rec.competitionId}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-emerald-300 whitespace-nowrap">
                                      {rec.userName || 'Jwè'}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{rec.userPhone || '-'}</td>
                                    <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                                      🎮 {rec.gameTitle || rec.gameId}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                                        N{rec.level}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-black text-amber-400 tabular-nums">
                                      +{rec.score} pts
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* CREATE NEW COMPETITION ACCORDION / FORM */}
                  <form onSubmit={handleCreateComp} className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Kreye yon Lòt Nouvo Konpetisyon 7 Jou</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Non Konpetisyon an</label>
                        <input
                          type="text"
                          required
                          value={newCompName}
                          onChange={(e) => setNewCompName(e.target.value)}
                          placeholder="Egzanp: TOUNWA PRESTIJ 509"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Badge / Tit Kout</label>
                        <input
                          type="text"
                          value={newCompBadge}
                          onChange={(e) => setNewCompBadge(e.target.value)}
                          placeholder="🏆 NOUVO"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Pri Enskripsyon (HT)</label>
                        <input
                          type="number"
                          required
                          value={newCompFee}
                          onChange={(e) => setNewCompFee(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Kantite Patisipan Max</label>
                        <input
                          type="number"
                          required
                          value={newCompSlots}
                          onChange={(e) => setNewCompSlots(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* HAITI TIMEZONE: START AND END DATETIME (Requirement 1) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Dat & Lè Kòmansman (Lè Ayiti):
                        </label>
                        <input
                          type="datetime-local"
                          value={newCompStartDateTime}
                          onChange={(e) => setNewCompStartDateTime(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Dat & Lè Fen (Fèmen Otomatik):
                        </label>
                        <input
                          type="datetime-local"
                          value={newCompEndDateTime}
                          onChange={(e) => setNewCompEndDateTime(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* STATUS & QUALIFICATION */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Estati Inisyal:</label>
                        <select
                          value={newCompStatus}
                          onChange={(e) => setNewCompStatus(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="Enskripsyon ouvè">Enskripsyon ouvè</option>
                          <option value="Ap vini">Ap vini</option>
                          <option value="An kou">An kou</option>
                          <option value="Enskripsyon fèmen">Enskripsyon fèmen</option>
                          <option value="An poz">An poz</option>
                          <option value="Fini">Fini</option>
                          <option value="Anile">Anile</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Règ Kalifikasyon Faz Eliminatwa:</label>
                        <select
                          value={newCompQualificationCount}
                          onChange={(e) => setNewCompQualificationCount(Number(e.target.value))}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value={4}>Top 4 Jwè (Demi-Final)</option>
                          <option value={8}>Top 8 Jwè (Kar de Final)</option>
                          <option value={16}>Top 16 Jwè (Wityèm de Final)</option>
                        </select>
                      </div>

                      {/* VOTING SETTINGS */}
                      <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Otorize Vòt Fanatik</div>
                          <div className="text-[10px] text-slate-400">Fanatik yo ap ka vote pou 15 HT</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={newCompVotingEnabled}
                          onChange={(e) => setNewCompVotingEnabled(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Pri Vòt la (HT)</label>
                        <input
                          type="number"
                          value={newCompVotePrice}
                          onChange={(e) => setNewCompVotePrice(e.target.value)}
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* DAYS OF COMPETITION */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">Jou Konpetisyon an ap fèt:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Lendi', 'Madi', 'Mèkredi', 'Jedi', 'Vandredi', 'Samdi', 'Dimanch'].map((day) => {
                            const isSelected = newCompDays.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                onClick={() => {
                                  setNewCompDays((prev) =>
                                    prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-black border-amber-400'
                                    : 'bg-[#0B0F19] border-slate-700 text-slate-400'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">Tagline</label>
                        <input
                          type="text"
                          value={newCompTagline}
                          onChange={(e) => setNewCompTagline(e.target.value)}
                          placeholder="Fraz atiran pou konpetisyon an..."
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* Select games for this new competition */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Chwazi jwèt konpetisyon an (Koche jwèt ki otorize yo):
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {overview.games.map((g) => {
                            const isSelected = newCompSelectedGames.includes(g.id);
                            return (
                              <button
                                type="button"
                                key={g.id}
                                onClick={() => {
                                  setNewCompSelectedGames((prev) =>
                                    prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                                  );
                                }}
                                className={`p-2 rounded-xl text-left text-xs font-bold border transition-colors flex items-center gap-2 ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                                    : 'bg-[#0B0F19] border-slate-700 text-slate-400'
                                }`}
                              >
                                <span>{g.icon || '🎮'}</span>
                                <span className="truncate">{g.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingComp}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
                    >
                      {creatingComp ? 'Kreyasyon...' : 'Kreye Konpetisyon an'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* SECTION: MATCH VS & VÒT FANATIK (Requirements 6, 7) */}
          {activeSection === 'match_vot' && overview && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ThumbsUp className="w-5 h-5 text-amber-400" />
                    <span>Jesyon Match VS & Vòt Fanatik</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Kreye match fas-a-fas, pèmèt vòt fanatik (15 HT), gade pousantaj an tan reyèl, epi anrejistre nòt final yo.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setNewMatchGameId(selectedComp?.authorizedGameIds?.[0] || 'game_football');
                    setShowCreateMatchModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kreye yon Nouvo Match VS</span>
                </button>
              </div>

              {/* Competition Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                {overview.competitions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCompManageId(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                      (selectedCompManageId || overview.competitions[0].id) === c.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.badge}</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-75">({c.matches?.length || 0} Match)</span>
                  </button>
                ))}
              </div>

              {/* Match List for Selected Competition */}
              {selectedComp && (
                <div className="space-y-4">
                  {(!selectedComp.matches || selectedComp.matches.length === 0) ? (
                    <div className="p-8 text-center bg-[#131B2E] border border-slate-800 rounded-3xl text-slate-400 text-xs">
                      Pa gen match ki pwograme nan konpetisyon sa a ankò. Klike sou bouton &ldquo;Kreye yon Nouvo Match VS&rdquo; anwo a pou ajoute premye match la.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedComp.matches.map((m) => {
                        const totalVotes = (m.votes1 || 0) + (m.votes2 || 0);
                        const pct1 = totalVotes > 0 ? Math.round(((m.votes1 || 0) / totalVotes) * 100) : 50;
                        const pct2 = totalVotes > 0 ? 100 - pct1 : 50;
                        const p1Won = m.winnerId === m.player1.userId;
                        const p2Won = m.winnerId === m.player2.userId;

                        return (
                          <div
                            key={m.id}
                            className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 shadow-xl space-y-4"
                          >
                            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                              <span className="font-bold text-amber-400">{m.round}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.status === 'Fini' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {m.status || 'Pwograme'}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">{m.scheduledTime || m.matchDateTimeISO || '4:00 PM'}</span>
                              </div>
                            </div>

                            {/* Player 1 vs Player 2 */}
                            <div className="grid grid-cols-2 gap-3 items-center">
                              {/* Player 1 */}
                              <div className={`p-3 rounded-2xl ${p1Won ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-[#0B0F19] border border-slate-800'}`}>
                                <div className="flex items-center gap-2">
                                  <img src={m.player1.profilePhoto} alt={m.player1.fullName} className="w-8 h-8 rounded-full object-cover" />
                                  <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-white truncate">{m.player1.fullName}</div>
                                    <div className="text-[10px] text-amber-400">Nivo {m.player1.level || 1}</div>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                  <span className="text-slate-400 text-[10px]">Nòt:</span>
                                  <span className="font-black text-white tabular-nums text-sm">{m.player1.score ?? '-'}</span>
                                </div>
                                <div className="text-[10px] text-purple-300 font-bold mt-1">
                                  Vòt: {m.votes1 || 0} ({pct1}%)
                                </div>
                              </div>

                              {/* Player 2 */}
                              <div className={`p-3 rounded-2xl ${p2Won ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-[#0B0F19] border border-slate-800'}`}>
                                <div className="flex items-center gap-2">
                                  <img src={m.player2.profilePhoto} alt={m.player2.fullName} className="w-8 h-8 rounded-full object-cover" />
                                  <div className="overflow-hidden">
                                    <div className="text-xs font-bold text-white truncate">{m.player2.fullName}</div>
                                    <div className="text-[10px] text-amber-400">Nivo {m.player2.level || 1}</div>
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                  <span className="text-slate-400 text-[10px]">Nòt:</span>
                                  <span className="font-black text-white tabular-nums text-sm">{m.player2.score ?? '-'}</span>
                                </div>
                                <div className="text-[10px] text-purple-300 font-bold mt-1">
                                  Vòt: {m.votes2 || 0} ({pct2}%)
                                </div>
                              </div>
                            </div>

                            {/* Live Vote Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>{m.player1.fullName.split(' ')[0]}: {pct1}%</span>
                                <span>Total vòt: {totalVotes}</span>
                                <span>{m.player2.fullName.split(' ')[0]}: {pct2}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${pct1}%` }} />
                                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${pct2}%` }} />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleOpenMatchModal(m)}
                                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Mete Rezilta</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION: BOUTIK KADO (REQUIREMENT 8) */}
          {activeSection === 'boutik_kado' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400" />
                    <span>Jesyon Boutik Kado Virtiyèl</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Jere pri kado yo (Chat 🐱 20 HT, Reken 🦈 100 HT, Pistolè 🔫 300 HT, Lyon 🦁 400 HT), aktive/dezaktive yo oswa ajoute nouvo kado.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddGiftModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ajoute yon Nouvo Kado</span>
                </button>
              </div>

              {/* Gift Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {giftsList.map((g) => {
                  const currentInput = editingGiftPrices[g.id] ?? g.price.toString();
                  const isModified = Number(currentInput) !== g.price;
                  const isSaving = savingGiftId === g.id;

                  return (
                    <div
                      key={g.id}
                      className={`p-5 rounded-3xl bg-[#131B2E] border ${
                        g.isActive ? 'border-slate-800' : 'border-red-900/40 opacity-70'
                      } shadow-xl flex flex-col justify-between space-y-4`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl p-3 rounded-2xl bg-[#0B0F19] border border-slate-700 shadow-inner">
                          {g.icon}
                        </span>
                        <div>
                          <div className="font-black text-white text-base">{g.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{g.description}</div>
                          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            g.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {g.isActive ? 'Aktif nan Boutik' : 'Dezaktive'}
                          </span>
                        </div>
                      </div>

                      {/* Price Control */}
                      <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">Pri Aktyèl:</span>
                          <span className="font-black text-amber-400 tabular-nums">{g.price} HT</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="1"
                              value={currentInput}
                              onChange={(e) =>
                                setEditingGiftPrices((prev) => ({ ...prev, [g.id]: e.target.value }))
                              }
                              className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white tabular-nums font-bold"
                              placeholder="Pri an HT"
                            />
                            <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">HT</span>
                          </div>

                          <button
                            onClick={() => handleSaveGiftPrice(g)}
                            disabled={isSaving}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isModified
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSaving ? '...' : isModified ? 'Sove' : 'Mete ajou'}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleGiftActive(g)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          g.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {g.isActive ? 'Dezaktive Kado sa a' : 'Aktive Kado sa a'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Gift Transactions Log */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>Dènye Kado Fanatik Voye Bay Jwè yo</span>
                </h3>
                {giftTransactions.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">Pa gen kado ki voye ankò.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2">Moun ki voye</th>
                          <th className="py-2">Jwè ki resevwa</th>
                          <th className="py-2">Kado</th>
                          <th className="py-2">Valè HTG</th>
                          <th className="py-2">Referans</th>
                          <th className="py-2">Lè / Dat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {giftTransactions.map((tx: any) => (
                          <tr key={tx.id}>
                            <td className="py-2.5 font-bold text-white">{tx.senderName}</td>
                            <td className="py-2.5 text-amber-300 font-bold">{tx.receiverName}</td>
                            <td className="py-2.5">
                              <span className="text-base mr-1">{tx.giftIcon}</span>
                              <span>{tx.giftName}</span>
                            </td>
                            <td className="py-2.5 font-black text-emerald-400 tabular-nums">+{tx.price} HT</td>
                            <td className="py-2.5 font-mono text-[11px] text-slate-400">{tx.reference}</td>
                            <td className="py-2.5 text-slate-400 text-[11px]">
                              {new Date(tx.createdAt).toLocaleDateString('ht-HT', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: FINANS KONPETISYON (REQUIREMENT 11) */}
          {activeSection === 'finans_konpetisyon' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Finans & Kontablite Konpetisyon (Règ Reyèl)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Rezime tout lajan reyèl ki antre nan enskripsyon konpetisyon, vòt fanatik ak kado virtiyèl.
                </p>
              </div>

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-3xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Revni Enskripsyon</div>
                  <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">
                    {(financeData?.summary?.totalRegistrationRevenue || 0).toLocaleString()} HT
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Frè antre jwè yo</div>
                </div>

                <div className="p-4 rounded-3xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Revni Vòt Fanatik</div>
                  <div className="text-2xl font-black text-purple-400 mt-1 tabular-nums">
                    {(financeData?.summary?.totalVotingRevenue || 0).toLocaleString()} HT
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total vòt 15 HT</div>
                </div>

                <div className="p-4 rounded-3xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Revni Kado Boutik</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                    {(financeData?.summary?.totalGiftRevenue || 0).toLocaleString()} HT
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Chat, Reken, Pistolè, Lyon</div>
                </div>

                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 via-[#131B2E] to-amber-600/20 border-2 border-amber-500/40">
                  <div className="text-[10px] uppercase font-black text-amber-400">Total Revni Jeneral</div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">
                    {(financeData?.summary?.totalGrossRevenue || 0).toLocaleString()} HT
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold mt-0.5">Konpetisyon & Fanatik</div>
                </div>
              </div>

              {/* Competitions Financial Breakdown Table */}
              <div className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white">Detay Revni Pa Konpetisyon</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5">Non Konpetisyon</th>
                        <th className="py-2.5">Estati</th>
                        <th className="py-2.5">Enskripsyon</th>
                        <th className="py-2.5">Revni Enskripsyon</th>
                        <th className="py-2.5">Vòt</th>
                        <th className="py-2.5">Revni Vòt</th>
                        <th className="py-2.5">Total Konpetisyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {(financeData?.competitions || overview?.competitions || []).map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-3 font-bold text-white flex items-center gap-1.5">
                            <span>{c.badge}</span>
                            <span>{c.name}</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 tabular-nums">{c.registeredCount || c.registeredUserIds?.length || 0} jwè</td>
                          <td className="py-3 font-black text-amber-400 tabular-nums">{c.registrationRevenue?.toLocaleString() || 0} HT</td>
                          <td className="py-3 tabular-nums">{c.votesCount || 0} vòt</td>
                          <td className="py-3 font-black text-purple-400 tabular-nums">{c.votingRevenue?.toLocaleString() || 0} HT</td>
                          <td className="py-3 font-black text-emerald-400 tabular-nums">
                            {((c.registrationRevenue || 0) + (c.votingRevenue || 0)).toLocaleString()} HT
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: SISTÈM PIBLIKASYON ADMINISTRATÈ A (REQUIREMENT 3) */}
          {activeSection === 'piblikasyon' && overview && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-amber-400" />
                  <span>Sistèm Piblikasyon Administratè a</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Kreye piblikasyon Tèks, Foto (depi galri telefòn ou) oswa Videyo avèk aperçu anvan pibliye.
                </p>
              </div>

              {/* Create/Edit Post Card */}
              <form onSubmit={handleCreatePost} className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-amber-400">
                    {editingPost ? 'Modifye Piblikasyon an' : 'Kreye yon Nouvo Piblikasyon'}
                  </h3>
                  {editingPost && (
                    <button
                      type="button"
                      onClick={resetPostForm}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Anile modifikasyon
                    </button>
                  )}
                </div>

                {/* Post Mode Selector: A (Text), B (Photo), C (Video) */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPostMode('text')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      postMode === 'text' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0B0F19] text-slate-400'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>A. Tèks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostMode('image')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      postMode === 'image' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0B0F19] text-slate-400'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>B. Foto (Galri)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostMode('video')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      postMode === 'video' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[#0B0F19] text-slate-400'
                    }`}
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>C. Videyo (Galri)</span>
                  </button>
                </div>

                {/* Common Fields */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tit Piblikasyon an</label>
                  <input
                    type="text"
                    required
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Egzanp: Gran Match Demi-Final Samdi a ap kòmanse !"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsyon / Mesaj</label>
                  <textarea
                    rows={3}
                    required
                    value={newPostDesc}
                    onChange={(e) => setNewPostDesc(e.target.value)}
                    placeholder="Mete tout detay, règ oswa anons sou konpetisyon an..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* MODE B: PHOTO PICKER & PREVIEW */}
                {postMode === 'image' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0B0F19] border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Chwazi foto nan galri telefòn ou:
                      </label>
                      <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Ouvri Galri</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImagePicker}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Previews of selected images */}
                    {newPostImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-400 font-bold">
                            ✓ Foto chwazi an gwo kalite ({newPostImages.length}) — San fann, san flou, san koupe logo/ekri:
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {newPostImages.map((imgUrl, i) => (
                            <div
                              key={i}
                              className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/80 p-2 flex flex-col items-center shadow-lg"
                            >
                              <div className="w-full h-56 flex items-center justify-center overflow-hidden rounded-xl bg-black/70">
                                <img
                                  src={imgUrl}
                                  alt={`Aperçu ${i + 1}`}
                                  className="w-full h-full object-contain transition-transform group-hover:scale-[1.01]"
                                />
                              </div>
                              <div className="w-full flex items-center justify-between pt-2 px-1 text-[11px]">
                                <span className="text-slate-400 font-bold">Foto #{i + 1} (Fòma natirèl)</span>
                                <button
                                  type="button"
                                  onClick={() => setNewPostImages((prev) => prev.filter((_, idx) => idx !== i))}
                                  className="px-2 py-0.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold transition-colors flex items-center gap-1"
                                  title="Retire foto sa a"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Retire</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE C: VIDEO PICKER & PREVIEW */}
                {postMode === 'video' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0B0F19] border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        Chwazi videyo nan galri telefòn ou:
                      </label>
                      <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                        <VideoIcon className="w-3.5 h-3.5" />
                        <span>Ouvri Galri Videyo</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoPicker}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Video URL fallback option */}
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Oswa kole yon lyen videyo (mp4, webm, etc.):</label>
                      <input
                        type="url"
                        value={newPostVideo}
                        onChange={(e) => setNewPostVideo(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    {/* Video Preview */}
                    {newPostVideo && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-400 font-bold">Aperçu Videyo:</div>
                        <video
                          src={newPostVideo}
                          controls
                          className="w-full max-h-48 rounded-xl bg-black border border-slate-700"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Vidéo Master Link & Pin option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Lyen Vidéo Master Administratè a</label>
                    <input
                      type="url"
                      value={newPostTiktok}
                      onChange={(e) => setNewPostTiktok(e.target.value)}
                      placeholder="https://masterplay.ht/videos/chalanj.mp4"
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={newPostPinned}
                        onChange={(e) => setNewPostPinned(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Mete piblikasyon sa a anlè nèt (Pinned)</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingPost}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
                >
                  {creatingPost ? 'N ap pibliye...' : editingPost ? 'Sove Modifikasyon' : 'Pibliye nan Aplikasyon an'}
                </button>
              </form>

              {/* List of existing posts with edit and delete */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Piblikasyon ki fèt yo ({overview.posts.length})
                </h3>
                {overview.posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{post.title}</span>
                        {post.mediaType && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-800 text-slate-300 uppercase">
                            {post.mediaType}
                          </span>
                        )}
                        {post.pinned && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-400">
                            PINNED
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 line-clamp-2">{post.description}</p>
                      {post.tiktokUrl && (
                        <div className="text-[11px] text-amber-400 font-bold">
                          Vidéo Master: {post.tiktokUrl}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        {new Date(post.createdAt).toLocaleString()} • {post.likes?.length || 0} Like • {post.comments?.length || 0} Kòmantè
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditPost(post)}
                        className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Modifye"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Efase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: TRANZAKSYON NATCASH */}
          {activeSection === 'tranzaksyon' && overview && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">Jesyon Tranzaksyon NatCash</h2>
                <p className="text-xs text-slate-400">
                  Verifye screenshot depo yo epi trete demann retrè yo pou itilizatè yo.
                </p>
              </div>

              <div className="space-y-3">
                {overview.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          tx.type === 'depo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {tx.type}
                        </span>
                        <span className="font-mono font-bold text-white">{tx.referenceId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'konfime'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : tx.status === 'refize'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300 animate-pulse'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-1">
                        Itilizatè: <strong>{tx.userName}</strong> ({tx.userPhone}) • NatCash: {tx.natcashName} ({tx.natcashPhone})
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-black text-white text-base tabular-nums">
                          {tx.amount.toLocaleString()} HT
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {tx.status === 'an_atant' && (
                        <button
                          onClick={() => setReviewingTx(tx)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors"
                        >
                          Trete Demann
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: USERS MANAGER */}
          {activeSection === 'itilizate' && overview && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white">Lis Tout Itilizatè yo</h2>
                <p className="text-xs text-slate-400">
                  Wè kont yo, balans yo, ak rechèch pa non oswa nimewo telefòn.
                </p>
              </div>

              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Chèche pa non oswa telefòn..."
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                {overview.users
                  .filter(
                    (u) =>
                      u.fullName.toLowerCase().includes(userQuery.toLowerCase()) ||
                      u.phoneNumber.includes(userQuery) ||
                      u.id.toLowerCase().includes(userQuery.toLowerCase()) ||
                      (u.masterPlayId && u.masterPlayId.toLowerCase().includes(userQuery.toLowerCase()))
                  )
                  .map((u) => {
                    const isVerifying = verifyingUserIds[u.id];
                    const isVerified = Boolean(u.isVerifiedInDatabase);

                    return (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.profilePhoto}
                            alt={u.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{u.fullName}</span>
                              <VerifiedBadge
                                verified={Boolean(u.verified || u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin)}
                                size="xs"
                              />
                              {isVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <Check className="w-3 h-3" />
                                  <span>Verifye nan Bazdone</span>
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>{u.phoneNumber}</span>
                              <span className="text-slate-600">•</span>
                              <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                                {u.masterPlayId || u.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                          <div className="text-left sm:text-right">
                            <div className="font-black text-emerald-400 text-sm tabular-nums">
                              {u.balance.toLocaleString()} HT
                            </div>
                            <div className="text-[10px] text-slate-500">Nivo {u.level}</div>
                          </div>

                          {/* Requirement 1: Bouton « Anrejistre » devan chak kont itilizatè */}
                          <button
                            onClick={() => handleVerifyUserInDB(u)}
                            disabled={isVerifying}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                              isVerified
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                            title="Anrejistre epi verifye kont sa a nan bazdone MASTER PLAY la yon fason pèmanan"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isVerifying ? 'Anrejistreman...' : isVerified ? 'Anrejistre Ankò' : 'Anrejistre'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SECTION 6B: ACCOUNT CERTIFICATION */}
          {activeSection === 'setifikasyon' && overview && (() => {
            const uncertifiedUsers = overview.users.filter(
              (u) => u.certificationStatus !== 'sètifye' && u.role !== 'ADMIN' && !u.isAdmin
            );
            const certifiedUsers = overview.users.filter(
              (u) => u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin
            );
            const baseList =
              certFilter === 'non_sètifye'
                ? uncertifiedUsers
                : certFilter === 'sètifye'
                ? certifiedUsers
                : overview.users;
            const filteredUsers = baseList.filter((u) => {
              const q = certSearchQuery.trim().toLowerCase();
              if (!q) return true;
              return (
                u.fullName.toLowerCase().includes(q) ||
                u.phoneNumber.toLowerCase().includes(q) ||
                u.id.toLowerCase().includes(q) ||
                (u.masterPlayId && u.masterPlayId.toLowerCase().includes(q))
              );
            });

            return (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Sètifikasyon Kont</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Verifye epi valide kont itilizatè ki poko sètifye yo pou ba yo aksè konplè nan platfòm nan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCertFilter('non_sètifye')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${
                      certFilter === 'non_sètifye'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-[#131B2E] text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Poko Sètifye ({uncertifiedUsers.length})
                  </button>
                  <button
                    onClick={() => setCertFilter('sètifye')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${
                      certFilter === 'sètifye'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-[#131B2E] text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Kont Sètifye ({certifiedUsers.length})
                  </button>
                  <button
                    onClick={() => setCertFilter('tout')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-colors ${
                      certFilter === 'tout'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-[#131B2E] text-slate-300 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Tout Kont ({overview.users.length})
                  </button>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={certSearchQuery}
                    onChange={(e) => setCertSearchQuery(e.target.value)}
                    placeholder="Chèche pa non, telefòn oswa ID..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#131B2E] border border-slate-800 text-center text-xs text-slate-400">
                    Pa gen okenn kont nan kategori sa a pou kounye a.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredUsers.map((u) => {
                      const isCertified = u.certificationStatus === 'sètifye' || u.role === 'ADMIN' || u.isAdmin;
                      const isCertifying = Boolean(certifyingUserIds[u.id]);
                      return (
                        <div
                          key={u.id}
                          className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={u.profilePhoto}
                              alt={u.fullName}
                              className="w-11 h-11 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-white text-sm">{u.fullName}</span>
                                <VerifiedBadge verified={isCertified} size="xs" />
                                {isCertified ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Kont Sètifye</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <Clock className="w-3 h-3" />
                                    <span>Non Sètifye</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-300 flex flex-wrap items-center gap-2">
                                <span>📞 {u.phoneNumber}</span>
                                {u.email && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span>✉️ {u.email}</span>
                                  </>
                                )}
                              </div>
                              <div className="text-slate-400 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                                  ID: {u.masterPlayId || u.id}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span>
                                  Kreye: {new Date(u.createdAt).toLocaleDateString('ht-HT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                            {isCertified ? (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black text-xs inline-flex items-center gap-1.5">
                                  <Check className="w-4 h-4" />
                                  <span>Kont Sètifye</span>
                                </span>
                                {u.role !== 'ADMIN' && !u.isAdmin && (
                                  <button
                                    onClick={() => handleUncertifyUser(u)}
                                    disabled={isCertifying}
                                    className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs transition-colors disabled:opacity-50"
                                  >
                                    {isCertifying ? '...' : 'Retire Sètifikasyon'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCertifyUser(u)}
                                disabled={isCertifying}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isCertifying ? 'Ap sètifye...' : 'Sètifye Kont'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* SECTION 6C: MEMWA / DATABASE SYSTEM */}
          {activeSection === 'memwa_database' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span>MEMWA GLOBAL / DATABASE SYSTEM</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sous verite santral MASTER PLAY — pèsistans, evènman, synchronization, ak backup otomatik.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setCreatingBackup(true);
                    try {
                      const res = await api.createAdminMemoryBackup(currentUser?.fullName || 'Administratè');
                      if (res.success) {
                        notify(`Backup v${res.snapshot?.version} kreye avèk siksè!`, 'success');
                        await loadAdminData();
                      } else {
                        notify(res.error || 'Erè pandan backup la.', 'error');
                      }
                    } catch {
                      notify('Erè koneksyon.', 'error');
                    } finally {
                      setCreatingBackup(false);
                    }
                  }}
                  disabled={creatingBackup}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{creatingBackup ? 'Ap kreye backup...' : 'Kreye Backup Kounye a'}</span>
                </button>
              </div>

              {/* Firebase Cloud & Firestore Migration Card */}
              <div className="p-4 rounded-2xl bg-[#131B2E] border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                      <span>🔥 Firebase Cloud Backend & Firestore</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pwojè: <span className="font-mono text-cyan-300">{firebaseConfig.projectId}</span> • Bucket:{' '}
                      <span className="font-mono text-slate-300">{firebaseConfig.storageBucket}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Firestore DB: <span className="font-mono text-slate-300">{firebaseConfig.firestoreDatabaseId}</span>
                    </p>
                    <p className="text-[11px] mt-1">
                      Sesyon Firebase:{' '}
                      {firebaseUser ? (
                        <span className="text-emerald-400 font-bold">
                          Konekte ({firebaseUser.email || firebaseUser.uid})
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold">Pa konekte nan Google Admin</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(!firebaseUser || firebaseUser.email !== 'itsleprince70@gmail.com') && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const g = await signInWithFirebaseGoogle();
                            notify(`Konekte sou Firebase kòm ${g.email}`, 'success');
                          } catch (err: any) {
                            notify(err?.message || 'Pa kapab konekte ak Google.', 'error');
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-black text-xs hover:bg-slate-100"
                      >
                        Konekte Google Admin
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={cloudSyncing || !overview}
                      onClick={async () => {
                        if (!overview) return;
                        setCloudSyncing(true);
                        setCloudSyncSummary(null);
                        try {
                          const r = await syncAdminMigrationToFirestore({
                            users: overview.users || [],
                            competitions: overview.competitions || [],
                            games: overview.games || [],
                            posts: overview.posts || [],
                          });
                          if (r.error) {
                            setCloudSyncSummary(r.error);
                            notify(r.error, 'error');
                          } else {
                            const msg = `Senkronize nan Firestore: ${r.syncedUsers} itilizatè, ${r.syncedGames} jwèt, ${r.syncedCompetitions} konpetisyon, ${r.syncedPosts} piblikasyon.`;
                            setCloudSyncSummary(msg);
                            notify(msg, 'success');
                          }
                        } finally {
                          setCloudSyncing(false);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs disabled:opacity-50"
                    >
                      {cloudSyncing ? 'Ap senkronize...' : 'Senkronize Done nan Firestore'}
                    </button>
                  </div>
                </div>
                {cloudSyncSummary && (
                  <div className="p-2.5 rounded-xl bg-black/30 border border-slate-700 text-xs text-cyan-200">
                    {cloudSyncSummary}
                  </div>
                )}
              </div>

              {memoryOverview && (
                <>
                  {/* Global Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Itilizatè', val: memoryOverview.stats.usersCount, color: 'text-white' },
                      { label: 'Piblikasyon', val: memoryOverview.stats.publicationsCount, color: 'text-cyan-400' },
                      { label: 'Vidéo', val: memoryOverview.stats.videosCount, color: 'text-rose-400' },
                      { label: 'Konpetisyon', val: memoryOverview.stats.competitionsCount, color: 'text-amber-400' },
                      { label: 'Scores', val: memoryOverview.stats.scoresCount, color: 'text-emerald-400' },
                      { label: 'Tranzaksyon', val: memoryOverview.stats.transactionsCount, color: 'text-blue-400' },
                      { label: 'Evènman Memwa', val: memoryOverview.stats.eventsCount, color: 'text-purple-400' },
                      { label: 'Erè Sync', val: memoryOverview.stats.syncErrorsCount, color: memoryOverview.stats.syncErrorsCount > 0 ? 'text-red-400' : 'text-emerald-400' },
                    ].map((card) => (
                      <div key={card.label} className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800">
                        <div className="text-[11px] text-slate-400 font-bold">{card.label}</div>
                        <div className={`text-xl font-black mt-1 tabular-nums ${card.color}`}>
                          {card.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Backup Status & Snapshots */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-white">Estati Backup & Versioning</h3>
                        <p className="text-[11px] text-slate-400">
                          Schema v{memoryOverview.backupStatus.schemaVersion} • Done v{memoryOverview.backupStatus.dataVersion} • Dènye mizajou:{' '}
                          {new Date(memoryOverview.backupStatus.lastUpdatedAt).toLocaleString('ht-HT')}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-black">
                        Pwoteksyon Aktif
                      </span>
                    </div>

                    {memoryOverview.backupStatus.snapshots?.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {memoryOverview.backupStatus.snapshots.map((snap: any) => (
                          <div key={snap.fileName} className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-mono text-cyan-300 font-bold">{snap.fileName}</div>
                              <div className="text-[10px] text-slate-400">
                                v{snap.version} • {snap.usersCount} itilizatè • {snap.postsCount} piblikasyon • Checksum: {snap.checksum}
                              </div>
                            </div>
                            <button
                              onClick={() => setRestoreConfirmFile(snap.fileName)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
                            >
                              Restore Backup
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Poko gen snapshot manyèl. Klike « Kreye Backup Kounye a » pou sove premye snapshot la.</p>
                    )}
                  </div>

                  {/* Needs Verification Summary */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Kont ki Bezwen Verifikasyon ({memoryOverview.stats.needsVerificationCount})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Kont itilizatè ki poko sètifye nan bazdone a.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSection('setifikasyon')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                    >
                      Ouvri Sètifikasyon Kont
                    </button>
                  </div>

                  {/* Recent Events Log */}
                  <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 space-y-3">
                    <h3 className="text-sm font-black text-white">Istorik Evènman Memwa Global (Resan)</h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {memoryOverview.recentEvents.map((evt: any) => (
                        <div key={evt.eventId} className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div>
                            <span className="font-black text-cyan-400 mr-2">{evt.actionType}</span>
                            <span className="text-slate-300">{evt.pageOrFeature}</span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {evt.eventId} • User: {evt.userId}
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 shrink-0">
                            {new Date(evt.dateTime).toLocaleString('ht-HT')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sync Errors */}
                  {memoryOverview.syncErrors?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                      <h3 className="text-sm font-black text-red-300">Erè Synchronization</h3>
                      {memoryOverview.syncErrors.map((err: any) => (
                        <div key={err.id} className="text-xs text-red-200 bg-black/30 p-2 rounded-lg">
                          <strong>{err.actionType}</strong>: {err.error} ({new Date(err.timestamp).toLocaleString('ht-HT')})
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Restore Confirmation Modal */}
              {restoreConfirmFile && (
                <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-sm bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 space-y-4 text-center">
                    <h3 className="text-base font-black text-white">Konfime Restore Backup</h3>
                    <p className="text-xs text-slate-300">
                      Èske ou sèten ou vle restore bazdone a depi <span className="font-mono text-amber-300">{restoreConfirmFile}</span>? Aksyon sa a ap anrejistre nan audit log la.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreConfirmFile(null)}
                        disabled={restoringBackup}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                      >
                        Anile
                      </button>
                      <button
                        type="button"
                        disabled={restoringBackup}
                        onClick={async () => {
                          setRestoringBackup(true);
                          try {
                            const r = await api.restoreAdminMemoryBackup(restoreConfirmFile, currentUser?.fullName || 'Administratè');
                            if (r.success) {
                              notify(r.message || 'Bazdone restore avèk siksè!', 'success');
                              setRestoreConfirmFile(null);
                              await loadAdminData();
                              onDataChanged();
                            } else {
                              notify(r.error || 'Erè pandan restore.', 'error');
                            }
                          } catch {
                            notify('Erè koneksyon.', 'error');
                          } finally {
                            setRestoringBackup(false);
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                      >
                        {restoringBackup ? 'Ap restore...' : 'Wi, Restore'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: BROADCAST NOTIFICATIONS */}
          {activeSection === 'notifikasyon' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h2 className="text-lg font-black text-white">Voye Notifikasyon bay Tout Moun</h2>
                <p className="text-xs text-slate-400">
                  Voye anons sou nouvo konpetisyon, rezilta oswa enfòmasyon enpòtan.
                </p>
              </div>

              {notifSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {notifSuccess}
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tit Notifikasyon an</label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Egzanp: Rezilta MASTER COUP pibliye !"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mesaj la</label>
                  <textarea
                    rows={3}
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Ekri mesaj la an Kreyòl..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
                >
                  {sendingNotif ? 'N ap voye...' : 'Voye bay tout itilizatè yo'}
                </button>
              </form>
            </div>
          )}

          {/* SECTION: MONETIZATION MANAGEMENT */}
          {activeSection === 'monetizasyon' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <span>Jesyon Monetizasyon Kreyatè</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Konfigire tarif revni, kontwole kreyatè monetize yo epi jere peman kès la.
                  </p>
                </div>
                <button
                  onClick={loadAdminData}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rafrechi</span>
                </button>
              </div>

              {monetizationMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {monetizationMsg}
                </div>
              )}

              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Kreyatè Elijib</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {monetizationData?.totalCreatorsCount || 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Kreyatè Monetize Aktif</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {monetizationData?.totalMonetizedCount || 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Frè Aktivasyon</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {monetizationData?.config?.activationFee || 250} HT
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tarif 1k Likes</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {monetizationData?.config?.earningsPer1000Likes || 500} G
                  </div>
                </div>
              </div>

              {/* Configuration Form */}
              <form onSubmit={handleSaveMonetizationConfig} className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Konfigirasyon Tarif & Règ Monetizasyon</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Frè Aktivasyon (HT)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monetizationActivationFeeInput}
                      onChange={(e) => setMonetizationActivationFeeInput(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Revni / 1,000 Likes (G)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monetization1kLikesInput}
                      onChange={(e) => setMonetization1kLikesInput(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bonis 1,000 Abòne (G)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monetizationMilestoneInput}
                      onChange={(e) => setMonetizationMilestoneInput(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Minimòm Abòne Elijibilite</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={monetizationMinFollowersInput}
                      onChange={(e) => setMonetizationMinFollowersInput(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingMonetizationConfig}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingMonetizationConfig ? 'N ap sove...' : 'Sove Konfigirasyon Monetizasyon'}
                </button>
              </form>

              {/* Creators Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Lis Kreyatè Elijib & Monetize ({monetizationData?.creators?.length || 0})
                </h3>

                {(!monetizationData?.creators || monetizationData.creators.length === 0) ? (
                  <div className="p-8 rounded-2xl bg-[#131B2E] border border-slate-800 text-center text-xs text-slate-400">
                    Poko gen kreyatè ki rive nan 1,000 abòne oswa ki mande monetizasyon.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {monetizationData.creators.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={c.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={c.fullName}
                            className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{c.fullName}</span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  c.isMonetized
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                }`}
                              >
                                {c.isMonetized ? '⭐ MONETIZE' : 'ELIJIB (POKO AKTIF)'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{c.phoneNumber}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-amber-400">ID: {c.id}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                              <span>👥 <b>{(c.followersCount || 0).toLocaleString()}</b> abòne</span>
                              <span>❤️ <b>{(c.monetizedLikesCount || 0).toLocaleString()}</b> likes</span>
                              {c.followerMilestonePaid && <span className="text-emerald-400 font-bold">✓ Bonis 1k Abòne</span>}
                            </div>
                          </div>
                        </div>

                        {/* Financial stats & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] text-slate-400">Revni Disponib:</div>
                            <div className="text-base font-black text-emerald-400 tabular-nums">
                              {(c.availableEarnings || 0).toLocaleString()} HT
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Total: {(c.totalEarnings || 0).toLocaleString()} HT • Peye: {(c.paidEarnings || 0).toLocaleString()} HT
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCreatorStatus(c.id, c.monetizationStatus, c.isMonetized)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                c.isMonetized
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {c.isMonetized ? 'Sispann' : 'Aktive'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPayoutModalCreator(c);
                                setPayoutAmountInput(String(c.availableEarnings || 0));
                                setPayoutPinInput('');
                              }}
                              disabled={!c.availableEarnings || c.availableEarnings <= 0}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-40"
                            >
                              Peye Kreyatè
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: ALGORITHM INTELLIGENCE & DECISION SYSTEM */}
          {activeSection === 'algorithm_intelligence' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <span>🧠 Sistèm Algorithm Master & Entèlijans Desizyon</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Siveyans otomatik kont doublon, spam likes, anomalie vòt ak analiz sekirite platfòm nan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCleanModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Netwaye Fo Kont & Fo Abòne</span>
                  </button>
                  <button
                    onClick={loadAdminData}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Rafrechi analiz"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Health integrity score */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#131B2E] via-slate-900 to-[#131B2E] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-2xl">
                    {algorithmData?.healthScore || 100}%
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Nivo Entegrite & Sante Bazdone a</h3>
                    <p className="text-xs text-slate-400">
                      {(algorithmData?.healthScore || 100) >= 90
                        ? 'Sistèm nan estab, tout relasyon itilizatè ak tranzaksyon yo verifye.'
                        : 'Atansyon: kèk anomalie detekte ki mande atansyon administratè a.'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Algorithme Aktif 24/7
                  </span>
                </div>
              </div>

              {/* Detected Anomalies */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Anomali Detekte pa Algorithme la ({algorithmData?.anomalies?.length || 0})</span>
                </h3>

                {(!algorithmData?.anomalies || algorithmData.anomalies.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 text-center text-xs text-emerald-400 font-semibold">
                    ✓ Okenn anomalie oswa doublon pa detekte nan sistèm nan. Tout bagay nòmal !
                  </div>
                ) : (
                  <div className="space-y-2">
                    {algorithmData.anomalies.map((a: any) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-400 uppercase text-[10px] bg-rose-500/20 px-2 py-0.5 rounded-full">
                              {a.severity}
                            </span>
                            <span className="text-white font-semibold">{a.description}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Detekte: {new Date(a.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Strategic Recommendations */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Rekòmandasyon Entèlijan pou Administratè a ({algorithmData?.recommendations?.length || 0})</span>
                </h3>

                {(!algorithmData?.recommendations || algorithmData.recommendations.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-[#131B2E] border border-slate-800 text-center text-xs text-slate-400">
                    Okenn aksyon ijan pa nesesè kounye a.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {algorithmData.recommendations.map((rec: any) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 flex flex-col justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm">{rec.title}</div>
                          <p className="text-slate-300">{rec.description}</p>
                        </div>
                        {rec.actionLabel && (
                          <button
                            type="button"
                            onClick={() => {
                              if (rec.category === 'monetization') setActiveSection('monetizasyon');
                              else if (rec.category === 'finance') setActiveSection('tranzaksyon');
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs transition-colors text-center"
                          >
                            {rec.actionLabel} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: ADMIN PIN SETTINGS */}
          {activeSection === 'anviwonman' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h2 className="text-lg font-black text-white">Sekirite Administratè & PIN</h2>
                <p className="text-xs text-slate-400">
                  Modifye kòd sekirite pou aksè nan espas administrasyon an.
                </p>
              </div>

              {pinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {pinSuccess}
                </div>
              )}

              {pinChangeError && (
                <div className="p-3 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
                  {pinChangeError}
                </div>
              )}

              <form onSubmit={handleChangeAdminPin} className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kòd Aktyèl</label>
                  <input
                    type="password"
                    required
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Tape kòd aktyèl la..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nouvo Kòd Admin</label>
                  <input
                    type="password"
                    required
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="Omwen 5 karaktè..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
                >
                  Sove Nouvo Kòd Admin
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* MATCH RESULT SUBMISSION & VERIFICATION MODAL */}
      {managingMatch && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                Rezilta & Verifikasyon Match
              </h3>
              <button onClick={() => setManagingMatch(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-[#0B0F19] p-3 rounded-2xl border border-slate-800">
              <div className="font-bold text-amber-400">{managingMatch.date}</div>
              <div>Jwèt chwazi pou match sa a: <strong className="text-white">{managingMatch.gameTitle}</strong></div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {managingMatch.id}</div>
            </div>

            <form onSubmit={handleSaveMatchResult} className="space-y-4">
              {/* Score inputs for Player 1 & Player 2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 text-center space-y-2">
                  <img src={managingMatch.player1.profilePhoto} alt={managingMatch.player1.fullName} className="w-8 h-8 rounded-full mx-auto object-cover" />
                  <div className="font-bold text-white text-xs truncate">{managingMatch.player1.fullName}</div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={matchScore1}
                    onChange={(e) => setMatchScore1(e.target.value)}
                    className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-2 py-1.5 text-center text-sm font-black text-white tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setMatchWinnerId(managingMatch.player1.userId)}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold ${
                      matchWinnerId === managingMatch.player1.userId
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Gayan Match la
                  </button>
                </div>

                <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 text-center space-y-2">
                  <img src={managingMatch.player2.profilePhoto} alt={managingMatch.player2.fullName} className="w-8 h-8 rounded-full mx-auto object-cover" />
                  <div className="font-bold text-white text-xs truncate">{managingMatch.player2.fullName}</div>
                  <input
                    type="number"
                    min="0"
                    required
                    value={matchScore2}
                    onChange={(e) => setMatchScore2(e.target.value)}
                    className="w-full bg-[#131B2E] border border-slate-700 rounded-xl px-2 py-1.5 text-center text-sm font-black text-white tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setMatchWinnerId(managingMatch.player2.userId)}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold ${
                      matchWinnerId === managingMatch.player2.userId
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Gayan Match la
                  </button>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Estati Match la:</label>
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Fini">Fini (Konfime gayan)</option>
                  <option value="Ap dewoule">Ap dewoule</option>
                  <option value="Pwograme">Pwograme</option>
                  <option value="An atant verifikasyon">An atant verifikasyon</option>
                  <option value="Anile">Anile</option>
                </select>
              </div>

              {/* Audit correction note */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nòt verifikasyon / koreksyon:</label>
                <input
                  type="text"
                  value={matchAuditNote}
                  onChange={(e) => setMatchAuditNote(e.target.value)}
                  placeholder="Egzanp: Rezilta verifye ak prèv..."
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagingMatch(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={submittingMatch}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  {submittingMatch ? 'Anrejistreman...' : 'Konfime Rezilta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION REVIEW DIALOG */}
      {reviewingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white">
                Revizyon {reviewingTx.type === 'depo' ? 'Depo' : 'Retrè'} NatCash
              </h3>
              <button onClick={() => setReviewingTx(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-[#0B0F19] p-3.5 rounded-2xl border border-slate-800">
              <div>Referans: <strong className="text-amber-400 font-mono">{reviewingTx.referenceId}</strong></div>
              <div>Itilizatè: <strong>{reviewingTx.userName}</strong> ({reviewingTx.userPhone})</div>
              <div>NatCash: <strong>{reviewingTx.natcashName}</strong> ({reviewingTx.natcashPhone})</div>
              <div>Montan: <strong className="text-emerald-400 text-sm font-black">{reviewingTx.amount} HT</strong></div>
            </div>

            {reviewingTx.proofImage && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Prèv Transfè / Screenshot:</label>
                <img
                  src={reviewingTx.proofImage}
                  alt="Prèv"
                  className="max-h-48 w-full object-contain rounded-xl border border-slate-700 bg-black/50"
                />
              </div>
            )}

            {reviewingTx.status === 'an_atant' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rezon refi (si w ap refize l):</label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Egzanp: Transfè pa resevwa sou NatCash..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview('refize')}
                    disabled={submittingReview}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Refize Demann lan
                  </button>
                  <button
                    onClick={() => handleReview('konfime')}
                    disabled={submittingReview}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-colors shadow-lg"
                  >
                    Konfime & Ajoute Lajan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* CREATE NEW CUSTOM MATCH MODAL */}
      {showCreateMatchModal && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Kreye Match VS Fas-a-Fas</span>
              </h3>
              <button onClick={() => setShowCreateMatchModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3">
              {/* Select Player 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jwè 1:</label>
                <select
                  required
                  value={newMatchPlayer1Id}
                  onChange={(e) => setNewMatchPlayer1Id(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Chwazi Jwè 1 nan lis la...</option>
                  {(overview?.users || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.phoneNumber}) • Nivo {u.level || 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Player 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jwè 2:</label>
                <select
                  required
                  value={newMatchPlayer2Id}
                  onChange={(e) => setNewMatchPlayer2Id(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Chwazi Jwè 2 nan lis la...</option>
                  {(overview?.users || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.phoneNumber}) • Nivo {u.level || 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Game */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Jwèt pou Match sa a:</label>
                <select
                  required
                  value={newMatchGameId}
                  onChange={(e) => setNewMatchGameId(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {(overview?.games || []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Round Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tit / Faz Match la:</label>
                <input
                  type="text"
                  required
                  value={newMatchRound}
                  onChange={(e) => setNewMatchRound(e.target.value)}
                  placeholder="Egzanp: Kar de Final - Match 1"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Match Time (Haiti Timezone) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Lè Match la (Lè Ayiti):</label>
                <input
                  type="text"
                  required
                  value={newMatchTime}
                  onChange={(e) => setNewMatchTime(e.target.value)}
                  placeholder="Egzanp: 4:00 PM oswa 2026-10-24 16:00"
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Voting Settings */}
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Otorize Vòt Fanatik</div>
                  <div className="text-[10px] text-slate-400">Fanatik yo ap ka vote pou jwè yo prefere a</div>
                </div>
                <input
                  type="checkbox"
                  checked={newMatchVotingEnabled}
                  onChange={(e) => setNewMatchVotingEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMatchModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={creatingMatch}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  {creatingMatch ? 'Pwogramasyon...' : 'Konfime Match la'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW GIFT MODAL */}
      {showAddGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Ajoute yon Nouvo Kado Virtiyèl</span>
              </h3>
              <button onClick={() => setShowAddGiftModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewGift} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Non Kado a</label>
                <input
                  type="text"
                  required
                  value={newGiftName}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  placeholder="Egzanp: Kouwòn Wa, Flèch..."
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Emoji / Ikòn</label>
                  <input
                    type="text"
                    required
                    value={newGiftIcon}
                    onChange={(e) => setNewGiftIcon(e.target.value)}
                    placeholder="👑"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pri (HT)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newGiftPrice}
                    onChange={(e) => setNewGiftPrice(e.target.value)}
                    placeholder="50"
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsyon</label>
                <input
                  type="text"
                  value={newGiftDesc}
                  onChange={(e) => setNewGiftDesc(e.target.value)}
                  placeholder="Kout mesaj sipò..."
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGiftModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  Ajoute nan Boutik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATOR PAYOUT MODAL */}
      {payoutModalCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Peman Revni Kreyatè</span>
              </h3>
              <button onClick={() => setPayoutModalCreator(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 flex items-center gap-3">
              <img
                src={payoutModalCreator.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={payoutModalCreator.fullName}
                className="w-12 h-12 rounded-full object-cover border border-slate-700"
              />
              <div className="text-xs">
                <div className="font-bold text-white text-sm">{payoutModalCreator.fullName}</div>
                <div className="text-slate-400">{payoutModalCreator.phoneNumber} • ID: {payoutModalCreator.id}</div>
                <div className="text-emerald-400 font-bold mt-0.5">
                  Revni Disponib: {(payoutModalCreator.availableEarnings || 0).toLocaleString()} HT
                </div>
              </div>
            </div>

            <form onSubmit={handleExecutePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Montan Peman (HT)</label>
                <input
                  type="number"
                  min="1"
                  max={payoutModalCreator.availableEarnings || 0}
                  required
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kòd PIN Administratè (Sekirite)</label>
                <input
                  type="password"
                  required
                  placeholder="Tape PIN admin ou..."
                  value={payoutPinInput}
                  onChange={(e) => setPayoutPinInput(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalCreator(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {payoutLoading ? 'N ap trete...' : 'Konfime Peman an'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAN FAKE ACCOUNTS MODAL */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Netwaye Fo Kont & Fo Abòne</span>
              </h3>
              <button onClick={() => setShowCleanModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
              <div className="font-bold text-rose-400">Avètisman Sekirite:</div>
              <p>
                Aksyon sa a pral netwaye tout kont tès/fo kont ki pa otantik nan bazdone a, retire relasyon fo abòne yo, epi resenkronize kontè abòne kreyatè yo kòrèkteman.
              </p>
            </div>

            <form onSubmit={handleRunCleanFakeAccounts} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Antre Kòd PIN Admin pou Konfime
                </label>
                <input
                  type="password"
                  required
                  placeholder="Tape PIN admin..."
                  value={cleanFakeAccountsPin}
                  onChange={(e) => setCleanFakeAccountsPin(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCleanModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={cleaningFakeAccounts}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-md disabled:opacity-50"
                >
                  {cleaningFakeAccounts ? 'N ap netwaye...' : 'Netwaye Kounye a'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
