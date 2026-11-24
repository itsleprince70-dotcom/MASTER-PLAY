export type MediaPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function getCameraPermissionState(): Promise<MediaPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state;
      }
    }
  } catch {
    // Fallback for browsers that don't support camera permission query
  }
  return 'prompt';
}

export async function requestCameraAndMic(options: {
  video?: boolean;
  audio?: boolean;
}): Promise<{ granted: boolean; error?: string; deniedPermanently?: boolean }> {
  const { video = true, audio = false } = options;
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      error: 'Aparèy oswa navigatè sa a pa sipòte aksè kamera dirèk.',
    };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    const name = err?.name || '';
    const isDenied = name === 'NotAllowedError' || name === 'PermissionDeniedError';
    return {
      granted: false,
      deniedPermanently: isDenied,
      error: isDenied
        ? 'Pèmisyon kamera/mikwo refize. Ale nan Paramèt telefòn nan pou aktive Kamera ak Mikwo.'
        : 'Pa kapab ouvri kamera/mikwo aparèy la kounye a. Verifye si yon lòt aplikasyon pa ap itilize li.',
    };
  }
}
