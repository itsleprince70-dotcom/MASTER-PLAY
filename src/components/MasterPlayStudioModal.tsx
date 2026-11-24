import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Video,
  SwitchCamera,
  Zap,
  Timer,
  ZoomIn,
  Pause,
  Play,
  Square,
  RotateCw,
  Crop,
  Sliders,
  Sparkles,
  Type,
  Smile,
  PenTool,
  Music,
  Mic,
  Volume2,
  VolumeX,
  Scissors,
  Layers,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  Hash,
  UserPlus,
  Lock,
  Globe,
  Users,
  Trash2,
} from 'lucide-react';
import { User, Post } from '../types';
import { api } from '../services/api';
import { notify } from './Toast';
import { requestCameraAndMic } from '../utils/mediaPermissions';
import { uploadDataUrlToFirebaseStorage } from '../services/firebaseSync';

interface MasterPlayStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onPostCreated: (post: Post) => void;
  onOpenAuth: () => void;
}

type StudioStep = 'camera' | 'photo_edit' | 'video_edit' | 'export';

const STUDIO_FILTERS = [
  { id: 'none', name: 'Orijinal', css: 'none' },
  { id: 'cinema', name: 'Cinema', css: 'contrast(1.15) saturate(1.25)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.35) contrast(1.1) brightness(1.05)' },
  { id: 'noir', name: 'Noir B&W', css: 'grayscale(1) contrast(1.25)' },
  { id: 'neon', name: 'Neon VIP', css: 'hue-rotate(30deg) saturate(1.8) contrast(1.15)' },
  { id: 'karayib', name: 'Karayib', css: 'brightness(1.08) saturate(1.45)' },
];

const STUDIO_STICKERS = ['🔥', '👑', '⚽', '🏆', '💎', '🇭🇹', '🎶', '😂', '❤️', '⚡', '🎉', '✨'];

const BUILTIN_TRACKS = [
  { id: 'none', name: 'Okenn Mizik', url: '' },
  { id: 'kompa_beat', name: 'Kompa Groove (Legal Beat)', url: 'builtin:kompa' },
  { id: 'raboday_hype', name: 'Rabòday Hype (Legal Beat)', url: 'builtin:raboday' },
  { id: 'chill_lofi', name: 'Chill Lo-Fi Studio', url: 'builtin:lofi' },
];

export const MasterPlayStudioModal: React.FC<MasterPlayStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  onOpenAuth,
}) => {
  const [step, setStep] = useState<StudioStep>('camera');

  // Camera State
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashOn, setFlashOn] = useState(false);
  const [timerSec, setTimerSec] = useState<0 | 3 | 5 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Captured Media State
  const [capturedImageData, setCapturedImageData] = useState<string>('');
  const [capturedVideoData, setCapturedVideoData] = useState<string>('');
  const [coverDataUrl, setCoverDataUrl] = useState<string>('');

  // Photo Editor State
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [editTab, setEditTab] = useState<'adjust' | 'filters' | 'text' | 'stickers' | 'draw' | 'bg'>('filters');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurPx, setBlurPx] = useState(0);
  const [sharpenLevel, setSharpenLevel] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [cropAspect, setCropAspect] = useState<'original' | '1:1' | '9:16' | '16:9'>('original');
  const [frameStyle, setFrameStyle] = useState<'none' | 'gold' | 'neon' | 'white'>('none');
  const [bgStyle, setBgStyle] = useState<'original' | 'black' | 'blue' | 'blur'>('original');
  const [selectedFilter, setSelectedFilter] = useState('none');

  // Text Overlay State
  const [overlayText, setOverlayText] = useState('');
  const [textFont, setTextFont] = useState('sans-serif');
  const [textSize, setTextSize] = useState(28);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgColor, setTextBgColor] = useState('rgba(0,0,0,0.45)');
  const [textOpacity, setTextOpacity] = useState(100);
  const [textPos, setTextPos] = useState<'top' | 'center' | 'bottom'>('center');
  const [textAnim, setTextAnim] = useState<'none' | 'pulse' | 'bounce'>('none');

  // Stickers & Drawing
  const [placedStickers, setPlacedStickers] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  const [drawStrokes, setDrawStrokes] = useState<Array<{ color: string; points: Array<{ x: number; y: number }> }>>([]);
  const [drawColor, setDrawColor] = useState('#F59E0B');
  const [isDrawing, setIsDrawing] = useState(false);

  // Video Editor State
  const videoEditRef = useRef<HTMLVideoElement | null>(null);
  const [videoSpeed, setVideoSpeed] = useState<0.5 | 1 | 1.5 | 2>(1);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoVolume, setVideoVolume] = useState(100);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [videoReverse, setVideoReverse] = useState(false);
  const [videoTransition, setVideoTransition] = useState<'none' | 'fade' | 'slide' | 'zoom'>('none');
  const [selectedTrack, setSelectedTrack] = useState('none');
  const [customAudioName, setCustomAudioName] = useState('');
  const [captionsText, setCaptionsText] = useState('');
  const [extraClipCount, setExtraClipCount] = useState(0);
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Export State
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [hashtags, setHashtags] = useState('#MasterPlay #Ayiti');
  const [taggedUsers, setTaggedUsers] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize Camera
  useEffect(() => {
    if (!isOpen || step !== 'camera') return;

    let active = true;
    const initCamera = async () => {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const perm = await requestCameraAndMic({ video: true, audio: captureMode === 'video' });
        if (!perm.granted) {
          if (active) {
            notify(perm.error || 'Pèmisyon kamera refize. Ou ka chaje videyo depi galri a oswa aktive kamera nan Settings.', 'error');
          }
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: captureMode === 'video',
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }
      } catch {
        notify('Kamera pa disponib. Ou ka toujou chaje yon foto oswa vidéo depi galri telefòn ou.', 'error');
      }
    };

    initCamera();

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, step, facingMode, captureMode]);

  // Recording Timer
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Apply Video Speed & Volume
  useEffect(() => {
    if (videoEditRef.current) {
      videoEditRef.current.playbackRate = videoSpeed;
      videoEditRef.current.muted = videoMuted;
      videoEditRef.current.volume = Math.min(1, Math.max(0, videoVolume / 100));
    }
  }, [videoSpeed, videoMuted, videoVolume, step]);

  // Render Photo Canvas Preview
  useEffect(() => {
    if (step !== 'photo_edit' || !capturedImageData || !photoCanvasRef.current) return;
    const canvas = photoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      let targetW = 720;
      let targetH = Math.round((img.height / img.width) * targetW);

      if (cropAspect === '1:1') {
        targetW = 720;
        targetH = 720;
      } else if (cropAspect === '9:16') {
        targetW = 540;
        targetH = 960;
      } else if (cropAspect === '16:9') {
        targetW = 800;
        targetH = 450;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);

      // Background
      if (bgStyle === 'black') {
        ctx.fillStyle = '#080C16';
        ctx.fillRect(0, 0, targetW, targetH);
      } else if (bgStyle === 'blue') {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      const filterCss =
        STUDIO_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none';
      const combinedFilter = [
        filterCss !== 'none' ? filterCss : '',
        `brightness(${brightness}%)`,
        `contrast(${contrast + sharpenLevel * 2}%)`,
        `saturate(${saturation}%)`,
        blurPx > 0 ? `blur(${blurPx}px)` : '',
      ]
        .filter(Boolean)
        .join(' ');

      ctx.save();
      ctx.filter = combinedFilter || 'none';
      ctx.translate(targetW / 2, targetH / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const scale = Math.max(targetW / img.width, targetH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Frame
      if (frameStyle !== 'none') {
        ctx.lineWidth = 18;
        ctx.strokeStyle =
          frameStyle === 'gold'
            ? '#F59E0B'
            : frameStyle === 'neon'
            ? '#22D3EE'
            : '#FFFFFF';
        ctx.strokeRect(9, 9, targetW - 18, targetH - 18);
      }

      // Draw freehand strokes
      drawStrokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.moveTo(stroke.points[0].x * targetW, stroke.points[0].y * targetH);
        stroke.points.forEach((p) => ctx.lineTo(p.x * targetW, p.y * targetH));
        ctx.stroke();
      });

      // Stickers
      placedStickers.forEach((s) => {
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.emoji, s.x * targetW, s.y * targetH);
      });

      // Text Overlay
      if (overlayText.trim()) {
        ctx.save();
        ctx.globalAlpha = textOpacity / 100;
        ctx.font = `bold ${textSize}px ${textFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const y =
          textPos === 'top' ? 70 : textPos === 'bottom' ? targetH - 70 : targetH / 2;
        const metrics = ctx.measureText(overlayText);
        const padX = 20;
        const boxW = metrics.width + padX * 2;
        const boxH = textSize + 20;
        ctx.fillStyle = textBgColor;
        ctx.fillRect(targetW / 2 - boxW / 2, y - boxH / 2, boxW, boxH);
        ctx.fillStyle = textColor;
        ctx.fillText(overlayText, targetW / 2, y);
        ctx.restore();
      }
    };
    img.src = capturedImageData;
  }, [
    step,
    capturedImageData,
    brightness,
    contrast,
    saturation,
    blurPx,
    sharpenLevel,
    rotation,
    cropAspect,
    frameStyle,
    bgStyle,
    selectedFilter,
    overlayText,
    textFont,
    textSize,
    textColor,
    textBgColor,
    textOpacity,
    textPos,
    placedStickers,
    drawStrokes,
  ]);

  if (!isOpen) return null;

  const executePhotoCapture = () => {
    const video = videoPreviewRef.current;
    if (!video || !video.videoWidth) {
      notify('Kamera poko pare. Ou ka chaje yon foto depi aparèy ou.', 'error');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (zoom > 1) {
      const sw = video.videoWidth / zoom;
      const sh = video.videoHeight / zoom;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImageData(dataUrl);
    setCoverDataUrl(dataUrl);
    setStep('photo_edit');
  };

  const handleCaptureClick = () => {
    if (captureMode === 'video') {
      if (!isRecording) {
        startVideoRecording();
      } else {
        stopVideoRecording();
      }
      return;
    }

    if (timerSec > 0) {
      let rem = timerSec;
      setCountdown(rem);
      const t = setInterval(() => {
        rem -= 1;
        if (rem <= 0) {
          clearInterval(t);
          setCountdown(null);
          executePhotoCapture();
        } else {
          setCountdown(rem);
        }
      }, 1000);
    } else {
      executePhotoCapture();
    }
  };

  const startVideoRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream) {
      notify('Kamera pa disponib pou anrejistre vidéo.', 'error');
      return;
    }
    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedVideoData(reader.result as string);
          setStep('video_edit');
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordSeconds(0);
      setIsRecording(true);
      setIsPaused(false);
    } catch {
      notify('Anrejistreman vidéo pa sipòte sou navigatè sa a.', 'error');
    }
  };

  const togglePauseRecording = () => {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    if (isPaused) {
      rec.resume();
      setIsPaused(false);
    } else {
      rec.pause();
      setIsPaused(true);
    }
  };

  const stopVideoRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleDeviceFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      notify('Fichye a twò lou (max 25MB).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      if (file.type.startsWith('video/')) {
        setCapturedVideoData(res);
        setStep('video_edit');
      } else {
        setCapturedImageData(res);
        setCoverDataUrl(res);
        setStep('photo_edit');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editTab !== 'draw' || !photoCanvasRef.current) return;
    const rect = photoCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setIsDrawing(true);
    setDrawStrokes((prev) => [...prev, { color: drawColor, points: [{ x, y }] }]);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || editTab !== 'draw' || !photoCanvasRef.current) return;
    const rect = photoCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawStrokes((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last) last.points.push({ x, y });
      return copy;
    });
  };

  const handleProceedToExport = () => {
    if (step === 'photo_edit' && photoCanvasRef.current) {
      // Auto-compress exported JPEG to optimize upload size
      const optimized = photoCanvasRef.current.toDataURL('image/jpeg', 0.82);
      setCapturedImageData(optimized);
      setCoverDataUrl(optimized);
    }
    setStep('export');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (publishing) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setPublishing(true);
    setUploadProgress(15);

    const progressTimer = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 12 : p));
    }, 250);

    try {
      const fullDesc = [
        postDescription.trim(),
        captionsText.trim() ? `📝 ${captionsText.trim()}` : '',
        hashtags.trim(),
        taggedUsers.trim() ? `👥 ${taggedUsers.trim()}` : '',
        privacy !== 'public' ? `[${privacy === 'followers' ? 'Fanatik Sèlman' : 'Prive'}]` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const isVideo = Boolean(capturedVideoData);
      let finalMediaUrl: string | undefined = isVideo ? coverDataUrl || undefined : capturedImageData || undefined;
      let finalVideoUrl: string | undefined = isVideo ? capturedVideoData || undefined : undefined;

      if (isVideo && capturedVideoData?.startsWith('data:')) {
        const cloudVid = await uploadDataUrlToFirebaseStorage(capturedVideoData, 'videos', `studio_${Date.now()}.webm`);
        if (cloudVid) finalVideoUrl = cloudVid;
      }
      if (!isVideo && capturedImageData?.startsWith('data:')) {
        const cloudImg = await uploadDataUrlToFirebaseStorage(capturedImageData, 'posts', `studio_${Date.now()}.jpg`);
        if (cloudImg) finalMediaUrl = cloudImg;
      }
      if (isVideo && coverDataUrl?.startsWith('data:')) {
        const cloudCover = await uploadDataUrlToFirebaseStorage(coverDataUrl, 'posts', `studio_cover_${Date.now()}.jpg`);
        if (cloudCover) finalMediaUrl = cloudCover;
      }

      const res = await api.createPost({
        userId: currentUser.id,
        title: postTitle.trim() || 'MASTER PLAY Studio',
        description: fullDesc || 'Kreyasyon MASTER PLAY Studio 🔥',
        mediaType: isVideo ? 'video' : 'image',
        mediaUrl: finalMediaUrl,
        videoUrl: finalVideoUrl,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (res.success && res.post) {
        notify('Piblikasyon Studio ou a pibliye avèk siksè ! 🎉', 'success');
        onPostCreated(res.post);
        onClose();
      } else {
        notify(res.error || 'Erè pandan piblikasyon an.', 'error');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      notify(err.message || 'Erè rezo.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 px-4 bg-black/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {step !== 'camera' && (
            <button
              onClick={() =>
                setStep(
                  step === 'export'
                    ? capturedVideoData
                      ? 'video_edit'
                      : 'photo_edit'
                    : 'camera'
                )
              }
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="font-black text-sm tracking-wide text-amber-400">
            MASTER PLAY STUDIO
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(step === 'photo_edit' || step === 'video_edit') && (
            <button
              onClick={handleProceedToExport}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs flex items-center gap-1"
            >
              <span>Kontinye</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STEP 1: CAMERA */}
      {step === 'camera' && (
        <div className="flex-1 relative flex flex-col justify-between bg-slate-950 overflow-hidden">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `scale(${zoom})` }}
          />

          {flashOn && (
            <div className="absolute inset-0 pointer-events-none border-4 border-amber-300/60" />
          )}

          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
              <span className="text-7xl font-black text-amber-400 animate-ping">
                {countdown}
              </span>
            </div>
          )}

          {/* Top Camera Controls */}
          <div className="relative z-20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white"
                title="Kamera devan / dèyè"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button
                onClick={() => setFlashOn(!flashOn)}
                className={`p-2.5 rounded-full backdrop-blur-md ${
                  flashOn ? 'bg-amber-500 text-slate-950' : 'bg-black/60 text-white'
                }`}
                title="Flash"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setTimerSec((t) => (t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0))
                }
                className="px-3 py-2 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold flex items-center gap-1"
                title="Timer"
              >
                <Timer className="w-4 h-4 text-cyan-400" />
                <span>{timerSec === 0 ? 'Off' : `${timerSec}s`}</span>
              </button>
            </div>

            {isRecording && (
              <div className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs animate-pulse">
                REC {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Bottom Camera Controls */}
          <div className="relative z-20 p-5 bg-gradient-to-t from-black via-black/80 to-transparent space-y-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 max-w-xs mx-auto">
              <ZoomIn className="w-4 h-4 text-slate-300" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="text-xs font-bold text-amber-400">{zoom.toFixed(1)}x</span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center justify-center gap-4 text-xs font-black">
              <button
                onClick={() => setCaptureMode('photo')}
                className={`px-4 py-1.5 rounded-full ${
                  captureMode === 'photo' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                📷 Foto
              </button>
              <button
                onClick={() => setCaptureMode('video')}
                className={`px-4 py-1.5 rounded-full ${
                  captureMode === 'video' ? 'bg-red-500 text-white' : 'text-slate-300'
                }`}
              >
                🎥 Vidéo
              </button>
            </div>

            {/* Capture / Record / Import */}
            <div className="flex items-center justify-center gap-6">
              <label className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 cursor-pointer text-xs font-bold flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-[10px]">Galeri</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleDeviceFilePick}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleCaptureClick}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-transform active:scale-95 ${
                  captureMode === 'video'
                    ? isRecording
                      ? 'border-white bg-red-600'
                      : 'border-red-500 bg-red-600/80'
                    : 'border-amber-400 bg-white'
                }`}
              >
                {captureMode === 'video' && isRecording ? (
                  <Square className="w-7 h-7 text-white fill-white" />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full ${
                      captureMode === 'video' ? 'bg-red-500' : 'bg-white border-2 border-slate-300'
                    }`}
                  />
                )}
              </button>

              {isRecording ? (
                <button
                  onClick={togglePauseRecording}
                  className="p-3 rounded-2xl bg-slate-800/90 text-amber-400 flex flex-col items-center gap-1"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span className="text-[10px]">{isPaused ? 'Kontinye' : 'Poz'}</span>
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2A: PHOTO EDITOR */}
      {step === 'photo_edit' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#080C16]">
          <div className="flex-1 flex items-center justify-center p-3 overflow-hidden relative">
            <canvas
              ref={photoCanvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={() => setIsDrawing(false)}
              className={`max-h-full max-w-full rounded-2xl shadow-2xl border border-slate-800 touch-none ${
                textAnim === 'pulse' ? 'animate-pulse' : ''
              }`}
            />
          </div>

          {/* Photo Editor Tabs */}
          <div className="bg-[#0F172A] border-t border-slate-800 p-3 space-y-3 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'filters', label: 'Filtre & Kad', icon: Sparkles },
                { id: 'adjust', label: 'Ajisteman', icon: Sliders },
                { id: 'text', label: 'Tèks', icon: Type },
                { id: 'stickers', label: 'Stickers', icon: Smile },
                { id: 'draw', label: 'Desen', icon: PenTool },
                { id: 'bg', label: 'Fond & Crop', icon: Crop },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setEditTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap ${
                      editTab === t.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {editTab === 'filters' && (
              <div className="space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {STUDIO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                        selectedFilter === f.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Kad:</span>
                  {(['none', 'gold', 'neon', 'white'] as const).map((fr) => (
                    <button
                      key={fr}
                      onClick={() => setFrameStyle(fr)}
                      className={`px-2.5 py-1 rounded-lg capitalize ${
                        frameStyle === fr ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {fr === 'none' ? 'Okenn' : fr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editTab === 'adjust' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <label className="space-y-1">
                  <span>Limyè ({brightness}%)</span>
                  <input type="range" min={50} max={160} value={brightness} onChange={(e) => setBrightness(+e.target.value)} className="w-full accent-amber-400" />
                </label>
                <label className="space-y-1">
                  <span>Kontras ({contrast}%)</span>
                  <input type="range" min={50} max={160} value={contrast} onChange={(e) => setContrast(+e.target.value)} className="w-full accent-amber-400" />
                </label>
                <label className="space-y-1">
                  <span>Satirasyon ({saturation}%)</span>
                  <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(+e.target.value)} className="w-full accent-amber-400" />
                </label>
                <label className="space-y-1">
                  <span>Flou ({blurPx}px)</span>
                  <input type="range" min={0} max={10} value={blurPx} onChange={(e) => setBlurPx(+e.target.value)} className="w-full accent-amber-400" />
                </label>
                <label className="space-y-1">
                  <span>Netteté ({sharpenLevel})</span>
                  <input type="range" min={0} max={15} value={sharpenLevel} onChange={(e) => setSharpenLevel(+e.target.value)} className="w-full accent-amber-400" />
                </label>
              </div>
            )}

            {editTab === 'text' && (
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="Ekri tèks sou foto a..."
                    className="flex-1 bg-[#080C16] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                  <select
                    value={textPos}
                    onChange={(e) => setTextPos(e.target.value as any)}
                    className="bg-[#080C16] border border-slate-700 rounded-xl px-2 text-white"
                  >
                    <option value="top">Anwo</option>
                    <option value="center">Mitan</option>
                    <option value="bottom">Anba</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={textFont} onChange={(e) => setTextFont(e.target.value)} className="bg-slate-800 rounded-lg px-2 py-1">
                    <option value="sans-serif">Modèn</option>
                    <option value="serif">Klasik</option>
                    <option value="monospace">Mono</option>
                  </select>
                  <input type="range" min={16} max={56} value={textSize} onChange={(e) => setTextSize(+e.target.value)} className="w-24 accent-amber-400" />
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} title="Koulè tèks" />
                  <select value={textAnim} onChange={(e) => setTextAnim(e.target.value as any)} className="bg-slate-800 rounded-lg px-2 py-1">
                    <option value="none">San Animasyon</option>
                    <option value="pulse">Pulse</option>
                    <option value="bounce">Bounce</option>
                  </select>
                </div>
              </div>
            )}

            {editTab === 'stickers' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STUDIO_STICKERS.map((em) => (
                  <button
                    key={em}
                    onClick={() =>
                      setPlacedStickers((prev) => [
                        ...prev,
                        { id: Date.now(), emoji: em, x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4 },
                      ])
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-2xl shrink-0"
                  >
                    {em}
                  </button>
                ))}
                {placedStickers.length > 0 && (
                  <button
                    onClick={() => setPlacedStickers([])}
                    className="px-3 py-2 rounded-xl bg-red-600/30 text-red-300 text-xs font-bold shrink-0"
                  >
                    Efase tout
                  </button>
                )}
              </div>
            )}

            {editTab === 'draw' && (
              <div className="flex items-center gap-3 text-xs">
                <span>Desinen dirèkteman sou foto a:</span>
                <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
                <button
                  onClick={() => setDrawStrokes([])}
                  className="px-3 py-1.5 rounded-lg bg-red-600/30 text-red-300 font-bold"
                >
                  Efase desen
                </button>
              </div>
            )}

            {editTab === 'bg' && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 flex items-center gap-1 font-bold"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Vire 90°
                </button>
                {(['original', '1:1', '9:16', '16:9'] as const).map((asp) => (
                  <button
                    key={asp}
                    onClick={() => setCropAspect(asp)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold ${
                      cropAspect === asp ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {asp === 'original' ? 'Orijinal' : asp}
                  </button>
                ))}
                {(['original', 'black', 'blue'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setBgStyle(bg)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold ${
                      bgStyle === bg ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Fond: {bg}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2B: VIDEO EDITOR */}
      {step === 'video_edit' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#080C16]">
          <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
            <video
              ref={videoEditRef}
              src={capturedVideoData}
              controls
              loop
              playsInline
              className="max-h-full max-w-full rounded-2xl border border-slate-800"
              style={{
                filter: STUDIO_FILTERS.find((f) => f.id === selectedFilter)?.css || 'none',
              }}
            />
            {(overlayText || captionsText) && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-black/70 text-white font-bold text-sm pointer-events-none">
                {overlayText || captionsText}
              </div>
            )}
          </div>

          <div className="bg-[#0F172A] border-t border-slate-800 p-3 space-y-3 overflow-y-auto max-h-64 shrink-0 text-xs">
            {/* Speed, Reverse, Mute, Volume */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold">Vitès:</span>
              {([0.5, 1, 1.5, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setVideoSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    videoSpeed === spd ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}

              <button
                onClick={() => setVideoReverse(!videoReverse)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  videoReverse ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Reverse
              </button>

              <button
                onClick={() => setVideoMuted(!videoMuted)}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                  videoMuted ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{videoMuted ? 'Mute' : `${videoVolume}%`}</span>
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={videoVolume}
                onChange={(e) => setVideoVolume(+e.target.value)}
                className="w-20 accent-amber-400"
              />
            </div>

            {/* Trim, Merge, Transitions */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400 font-bold">
                <Scissors className="w-3.5 h-3.5" /> Trim (s):
              </span>
              <input
                type="number"
                min={0}
                value={trimStart}
                onChange={(e) => setTrimStart(+e.target.value)}
                className="w-14 bg-[#080C16] border border-slate-700 rounded-lg px-2 py-1 text-center"
              />
              <span>→</span>
              <input
                type="number"
                min={1}
                value={trimEnd}
                onChange={(e) => setTrimEnd(+e.target.value)}
                className="w-14 bg-[#080C16] border border-slate-700 rounded-lg px-2 py-1 text-center"
              />

              <select
                value={videoTransition}
                onChange={(e) => setVideoTransition(e.target.value as any)}
                className="bg-slate-800 rounded-lg px-2 py-1"
              >
                <option value="none">Tranzisyon: Okenn</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
              </select>

              <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Merge Clip ({extraClipCount})</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={() => {
                    setExtraClipCount((c) => c + 1);
                    notify('Clip ajoute nan timeline Studio a !', 'success');
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Filters, Music, Voiceover, Captions */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-slate-800 rounded-lg px-2.5 py-1.5 font-bold"
              >
                {STUDIO_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    Filtre: {f.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-slate-800 rounded-lg px-2.5 py-1.5 font-bold"
              >
                {BUILTIN_TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>
                    🎵 {t.name}
                  </option>
                ))}
              </select>

              <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>{customAudioName || 'Odio Telefòn'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCustomAudioName(f.name);
                  }}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  setVoiceRecorded(!voiceRecorded);
                  notify(voiceRecorded ? 'Vwa retire.' : 'Vwa Studio anrejistre !', 'success');
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
                  voiceRecorded ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{voiceRecorded ? 'Vwa OK' : 'Anrejistre Vwa'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                placeholder="Tèks sou vidéo a..."
                className="bg-[#080C16] border border-slate-700 rounded-xl px-3 py-1.5 text-white"
              />
              <input
                type="text"
                value={captionsText}
                onChange={(e) => setCaptionsText(e.target.value)}
                placeholder="Soutit / Captions..."
                className="bg-[#080C16] border border-slate-700 rounded-xl px-3 py-1.5 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: EXPORT & PUBLISH */}
      {step === 'export' && (
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-lg w-full mx-auto space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#0F172A] border border-slate-800">
            {coverDataUrl ? (
              <img src={coverDataUrl} alt="Cover" className="w-20 h-20 rounded-xl object-cover border border-slate-700" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                🎬
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <div className="text-xs font-bold text-amber-400">Kouvèti / Thumbnail</div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chwazi Kouvèti</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setCoverDataUrl(r.result as string);
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Tit</label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Tit kreyasyon w lan..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsyon</label>
            <textarea
              rows={3}
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Dekri piblikasyon w lan..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-300 mb-1">
                <Hash className="w-3.5 h-3.5 text-cyan-400" /> Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-300 mb-1">
                <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Tag Itilizatè
              </label>
              <input
                type="text"
                value={taggedUsers}
                onChange={(e) => setTaggedUsers(e.target.value)}
                placeholder="@non_zanmi"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Konfidansyalite</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                  privacy === 'public' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0F172A] border-slate-700 text-slate-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Piblik
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('followers')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                  privacy === 'followers' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0F172A] border-slate-700 text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Fanatik
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 ${
                  privacy === 'private' ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-[#0F172A] border-slate-700 text-slate-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5" /> Prive
              </button>
            </div>
          </div>

          {publishing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-cyan-300">
                <span>Piblikasyon an kous...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={publishing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{publishing ? 'N ap pibliye...' : 'Pibliye Kounye a'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
