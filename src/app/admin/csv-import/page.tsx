"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Download,
} from "lucide-react";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export default function CsvImportPage() {
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<string>("SUPER_ADMIN");
  const [importType, setImportType] = useState<
    "ATHLETES" | "RACE_RESULTS" | "TRAINING" | "ATTENDANCE" | "SPONSORSHIP" | "CLUB_ACTIVITIES"
  >("CLUB_ACTIVITIES");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setCurrentUserRole(d.user.role);
          if (d.user.role === "ATHLETE") {
            router.push(d.user.athleteId ? `/athletes/${d.user.athleteId}` : "/login");
          } else if (d.user.role !== "SUPER_ADMIN" && d.user.role !== "CLUB_ADMIN") {
            router.push("/dashboard");
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const sampleCsvTemplates: Record<string, string> = {
    CLUB_ACTIVITIES: `title,activityType,date,location,pointsValue,isMandatory,notes
Saturday Morning 25km Club Long Run,WEEKLY_RUN,2026-04-04,Super Eagles Clubhouse,15,false,Aerobic base builder
Wednesday Twilight 10km Pack Walk,WEEKLY_WALK,2026-04-08,Zoo Lake,15,false,Fast walkers and leisure groups
Super Eagles 15km Race Water Point 3,WATER_POINT,2026-04-18,Constantia,30,true,Mandatory club volunteer duty
Club 5km Time Trial (Running & Walking),TIME_TRIAL,2026-04-22,Wanderers Track,10,false,Official timing with electronic chip
Annual General Meeting & Season Launch,CLUB_MEETING,2026-04-25,Auditorium,20,true,President address and license distribution`,
    ATHLETES: `athleteNumber,firstName,lastName,dateOfBirth,gender,contactEmail,primaryDiscipline,athleteStatus
SEA-021,Mandla,Khumalo,1995-04-12,MALE,mandla.khumalo@gmail.com,MARATHON,DEVELOPMENT
SEA-022,Refilwe,Mabaso,1998-09-21,FEMALE,refilwe.m@yahoo.com,HALF_MARATHON,PERFORMANCE`,
    RACE_RESULTS: `athleteNumber,raceName,date,distanceKm,officialTimeFormatted,verificationStatus
SEA-001,Kaapsehoop Marathon 2026,2026-03-07,42.195,2:24:10,VERIFIED
SEA-002,Kaapsehoop Marathon 2026,2026-03-07,42.195,2:21:45,VERIFIED`,
    TRAINING: `athleteNumber,date,workoutType,distanceKm,durationMinutes,sessionRpe
SEA-001,2026-03-01,LONG_RUN,32,130,7
SEA-002,2026-03-01,TEMPO,16,62,8`,
    ATTENDANCE: `athleteNumber,activityTitle,date,attended
SEA-001,Weekly Wednesday 8km Club Time Trial,2026-03-04,true
SEA-002,Weekly Wednesday 8km Club Time Trial,2026-03-04,false`,
    SPONSORSHIP: `athleteNumber,transactionDate,supportType,amountZar,notes
SEA-001,2026-02-15,CASH_STIPEND,6000,Monthly athlete high performance stipend
SEA-003,2026-02-20,RACE_ENTRY,2500,Championship registration fee`,
  };

  const handleDownloadBlankTemplate = () => {
    window.location.href = `/api/admin/csv-template?type=${importType}&samples=false`;
  };

  const handleDownloadSampleTemplate = () => {
    window.location.href = `/api/admin/csv-template?type=${importType}&samples=true`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportSuccess(false);
    setValidationErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        setParsedRows(rows);

        // Client-side Validation Checks
        const errors: string[] = [];
        if (rows.length === 0) {
          errors.push("The selected CSV file contains no data rows.");
        }

        rows.forEach((row, idx) => {
          if (importType !== "CLUB_ACTIVITIES" && !row.athleteNumber) {
            errors.push(`Row ${idx + 1}: Missing mandatory athleteNumber.`);
          }
          if (importType === "CLUB_ACTIVITIES" && (!row.title || !row.date)) {
            errors.push(`Row ${idx + 1}: Missing mandatory title or date for activity.`);
          }
          if (importType === "ATHLETES" && (!row.firstName || !row.contactEmail)) {
            errors.push(`Row ${idx + 1}: Missing required firstName or contactEmail.`);
          }
          if (importType === "RACE_RESULTS" && (!row.raceName || !row.officialTimeFormatted)) {
            errors.push(`Row ${idx + 1}: Missing raceName or officialTimeFormatted.`);
          }
        });

        setValidationErrors(errors);
      },
    });
  };

  const handleCommitImport = async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;
    setIsImporting(true);

    try {
      const res = await fetch("/api/admin/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importType,
          rows: parsedRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportSuccess(true);
        setImportedCount(data.count || parsedRows.length);
        setParsedRows([]);
        setCsvFile(null);
      } else {
        setValidationErrors([data.error || "Failed to commit import."]);
      }
    } catch {
      setValidationErrors(["Network error while importing CSV data."]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "System Administration", href: "/admin" },
          { label: "CSV Ingestion Center", current: true },
        ]}
        userRole={currentUserRole}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Bulk CSV Ingestion & Validation Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Failsafe 2-step data import workflow: Upload → Validate & Preview → Database Commit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBlankTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/80 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors shadow-xs"
            title="Download a clean, blank CSV with exact column headers ready to fill and re-upload"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export Blank CSV (Ready to Fill)</span>
          </button>

          <button
            onClick={handleDownloadSampleTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            title="Download template with sample data rows showing correct formats"
          >
            <FileSpreadsheet className="h-4 w-4 text-orange-400" />
            <span>Download Sample CSV</span>
          </button>
        </div>
      </div>

      {importSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/80 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Successfully imported and verified {importedCount} records in database!</span>
        </div>
      )}

      {/* Step 1: Select Entity & Upload */}
      <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Step 1: Select Entity Target & Upload File
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Select Dataset Target
            </label>
            <select
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value as any);
                setParsedRows([]);
                setValidationErrors([]);
              }}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs font-bold text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="CLUB_ACTIVITIES">Club Schedule (Runs, Walks, Clinics & Events)</option>
              <option value="ATHLETES">Athletes Master Roster</option>
              <option value="RACE_RESULTS">Official Race Competition Results</option>
              <option value="TRAINING">Training Activities & Workouts</option>
              <option value="ATTENDANCE">Internal Club Run Attendance</option>
              <option value="SPONSORSHIP">Sponsorship Disbursements & Transactions</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-[#F97316] file:px-3 file:py-1 file:text-xs file:font-bold file:text-white focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Validation & Preview */}
      {parsedRows.length > 0 && (
        <div className="rounded-2xl border border-slate-700/80 bg-[#1E293B]/85 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Step 2: Validation Audit & Data Preview ({parsedRows.length} Rows Parsed)
              </h2>
              <p className="text-xs text-slate-400">
                Confirm parsed column schema before committing to database. Bad rows will not be imported.
              </p>
            </div>

            <button
              onClick={handleCommitImport}
              disabled={isImporting || validationErrors.length > 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:bg-[#FB923C] hover:-translate-y-0.5 disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              <span>{isImporting ? "Importing Data..." : "Confirm & Commit to Database"}</span>
            </button>
          </div>

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Validation Errors Detected ({validationErrors.length})</span>
              </div>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px]">
                {validationErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="mt-4 max-h-[350px] overflow-auto rounded-xl border border-slate-700/80 bg-[#1E293B]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0F172A] text-[11px] font-bold uppercase tracking-wider text-white border-b border-slate-700">
                <tr>
                  {Object.keys(parsedRows[0] || {}).map((col) => (
                    <th key={col} className="px-3 py-2.5 text-white font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {parsedRows.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-800 dark:text-slate-200">
                        {val?.toString() || "--"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 10 && (
            <div className="mt-2 text-right text-[11px] text-slate-400">
              Showing first 10 of {parsedRows.length} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}
