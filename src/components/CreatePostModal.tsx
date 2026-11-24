import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { api } from '../services/api';
import { X, Image, Video, FileText, Upload, AlertTriangle, ShieldCheck, CheckCircle2, Clock, Camera, Sparkles } from 'lucide-react';
import { notify } from './Toast';
import { MasterPlayStudioModal } from './MasterPlayStudioModal';
import { uploadMediaToFirebaseStorage } from '../services/firebaseSync';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPostCreated: (post: Post) => void;
  onOpenAuth: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  onOpenAuth,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showStudio, setShowStudio] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check 1-post-per-day status when modal opens
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setCheckingLimit(true);
    setErrorMsg(null);

    api.canUserPostToday(currentUser.id)
      .then((res) => {
        if (res.success && res.alreadyPostedToday) {
          setCanPost(false);
          setLimitMessage(res.message || 'Ou deja fè yon piblikasyon jodi a. Ou gen dwa fè yon sèl piblikasyon pa jou.');
        } else {
          setCanPost(true);
          setLimitMessage(null);
        }
      })
      .catch((err) => {
        console.error('Error checking post limit:', err);
      })
      .finally(() => {
        setCheckingLimit(false);
      });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-md w-full text-center text-white">
          <h3 className="text-lg font-black mb-2">Konekte Pou Pibliye</h3>
          <p className="text-xs text-gray-300 mb-6">Ou dwe konekte sou kont ou pou w ka fè yon piblikasyon oswa pataje yon vidéo sou Master Play.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-gray-800 text-gray-300 text-xs font-bold"
            >
              Anile
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-black text-xs font-black shadow-lg"
            >
              Konekte Kounye a
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Fichye a twò lou. Tanpri chwazi yon fichye ki mwens pase 25MB.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    if (isVideo) {
      setMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setMediaType('image');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFilePreview(result);
      setMediaUrl(result);
    };
    reader.readAsDataURL(file);

    try {
      const cloudUrl = await uploadMediaToFirebaseStorage(
        file,
        isVideo ? 'videos' : 'posts',
        file.name
      );
      if (cloudUrl) {
        setMediaUrl(cloudUrl);
      }
    } catch {
      // Keep local preview data URL fallback if Firebase Storage isn't enabled yet
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!canPost) {
      setErrorMsg(limitMessage || 'Ou deja fè yon piblikasyon jodi a.');
      return;
    }

    if (!title.trim() && !description.trim()) {
      setErrorMsg('Tanpri mete yon tit oswa yon deskripsyon pou piblikasyon w lan.');
      return;
    }

    setLoading(true);
    setUploadProgress(20);
    setErrorMsg(null);

    const timer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 15 : p));
    }, 250);

    try {
      const res = await api.createPost({
        userId: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        mediaUrl: mediaUrl.trim() || undefined,
        videoUrl: mediaType === 'video' ? mediaUrl.trim() : undefined,
      });

      clearInterval(timer);
      setUploadProgress(100);

      if (res.success && res.post) {
        notify('Piblikasyon w lan anrejistre avèk siksè ! 🎉', 'success');
        onPostCreated(res.post);
        onClose();
      } else {
        setErrorMsg(res.error || 'Erè nan kreye piblikasyon.');
      }
    } catch (err: any) {
      clearInterval(timer);
      setErrorMsg(err.message || 'Erè nan koneksyon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              MP
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">Kreye Yon Piblikasyon</h3>
              <p className="text-[11px] text-gray-400">Pataje yon jwèt, yon foto oswa yon bèl vidéo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Limit Notice (1 post per day) */}
          {checkingLimit ? (
            <div className="p-3 bg-white/5 rounded-2xl text-xs text-gray-300 text-center animate-pulse">
              W ap verifye limit jounen an...
            </div>
          ) : !canPost ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-3">
              <Clock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold block">Limit 1 Piblikasyon pa Jou Atènn</span>
                <p className="mt-0.5 text-gray-300 leading-relaxed">
                  {limitMessage || 'Ou deja fè yon piblikasyon jodi a sou Master Play. Pou evite spam, chak itilizatè ka pibliye yon sèl fwa chak jou. Mèsi pou konpreyansyon w !'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-[11px] text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Ou gen dwa fè <strong>1 piblikasyon jodi a</strong>. Chwazi pi bon kontni w la !</span>
            </div>
          )}

          {/* Explicit Content Policy Warning */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[11px] text-red-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-200">Règ Sekirite Kontni:</span>
              <p className="mt-0.5 text-gray-300">
                Tout kontni seksyèl, pònografi oswa imaj/videyo deplase entèdi nèt sou Master Play. Sistèm nan ap bloke yo otomatikman anvan yo pibliye.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-600/20 border border-red-500 rounded-2xl text-xs text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Source Choice: Galeri Telefòn vs MASTER PLAY Studio */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Galeri Telefòn</div>
                <div className="text-[10px] text-cyan-200">Chwazi foto oswa vidéo</div>
              </div>
            </div>

            <button
              type="button"
              disabled={!canPost || loading}
              onClick={() => setShowStudio(true)}
              className="p-3 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 flex items-center gap-2.5 text-left transition-all disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <span>MASTER PLAY Studio</span>
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-300">Kamera, Efè, Mizik & Edite</div>
              </div>
            </button>
          </div>

          {/* Media Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">Kalite Piblikasyon</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mediaType === 'image'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Foto</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mediaType === 'video'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vidéo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMediaType('text');
                  setMediaUrl('');
                  setFilePreview(null);
                }}
                className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mediaType === 'text'
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tèks Sèlman</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Tit</label>
            <input
              type="text"
              placeholder="Eg: Bèl viktwa nan Kèkè jodi a !"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canPost || loading}
              className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Deskripsyon oswa Mesaj</label>
            <textarea
              rows={3}
              placeholder="Ekri sa k nan lespri w..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canPost || loading}
              className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Media Input (If image or video) */}
          {mediaType !== 'text' && (
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-gray-300">
                Chwazi Fichye {mediaType === 'video' ? 'Vidéo' : 'Foto'}
              </label>

              {/* File Upload Button */}
              <div className="flex gap-2 items-center">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors ${!canPost || loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">
                    Chaje {mediaType === 'video' ? 'Vidéo' : 'Foto'} depi aparèy ou
                  </span>
                  <input
                    type="file"
                    accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                    onChange={handleFileUpload}
                    disabled={!canPost || loading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Media URL */}
              <div>
                <input
                  type="text"
                  placeholder={`Oswa kole yon lyen ${mediaType === 'video' ? 'vidéo (MP4, Vidéo Master, YouTube)' : 'foto'} dirèk...`}
                  value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    setFilePreview(e.target.value);
                  }}
                  disabled={!canPost || loading}
                  className="w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Preview */}
              {filePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-48 bg-black flex items-center justify-center">
                  {mediaType === 'video' || filePreview.startsWith('data:video/') ? (
                    <video
                      src={filePreview}
                      controls
                      className="max-h-44 rounded-xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <img src={filePreview} alt="Preview" className="max-h-44 object-contain rounded-xl" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFilePreview(null);
                      setMediaUrl('');
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-cyan-300">
                <span>Piblikasyon an kous...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
            >
              Anile
            </button>
            <button
              type="submit"
              disabled={!canPost || loading}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs shadow-xl transition-all ${
                !canPost || loading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black active:scale-95'
              }`}
            >
              {loading ? 'W ap verifye & pibliye...' : !canPost ? 'Piblikasyon Fèmen Jodi a' : 'Pibliye Kounye a'}
            </button>
          </div>
        </form>
      </div>

      {/* Integrated MASTER PLAY Studio Modal */}
      <MasterPlayStudioModal
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        currentUser={currentUser}
        onPostCreated={(post) => {
          setShowStudio(false);
          onPostCreated(post);
          onClose();
        }}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
