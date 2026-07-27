import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Pause, Play, Square, ArrowLeft } from "lucide-react";
import { T } from "../../../shared/theme/tokens";
import { fmtTime } from "../../../shared/lib/utils";
import Pill from "../../../shared/components/ui/Pill";
import StatusBanner from "../../../shared/components/ui/StatusBanner";

export default function RecordScreen({ patient, onFinish, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micState, setMicState] = useState("idle");
  const [status, setStatus] = useState({ variant: "info", title: "Ready to record", message: "Choose a patient and start when you are ready." });
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const drawSimulated = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = T.teal;
    const bars = 64;
    for (let i = 0; i < bars; i++) {
      const amp = isPaused ? 0.08 : Math.abs(Math.sin(Date.now() / 180 + i)) * (0.3 + Math.random() * 0.7);
      const barH = amp * h * 0.8;
      ctx.fillRect((i * w) / bars, (h - barH) / 2, (w / bars) * 0.6, barH);
    }
  }, [isPaused]);

  const drawLive = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const w = canvas.width, h = canvas.height;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = T.teal;
    const bars = 64;
    const step = Math.floor(bufferLength / bars);
    for (let i = 0; i < bars; i++) {
      const v = isPaused ? 4 : dataArray[i * step] || 0;
      const barH = (v / 255) * h * 0.85 + 3;
      ctx.fillRect((i * w) / bars, (h - barH) / 2, (w / bars) * 0.6, barH);
    }
  }, [isPaused]);

  const animate = useCallback(() => {
    if (micState === "live") drawLive();
    else drawSimulated();
    rafRef.current = requestAnimationFrame(animate);
  }, [micState, drawLive, drawSimulated]);

  async function startRecording() {
    setIsRecording(true);
    setIsPaused(false);
    setStatus({ variant: "info", title: "Starting capture", message: "Requesting microphone access and preparing the waveform…" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicState("live");
      setStatus({ variant: "success", title: "Recording active", message: "Capture is live. Pause or stop whenever you are ready." });
    } catch {
      setMicState("simulated");
      setStatus({ variant: "error", title: "Microphone unavailable", message: "Using a simulated waveform for the demo so you can continue without hardware access." });
    }
    rafRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close?.();
    };
  }, []);

  function togglePause() {
    setIsPaused((p) => !p);
    setStatus({ variant: "info", title: isPaused ? "Resumed" : "Paused", message: isPaused ? "Recording has resumed." : "Recording is paused. You can resume at any time." });
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close?.();
    setIsRecording(false);
    setStatus({ variant: "info", title: "Finishing visit", message: "Preparing the transcript and draft view…" });
    onFinish(elapsed);
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <Pill tone="ink">Visit · {patient.name}</Pill>
      <h2 style={{ fontFamily: "Source Serif 4", color: T.ink }} className="text-2xl font-semibold mt-3">
        {isRecording ? (isPaused ? "Recording paused" : "Recording consultation") : "Ready to record"}
      </h2>
      <div className="mt-4">
        <StatusBanner variant={status.variant} title={status.title} message={status.message} />
      </div>

      <div
        className="mt-8 rounded-xl border p-6"
        style={{ backgroundColor: T.raised, borderColor: T.line }}
      >
        <canvas ref={canvasRef} width={640} height={110} className="w-full h-[110px]" />
        <div
          className="mt-4 text-3xl font-semibold tabular-nums"
          style={{ fontFamily: "IBM Plex Mono", color: T.ink }}
        >
          {fmtTime(elapsed)}
        </div>

        <div className="flex items-center justify-center gap-3 mt-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-medium"
              style={{ backgroundColor: T.brick, color: "#fff", fontFamily: "Inter" }}
            >
              <Mic size={18} /> Start recording
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex items-center gap-2 px-5 py-3 rounded-full font-medium border"
                style={{ borderColor: T.line, color: T.ink, fontFamily: "Inter" }}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={stop}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium"
                style={{ backgroundColor: T.ink, color: T.paper, fontFamily: "Inter" }}
              >
                <Square size={16} /> End & transcribe
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onCancel}
        className="mt-6 text-sm inline-flex items-center gap-1"
        style={{ color: T.muted, fontFamily: "Inter" }}
      >
        <ArrowLeft size={14} /> Back to roster
      </button>
    </div>
  );
}
