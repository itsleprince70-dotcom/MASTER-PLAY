import React, { useState } from 'react';
import { Competition, Game, User } from '../types';
import { Trophy, Medal, Crown, Star, Flame, Award, ChevronRight, Heart, Gift, Users, Shield } from 'lucide-react';
import { SubscribeButton } from './SubscribeButton';

interface LeaderboardViewProps {
  competitions: Competition[];
  games: Game[];
  currentUser?: User | null;
  onOpenAuth?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  competitions,
  games,
  currentUser,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'jeneral' | 'fanatik' | 'jwet'>('jeneral');
  const [selectedCompId, setSelectedCompId] = useState<string>(competitions[0]?.id || '');

  const selectedComp = competitions.find((c) => c.id === selectedCompId) || competitions[0];

  // Participants list for selected competition
  const participants = selectedComp?.scores || [];

  // Sort participants by totalScore for General Leaderboard
  const generalRanking = [...participants].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return (b.level || 1) - (a.level || 1);
  });

  // Sort participants for Match & Fan Support (by votes + matches won)
  const totalCompetitionVotes = participants.reduce((acc, p) => acc + (p.votesCount || 0), 0);
  const fanRanking = [...participants].sort((a, b) => {
    const scoreA = (a.votesCount || 0) * 10 + (a.matchesWon || 0) * 50 + (a.giftsCount || 0) * 5;
    const scoreB = (b.votesCount || 0) * 10 + (b.matchesWon || 0) * 50 + (b.giftsCount || 0) * 5;
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600/30 via-slate-900 to-indigo-950/60 p-6 border border-amber-500/20 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Tablo Klasman Ofisyèl & Pèfòmans Jwè yo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Klasman MASTER PLAY / Kèkè Challenge
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Klasman jeneral pwen, nivo, etwal, ansanm ak klasman espesyal match, vòt ak sipò fanatik !
        </p>
      </div>

      {/* Segmented Control Switcher */}
      <div className="flex border-b border-slate-800 bg-[#0F172A] p-1.5 rounded-2xl max-w-xl gap-1">
        <button
          onClick={() => setActiveTab('jeneral')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'jeneral'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Klasman Jeneral</span>
        </button>

        <button
          onClick={() => setActiveTab('fanatik')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'fanatik'
              ? 'bg-rose-500 text-white font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Match & Sipò Fanatik</span>
        </button>

        <button
          onClick={() => setActiveTab('jwet')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'jwet'
              ? 'bg-blue-600 text-white font-black shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Nòt nan Jwèt</span>
        </button>
      </div>

      {/* Competition Selector for tournament tabs */}
      {activeTab !== 'jwet' && competitions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0">Konpetisyon:</span>
          {competitions.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCompId(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedComp?.id === c.id
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-[#131B2E] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.badge || '🏆'} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. KLASMAN JENERAL */}
      {/* ======================================================== */}
      {activeTab === 'jeneral' && (
        <div className="space-y-4">
          {/* Podium top 3 */}
          {generalRanking.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 p-4 rounded-3xl bg-[#131B2E] border border-slate-700 text-center flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl">🥈</span>
                <span className="text-[10px] font-black uppercase text-slate-400">2yèm Plas</span>
                <img
                  src={generalRanking[1].profilePhoto}
                  alt={generalRanking[1].fullName}
                  className="w-12 h-12 rounded-full object-cover my-2 border-2 border-slate-500"
                />
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate max-w-[130px]">{generalRanking[1].fullName}</h4>
                  {generalRanking[1].userId !== currentUser?.id && (
                    <SubscribeButton
                      targetUserId={generalRanking[1].userId}
                      targetUserName={generalRanking[1].fullName}
                      currentUser={currentUser || null}
                      size="icon"
                      onOpenAuth={onOpenAuth}
                    />
                  )}
                </div>
                <div className="text-xs font-black text-amber-400 tabular-nums">{generalRanking[1].totalScore.toLocaleString()} pts</div>
                <div className="text-[10px] text-slate-400 mt-1">Nivo {generalRanking[1].level || 2} • {'★'.repeat(generalRanking[1].stars || 2)}</div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 p-5 rounded-3xl bg-gradient-to-b from-amber-500/20 via-[#131B2E] to-[#0B0F19] border-2 border-amber-500/50 text-center flex flex-col items-center justify-center shadow-xl scale-[1.02]">
                <span className="text-3xl animate-bounce">👑</span>
                <span className="text-[10px] font-black uppercase text-amber-400">1ye Plas • Lidè</span>
                <img
                  src={generalRanking[0].profilePhoto}
                  alt={generalRanking[0].fullName}
                  className="w-16 h-16 rounded-full object-cover my-2 border-2 border-amber-400 shadow-md"
                />
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-base font-black text-white truncate max-w-[150px]">{generalRanking[0].fullName}</h4>
                  {generalRanking[0].userId !== currentUser?.id && (
                    <SubscribeButton
                      targetUserId={generalRanking[0].userId}
                      targetUserName={generalRanking[0].fullName}
                      currentUser={currentUser || null}
                      size="icon"
                      onOpenAuth={onOpenAuth}
                    />
                  )}
                </div>
                <div className="text-sm font-black text-amber-400 tabular-nums">{generalRanking[0].totalScore.toLocaleString()} pts</div>
                <div className="text-[10px] text-amber-300 font-bold mt-1">Nivo {generalRanking[0].level || 3} • {'★'.repeat(generalRanking[0].stars || 3)}</div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 md:order-3 p-4 rounded-3xl bg-[#131B2E] border border-slate-700 text-center flex flex-col items-center justify-center shadow-lg">
                <span className="text-2xl">🥉</span>
                <span className="text-[10px] font-black uppercase text-amber-600">3yèm Plas</span>
                <img
                  src={generalRanking[2].profilePhoto}
                  alt={generalRanking[2].fullName}
                  className="w-12 h-12 rounded-full object-cover my-2 border-2 border-amber-700"
                />
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="text-sm font-bold text-white truncate max-w-[130px]">{generalRanking[2].fullName}</h4>
                  {generalRanking[2].userId !== currentUser?.id && (
                    <SubscribeButton
                      targetUserId={generalRanking[2].userId}
                      targetUserName={generalRanking[2].fullName}
                      currentUser={currentUser || null}
                      size="icon"
                      onOpenAuth={onOpenAuth}
                    />
                  )}
                </div>
                <div className="text-xs font-black text-amber-400 tabular-nums">{generalRanking[2].totalScore.toLocaleString()} pts</div>
                <div className="text-[10px] text-slate-400 mt-1">Nivo {generalRanking[2].level || 2} • {'★'.repeat(generalRanking[2].stars || 2)}</div>
              </div>
            </div>
          )}

          {/* Full General Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#131B2E] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                  <th className="py-3 px-4">Pozisyon</th>
                  <th className="py-3 px-4">Foto & Non Jwè</th>
                  <th className="py-3 px-4 text-center">Nivo</th>
                  <th className="py-3 px-4 text-center">Etwal</th>
                  <th className="py-3 px-4 text-center">Abòne</th>
                  <th className="py-3 px-4 text-right font-black text-amber-400">Total Pwen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {generalRanking.map((p, idx) => {
                  const isUser = p.userId === currentUser?.id;
                  return (
                    <tr
                      key={p.userId}
                      className={`transition-colors ${
                        isUser ? 'bg-amber-500/10 font-bold' : idx < 3 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-black">
                        {idx === 0 ? '🥇 1ye' : idx === 1 ? '🥈 2yèm' : idx === 2 ? '🥉 3yèm' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.profilePhoto}
                            alt={p.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white block">
                                {p.fullName} {isUser && '(Ou menm)'}
                              </span>
                              {!isUser && (
                                <SubscribeButton
                                  targetUserId={p.userId}
                                  targetUserName={p.fullName}
                                  currentUser={currentUser || null}
                                  size="icon"
                                  onOpenAuth={onOpenAuth}
                                />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">Jwè ID: #{p.userId.slice(-4)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-black text-[11px]">
                          N{p.level || 2}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-amber-400 text-xs">
                        {'★'.repeat(Math.min(5, p.stars || 2))}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 tabular-nums">
                        {p.followers || 20}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-400 text-sm tabular-nums">
                        {p.totalScore.toLocaleString()} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. KLASMAN MATCH AK SIPÒ FANATIK */}
      {/* ======================================================== */}
      {activeTab === 'fanatik' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#131B2E] border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-black text-rose-400 uppercase tracking-wider block">Règ Klasman Fanatik:</span>
              <span>Separe total vòt ak total kado. Pwen match = 50 pts chak viktwa, vòt = 10 pts chak, kado = 5 pts chak.</span>
            </div>
            <div className="text-right shrink-0 text-slate-400 text-[11px]">
              Total Vòt Tounwa: <strong className="text-rose-400">{totalCompetitionVotes} vòt</strong>
            </div>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#131B2E] shadow-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#0B0F19]">
                  <th className="py-3 px-4">Pozisyon</th>
                  <th className="py-3 px-4">Foto & Non Jwè</th>
                  <th className="py-3 px-4 text-center">Match Genyen</th>
                  <th className="py-3 px-4 text-center">Vòt Resevwa</th>
                  <th className="py-3 px-4 text-center">% Vòt</th>
                  <th className="py-3 px-4 text-center">Kado Resevwa</th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">Valè Kado</th>
                  <th className="py-3 px-4 text-right font-black text-amber-400">Total Pwen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fanRanking.map((p, idx) => {
                  const isUser = p.userId === currentUser?.id;
                  const votes = p.votesCount || 0;
                  const votePct = totalCompetitionVotes > 0 ? Math.round((votes / totalCompetitionVotes) * 100) : 0;
                  const gifts = p.giftsCount || 0;
                  const giftVal = p.giftsValue || gifts * 50;

                  return (
                    <tr
                      key={p.userId}
                      className={`transition-colors ${
                        isUser ? 'bg-rose-500/10 font-bold' : idx < 3 ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-black">
                        {idx === 0 ? '👑 1ye' : idx === 1 ? '🥈 2yèm' : idx === 2 ? '🥉 3yèm' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.profilePhoto}
                            alt={p.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-white block">
                              {p.fullName} {isUser && '(Ou menm)'}
                            </span>
                            <span className="text-[10px] text-slate-400">Nivo {p.level || 2}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-amber-400 tabular-nums">
                        {p.matchesWon || (idx < 3 ? 2 : 1)}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-400 font-bold tabular-nums">
                        {votes} vòt
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 font-semibold tabular-nums">
                        {votePct}%
                      </td>
                      <td className="py-3 px-4 text-center text-amber-300 font-bold tabular-nums">
                        🎁 {gifts}
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-black tabular-nums">
                        {giftVal} HTG
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-400 text-sm tabular-nums">
                        {p.totalScore.toLocaleString()} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. NÒT NAN JWÈT (TOP SCORES ACROSS ALL 12 GAMES) */}
      {/* ======================================================== */}
      {activeTab === 'jwet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-3xl bg-[#131B2E] border border-slate-800 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.icon || '🎮'}</span>
                  <h4 className="text-sm font-black text-white">{g.title}</h4>
                </div>
                <span className="text-[10px] text-amber-400 font-bold">6 Nivo</span>
              </div>

              {/* High Scores List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                {g.highScores && g.highScores.length > 0 ? (
                  g.highScores.slice(0, 3).map((hs, hidx) => (
                    <div
                      key={hidx}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#0B0F19] text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-amber-400">#{hidx + 1}</span>
                        <span className="text-slate-200 truncate">{hs.userName}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-300 tabular-nums">
                        {hs.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-500 py-2 text-center">
                    Poko gen nòt anrejistre pou jwèt sa a.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
