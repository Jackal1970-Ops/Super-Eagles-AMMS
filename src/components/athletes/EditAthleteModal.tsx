"use client";

import React, { useState } from "react";
import { X, Save, AlertCircle, Calendar, Shield, Award, Mail, Phone, User as UserIcon } from "lucide-react";

interface EditAthleteModalProps {
  athlete: any;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedAthlete: any) => void;
  currentUserRole?: string;
}

export function EditAthleteModal({
  athlete,
  isOpen,
  onClose,
  onSaved,
  currentUserRole = "SUPER_ADMIN",
}: EditAthleteModalProps) {
  const isExecutive = currentUserRole === "SUPER_ADMIN" || currentUserRole === "CLUB_ADMIN";
  const isCoach = currentUserRole === "COACH";

  const [formData, setFormData] = useState({
    firstName: athlete.firstName || "",
    lastName: athlete.lastName || "",
    preferredName: athlete.preferredName || "",
    athleteNumber: athlete.athleteNumber || "",
    asaLicenseNumber: athlete.asaLicenseNumber || "",
    gender: athlete.gender || "MALE",
    dateOfBirth: athlete.dateOfBirth
      ? new Date(athlete.dateOfBirth).toISOString().split("T")[0]
      : "1995-01-01",
    contactEmail: athlete.contactEmail || "",
    contactPhone: athlete.contactPhone || "",
    emergencyContact: athlete.emergencyContact || "",
    primaryDiscipline: athlete.primaryDiscipline || "MARATHON",
    disciplineCategory: athlete.disciplineCategory || "RUNNER",
    athleteStatus: athlete.athleteStatus || "DEVELOPMENT",
    membershipCategory: athlete.membershipCategory || "SENIOR_RUNNER",
    membershipStatus: athlete.membershipStatus || "ACTIVE",
    membershipFeeStatus: athlete.membershipFeeStatus || "PAID",
    membershipExpiry: athlete.membershipExpiry
      ? new Date(athlete.membershipExpiry).toISOString().split("T")[0]
      : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update member details.");
      }

      setSuccessMessage("Member details saved successfully!");
      onSaved(data.athlete);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 overflow-hidden rounded-3xl border border-slate-700/80 bg-[#0F172A] p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-orange-500/20 p-2 text-[#F97316]">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Edit Member Profile & Details
              </h2>
              <p className="text-xs text-slate-400">
                Member #{athlete.athleteNumber} — {athlete.firstName} {athlete.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-3 text-xs text-emerald-300">
            <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Section 1: Personal & Bio */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Personal Identity & Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-semibold text-slate-300">First Name</label>
                <input
                  type="text"
                  required
                  disabled={!isExecutive && !isCoach}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Last Name</label>
                <input
                  type="text"
                  required
                  disabled={!isExecutive && !isCoach}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Preferred Name</label>
                <input
                  type="text"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Date of Birth</label>
                <input
                  type="date"
                  required
                  disabled={!isExecutive && !isCoach}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Gender</label>
                <select
                  disabled={!isExecutive && !isCoach}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Club Number</label>
                <input
                  type="text"
                  disabled={!isExecutive}
                  value={formData.athleteNumber}
                  onChange={(e) => setFormData({ ...formData, athleteNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="border-t border-slate-800 pt-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Contact & Emergency Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-semibold text-slate-300">Contact Email</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+27 82 123 4567"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. Partner (+27 83 999 8888)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Athletic Profile & Discipline */}
          <div className="border-t border-slate-800 pt-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Athletic Squad & Discipline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 font-semibold text-slate-300">Discipline Category</label>
                <select
                  disabled={!isExecutive && !isCoach}
                  value={formData.disciplineCategory}
                  onChange={(e) => setFormData({ ...formData, disciplineCategory: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="RUNNER">Runner</option>
                  <option value="WALKER">Walker (Race / Fitness)</option>
                  <option value="DUAL">Dual Athlete (Run & Walk)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Primary Discipline</label>
                <select
                  disabled={!isExecutive && !isCoach}
                  value={formData.primaryDiscipline}
                  onChange={(e) => setFormData({ ...formData, primaryDiscipline: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="5K">5 Kilometres</option>
                  <option value="10K">10 Kilometres</option>
                  <option value="21K">Half Marathon (21.1 km)</option>
                  <option value="MARATHON">Standard Marathon (42.2 km)</option>
                  <option value="ULTRA_50K">Ultra 50 km</option>
                  <option value="ULTRA_56K">Two Oceans (56 km)</option>
                  <option value="ULTRA_90K">Comrades Marathon (90 km)</option>
                  <option value="TRAIL">Trail Running</option>
                  <option value="CROSS_COUNTRY">Cross Country</option>
                  <option value="TRACK">Track & Field</option>
                  <option value="RACE_WALK">Competitive Race Walk</option>
                  <option value="WALKING">Standard Walking</option>
                  <option value="FITNESS_WALK">Health & Fitness Walk</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-300">Squad Status</label>
                <select
                  disabled={!isExecutive && !isCoach}
                  value={formData.athleteStatus}
                  onChange={(e) => setFormData({ ...formData, athleteStatus: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden disabled:opacity-50"
                >
                  <option value="DEVELOPMENT">Development Squad</option>
                  <option value="PERFORMANCE">Performance Squad</option>
                  <option value="ELITE">Elite Squad</option>
                  <option value="RECREATIONAL">Recreational / Lifestyle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Membership, License & Annual Cycle Fees */}
          {isExecutive && (
            <div className="border-t border-slate-800 pt-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                4. Membership, ASA License & Annual Renewal Cycle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-slate-300">ASA License Number</label>
                  <input
                    type="text"
                    value={formData.asaLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, asaLicenseNumber: e.target.value })}
                    placeholder="e.g. 2026-ASA-9941"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white placeholder-slate-500 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">Membership Category</label>
                  <select
                    value={formData.membershipCategory}
                    onChange={(e) => setFormData({ ...formData, membershipCategory: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="SENIOR_RUNNER">Senior Runner</option>
                    <option value="SENIOR_WALKER">Senior Walker</option>
                    <option value="MASTER_RUNNER">Master Runner</option>
                    <option value="MASTER_WALKER">Master Walker</option>
                    <option value="JUNIOR_RUNNER">Junior Runner</option>
                    <option value="JUNIOR_WALKER">Junior Walker</option>
                    <option value="SOCIAL_WALKER">Social Walker</option>
                    <option value="LIFE_MEMBER">Life Member</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">Membership Standing</label>
                  <select
                    value={formData.membershipStatus}
                    onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="ACTIVE">Active Member</option>
                    <option value="PENDING_RENEWAL">Pending Renewal</option>
                    <option value="LAPSED">Lapsed (In Arrears)</option>
                    <option value="LIFE_MEMBER">Honorary Life Member</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">Annual Fee Status</label>
                  <select
                    value={formData.membershipFeeStatus}
                    onChange={(e) => setFormData({ ...formData, membershipFeeStatus: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="PAID">Paid (Up to Date)</option>
                    <option value="PENDING">Pending (Arrears - Locked)</option>
                    <option value="EXEMPT">Exempt (Life / Executive)</option>
                    <option value="SUBSIDIZED">Subsidized (Development)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-semibold text-slate-300">
                    Membership Cycle Expiry (Annual Standard: 31 Dec)
                  </label>
                  <input
                    type="date"
                    value={formData.membershipExpiry}
                    onChange={(e) => setFormData({ ...formData, membershipExpiry: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-orange-500 focus:outline-hidden"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Cycle is Per Annum (Jan 1 – Dec 31). Members with pending dues will be restricted from uploading training, wellness, or race results.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#FB923C] transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? "Saving Changes..." : "Save Member Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
