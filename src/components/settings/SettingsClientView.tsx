"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  RotateCcw,
  Globe,
  Wifi,
  Smartphone,
  Copy,
  ExternalLink,
  Share2,
  Terminal,
  Sparkles,
  Key,
  Cpu,
} from "lucide-react";

interface SettingsClientViewProps {
  initialConfigs: any[];
  userRole: string;
}

export function SettingsClientView({
  initialConfigs,
  userRole,
}: SettingsClientViewProps) {
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Gemini AI State
  const initialGemini = (() => {
    const found = initialConfigs.find((c: any) => c.configKey === "GEMINI_AI_CONFIG");
    if (!found) return { apiKey: "", model: "gemini-2.0-flash" };
    try {
      const parsed = JSON.parse(found.configValueJson);
      return {
        apiKey: parsed.apiKey || "",
        model: parsed.model || "gemini-2.0-flash",
      };
    } catch {
      return { apiKey: "", model: "gemini-2.0-flash" };
    }
  })();

  const [geminiApiKey, setGeminiApiKey] = useState(initialGemini.apiKey);
  const [geminiModel, setGeminiModel] = useState(initialGemini.model);
  const [savingGemini, setSavingGemini] = useState(false);

  // Network & Remote Access State
  const [netInfo, setNetInfo] = useState<{
    primaryUrl: string;
    primaryIp: string;
    port: number;
    remoteTunnelUrl: string | null;
    hostname?: string;
  } | null>(null);
  const [tunnelInput, setTunnelInput] = useState("");
  const [savingTunnel, setSavingTunnel] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/network-info")
      .then((r) => r.json())
      .then((d) => {
        setNetInfo(d);
        if (d.remoteTunnelUrl) {
          setTunnelInput(d.remoteTunnelUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveTunnel = async () => {
    setSavingTunnel(true);
    try {
      const res = await fetch("/api/network-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tunnelInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setNetInfo((prev) => (prev ? { ...prev, remoteTunnelUrl: data.remoteTunnelUrl } : null));
        setSuccessMsg("Remote Mobile Access Tunnel URL saved and activated successfully!");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update remote mobile access tunnel URL.");
      }
    } catch {
      setErrorMsg("Failed to update remote mobile access tunnel URL.");
    } finally {
      setSavingTunnel(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSaveGemini = async () => {
    setSavingGemini(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configKey: "GEMINI_AI_CONFIG",
          configValueJson: JSON.stringify({
            apiKey: geminiApiKey.trim(),
            model: geminiModel,
          }),
        }),
      });
      if (res.ok) {
        setSuccessMsg("Google Gemini AI API configuration saved and active!");
      } else {
        setErrorMsg("Failed to save Gemini AI configuration.");
      }
    } catch {
      setErrorMsg("Failed to save Gemini AI configuration.");
    } finally {
      setSavingGemini(false);
    }
  };

  // Helper: load a saved config or fall back to defaults
  function loadConfig(key: string, defaults: Record<string, number>) {
    const found = initialConfigs.find((c: any) => c.configKey === key);
    if (!found) return defaults;
    try {
      const parsed = JSON.parse(found.configValueJson);
      // Values are stored as decimals (0.35), display as percent (35)
      return Object.fromEntries(
        Object.entries(defaults).map(([k]) => [
          k,
          parsed[k] !== undefined ? Math.round(parsed[k] * 100) : defaults[k],
        ])
      );
    } catch {
      return defaults;
    }
  }

  // Performance Weights — load from DB or fall back to defaults
  const [perfWeights, setPerfWeights] = useState(() =>
    loadConfig("SCORING_WEIGHTS_PERFORMANCE", {
      verifiedPerformanceWeight: 35,
      improvementWeight: 30,
      targetCapabilityWeight: 20,
      reliabilityWeight: 15,
    })
  );

  // Sponsorship Weights — load from DB or fall back to defaults
  const [sponsWeights, setSponsWeights] = useState(() =>
    loadConfig("SCORING_WEIGHTS_SPONSORSHIP", {
      verifiedPerformanceWeight: 25,
      improvementWeight: 20,
      futurePotentialWeight: 15,
      reliabilityWeight: 10,
      clubContributionWeight: 20,
      complianceWeight: 10,
    })
  );

  const perfSum =
    perfWeights.verifiedPerformanceWeight +
    perfWeights.improvementWeight +
    perfWeights.targetCapabilityWeight +
    perfWeights.reliabilityWeight;

  const sponsSum =
    sponsWeights.verifiedPerformanceWeight +
    sponsWeights.improvementWeight +
    sponsWeights.futurePotentialWeight +
    sponsWeights.reliabilityWeight +
    sponsWeights.clubContributionWeight +
    sponsWeights.complianceWeight;

  const handleSaveWeights = async (configKey: string, values: any, sum: number) => {
    if (sum !== 100) {
      setErrorMsg(`Validation Error: Weights must sum exactly to 100% (currently ${sum}%).`);
      return;
    }

    setErrorMsg("");
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configKey,
          configValueJson: JSON.stringify(values),
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Configuration ${configKey} updated and audited successfully!`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to update configuration.");
      }
    } catch {
      setErrorMsg("Network error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Nationwide Remote Access & Network Panel */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Nationwide Mobile Access & Network Synchronization
              </h2>
              <p className="text-xs text-slate-400">
                Allow remote athletes (Comrades, Two Oceans, High-Altitude Camps) to upload race times & GPX files directly to this laptop.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-Cost Encrypted Tunnel
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Box 1: Clubhouse Local Proximity */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Wifi className="h-4 w-4 text-cyan-400" />
                  Clubhouse Local Wi-Fi & Hotspot Access
                </span>
                <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  Proximity Only
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                For marshals with phones or laptops connected to the same clubhouse Wi-Fi or marshal phone hotspot.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={netInfo?.primaryUrl || "Detecting network..."}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-cyan-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => netInfo?.primaryUrl && copyToClipboard(netInfo.primaryUrl, "local")}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedField === "local" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-slate-500">
              Host PC: <code className="text-slate-400">{netInfo?.hostname || "Localhost"}</code> (Port {netInfo?.port || 3000})
            </div>
          </div>

          {/* Box 2: Nationwide Remote Access (Cloudflare Tunnel) */}
          <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/60 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  Nationwide Remote Mobile Access (Cloudflare Tunnel)
                </span>
                {netInfo?.remoteTunnelUrl ? (
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Live Active Tunnel
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Action Required
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Secure global HTTPS address accessible from any phone across South Africa without paying cloud fees.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="e.g., https://supereagles.trycloudflare.com"
                  value={tunnelInput}
                  onChange={(e) => setTunnelInput(e.target.value)}
                  className="w-full rounded-lg border border-emerald-600/60 bg-slate-900 px-3 py-1.5 text-xs font-mono text-emerald-200 placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveTunnel}
                  disabled={savingTunnel || userRole !== "SUPER_ADMIN"}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>

              {netInfo?.remoteTunnelUrl && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(netInfo.remoteTunnelUrl!, "tunnel")}
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedField === "tunnel" ? "Copied!" : "Copy Public Link"}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Super Eagles Athletics Management Portal is live! Athletes can access and log training/race results here: ${netInfo.remoteTunnelUrl}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-[#25D366]/20 border border-[#25D366]/40 px-2.5 py-1 text-[11px] font-semibold text-[#25D366] hover:bg-[#25D366]/30 flex items-center gap-1"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Share on WhatsApp Group</span>
                  </a>

                  <a
                    href={netInfo.remoteTunnelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 ml-auto"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open Portal</span>
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Terminal className="h-3.5 w-3.5" />
                <span>How to Start the Free Cloudflare Tunnel (1 Click):</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                1. On this laptop, double-click <code className="rounded bg-slate-800 px-1 py-0.5 text-emerald-400">scripts\start-remote-tunnel.bat</code> (or run <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-200">cloudflared tunnel --url http://localhost:3000</code>).
              </p>
              <p className="text-slate-400 text-[10px]">
                2. Copy the generated <code className="text-emerald-300">https://*.trycloudflare.com</code> link, paste it into the box above, and click <b>Save</b>.
              </p>
              <p className="text-slate-400 text-[10px]">
                3. Click <b>Share on WhatsApp Group</b> so remote runners in Durban or Cape Town can open their athlete profiles and submit race data directly!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Gemini AI Configuration Panel */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Google Gemini AI Intelligence & Performance Coaching
              </h2>
              <p className="text-xs text-slate-400">
                Augment coaching insights with Google Gemini sports science intelligence (Noakes, Daniels, Riegel, Gabbett).
              </p>
            </div>
          </div>
          {geminiApiKey ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Gemini API Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-400 border border-slate-700">
              <Cpu className="h-3.5 w-3.5" />
              Deterministic Offline Mode Active
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* API Key Input */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Key className="h-3.5 w-3.5 text-indigo-400" />
              <span>Google Gemini API Key</span>
            </label>
            <p className="mt-1 text-[11px] text-slate-400">
              Enter your Gemini API key from Google AI Studio. Stored securely in your local database and encrypted session.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-indigo-200 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveGemini}
                disabled={savingGemini || userRole !== "SUPER_ADMIN"}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap shadow-md"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save AI Key</span>
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>Can also be configured in <code className="text-slate-400">.env</code> as <code className="text-indigo-300">GEMINI_API_KEY</code></span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <span>Get a Free Gemini Key</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* Model Selection */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-4 shadow-sm flex flex-col justify-between">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>Selected Gemini Model</span>
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Choose the Google Gemini foundation model for coaching analysis:
              </p>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:border-indigo-400 focus:outline-none"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Highest Performance - Paid Tier / Flagship)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended - Stable Fast)</option>
                <option value="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp (Advanced Chain-of-Thought)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (High Rate Limits & Quota)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Sports Science Reasoning)</option>
              </select>
            </div>
            <p className="mt-3 text-[10px] text-slate-500 italic">
              Note: If no API key is provided, the app automatically executes the built-in deterministic mathematical engine with zero cloud fees.
            </p>
          </div>
        </div>
      </div>

      {/* Config Panel 1: Athlete Performance Index Weights */}
      <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Athlete Performance Index (API: 0–100) Component Weights
            </h2>
            <p className="text-xs text-slate-400">
              Current Total: <b className={perfSum === 100 ? "text-orange-400" : "text-rose-400"}>{perfSum}%</b> / 100%
            </p>
          </div>

          <button
            onClick={() =>
              handleSaveWeights(
                "SCORING_WEIGHTS_PERFORMANCE",
                {
                  verifiedPerformanceWeight: perfWeights.verifiedPerformanceWeight / 100,
                  improvementWeight: perfWeights.improvementWeight / 100,
                  targetCapabilityWeight: perfWeights.targetCapabilityWeight / 100,
                  reliabilityWeight: perfWeights.reliabilityWeight / 100,
                },
                perfSum
              )
            }
            disabled={saving || perfSum !== 100 || userRole !== "SUPER_ADMIN"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save API Weights</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-300">
              Verified Competition Performance
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={perfWeights.verifiedPerformanceWeight}
                onChange={(e) =>
                  setPerfWeights({
                    ...perfWeights,
                    verifiedPerformanceWeight: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1 text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
            <span className="mt-1 block text-[10px] text-slate-400">Default: 35%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-300">
              Longitudinal Performance Improvement
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={perfWeights.improvementWeight}
                onChange={(e) =>
                  setPerfWeights({
                    ...perfWeights,
                    improvementWeight: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1 text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
            <span className="mt-1 block text-[10px] text-slate-400">Default: 30%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-300">
              Target Race Goal Capability
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={perfWeights.targetCapabilityWeight}
                onChange={(e) =>
                  setPerfWeights({
                    ...perfWeights,
                    targetCapabilityWeight: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1 text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
            <span className="mt-1 block text-[10px] text-slate-400">Default: 20%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-sm">
            <label className="block text-xs font-bold text-slate-300">
              Competitive Reliability & Consistency
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={perfWeights.reliabilityWeight}
                onChange={(e) =>
                  setPerfWeights({
                    ...perfWeights,
                    reliabilityWeight: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20 rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1 text-sm font-bold text-white focus:border-orange-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
            <span className="mt-1 block text-[10px] text-slate-400">Default: 15%</span>
          </div>
        </div>
      </div>

      {/* Config Panel 2: Club Sponsorship Score Weights */}
      <div className="rounded-3xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Club Sponsorship Score (CSS: 0–100) Component Weights
            </h2>
            <p className="text-xs text-slate-400">
              Current Total: <b className={sponsSum === 100 ? "text-orange-400" : "text-rose-400"}>{sponsSum}%</b> / 100%
            </p>
          </div>

          <button
            onClick={() =>
              handleSaveWeights(
                "SCORING_WEIGHTS_SPONSORSHIP",
                {
                  verifiedPerformanceWeight: sponsWeights.verifiedPerformanceWeight / 100,
                  improvementWeight: sponsWeights.improvementWeight / 100,
                  futurePotentialWeight: sponsWeights.futurePotentialWeight / 100,
                  reliabilityWeight: sponsWeights.reliabilityWeight / 100,
                  clubContributionWeight: sponsWeights.clubContributionWeight / 100,
                  complianceWeight: sponsWeights.complianceWeight / 100,
                },
                sponsSum
              )
            }
            disabled={saving || sponsSum !== 100 || userRole !== "SUPER_ADMIN"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save CSS Weights</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Verified Perf</span>
            <input
              type="number"
              value={sponsWeights.verifiedPerformanceWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, verifiedPerformanceWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 25%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Improvement</span>
            <input
              type="number"
              value={sponsWeights.improvementWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, improvementWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 20%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Future Potential</span>
            <input
              type="number"
              value={sponsWeights.futurePotentialWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, futurePotentialWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 15%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Reliability</span>
            <input
              type="number"
              value={sponsWeights.reliabilityWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, reliabilityWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 10%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Club Reciprocity</span>
            <input
              type="number"
              value={sponsWeights.clubContributionWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, clubContributionWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 20%</span>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-300">Compliance</span>
            <input
              type="number"
              value={sponsWeights.complianceWeight}
              onChange={(e) => setSponsWeights({ ...sponsWeights, complianceWeight: parseInt(e.target.value) || 0 })}
              className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-400">Default: 10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
