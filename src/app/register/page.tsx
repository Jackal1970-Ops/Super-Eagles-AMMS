"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  Shield,
  Activity,
  Award,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "MALE",
    contactPhone: "",
    membershipCategory: "SENIOR_RUNNER",
    disciplineCategory: "RUNNER",
    primaryDiscipline: "MARATHON",
    emergencyContact: "",
    emergencyPhone: "",
    asaLicenseNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const isWalker = val.includes("WALKER");
    setFormData({
      ...formData,
      membershipCategory: val,
      disciplineCategory: isWalker ? "WALKER" : "RUNNER",
      primaryDiscipline: isWalker ? "WALKING" : formData.primaryDiscipline === "WALKING" ? "MARATHON" : formData.primaryDiscipline,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!formData.dateOfBirth) {
      setError("Please select your date of birth.");
      return;
    }

    setLoading(true);

    try {
      const emergencyCombined = formData.emergencyContact
        ? `${formData.emergencyContact}${formData.emergencyPhone ? " - " + formData.emergencyPhone : ""}`
        : null;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          preferredName: formData.preferredName || null,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          contactPhone: formData.contactPhone,
          membershipCategory: formData.membershipCategory,
          disciplineCategory: formData.disciplineCategory,
          primaryDiscipline: formData.primaryDiscipline,
          emergencyContact: emergencyCombined,
          asaLicenseNumber: formData.asaLicenseNumber || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create membership account.");
        setLoading(false);
        return;
      }

      setSuccessMsg(`Welcome to Super Eagles! Your Member ID is ${data.athleteNumber}. Redirecting to your 360° profile...`);
      setTimeout(() => {
        if (data.user?.athleteId) {
          router.push(`/athletes/${data.user.athleteId}`);
        } else {
          router.push("/dashboard");
        }
      }, 1500);
    } catch {
      setError("Network error connecting to the club server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        {/* High Definition Super Eagles Club Crest */}
        <div className="mx-auto flex justify-center py-1">
          <img
            src="/images/emblem.png"
            alt="Super Eagles Official Crest"
            className="h-32 sm:h-40 w-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-all hover:scale-105 duration-300"
          />
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Join Super Eagles Athletics Club
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
          Official New Member Registration & Digital Profile Creation
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/50 p-3.5 text-xs font-bold text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/70 p-3.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Personal Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 mb-3">
                1. Personal Bio & Credentials
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. Sipho"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Sithole"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Preferred Name / Nickname
                  </label>
                  <input
                    type="text"
                    name="preferredName"
                    value={formData.preferredName}
                    onChange={handleChange}
                    placeholder="e.g. Speedy"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Cellphone / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      name="contactPhone"
                      required
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="e.g. 082 123 4567"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Account Login & Chosen Password */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 mb-3">
                2. Login Credentials & Password
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Email Address (Username) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Choose Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-9 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    minLength={8}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Athletics & Membership Category */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-1 mb-3">
                3. Membership Category & Athletics Discipline
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Membership Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="membershipCategory"
                    value={formData.membershipCategory}
                    onChange={handleCategoryChange}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="SENIOR_RUNNER">Senior Runner (20-39 yrs) - R850/yr</option>
                    <option value="MASTER_RUNNER">Master Runner (40+ yrs) - R750/yr</option>
                    <option value="SENIOR_WALKER">Senior Walker - R600/yr</option>
                    <option value="MASTER_WALKER">Master Walker (40+ yrs) - R600/yr</option>
                    <option value="JUNIOR_RUNNER">Junior Runner (&lt;20 yrs) - R450/yr</option>
                    <option value="JUNIOR_WALKER">Junior Walker (&lt;20 yrs) - R450/yr</option>
                    <option value="SOCIAL_WALKER">Social / Recreational Walker - R400/yr</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Primary Discipline
                  </label>
                  <select
                    name="primaryDiscipline"
                    value={formData.primaryDiscipline}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MARATHON">Marathon (42.2 km)</option>
                    <option value="ULTRA_90K">Ultra Marathon (Comrades / 90km)</option>
                    <option value="ULTRA_56K">Ultra Marathon (Two Oceans / 56km)</option>
                    <option value="ULTRA_50K">Ultra Marathon (50km)</option>
                    <option value="21K">Half Marathon (21.1 km)</option>
                    <option value="10K">10 km Road Running</option>
                    <option value="5K">5 km Speed & Parkrun</option>
                    <option value="WALKING">Fitness & Social Walking</option>
                    <option value="RACE_WALK">Competitive Race Walking</option>
                    <option value="TRAIL">Trail Running</option>
                    <option value="CROSS_COUNTRY">Cross Country</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    ASA Permanent License Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="asaLicenseNumber"
                    value={formData.asaLicenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. ASA-2026-9812"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Emergency Contact Name & Relation
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="e.g. Nomsa Sithole (Spouse)"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Emergency Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="e.g. 083 999 8888"
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Annual Cycle & Policy Notice */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Super Eagles Annual Membership Policy:</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Upon registration, you will receive an official Club ID (e.g. SEA-XXX) and your 2D QR Digital Membership Card. 
                Annual dues are based on the calendar cycle ending <strong>31 December</strong>. You can settle dues via EFT, SnapScan, or Cash at the clubhouse to unlock race submissions.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-green-500 focus:outline-none disabled:opacity-50 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Creating Your Membership Profile..." : "Complete Registration & Join Super Eagles"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have a membership account?{" "}
              <Link href="/login" className="font-bold text-emerald-400 hover:underline">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
