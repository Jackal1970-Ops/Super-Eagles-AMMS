"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, CheckCircle2, AlertCircle, Clock, FileCheck, Upload, Link as LinkIcon, FileText, X } from "lucide-react";

interface AthleteOption {
  id: string;
  athleteNumber: string;
  firstName: string;
  lastName: string;
  primaryDiscipline: string;
  disciplineCategory: string | null;
}

interface RaceOption {
  id: string;
  name: string;
  defaultDistanceKm: number;
  raceCategory: string;
}

export function RecordResultForm({
  athletes,
  races,
}: {
  athletes: AthleteOption[];
  races: RaceOption[];
}) {
  const router = useRouter();
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [raceName, setRaceName] = useState("");
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [distanceKm, setDistanceKm] = useState("42.195");
  const [hours, setHours] = useState("2");
  const [minutes, setMinutes] = useState("45");
  const [seconds, setSeconds] = useState("00");
  const [bibNumber, setBibNumber] = useState("");
  const [officialResultsUrl, setOfficialResultsUrl] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRaceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedRaceId(rId);
    if (rId === "CUSTOM") {
      setRaceName("");
      return;
    }
    const found = races.find((r) => r.id === rId);
    if (found) {
      setRaceName(found.name);
      setDistanceKm(found.defaultDistanceKm.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const totalSec =
      parseInt(hours || "0", 10) * 3600 +
      parseInt(minutes || "0", 10) * 60 +
      parseInt(seconds || "0", 10);

    if (totalSec <= 0) {
      setError("Please enter a valid completion time.");
      setLoading(false);
      return;
    }

    try {
      let finalCertUrl = certificateUrl;

      // If user selected a new certificate file, upload it first
      if (certificateFile) {
        setUploadingCert(true);
        const certForm = new FormData();
        certForm.append("certificate", certificateFile);
        const uploadRes = await fetch("/api/races/upload-certificate", {
          method: "POST",
          body: certForm,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload certificate evidence file.");
        }
        finalCertUrl = uploadData.fileUrl;
        setCertificateUrl(uploadData.fileUrl);
        setUploadingCert(false);
      }

      const res = await fetch("/api/races/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          raceName: raceName || "Official Club Event",
          date,
          distanceKm: parseFloat(distanceKm),
          officialTimeSeconds: totalSec,
          verificationStatus: "VERIFIED",
          bibNumber: bibNumber.trim() || undefined,
          certificateUrl: finalCertUrl || undefined,
          officialResultsUrl: officialResultsUrl.trim() || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record result.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/athletes/${athleteId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit result.");
    } finally {
      setUploadingCert(false);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">Official Result Recorded!</h3>
        <p className="mt-1 text-xs text-slate-400">
          Updating athlete performance index and durability calculations...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Select Athlete / Member
        </label>
        <select
          value={athleteId}
          onChange={(e) => setAthleteId(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-green-500 focus:outline-none"
        >
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.lastName}, {a.firstName} ({a.athleteNumber}) • {a.disciplineCategory || a.primaryDiscipline}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Select Official Competition
          </label>
          <select
            value={selectedRaceId}
            onChange={handleRaceSelect}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-green-500 focus:outline-none"
          >
            <option value="">-- Choose from Race Library --</option>
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.defaultDistanceKm} km)
              </option>
            ))}
            <option value="CUSTOM">Other / Custom Race Name</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Race Name
          </label>
          <input
            type="text"
            required
            value={raceName}
            onChange={(e) => setRaceName(e.target.value)}
            placeholder="e.g. Kaapsehoop Marathon"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-green-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Event Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-green-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Distance (km)
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            required
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Official Electronic Timing (hh:mm:ss)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Hours</div>
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-center text-base font-mono font-bold text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Minutes</div>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-center text-base font-mono font-bold text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-1">Seconds</div>
            <input
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-center text-base font-mono font-bold text-white focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Evidence & Verification Layer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
          <FileCheck className="h-4 w-4" />
          <span>Official Timing Evidence & Document Verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Bib / Race Number (Optional)
            </label>
            <input
              type="text"
              value={bibNumber}
              onChange={(e) => setBibNumber(e.target.value)}
              placeholder="e.g. 14205"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:border-green-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Official Online Results Link (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={officialResultsUrl}
                onChange={(e) => setOfficialResultsUrl(e.target.value)}
                placeholder="https://results.finishtime.co.za/..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 pl-8 text-xs font-mono text-white focus:border-green-500 focus:outline-none placeholder:text-slate-600"
              />
              <LinkIcon className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Certificate / Slip Document Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Timing Certificate / Finisher Slip (PDF, PNG, JPG - max 8MB)
          </label>
          <div className="mt-1 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-emerald-600/60 bg-emerald-950/20 hover:bg-emerald-950/40 px-4 py-2.5 text-xs font-bold text-emerald-300 transition-colors">
              <Upload className="h-4 w-4" />
              <span>{certificateFile ? "Change Certificate" : "Upload Certificate / Timing Slip"}</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setCertificateFile(f);
                }}
              />
            </label>
            {certificateFile && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate max-w-xs">{certificateFile.name}</span>
                <button
                  type="button"
                  onClick={() => setCertificateFile(null)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Attaching a verified race certificate or timing snapshot validates this competition result against ASA and club sponsorship standards.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1.5">
          Notes / Conditions / Split Verification
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Heatwave conditions, verified against official ASA race results sheet."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-green-500 focus:outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-950/50 hover:bg-green-600 transition-all disabled:opacity-50"
        >
          <Trophy className="h-4 w-4" />
          <span>{loading ? "Recording..." : "Save Official Result"}</span>
        </button>
      </div>
    </form>
  );
}
