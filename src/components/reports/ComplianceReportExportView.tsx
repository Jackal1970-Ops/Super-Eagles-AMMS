"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  Download,
  Award,
  DollarSign,
  Lock,
  RefreshCw,
  ExternalLink,
  Users,
} from "lucide-react";

export function ComplianceReportExportView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"POPIA" | "ASA" | "SPONSORSHIP">("POPIA");

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reports/compliance");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setError(json.error || "Failed to load compliance data");
      }
    } catch (err: any) {
      setError("Network error fetching compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportAsaCsv = () => {
    window.open("/api/admin/reports/compliance?type=ASA&format=csv", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Compliance & Federation Reporting</h2>
              <p className="text-xs text-slate-400">POPIA Data Protection • ASA / CGA Provincial Submission • Sponsorship Audits</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportAsaCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <Download className="h-4 w-4" />
              <span>Export ASA Provincial CSV</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-6 flex space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("POPIA")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "POPIA"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            POPIA Data Protection Audit
          </button>
          <button
            onClick={() => setActiveTab("ASA")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "ASA"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ASA / CGA Member Roster
          </button>
          <button
            onClick={() => setActiveTab("SPONSORSHIP")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "SPONSORSHIP"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sponsorship & Fund Stewardship
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-400 mb-2" />
          <p className="text-xs">Generating statutory compliance records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      ) : data ? (
        <div>
          {/* TAB 1: POPIA */}
          {activeTab === "POPIA" && data.popiaAudit && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                    <Lock className="h-4 w-4" />
                    <span>Statutory Privacy Model</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">POPIA Act 4 (2013)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Zero third-party telemetry or cloud exfiltration</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase">
                    <Users className="h-4 w-4" />
                    <span>Audited Data Subjects</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">{data.popiaAudit.dataSubjectCount} Registered Members</div>
                  <div className="text-[11px] text-slate-400 mt-1">Encrypted personal information safeguards</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Relational Data Sovereignty</span>
                  </div>
                  <div className="text-xl font-black text-white mt-1">Air-Gapped / Offline Local</div>
                  <div className="text-[11px] text-slate-400 mt-1">Self-contained SQLite storage with backup encryption</div>
                </div>
              </div>

              {/* Members Data Subject Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Data Subject Registry & Consent Record</h3>
                  <span className="text-xs text-slate-400 font-mono">Generated: {data.popiaAudit.generatedAt.slice(0, 10)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">Member ID</th>
                        <th className="p-3">Athlete Name</th>
                        <th className="p-3">Email on File</th>
                        <th className="p-3">Phone on File</th>
                        <th className="p-3">National ID Verified</th>
                        <th className="p-3">ASA License</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.popiaAudit.dataSubjects.map((s: any) => (
                        <tr key={s.athleteNumber} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-slate-200">{s.athleteNumber}</td>
                          <td className="p-3 font-semibold text-white">{s.name}</td>
                          <td className="p-3">{s.hasEmail ? <span className="text-emerald-400">Recorded</span> : <span className="text-slate-500">None</span>}</td>
                          <td className="p-3">{s.hasPhone ? <span className="text-emerald-400">Recorded</span> : <span className="text-slate-500">None</span>}</td>
                          <td className="p-3">{s.idProvided ? <span className="text-emerald-400">Masked on Record</span> : <span className="text-amber-400">Pending</span>}</td>
                          <td className="p-3">{s.asaRegistered ? <span className="text-emerald-400">Registered</span> : <span className="text-slate-500">Unlicensed</span>}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {s.membershipStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASA */}
          {activeTab === "ASA" && data.asaAffiliation && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-white">Central Gauteng Athletics (CGA) / ASA Annual Affiliation List</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official format for annual provincial registration, permanent license issuing, and championship eligibility.
                  </p>
                </div>
                <div className="flex space-x-4 text-xs font-semibold">
                  <div>Licensed: <span className="text-emerald-400 font-bold">{data.asaAffiliation.licensedCount}</span></div>
                  <div>Unlicensed: <span className="text-amber-400 font-bold">{data.asaAffiliation.unlicensedCount}</span></div>
                  <div>Total Roster: <span className="text-white font-bold">{data.asaAffiliation.totalAthletes}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">ASA License</th>
                        <th className="p-3">Club ID</th>
                        <th className="p-3">Surname</th>
                        <th className="p-3">First Name</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Date of Birth</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {data.asaAffiliation.roster.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-amber-300">{r.asaLicense}</td>
                          <td className="p-3 text-slate-300">{r.clubId}</td>
                          <td className="p-3 font-bold text-white">{r.surname}</td>
                          <td className="p-3 text-slate-200">{r.firstNames}</td>
                          <td className="p-3">{r.gender}</td>
                          <td className="p-3">{r.dob}</td>
                          <td className="p-3 text-slate-300">{r.category}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.standing === "GOOD_STANDING" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}>
                              {r.standing}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPONSORSHIP */}
          {activeTab === "SPONSORSHIP" && data.sponsorshipGovernance && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
                  <DollarSign className="h-4 w-4" />
                  <span>Sponsorship Governance & Fiduciary Stewardship</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Transparent allocation tracking ensuring corporate sponsor contributions (Nedbank, Standard Bank, Discovery) are directly assigned to race registrations, bus transport, shoes, and athletic development.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">Sponsorship Campaign</th>
                        <th className="p-3">Beneficiary</th>
                        <th className="p-3">Amount (ZAR)</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Disbursement Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.sponsorshipGovernance.allocations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No dedicated allocations recorded yet. Sponsorship funds active in general subsidy pool.
                          </td>
                        </tr>
                      ) : (
                        data.sponsorshipGovernance.allocations.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-semibold text-white">{a.campaign}</td>
                            <td className="p-3 text-slate-300">{a.beneficiary}</td>
                            <td className="p-3 font-mono font-bold text-emerald-400">R{a.amount.toLocaleString()}</td>
                            <td className="p-3 text-slate-400">{a.purpose}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-400">{a.disbursedAt?.slice(0, 10)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
