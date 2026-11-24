import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, googleProvider, OperationType, handleFirestoreError } from '../firebase';
import { User, Post, NotificationItem, Transaction, Competition, Game } from '../types';

export function sanitizeId(raw: string): string {
  const cleaned = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

function safeUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  // Do not store massive base64 blobs inside Firestore documents (1MB doc limit & 2048 rule guard)
  if (url.startsWith('data:') || url.length > 2048) return undefined;
  return url;
}

function phoneToSyntheticEmail(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  return `mp_${digits || 'user'}@masterplay.app`;
}

function pinToFirebasePassword(pin: string): string {
  const clean = (pin || '0000').trim();
  return clean.length >= 6 ? `MP_${clean}` : `MP_${clean}_2026`;
}

export function normalizeE164Phone(raw: string): string {
  const cleaned = String(raw || '').replace(/[\s\-().]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (/^\d{8}$/.test(cleaned)) return `+509${cleaned}`;
  if (/^509\d{8}$/.test(cleaned)) return `+${cleaned}`;
  return `+${cleaned.replace(/^\+/, '')}`;
}

export function translateFirebaseAuthError(err: any): string {
  const code = String(err?.code || '');
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Metòd koneksyon sa a poko aktive nan Firebase Console (Authentication -> Sign-in method).';
    case 'auth/email-already-in-use':
      return 'Adrès imèl sa a gen yon kont deja. Eseye konekte pito.';
    case 'auth/invalid-email':
      return 'Adrès imèl la pa valab.';
    case 'auth/weak-password':
      return 'Modpas la dwe gen omwen 6 karaktè.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Imèl oswa modpas la pa kòrèk.';
    case 'auth/invalid-phone-number':
      return 'Nimewo telefòn nan pa nan bon fòma entènasyonal (egzanp: +50940123456).';
    case 'auth/too-many-requests':
      return 'Twòp tantativ fèt. Tanpri tann yon ti moman anvan ou eseye ankò.';
    case 'auth/invalid-verification-code':
      return 'Kòd SMS la pa kòrèk. Verifye chif yo epi eseye ankò.';
    case 'auth/code-expired':
      return 'Kòd SMS la ekspire. Mande yon nouvo kòd.';
    case 'auth/captcha-check-failed':
      return 'Verifikasyon sekirite reCAPTCHA a echwe. Rekòmanse.';
    default:
      return err?.message || 'Erè otantifikasyon Firebase.';
  }
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function clearRecaptchaVerifier(): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // ignore cleanup error
    }
    activeRecaptchaVerifier = null;
  }
}

/**
 * Create a new Firebase account using real Email & Password authentication.
 */
export async function signUpWithFirebaseEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<FirebaseUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (fullName?.trim()) {
      await updateProfile(cred.user, { displayName: fullName.trim() }).catch(() => {});
    }
    return cred.user;
  } catch (err: any) {
    throw new Error(translateFirebaseAuthError(err));
  }
}

/**
 * Sign in to an existing Firebase account using real Email & Password authentication.
 */
export async function signInWithFirebaseEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return cred.user;
  } catch (err: any) {
    throw new Error(translateFirebaseAuthError(err));
  }
}

/**
 * Send an SMS verification OTP to a user's phone number via Firebase Phone Auth + invisible reCAPTCHA.
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  recaptchaContainerId: string
): Promise<ConfirmationResult> {
  const formatted = normalizeE164Phone(phoneNumber);
  if (!formatted || formatted.length < 10) {
    throw new Error('Tanpri antre yon nimewo telefòn valab ak kòd peyi a (egzanp: +50940123456).');
  }
  clearRecaptchaVerifier();
  try {
    activeRecaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    return await signInWithPhoneNumber(auth, formatted, activeRecaptchaVerifier);
  } catch (err: any) {
    clearRecaptchaVerifier();
    throw new Error(translateFirebaseAuthError(err));
  }
}

/**
 * Confirm the 6-digit SMS OTP code to sign in with Firebase Phone Authentication.
 */
export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  smsCode: string
): Promise<FirebaseUser> {
  try {
    const cred = await confirmationResult.confirm(smsCode.trim());
    clearRecaptchaVerifier();
    return cred.user;
  } catch (err: any) {
    throw new Error(translateFirebaseAuthError(err));
  }
}

/**
 * Sign in with real Firebase Google Popup Auth.
 */
export async function signInWithFirebaseGoogle(): Promise<{
  uid: string;
  email: string;
  fullName: string;
  photo: string;
}> {
  const cred = await signInWithPopup(auth, googleProvider);
  const fbUser = cred.user;
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    fullName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Jwè MASTER PLAY'),
    photo: fbUser.photoURL || '',
  };
}

/**
 * Ensure a Firebase Auth session exists for phone+PIN users when Email/Password auth is enabled.
 * Falls back gracefully if only Google Sign-In is enabled on the Firebase project.
 */
export async function ensureFirebasePhoneSession(params: {
  phoneNumber: string;
  pin: string;
  isRegister?: boolean;
}): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;
  const email = phoneToSyntheticEmail(params.phoneNumber);
  const password = pinToFirebasePassword(params.pin);

  try {
    if (params.isRegister) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    }
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
      } catch {
        return null;
      }
    }
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        return cred.user;
      } catch {
        return null;
      }
    }
    // auth/operation-not-allowed if Email/Password is not enabled in Firebase Console
    return null;
  }
}

/**
 * Sign out from Firebase Auth without deleting any user data in Firestore.
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut warning:', err);
  }
}

/**
 * Upload media (profile photo, post image, video, or NatCash proof) to Firebase Storage.
 */
export async function uploadMediaToFirebaseStorage(
  file: File | Blob,
  folder: 'profiles' | 'posts' | 'videos' | 'proofs',
  fileName?: string
): Promise<string | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const safeName = (fileName || `media_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `users/${uid}/${folder}/${Date.now()}_${safeName}`);
    const snap = await uploadBytes(storageRef, file);
    return await getDownloadURL(snap.ref);
  } catch (err) {
    console.warn('Firebase Storage upload fallback:', err);
    return null;
  }
}

/**
 * Convert a base64 data URL (e.g. from Studio camera/canvas) into a Blob and upload to Firebase Storage.
 */
export async function uploadDataUrlToFirebaseStorage(
  dataUrl: string,
  folder: 'profiles' | 'posts' | 'videos' | 'proofs',
  fileName?: string
): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith('data:') || !auth.currentUser?.uid) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return await uploadMediaToFirebaseStorage(blob, folder, fileName);
  } catch (err) {
    console.warn('Firebase Storage dataUrl upload fallback:', err);
    return null;
  }
}

/**
 * Sync user public profile + private PII/balance to Firestore keyed by permanent Firebase UID.
 */
export async function syncUserProfileToFirestore(user: User, explicitUid?: string): Promise<void> {
  const uid = explicitUid || auth.currentUser?.uid || user.firebaseUid;
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return;

  const cleanUid = sanitizeId(uid);
  const publicPath = `users/${cleanUid}`;
  const privatePath = `users/${cleanUid}/private/info`;

  try {
    const publicRef = doc(db, 'users', cleanUid);
    const existingSnap = await getDoc(publicRef);

    const safePhoto = safeUrl(user.profilePhoto);
    const publicPayload: Record<string, any> = {
      uid: cleanUid,
      fullName: (user.fullName || user.username || 'Jwè MASTER PLAY').slice(0, 120),
      level: typeof user.level === 'number' && user.level >= 1 ? user.level : 1,
      points: typeof user.points === 'number' && user.points >= 0 ? user.points : 0,
      stars: typeof user.stars === 'number' && user.stars >= 0 ? user.stars : 1,
      followersCount: typeof user.followersCount === 'number' && user.followersCount >= 0 ? user.followersCount : 0,
      followingCount: typeof user.followingCount === 'number' && user.followingCount >= 0 ? user.followingCount : 0,
      matchesWon: typeof user.matchesWon === 'number' && user.matchesWon >= 0 ? user.matchesWon : 0,
      matchesPlayed: typeof user.matchesPlayed === 'number' && user.matchesPlayed >= 0 ? user.matchesPlayed : 0,
      isOnline: true,
      updatedAt: serverTimestamp(),
    };
    if (user.masterPlayId) publicPayload.masterPlayId = String(user.masterPlayId).slice(0, 64);
    if (safePhoto) publicPayload.profilePhoto = safePhoto;

    if (!existingSnap.exists()) {
      publicPayload.certificationStatus = 'non_sètifye';
      publicPayload.verified = false;
      publicPayload.createdAt = serverTimestamp();
      await setDoc(publicRef, publicPayload);
    } else {
      await updateDoc(publicRef, {
        fullName: publicPayload.fullName,
        level: publicPayload.level,
        points: publicPayload.points,
        stars: publicPayload.stars,
        followingCount: publicPayload.followingCount,
        matchesWon: publicPayload.matchesWon,
        matchesPlayed: publicPayload.matchesPlayed,
        isOnline: true,
        ...(safePhoto ? { profilePhoto: safePhoto } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, publicPath);
    }
  }

  try {
    const privateRef = doc(db, 'users', cleanUid, 'private', 'info');
    const privateSnap = await getDoc(privateRef);

    const privatePayload: Record<string, any> = {
      uid: cleanUid,
      balance: typeof user.balance === 'number' && user.balance >= 0 ? user.balance : 0,
      reservedBalance: typeof user.reservedBalance === 'number' && user.reservedBalance >= 0 ? user.reservedBalance : 0,
      updatedAt: serverTimestamp(),
    };
    if (user.masterPlayId) privatePayload.masterPlayId = String(user.masterPlayId).slice(0, 64);
    if (user.phoneNumber) privatePayload.phoneNumber = String(user.phoneNumber).slice(0, 40);
    if (user.email) privatePayload.email = String(user.email).slice(0, 160);

    if (!privateSnap.exists()) {
      await setDoc(privateRef, privatePayload);
    } else {
      await updateDoc(privateRef, privatePayload);
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }
}

/**
 * Hydrate user data from Firestore on login / session restore (including private PII/balance).
 */
export async function hydrateUserFromFirestore(uid: string): Promise<Partial<User> | null> {
  if (!uid || !auth.currentUser) return null;
  const cleanUid = sanitizeId(uid);

  try {
    const [pubSnap, privSnap] = await Promise.all([
      getDoc(doc(db, 'users', cleanUid)),
      getDoc(doc(db, 'users', cleanUid, 'private', 'info')).catch(() => null),
    ]);

    if (!pubSnap.exists() && (!privSnap || !privSnap.exists())) return null;

    const pub = pubSnap.exists() ? pubSnap.data() : {};
    const priv = privSnap && privSnap.exists() ? privSnap.data() : {};

    return {
      firebaseUid: cleanUid,
      ...(pub.masterPlayId || priv.masterPlayId ? { masterPlayId: pub.masterPlayId || priv.masterPlayId } : {}),
      ...(pub.fullName ? { fullName: pub.fullName } : {}),
      ...(pub.profilePhoto ? { profilePhoto: pub.profilePhoto } : {}),
      ...(typeof pub.level === 'number' ? { level: pub.level } : {}),
      ...(typeof pub.points === 'number' ? { points: pub.points } : {}),
      ...(typeof pub.stars === 'number' ? { stars: pub.stars } : {}),
      ...(typeof pub.followersCount === 'number' ? { followersCount: pub.followersCount } : {}),
      ...(typeof pub.followingCount === 'number' ? { followingCount: pub.followingCount } : {}),
      ...(typeof pub.matchesWon === 'number' ? { matchesWon: pub.matchesWon } : {}),
      ...(typeof pub.matchesPlayed === 'number' ? { matchesPlayed: pub.matchesPlayed } : {}),
      ...(pub.certificationStatus ? { certificationStatus: pub.certificationStatus } : {}),
      ...(typeof pub.verified === 'boolean' ? { verified: pub.verified } : {}),
      ...(priv.phoneNumber ? { phoneNumber: priv.phoneNumber } : {}),
      ...(priv.email ? { email: priv.email } : {}),
      ...(typeof priv.balance === 'number' ? { balance: priv.balance } : {}),
      ...(typeof priv.reservedBalance === 'number' ? { reservedBalance: priv.reservedBalance } : {}),
    };
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.GET, `users/${cleanUid}`);
    }
    return null;
  }
}

/**
 * Sync per-game 7-level progress and high score to Firestore.
 */
export async function syncGameProgressToFirestore(params: {
  gameId: string;
  currentLevel?: number;
  highScore?: number;
  totalPoints?: number;
  completedLevelsCount?: number;
  sessionPaid?: boolean;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !params.gameId) return;

  const cleanUid = sanitizeId(uid);
  const cleanGameId = sanitizeId(params.gameId);
  const path = `users/${cleanUid}/gameProgress/${cleanGameId}`;

  try {
    // Ensure parent user doc exists before writing subcollection (rules Master Gate check)
    const userSnap = await getDoc(doc(db, 'users', cleanUid));
    if (!userSnap.exists()) return;

    const progressRef = doc(db, 'users', cleanUid, 'gameProgress', cleanGameId);
    const existingSnap = await getDoc(progressRef);

    const payload: Record<string, any> = {
      uid: cleanUid,
      gameId: cleanGameId,
      currentLevel: Math.max(1, Number(params.currentLevel) || 1),
      highScore: Math.max(0, Number(params.highScore) || 0),
      totalPoints: Math.max(0, Number(params.totalPoints) || 0),
      completedLevelsCount: Math.max(0, Number(params.completedLevelsCount) || 0),
      sessionPaid: Boolean(params.sessionPaid),
      updatedAt: serverTimestamp(),
    };

    if (!existingSnap.exists()) {
      await setDoc(progressRef, payload);
    } else {
      await updateDoc(progressRef, {
        currentLevel: payload.currentLevel,
        highScore: payload.highScore,
        totalPoints: payload.totalPoints,
        completedLevelsCount: payload.completedLevelsCount,
        sessionPaid: payload.sessionPaid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Sync user payment / NatCash / bet transaction to Firestore ledger subcollection.
 */
export async function syncTransactionToFirestore(tx: Partial<Transaction> & { id: string; type: string; amount: number; status: string }): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !tx?.id) return;

  const cleanUid = sanitizeId(uid);
  const cleanTxId = sanitizeId(tx.id);
  const path = `users/${cleanUid}/transactions/${cleanTxId}`;

  const allowedUserTypes = ['depo', 'retre', 'frè_jwèt', 'enskripsyon_konpetisyon', 'vòt', 'kado', 'avion_crash_miz'];
  const normalizedType = allowedUserTypes.includes(tx.type) ? tx.type : 'frè_jwèt';
  const normalizedStatus: 'an_atant' | 'konfime' | 'refize' =
    tx.status === 'konfime' || tx.status === 'refize' ? tx.status : 'an_atant';

  try {
    const userSnap = await getDoc(doc(db, 'users', cleanUid));
    if (!userSnap.exists()) return;

    const txRef = doc(db, 'users', cleanUid, 'transactions', cleanTxId);
    const existingSnap = await getDoc(txRef);
    if (existingSnap.exists()) return; // User cannot mutate existing transaction; admin handles approvals

    const proof = safeUrl(tx.proofImage);
    const payload: Record<string, any> = {
      id: cleanTxId,
      uid: cleanUid,
      referenceId: String(tx.referenceId || cleanTxId).slice(0, 64),
      type: normalizedType,
      amount: Math.max(0, Number(tx.amount) || 0),
      status: normalizedStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (proof) payload.proofImage = proof;
    if (tx.metadata?.description) payload.description = String(tx.metadata.description).slice(0, 500);

    await setDoc(txRef, payload);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

/**
 * Sync a newly created post to Firestore.
 */
export async function syncPostToFirestore(post: Post): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const postId = sanitizeId(post.id || `post_${Date.now()}`);
  const path = `posts/${postId}`;

  try {
    const mediaUrl = safeUrl(post.mediaUrl);
    const videoUrl = safeUrl(post.videoUrl);
    const authorPhoto = safeUrl(post.authorPhoto);
    const allowedMedia = ['text', 'image', 'video', 'none'].includes(post.mediaType || '')
      ? post.mediaType
      : 'text';

    const payload: Record<string, any> = {
      id: postId,
      authorUid: uid,
      authorName: (post.authorName || 'Jwè MASTER PLAY').slice(0, 120),
      title: (post.title || 'Piblikasyon').slice(0, 200),
      description: (post.description || '').slice(0, 2000),
      mediaType: allowedMedia,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (authorPhoto) payload.authorPhoto = authorPhoto;
    if (mediaUrl) payload.mediaUrl = mediaUrl;
    if (videoUrl) payload.videoUrl = videoUrl;

    await setDoc(doc(db, 'posts', postId), payload);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

/**
 * Sync a post like toggle to Firestore (likes subcollection + likesCount).
 */
export async function syncPostLikeToFirestore(postId: string, liked: boolean, likesCount: number): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !postId) return;

  const cleanPostId = sanitizeId(postId);
  const cleanUid = sanitizeId(uid);

  try {
    const postRef = doc(db, 'posts', cleanPostId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const likeRef = doc(db, 'posts', cleanPostId, 'likes', cleanUid);
    if (liked) {
      await setDoc(likeRef, { uid: cleanUid, createdAt: serverTimestamp() });
    } else {
      await deleteDoc(likeRef).catch(() => {});
    }

    await updateDoc(postRef, {
      likesCount: Math.max(0, Number(likesCount) || 0),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, `posts/${cleanPostId}/likes/${cleanUid}`);
    }
  }
}

/**
 * Sync a new comment on a post to Firestore.
 */
export async function syncPostCommentToFirestore(
  postId: string,
  comment: { id?: string; authorName: string; text: string },
  commentsCount: number
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !postId || !comment.text) return;

  const cleanPostId = sanitizeId(postId);
  const commentId = sanitizeId(comment.id || `cmt_${uid}_${Date.now()}`);

  try {
    const postRef = doc(db, 'posts', cleanPostId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    await setDoc(doc(db, 'posts', cleanPostId, 'comments', commentId), {
      id: commentId,
      authorUid: uid,
      authorName: (comment.authorName || 'Jwè MASTER PLAY').slice(0, 120),
      text: comment.text.slice(0, 1000),
      createdAt: serverTimestamp(),
    });

    await updateDoc(postRef, {
      commentsCount: Math.max(0, Number(commentsCount) || 0),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.CREATE, `posts/${cleanPostId}/comments/${commentId}`);
    }
  }
}

/**
 * Sync a follow/subscribe edge to Firestore (only when target user exists in Firestore).
 */
export async function syncFollowToFirestore(
  targetUidRaw: string,
  isFollowing: boolean
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !targetUidRaw) return;

  const followerUid = sanitizeId(uid);
  const targetUid = sanitizeId(targetUidRaw);
  if (followerUid === targetUid) return;

  try {
    const [meSnap, targetSnap] = await Promise.all([
      getDoc(doc(db, 'users', followerUid)),
      getDoc(doc(db, 'users', targetUid)),
    ]);
    if (!meSnap.exists() || !targetSnap.exists()) return;

    const followingRef = doc(db, 'users', followerUid, 'following', targetUid);
    const followerRef = doc(db, 'users', targetUid, 'followers', followerUid);

    if (isFollowing) {
      const edge = { followerUid, targetUid, createdAt: serverTimestamp() };
      await Promise.all([setDoc(followingRef, edge), setDoc(followerRef, edge)]);
    } else {
      await Promise.all([deleteDoc(followingRef).catch(() => {}), deleteDoc(followerRef).catch(() => {})]);
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, `users/${followerUid}/following/${targetUid}`);
    }
  }
}

/**
 * Sync competition participant registration & totalScore to Firestore.
 */
export async function syncCompetitionParticipationToFirestore(
  competitionId: string,
  user: User,
  totalScore: number = 0
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || !competitionId) return;

  const cleanCompId = sanitizeId(competitionId);
  const cleanUid = sanitizeId(uid);
  const path = `competitions/${cleanCompId}/participants/${cleanUid}`;

  try {
    const compSnap = await getDoc(doc(db, 'competitions', cleanCompId));
    if (!compSnap.exists()) return;

    const partRef = doc(db, 'competitions', cleanCompId, 'participants', cleanUid);
    const existingSnap = await getDoc(partRef);

    if (!existingSnap.exists()) {
      await setDoc(partRef, {
        uid: cleanUid,
        fullName: (user.fullName || user.username || 'Jwè MASTER PLAY').slice(0, 120),
        totalScore: Math.max(0, Number(totalScore) || 0),
        matchesWon: 0,
        votesCount: 0,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(partRef, {
        totalScore: Math.max(0, Number(totalScore) || 0),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Sync a game score to Firestore leaderboard collection.
 */
export async function syncGameScoreToFirestore(params: {
  userName: string;
  gameId: string;
  competitionId?: string;
  score: number;
  pointsEarned?: number;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const scoreId = sanitizeId(`score_${uid}_${Date.now()}`);
  const path = `scores/${scoreId}`;

  try {
    const payload: Record<string, any> = {
      id: scoreId,
      uid,
      userName: (params.userName || 'Jwè MASTER PLAY').slice(0, 120),
      gameId: sanitizeId(params.gameId),
      score: Math.max(0, Number(params.score) || 0),
      pointsEarned: Math.max(0, Number(params.pointsEarned) || 0),
      createdAt: serverTimestamp(),
    };
    if (params.competitionId) {
      payload.competitionId = sanitizeId(params.competitionId);
    }
    await setDoc(doc(db, 'scores', scoreId), payload);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

/**
 * Admin: Sync a competition document to Firestore.
 */
export async function syncCompetitionToFirestore(comp: Competition): Promise<void> {
  if (!auth.currentUser || !comp?.id) return;
  const compId = sanitizeId(comp.id);
  const path = `competitions/${compId}`;
  try {
    const payload: Record<string, any> = {
      id: compId,
      name: (comp.name || 'Konpetisyon MASTER PLAY').slice(0, 160),
      status: (comp.status || 'active').slice(0, 64),
      entryFee: Math.max(0, Number(comp.entryFee) || 0),
      updatedAt: serverTimestamp(),
    };
    if (comp.currentDay) payload.currentDay = String(comp.currentDay).slice(0, 64);
    if (comp.prizes?.first) payload.prizesFirst = String(comp.prizes.first).slice(0, 120);
    if (comp.prizes?.second) payload.prizesSecond = String(comp.prizes.second).slice(0, 120);
    if (comp.prizes?.third) payload.prizesThird = String(comp.prizes.third).slice(0, 120);
    const championName = comp.winners?.first?.name || comp.champion?.fullName;
    if (championName) payload.championName = String(championName).slice(0, 120);
    await setDoc(doc(db, 'competitions', compId), payload);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Admin: Sync a game catalog item to Firestore.
 */
export async function syncGameToFirestore(game: Game): Promise<void> {
  if (!auth.currentUser || !game?.id) return;
  const gameId = sanitizeId(game.id);
  const path = `games/${gameId}`;
  try {
    const payload: Record<string, any> = {
      id: gameId,
      title: (game.title || 'Jwèt MASTER PLAY').slice(0, 160),
      entryFee: Math.max(0, Number(game.entryFee) || 0),
      isPaid: Boolean(game.isPaid || Number(game.entryFee) > 0),
      isActive: game.isActive !== false,
      updatedAt: serverTimestamp(),
    };
    if (game.category) payload.category = String(game.category).slice(0, 64);
    await setDoc(doc(db, 'games', gameId), payload);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

/**
 * Admin: Migrate existing database snapshot (users, games, competitions, posts) to Firestore without altering local records.
 */
export async function syncAdminMigrationToFirestore(data: {
  users: User[];
  competitions: Competition[];
  games: Game[];
  posts: Post[];
}): Promise<{
  syncedUsers: number;
  syncedCompetitions: number;
  syncedGames: number;
  syncedPosts: number;
  error?: string;
}> {
  if (!auth.currentUser) {
    return {
      syncedUsers: 0,
      syncedCompetitions: 0,
      syncedGames: 0,
      syncedPosts: 0,
      error: 'Konekte ak kont Google Admin lan (itsleprince70@gmail.com) pou ekri tout koleksyon yo nan Firestore.',
    };
  }

  let syncedUsers = 0;
  let syncedCompetitions = 0;
  let syncedGames = 0;
  let syncedPosts = 0;

  try {
    for (const game of data.games) {
      await syncGameToFirestore(game);
      syncedGames++;
    }

    for (const comp of data.competitions) {
      await syncCompetitionToFirestore(comp);
      syncedCompetitions++;
    }

    for (const post of data.posts) {
      const postId = sanitizeId(post.id);
      const authorUid = sanitizeId(post.authorId || auth.currentUser.uid);
      const mediaUrl = safeUrl(post.mediaUrl);
      const videoUrl = safeUrl(post.videoUrl);
      const authorPhoto = safeUrl(post.authorPhoto);
      const mediaType = ['text', 'image', 'video', 'none'].includes(post.mediaType || '')
        ? post.mediaType
        : 'text';

      const payload: Record<string, any> = {
        id: postId,
        authorUid,
        authorName: (post.authorName || 'MASTER PLAY').slice(0, 120),
        title: (post.title || 'Piblikasyon').slice(0, 200),
        description: (post.description || '').slice(0, 2000),
        mediaType,
        likesCount: Math.max(0, post.likes?.length || 0),
        commentsCount: Math.max(0, post.comments?.length || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (authorPhoto) payload.authorPhoto = authorPhoto;
      if (mediaUrl) payload.mediaUrl = mediaUrl;
      if (videoUrl) payload.videoUrl = videoUrl;

      const postSnap = await getDoc(doc(db, 'posts', postId));
      if (!postSnap.exists()) {
        await setDoc(doc(db, 'posts', postId), payload);
      }
      syncedPosts++;
    }

    for (const u of data.users) {
      const targetUid = sanitizeId(u.firebaseUid || u.id);
      const pubRef = doc(db, 'users', targetUid);
      const pubSnap = await getDoc(pubRef);
      const safePhoto = safeUrl(u.profilePhoto);

      if (!pubSnap.exists()) {
        const pubPayload: Record<string, any> = {
          uid: targetUid,
          fullName: (u.fullName || u.username || 'Jwè MASTER PLAY').slice(0, 120),
          level: Math.max(1, Number(u.level) || 1),
          points: Math.max(0, Number(u.points) || 0),
          stars: Math.max(0, Number(u.stars) || 1),
          followersCount: Math.max(0, Number(u.followersCount) || 0),
          followingCount: Math.max(0, Number(u.followingCount) || 0),
          matchesWon: Math.max(0, Number(u.matchesWon) || 0),
          matchesPlayed: Math.max(0, Number(u.matchesPlayed) || 0),
          certificationStatus: u.certificationStatus === 'sètifye' ? 'sètifye' : 'non_sètifye',
          verified: Boolean(u.verified || u.certificationStatus === 'sètifye'),
          isOnline: Boolean(u.isOnline),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (u.masterPlayId) pubPayload.masterPlayId = String(u.masterPlayId).slice(0, 64);
        if (safePhoto) pubPayload.profilePhoto = safePhoto;
        await setDoc(pubRef, pubPayload);
      }
      syncedUsers++;
    }

    const logId = sanitizeId(`mig_${Date.now()}`);
    await setDoc(doc(db, 'adminAudit', logId), {
      id: logId,
      action: 'MIGRASYON_CLOUD_FIREBASE',
      details: `Senkronize ${syncedUsers} itilizatè, ${syncedGames} jwèt, ${syncedCompetitions} konpetisyon, ${syncedPosts} piblikasyon nan Firestore.`,
      actor: (auth.currentUser.email || 'Admin').slice(0, 120),
      createdAt: serverTimestamp(),
    });

    return { syncedUsers, syncedCompetitions, syncedGames, syncedPosts };
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      return {
        syncedUsers,
        syncedCompetitions,
        syncedGames,
        syncedPosts,
        error: 'Pèmisyon refize nan Firestore: Verifye ke w konekte sou Firebase ak kont Google Admin (itsleprince70@gmail.com).',
      };
    }
    return {
      syncedUsers,
      syncedCompetitions,
      syncedGames,
      syncedPosts,
      error: error?.message || 'Erè pandan senkronizasyon cloud la.',
    };
  }
}

/**
 * Fetch user's cloud gameProgress docs from Firestore.
 */
export async function fetchUserCloudGameProgress(uid: string): Promise<Array<{
  gameId: string;
  currentLevel: number;
  highScore: number;
  totalPoints: number;
}>> {
  if (!uid || !auth.currentUser) return [];
  const cleanUid = sanitizeId(uid);
  try {
    const q = query(collection(db, 'users', cleanUid, 'gameProgress'), where('uid', '==', cleanUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const v = d.data();
      return {
        gameId: v.gameId || d.id,
        currentLevel: Number(v.currentLevel) || 1,
        highScore: Number(v.highScore) || 0,
        totalPoints: Number(v.totalPoints) || 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Subscribe to real-time updates for the current user's cloud profile and notifications.
 */
export function subscribeUserCloudSync(
  uid: string,
  onUserUpdate: (partial: Partial<User>) => void,
  onNotificationsUpdate?: (items: NotificationItem[]) => void
): Unsubscribe {
  if (!uid || !auth.currentUser) return () => {};
  const cleanUid = sanitizeId(uid);

  const unsubPublic = onSnapshot(
    doc(db, 'users', cleanUid),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onUserUpdate({
        firebaseUid: cleanUid,
        ...(typeof d.level === 'number' ? { level: d.level } : {}),
        ...(typeof d.points === 'number' ? { points: d.points } : {}),
        ...(typeof d.stars === 'number' ? { stars: d.stars } : {}),
        ...(typeof d.followersCount === 'number' ? { followersCount: d.followersCount } : {}),
        ...(typeof d.followingCount === 'number' ? { followingCount: d.followingCount } : {}),
        ...(d.certificationStatus ? { certificationStatus: d.certificationStatus } : {}),
        ...(typeof d.verified === 'boolean' ? { verified: d.verified } : {}),
      });
    },
    (error: any) => {
      if (error?.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, `users/${cleanUid}`);
      } else {
        console.warn('Firestore user listener warning:', error?.message || error);
      }
    }
  );

  let unsubNotifs: Unsubscribe = () => {};
  if (onNotificationsUpdate) {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', cleanUid)
    );
    unsubNotifs = onSnapshot(
      q,
      (snap) => {
        const list: NotificationItem[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              userId: d.uid,
              title: d.title,
              message: d.message,
              type: 'anons' as const,
              isRead: Boolean(d.read),
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30);
        if (list.length > 0) onNotificationsUpdate(list);
      },
      (error: any) => {
        if (error?.code === 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, 'notifications');
        } else {
          console.warn('Firestore notifications listener warning:', error?.message || error);
        }
      }
    );
  }

  return () => {
    unsubPublic();
    unsubNotifs();
  };
}
