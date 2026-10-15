"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Calendar, Mail, Phone, Trophy, Check, ArrowLeft, Shield } from "lucide-react";

interface CoachOption {
  id: string;
  name: string;
  email: string;
}

interface AthleteRegistrationFormProps {
  coaches: CoachOption[];
  defaultAthleteNumber: string;
}

export default function AthleteRegistrationForm({
  coaches,
  defaultAthleteNumber,
}: AthleteRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    athleteNumber: defaultAthleteNumber,
    firstName: "",
    lastName: "",
    preferredName: "",
    dateOfBirth: "1998-05-15",
    gender: "MALE",
    contactEmail: "",
    contactPhone: "+27 ",
    emergencyContactName: "",
    emergencyContactPhone: "+27 ",
    asaLicenseNumber: "",
    disciplineCategory: "RUNNER",
    membershipCategory: "SENIOR_RUNNER",
    membershipFeeStatus: "PAID",
    membershipStartDate: new Date().toISOString().split("T")[0],
    athleteStatus: "DEVELOPMENT",
    primaryDiscipline: "MARATHON",
    coachId: coaches[0]?.id || "",
    targetRaceName: "Sanlam Cape Town Marathon",
    targetTimeFormatted: "3:00:00",
    targetDate: "2026-10-18",
  });

  // Calculate age automatically
  const birthYear = new Date(formData.dateOfBirth).getFullYear();
  const currentYear = new Date().getFullYear();
  const calculatedAge = !isNaN(birthYear) ? Math.max(0, currentYear - birthYear) : "--";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Convert target time hh:mm:ss to seconds
    const parts = formData.targetTimeFormatted.split(":");
    let targetTimeSeconds = 10800; // 3h default
    if (parts.length === 3) {
      targetTimeSeconds =
        parseInt(parts[0], 10) * 3600 +
        parseInt(parts[1], 10) * 60 +
        parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      targetTimeSeconds =
        parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    try {
      const res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetTimeSeconds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register athlete.");
        setLoading(false);
        return;
      }

      router.push(`/athletes/${data.athlete.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Section 1: Identification */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          1. Identification & Demographics
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Official membership credentials and competition categories.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Athlete Number *
            </label>
            <input
              type="text"
              name="athleteNumber"
              required
              value={formData.athleteNumber}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono font-bold text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="e.g. Kagiso"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Surname *
            </label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="e.g. Mokoena"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-[#F97316] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Preferred Name
            </label>
            <input
              type="text"
              name="preferredName"
              placeholder="e.g. KG"
              value={formData.preferredName}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-[#F97316] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Date of Birth * (Calculated Age: <span className="text-emerald-400 font-bold">{calculatedAge} yrs</span>)
            </label>
            <input
              type="date"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Gender Category *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-[#F97316] focus:outline-none"
            >
              <option value="MALE">Male (Senior / Master)</option>
              <option value="FEMALE">Female (Senior / Master)</option>
              <option value="OTHER">Other Category</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          2. Contact & Club Standing
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Contact Email *
            </label>
            <input
              type="email"
              name="contactEmail"
              required
              placeholder="athlete@domain.co.za"
              value={formData.contactEmail}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Phone Number
            </label>
            <input
              type="tel"
              name="contactPhone"
              placeholder="+27 82 000 0000"
              value={formData.contactPhone}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Emergency Contact Name
            </label>
            <input
              type="text"
              name="emergencyContactName"
              placeholder="Next of kin"
              value={formData.emergencyContactName}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              name="emergencyContactPhone"
              placeholder="+27 83 000 0000"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              ASA License Number
            </label>
            <input
              type="text"
              name="asaLicenseNumber"
              placeholder="e.g. ASA-2026-8819"
              value={formData.asaLicenseNumber}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Discipline Category *
            </label>
            <select
              name="disciplineCategory"
              value={formData.disciplineCategory}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="RUNNER">🏃 Road Runner</option>
              <option value="WALKER">🚶 Race / Fit Walker</option>
              <option value="DUAL">🏃🚶 Dual Discipline</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Primary Discipline *
            </label>
            <select
              name="primaryDiscipline"
              value={formData.primaryDiscipline}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="MARATHON">Marathon (42.2km)</option>
              <option value="ULTRA_MARATHON">Ultra Marathon (Comrades / Two Oceans)</option>
              <option value="HALF_MARATHON">Half Marathon (21.1km)</option>
              <option value="TEN_KM">10km Road Race</option>
              <option value="RACE_WALK">Competitive Race Walking</option>
              <option value="FIT_WALK">Fitness & Health Walking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Squad Tier *
            </label>
            <select
              name="athleteStatus"
              value={formData.athleteStatus}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="DEVELOPMENT">Development Squad</option>
              <option value="PERFORMANCE">Performance Squad</option>
              <option value="ELITE">Elite Championship Squad</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Membership Category *
            </label>
            <select
              name="membershipCategory"
              value={formData.membershipCategory}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="SENIOR_RUNNER">Senior Runner</option>
              <option value="SENIOR_WALKER">Senior Walker</option>
              <option value="JUNIOR">Junior Member (&lt;20 yrs)</option>
              <option value="MASTER">Master Member (40-49 yrs)</option>
              <option value="GRANDMASTER">Grandmaster (50+ yrs)</option>
              <option value="HONORARY">Honorary Member</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Membership Fee Status *
            </label>
            <select
              name="membershipFeeStatus"
              value={formData.membershipFeeStatus}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="PAID">PAID — Current Season</option>
              <option value="PENDING">PENDING — Invoice Issued</option>
              <option value="EXEMPT">EXEMPT — Scholarship / Life Member</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Assign Coach
            </label>
            <select
              name="coachId"
              value={formData.coachId}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">-- Unassigned --</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          3. Season Target Goal
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Target Championship Race
            </label>
            <input
              type="text"
              name="targetRaceName"
              value={formData.targetRaceName}
              onChange={handleChange}
              placeholder="e.g. Comrades Marathon"
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Target Finish Time (hh:mm:ss)
            </label>
            <input
              type="text"
              name="targetTimeFormatted"
              value={formData.targetTimeFormatted}
              onChange={handleChange}
              placeholder="2:45:00"
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Target Race Date
            </label>
            <input
              type="date"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <Link
          href="/athletes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          <span>{loading ? "Registering..." : "Complete Registration"}</span>
        </button>
      </div>
    </form>
  );
}
