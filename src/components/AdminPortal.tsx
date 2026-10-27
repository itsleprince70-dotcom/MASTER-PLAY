import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Competition, Transaction, Post, Game, AuditLog, CompetitionMatch, GiftItem, BalonAdminStats, BalonConfig, AvionCrashConfig, AvionCrashRound } from '../types';
import {
  Shield, KeyRound, Users, Trophy, Newspaper, Gamepad2, ArrowDownUp, Bell,
  Settings, Check, X, AlertCircle, Search, RefreshCw, Plus, Trash2, Edit3,
  ExternalLink, Calendar, Flame, Image as ImageIcon, Video as VideoIcon,
  FileText, ArrowRight, CheckCircle2, ChevronRight, Crown, Sparkles, Filter, Lock,
  Gift, ThumbsUp, DollarSign, Clock, Coins, Play, Pause, XCircle, Heart, Target,
  Plane
} from 'lucide-react';

interface AdminPortalProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose, onDataChanged }) => {
  const [authorized, setAuthorized] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [loadingPin, setLoadingPin] = useState(false);

  // Admin Data State
  const [overview, setOverview] = useState<{
    stats: any;
    users: User[];
    transactions: Transaction[];
    competitions: Competition[];
    posts: Post[];
    games: Game[];
    auditLogs: AuditLog[];
  } | null>(null);

  const [activeSection, setActiveSection] = useState<
    'overview' | 'avion_crash_admin' | 'balon_admin' | 'tranzaksyon' | 'konpetisyon' | 'match_vot' | 'boutik_kado' | 'finans_konpetisyon' | 'piblikasyon' | 'itilizate' | 'jwet' | 'notifikasyon' | 'anviwonman'
  >('overview');

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
  const [newCompVotePrice, setNewCompVotePrice] = useState<number>(15);
  const [creatingComp, setCreatingComp] = useState(false);

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

  // Verify Admin PIN
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setLoadingPin(true);
    try {
      const res = await api.verifyAdminPin(adminPinInput.trim());
      if (res.success && res.authorized) {
        setAuthorized(true);
        loadAdminData();
      } else {
        setPinError('Kòd sekirite administratè a pa kòrèk.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Erè verifikasyon.');
    } finally {
      setLoadingPin(false);
    }
  };

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [res, giftsRes, financeRes, balonRes, crashRes] = await Promise.all([
        api.getAdminOverview(),
        api.getGifts(),
        api.getAdminFinance(),
        api.getBalonAdminStats().catch(() => null),
        api.getAvionCrashAdminStats().catch(() => null),
      ]);

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
      alert(err.message || 'Erè nan mete ajou konfigirasyon Avion Crash.');
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
      alert(err.message || 'Erè nan mete ajou konfigirasyon 11 Balon.');
    } finally {
      setSavingBalonConfig(false);
    }
  };

  // --- 1. GAME PRICING ACTIONS ---
  const handleSaveGamePrice = async (game: Game) => {
    const rawVal = editingGamePrice[game.id];
    const newFee = Number(rawVal);
    if (isNaN(newFee) || newFee < 0) {
      alert('Tanpri mete yon pri ki valab (0 oswa plis).');
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
      alert('Erè pandan anrejistreman pri a.');
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
      alert('Erè pandan aktivasyon jwèt la.');
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
        alert('Nouvo jwèt la ajoute avèk siksè nan lis pri a !');
      }
    } catch (err) {
      alert('Erè pandan kreyasyon jwèt la.');
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
      alert(err.message || 'Erè nan chaje estatistik jwèt la.');
    } finally {
      setLoadingGameStats(false);
    }
  };

  // --- 2. COMPETITION AUTHORIZED GAMES & 7-DAY BRACKET ACTIONS ---
  const selectedComp = overview?.competitions.find(c => c.id === selectedCompManageId) || overview?.competitions[0];

  const handleToggleGameForComp = async (compId: string, gameId: string) => {
    if (!selectedComp) return;
    const current = selectedComp.authorizedGameIds || [];
    const updated = current.includes(gameId)
      ? current.filter(id => id !== gameId)
      : [...current, gameId];

    if (updated.length === 0) {
      alert('Konpetisyon an dwe gen omwen 1 jwèt otorize.');
      return;
    }

    try {
      const res = await api.updateCompetitionGames(compId, updated);
      if (res.success) {
        loadAdminData();
        onDataChanged();
      }
    } catch (err) {
      alert('Erè pandan mizajou jwèt konpetisyon an.');
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
      alert('Erè pandan chanjman jounen an.');
    }
  };

  const handleQualifyTop8 = async (compId: string) => {
    if (!confirm('Èske w sèten ou vle konfime kalifikasyon Top 8 la kounye a? Sa pral bloke klasman Jedi a epi pwograme 4 match Vandredi yo.')) return;
    try {
      const res = await api.qualifyTop8(compId);
      if (res.success) {
        loadAdminData();
        onDataChanged();
        alert('Felisitasyon ! Top 8 la konfime epi 4 match eliminatwa Vandredi yo pwograme.');
      } else {
        alert(res.error || 'Erè pandan kalifikasyon an.');
      }
    } catch (err: any) {
      alert(err.message || 'Erè rezo.');
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
        alert(res.error || 'Erè anrejistreman rezilta.');
      }
    } catch (err) {
      alert('Erè pandan anrejistreman rezilta match la.');
    } finally {
      setSubmittingMatch(false);
    }
  };

  const handleCreateComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompSelectedGames.length === 0) {
      alert('Tanpri chwazi omwen 1 jwèt pou konpetisyon sa a.');
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
        alert('Nouvo konpetisyon an kreye avèk siksè !');
      }
    } catch (err) {
      alert('Erè pandan kreyasyon konpetisyon an.');
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
        alert(`Estati konpetisyon an chanje a: "${status}"`);
      } else {
        alert(res.error || 'Erè chanjman estati.');
      }
    } catch (err: any) {
      alert(err.message || 'Erè rezo.');
    }
  };

  const handleToggleCompVoting = async (compId: string, votingEnabled: boolean, votePrice?: number) => {
    try {
      const res = await api.toggleVoting(compId, { votingEnabled, votePrice });
      if (res.success) {
        loadAdminData();
        onDataChanged();
        alert(`Sistèm vòt la ${votingEnabled ? 'louvri' : 'fèmen'} avèk siksè !`);
      }
    } catch (err: any) {
      alert(err.message || 'Erè pandan mizajou vòt la.');
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComp) return;
    if (!newMatchPlayer1Id || !newMatchPlayer2Id) {
      alert('Tanpri chwazi de jwè diferan.');
      return;
    }
    if (newMatchPlayer1Id === newMatchPlayer2Id) {
      alert('Ou pa ka chwazi menm jwè a pou tou de bò yo.');
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
        alert('Match fas-a-fas la pwograme avèk siksè !');
      } else {
        alert(res.error || 'Erè pandan kreyasyon match la.');
      }
    } catch (err: any) {
      alert(err.message || 'Erè rezo.');
    } finally {
      setCreatingMatch(false);
    }
  };

  // --- GIFTS (BOUTIK KADO) HANDLERS ---
  const handleSaveGiftPrice = async (gift: GiftItem) => {
    const rawVal = editingGiftPrices[gift.id];
    const newPrice = Number(rawVal);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Tanpri mete yon pri pozitif.');
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
        alert(`Pri pou ${gift.name} ${gift.icon} mete ajou a ${newPrice} HT !`);
      }
    } catch (err) {
      alert('Erè anrejistreman pri kado a.');
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
      alert('Erè chanjman estati kado a.');
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
        alert('Nouvo kado a ajoute avèk siksè nan Boutik Kado a !');
      }
    } catch (err) {
      alert('Erè pandan kreyasyon kado a.');
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
          alert('Piblikasyon an modifye avèk siksè !');
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
          alert('Piblikasyon an afiche avèk siksè nan fil aplikasyon an !');
        }
      }
    } catch (err) {
      alert('Erè pandan kreyasyon piblikasyon an.');
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
      alert('Erè pandan efasman an.');
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
      alert('Erè pandan revizyon tranzaksyon an.');
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
      alert('Erè pandan voye notifikasyon an.');
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

  // 1. PIN LOGIN SCREEN IF NOT AUTHORIZED
  if (!authorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Espas Administrasyon</h2>
            <p className="text-xs text-slate-400 mt-1">
              Antre kòd sekirite administratè ofisyèl MASTER PLAY ou a pou w ka jere pri, konpetisyon ak piblikasyon.
            </p>
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                autoFocus
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Tape kòd admin (prince509)..."
                className="w-full bg-[#080C16] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-center tracking-widest text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Anile
              </button>
              <button
                type="submit"
                disabled={loadingPin}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-950/40 transition-all"
              >
                {loadingPin ? 'Verifikasyon...' : 'Ouvri Sesyon'}
              </button>
            </div>
          </form>
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
                Admin: Prince509
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
                      </div>
                    </div>
                  </div>

                  {/* 2. CHWAZI JWÈT KONPETISYON AN (REQUIREMENT 2) */}
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

                      {/* QUALIFY TOP 8 BUTTON */}
                      <button
                        onClick={() => handleQualifyTop8(selectedComp.id)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg self-start sm:self-auto"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Konfime & Kalifye Top 8 pou Vandredi</span>
                      </button>
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

                              {/* Action Button */}
                              <button
                                onClick={() => handleOpenMatchModal(m)}
                                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Mete Rezilta / Korije Match</span>
                              </button>
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
                          onChange={(e) => setNewCompVotePrice(Number(e.target.value))}
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

                    {/* Video Live Preview */}
                    {newPostVideo && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-400 font-bold">Aperçu Videyo:</div>
                        <video
                          src={newPostVideo}
                          controls
                          className="w-full max-h-48 rounded-xl bg-black border border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TikTok Link & Pin option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Lyen TikTok Administratè a</label>
                    <input
                      type="url"
                      value={newPostTiktok}
                      onChange={(e) => setNewPostTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@kekechallenge"
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
                          TikTok: {post.tiktokUrl}
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
                      u.phoneNumber.includes(userQuery)
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-2xl bg-[#131B2E] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.profilePhoto}
                          alt={u.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{u.fullName}</div>
                          <div className="text-slate-400">{u.phoneNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-400 text-sm tabular-nums">
                          {u.balance.toLocaleString()} HT
                        </div>
                        <div className="text-[10px] text-slate-500">Nivo {u.level}</div>
                      </div>
                    </div>
                  ))}
              </div>
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
    </div>
  );
};
