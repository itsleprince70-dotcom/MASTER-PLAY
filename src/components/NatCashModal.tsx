import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Copy, Check, ShieldCheck, AlertCircle, Upload, Smartphone, Clock, RefreshCw, ZoomIn, Eye } from 'lucide-react';
import { User, Transaction } from '../types';
import { api } from '../services/api';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';

interface NatCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  initialTab?: 'depo' | 'retre' | 'istorik' | 'sekirite';
  userTransactions: Transaction[];
  onTransactionSuccess: (updatedUser?: User) => void;
}

export const NatCashModal: React.FC<NatCashModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'depo',
  userTransactions,
  onTransactionSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'depo' | 'retre' | 'istorik' | 'sekirite'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [zoomProof, setZoomProof] = useState(false);

  // Deposit Form State
  const [depositName, setDepositName] = useState(user?.fullName || '');
  const [depositPhone, setDepositPhone] = useState(user?.phoneNumber || '');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [proofImage, setProofImage] = useState<string>('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccessTx, setDepositSuccessTx] = useState<Transaction | null>(null);
  const [depositError, setDepositError] = useState('');

  // Withdrawal Form State
  const [withdrawName, setWithdrawName] = useState(user?.fullName || '');
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phoneNumber || '');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccessTx, setWithdrawSuccessTx] = useState<Transaction | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Foto a twò lou. Tanpri chwazi yon imaj ki pi piti pase 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setDepositError('');

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 50) {
      setDepositError('Montan minimòm pou depo se 50 HT.');
      return;
    }

    if (!depositName.trim() || !depositPhone.trim()) {
      setDepositError('Tanpri ranpli non ak nimewo NatCash ou.');
      return;
    }

    if (!proofImage) {
      setDepositError('Tanpri telechaje screenshot oswa prèv transfè NatCash la pou admin lan ka verifye l.');
      return;
    }

    setDepositLoading(true);
    try {
      const res = await api.requestDeposit({
        userId: user.id,
        natcashName: depositName.trim(),
        natcashPhone: depositPhone.trim(),
        amount: amt,
        proofImage,
      });

      if (res.success && res.transaction) {
        setDepositSuccessTx(res.transaction);
        onTransactionSuccess();
      } else {
        setDepositError(res.error || 'Erè pandan kreyasyon demann depo a.');
      }
    } catch (err: any) {
      setDepositError(err.message || 'Erè rezo.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWithdrawError('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 100) {
      setWithdrawError('Montan minimòm pou retrè se 100 HT.');
      return;
    }

    const availableBalance = user.balance - (user.reservedBalance || 0);
    if (amt > availableBalance) {
      setWithdrawError(`Balans ou pa ase. Balans disponib ou se ${availableBalance} HT.`);
      return;
    }

    if (!withdrawName.trim() || !withdrawPhone.trim()) {
      setWithdrawError('Tanpri mete non ak nimewo NatCash benefisyè a.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await api.requestWithdrawal({
        userId: user.id,
        recipientName: withdrawName.trim(),
        natcashPhone: withdrawPhone.trim(),
        amount: amt,
      });

      if (res.success && res.transaction) {
        setWithdrawSuccessTx(res.transaction);
        onTransactionSuccess(res.user);
      } else {
        setWithdrawError(res.error || 'Erè pandan kreyasyon demann retrè a.');
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Erè rezo.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const availableBalance = user ? user.balance - (user.reservedBalance || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/70 sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131B2E]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              ₦
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Tranzaksyon NatCash</h2>
              <p className="text-xs text-slate-400">Transfè rapid, serye e verifye an Ayiti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Strip */}
        <div className="px-6 py-3 bg-[#0B0F19] border-b border-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Balans disponib:{' '}
            <span className="font-bold text-emerald-400 text-sm tabular-nums">
              {availableBalance.toLocaleString()} HT
            </span>
          </div>
          {(user?.reservedBalance || 0) > 0 && (
            <div className="text-xs text-amber-400 font-medium">
              Rezève: {(user?.reservedBalance || 0).toLocaleString()} HT
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('depo')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'depo'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Depo
          </button>
          <button
            onClick={() => setActiveTab('retre')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'retre'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Retrè
          </button>
          <button
            onClick={() => setActiveTab('istorik')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'istorik'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Istorik
          </button>
          <button
            onClick={() => setActiveTab('sekirite')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sekirite'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Sekirite
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* DEPOSIT TAB */}
          {activeTab === 'depo' && (
            <div>
              {depositSuccessTx ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Demann Depo Anrejistre !</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Referans:{' '}
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        {depositSuccessTx.referenceId}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                      Estati a se <span className="text-amber-400 font-bold">« An atant »</span>. Administratè a ap verifye prèv transfè ou a epi l ap ajoute {depositSuccessTx.amount} HT nan balans ou.
                    </p>
                  </div>

                  <div className="pt-2">
                    <WhatsAppSupportButton
                      referenceId={depositSuccessTx.referenceId}
                      type="depo"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setDepositSuccessTx(null);
                      setProofImage('');
                      setActiveTab('istorik');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Gade nan Istorik tranzaksyon
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  {/* Step Guide Banner */}
                  <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Enfòmasyon Transfè NatCash
                    </div>
                    <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-700/70 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 font-medium">Nimewo pou transfè a:</div>
                        <div className="text-base font-black text-white tracking-wider flex items-center gap-1.5">
                          +509 40987659
                        </div>
                        <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                          Non sou kont lan: MATHURIN KERLINDGE
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('+50940987659')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Kopye !' : 'Kopye'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                      <div className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Fè transfè a sou NatCash</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Pran yon screenshot prèv la</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>Voye prèv la nan fòm sa a</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">4</span>
                        <span>Rete tann verifikasyon</span>
                      </div>
                    </div>
                  </div>

                  {depositError && (
                    <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{depositError}</span>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Non ki sou kont NatCash ou
                      </label>
                      <input
                        type="text"
                        required
                        value={depositName}
                        onChange={(e) => setDepositName(e.target.value)}
                        placeholder="Egzanp: Jean William"
                        className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Nimewo telefòn NatCash ou
                        </label>
                        <input
                          type="tel"
                          required
                          value={depositPhone}
                          onChange={(e) => setDepositPhone(e.target.value)}
                          placeholder="+509 XXXX XXXX"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Montan depoze (HT)
                        </label>
                        <input
                          type="number"
                          required
                          min="50"
                          step="50"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="500"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold tabular-nums focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quick amount chips */}
                    <div className="flex gap-2">
                      {[250, 500, 1000, 1500, 2500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt.toString())}
                          className={`text-xs py-1 px-2.5 rounded-lg border transition-colors ${
                            depositAmount === amt.toString()
                              ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                              : 'border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {amt} HT
                        </button>
                      ))}
                    </div>

                    {/* Screenshot / Proof upload */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">
                          Screenshot oswa kanè prèv transfè a (Obligatwa)
                        </label>
                        {proofImage && (
                          <button
                            type="button"
                            onClick={() => setZoomProof(true)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Agrandir pou verifye</span>
                          </button>
                        )}
                      </div>

                      {proofImage ? (
                        <div className="p-3 rounded-2xl bg-[#0B0F19] border border-slate-700 space-y-2">
                          <div
                            onClick={() => setZoomProof(true)}
                            className="relative cursor-pointer group rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex items-center justify-center min-h-[160px]"
                          >
                            <img
                              src={proofImage}
                              alt="Prèv transfè NatCash"
                              className="max-h-52 w-full object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                              <Eye className="w-4 h-4" />
                              <span>Klike pou agrandi</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Foto chwazi an gwo kalite
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setZoomProof(true)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <ZoomIn className="w-3 h-3" />
                                <span>Agrandir</span>
                              </button>
                              <label className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors">
                                <span>Chanje</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProofUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl p-5 cursor-pointer bg-[#0B0F19] transition-colors group">
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <Upload className="w-7 h-7 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                            <span className="text-xs font-bold text-slate-200">
                              Chwazi yon screenshot nan galri telefòn ou
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Asire w nimewo transfè, montan ak dat la parèt klè
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              PNG, JPG oswa JPEG (Gwo kalite sipòte)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* FULL RESOLUTION PROOF INSPECTION MODAL */}
                  {zoomProof && proofImage && (
                    <div
                      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
                      onClick={() => setZoomProof(false)}
                    >
                      <div
                        className="relative max-w-4xl max-h-[90vh] w-full bg-[#0F172A] border border-slate-700 rounded-3xl p-4 flex flex-col items-center shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="text-left">
                            <div className="text-sm font-black text-white flex items-center gap-2">
                              <Eye className="w-4 h-4 text-emerald-400" />
                              <span>Verifikasyon Prèv Transfè NatCash</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Verifye si referans, montan ak dat transfè a byen lizib.
                            </div>
                          </div>
                          <button
                            onClick={() => setZoomProof(false)}
                            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="w-full flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px]">
                          <img
                            src={proofImage}
                            alt="Prèv transfè plen ekran"
                            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-slate-800"
                          />
                        </div>

                        <div className="w-full pt-3 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={() => setZoomProof(false)}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider"
                          >
                            Fèmen Verifikasyon
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {depositLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>N ap anrejistre demann lan...</span>
                      </>
                    ) : (
                      <span>Soumèt demann depo a</span>
                    )}
                  </button>

                  <div className="pt-1">
                    <WhatsAppSupportButton type="depo" />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* WITHDRAWAL TAB */}
          {activeTab === 'retre' && (
            <div>
              {withdrawSuccessTx ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Demann Retrè Anrejistre !</h3>
                    <p className="text-sm text-slate-300 mt-1">
                      Referans:{' '}
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        {withdrawSuccessTx.referenceId}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                      Nou rezève <span className="text-white font-bold">{withdrawSuccessTx.amount} HT</span> nan balans ou. Administratè a ap fè transfè NatCash la sou <span className="text-emerald-400 font-bold">{withdrawSuccessTx.natcashPhone}</span> apre verifikasyon.
                    </p>
                  </div>

                  <div className="pt-2">
                    <WhatsAppSupportButton
                      referenceId={withdrawSuccessTx.referenceId}
                      type="retre"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setWithdrawSuccessTx(null);
                      setActiveTab('istorik');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Gade nan Istorik tranzaksyon
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Règ Retrè NatCash
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Montan minimòm pou retire se <strong>100 HT</strong>.</li>
                      <li>Lajan an rezève otomatikman pou sekirite kont ou.</li>
                      <li>Admin lan verifye e voye lajan an sou nimewo NatCash ou bay la.</li>
                      <li>Si yon retrè refize, montan an remèt nan balans disponib ou.</li>
                    </ul>
                  </div>

                  {withdrawError && (
                    <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Non konplè benefisyè a
                      </label>
                      <input
                        type="text"
                        required
                        value={withdrawName}
                        onChange={(e) => setWithdrawName(e.target.value)}
                        placeholder="Egzanp: Jean William"
                        className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Nimewo NatCash pou resevwa
                        </label>
                        <input
                          type="tel"
                          required
                          value={withdrawPhone}
                          onChange={(e) => setWithdrawPhone(e.target.value)}
                          placeholder="+509 XXXX XXXX"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Montan pou retire (HT)
                        </label>
                        <input
                          type="number"
                          required
                          min="100"
                          max={availableBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="500"
                          className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold tabular-nums focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {[100, 250, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setWithdrawAmount(Math.min(amt, availableBalance).toString())}
                          className="text-xs py-1 px-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                        >
                          {amt} HT
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(availableBalance.toString())}
                        className="text-xs py-1 px-2.5 rounded-lg border border-amber-500/50 text-amber-400 font-bold hover:bg-amber-500/10"
                      >
                        Tout ({availableBalance} HT)
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800 text-xs text-slate-400">
                    Rezime: N ap transfere <strong className="text-white">{withdrawAmount || 0} HT</strong> sou nimewo <strong className="text-white">{withdrawPhone || '...'}</strong>.
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading || availableBalance < 100}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {withdrawLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>N ap trete demann lan...</span>
                      </>
                    ) : (
                      <span>Konfime demann retrè a</span>
                    )}
                  </button>

                  <div className="pt-1">
                    <WhatsAppSupportButton type="retre" />
                  </div>
                </form>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'istorik' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tout tranzaksyon ou yo ({userTransactions.length})</span>
                <span className="text-[11px]">Klase pa dat</span>
              </div>

              {userTransactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Ou poko gen okenn tranzaksyon. Fè yon depo pou kòmanse !
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            tx.type === 'depo'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {tx.type === 'depo' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white uppercase">
                              {tx.type === 'depo' ? 'Depo NatCash' : 'Retrè NatCash'}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                              {tx.referenceId}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(tx.createdAt).toLocaleDateString('ht-HT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {tx.rejectReason && (
                            <div className="text-[11px] text-red-400 mt-1">
                              Rezon refi: {tx.rejectReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-black tabular-nums ${
                            tx.type === 'depo' ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {tx.type === 'depo' ? '+' : '-'}{tx.amount.toLocaleString()} HT
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                            tx.status === 'konfime'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'refize'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {tx.status === 'konfime'
                            ? 'Konfime'
                            : tx.status === 'refize'
                            ? 'Refize'
                            : 'An atant'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'sekirite' && (
            <div className="space-y-4">
              <div className="bg-[#131B2E] p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Sekirite & Pwoteksyon Done</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nan MASTER PLAY / Kèkè Challenge, nou bay sekirite w ak lajan w pi gwo priyorite. Tout transfè fèt sèlman sou nimewo ofisyèl la.
                </p>
                <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="text-amber-400 font-bold">Konsèy sekirite enpòtan:</div>
                  <div className="text-slate-300">• Pa janm voye kòd sekrè w bay pèsonn.</div>
                  <div className="text-slate-300">• Toujou verifye non <strong>MATHURIN KERLINDGE</strong> anvan w voye lajan.</div>
                  <div className="text-slate-300">• Pa voye lajan sou okenn lòt nimewo ki pa <strong>+509 40987659</strong>.</div>
                </div>
              </div>

              <WhatsAppSupportButton type="sipò" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
