import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Loader2, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError('Camera access was denied or is unavailable on this device.');
      }
    };
    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="glass w-full max-w-md rounded-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Camera className="h-4 w-4 text-neon" /> Capture from webcam
          </p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close camera"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
              <Loader2 className="h-6 w-6 animate-spin text-neon" />
              <span className="text-xs">Starting camera…</span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-xs text-white/60">{error}</p>
            </div>
          )}
        </div>

        <button
          onClick={capture}
          disabled={!ready}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neon py-3 text-sm font-bold text-black transition-all hover:shadow-[0_0_24px_rgba(0,255,102,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Camera className="h-4 w-4" /> Capture &amp; Analyze
        </button>
      </motion.div>
    </motion.div>
  );
}
