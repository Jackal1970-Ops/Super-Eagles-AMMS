"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  X,
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";

interface CoachVoiceBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  discipline: string;
  targetRace?: string;
  briefText?: string;
}

export function CoachVoiceBriefModal({
  isOpen,
  onClose,
  athleteName,
  discipline,
  targetRace = "Comrades Marathon 2026",
  briefText,
}: CoachVoiceBriefModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  const defaultBrief =
    briefText ||
    `Good morning ${athleteName}! This is your Super Eagles morning coaching briefing. Today's Highveld weather is crisp at 16 degrees Celsius with mild humidity. Your focus today is steady aerobic maintenance. For your ${discipline.toLowerCase().replace("_", " ")}, maintain relaxed breathing through the first 5 kilometers. Keep your heart rate calibrated and remember to hydrate with electrolytes after your session. You are on track for ${targetRace}. Have a powerful, safe session with the squad!`;

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSynth(window.speechSynthesis);
    } else {
      setIsSupported(false);
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handlePlay = () => {
    if (!synth) return;

    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
      return;
    }

    synth.cancel(); // cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(defaultBrief);
    utterance.rate = 0.95; // comfortable, clear pace
    utterance.pitch = 1.0;

    // Try to pick an English voice
    const voices = synth.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.includes("en-ZA") || v.lang.includes("en-GB") || v.lang.includes("en-US")) ||
      voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synth.speak(utterance);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!synth) return;
    synth.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!synth) return;
    synth.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => {
            handleStop();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Volume2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">
                Coach Morning Audio Briefing
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800">
                <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                Hands-Free
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Voice-synthesized morning debrief for {athleteName} before tying your laces.
            </p>
          </div>
        </div>

        {/* Audio Wave / Pulse Banner */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Morning Session Briefing (30s Audio)</span>
            </div>
            {isPlaying && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 animate-pulse">
                Speaking...
              </span>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed font-sans italic border-l-2 border-emerald-500/60 pl-3">
            "{defaultBrief}"
          </p>

          {/* Audio Controls Bar */}
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-slate-900 pt-3">
            {!isPlaying ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-lg hover:bg-emerald-500 transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Play Voice Brief</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-black text-white shadow-lg hover:bg-amber-500 transition-all"
              >
                <Pause className="h-4 w-4 fill-white" />
                <span>Pause Voice</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-750 transition-all"
              title="Stop speech"
            >
              <VolumeX className="h-4 w-4" />
              <span>Stop</span>
            </button>
          </div>

          {!isSupported && (
            <div className="mt-2 text-center text-[10px] text-amber-400">
              Web Speech not supported in this browser; please read briefing text above.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Grounded in Noakes Central Governor & Daniels VDOT</span>
          </div>
          <button
            type="button"
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
