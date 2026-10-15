"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  Hotel,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  X,
} from "lucide-react";

interface EventLogisticsViewProps {
  raceId?: string;
  userRole: string;
}

export function EventLogisticsView({ raceId, userRole }: EventLogisticsViewProps) {
  const [loading, setLoading] = useState(true);
  const [logistics, setLogistics] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<"BUS_TRANSPORT" | "HOTEL_ACCOMMODATION" | "VOLUNTEER_ROSTER">("BUS_TRANSPORT");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [capacity, setCapacity] = useState<number>(30);
  const [departureTime, setDepartureTime] = useState("05:00");
  const [pickupPoint, setPickupPoint] = useState("Super Eagles Clubhouse, Soweto");

  const fetchLogistics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/logistics?type=${selectedType}${raceId ? `&raceId=${raceId}` : ""}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLogistics(data.logistics || []);
        setRegistrations(data.registrations || []);
      } else {
        setError(data.error || "Failed to load logistics");
      }
    } catch {
      setError("Network error loading event logistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, [selectedType, raceId]);

  const handleCreateManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const manifestDetails = JSON.stringify({
        notes: details,
        departureTime,
        pickupPoint,
      });

      const res = await fetch("/api/events/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          title,
          details: manifestDetails,
          capacity: Number(capacity),
          raceEditionId: raceId || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        setTitle("");
        setDetails("");
        fetchLogistics();
      } else {
        alert(data.error || "Failed to create logistics manifest");
      }
    } catch {
      alert("Error saving logistics unit");
    } finally {
      setSubmitting(false);
    }
  };

  const isCoordinator = ["SUPER_ADMIN", "CLUB_ADMIN", "COACH"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Race Day Operations & Logistics Hub</h2>
            <p className="text-xs text-slate-400">Team transport manifests, hotel rooming allocations, and volunteer marshal stationing</p>
          </div>

          <div className="flex items-center space-x-2">
            {isCoordinator && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Logistics Manifest</span>
              </button>
            )}
            <button
              onClick={fetchLogistics}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-5 flex space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setSelectedType("BUS_TRANSPORT")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedType === "BUS_TRANSPORT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bus className="h-4 w-4" />
            <span>Bus & Transport Fleet</span>
          </button>
          <button
            onClick={() => setSelectedType("HOTEL_ACCOMMODATION")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedType === "HOTEL_ACCOMMODATION"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Hotel className="h-4 w-4" />
            <span>Hotel Rooming Lists</span>
          </button>
          <button
            onClick={() => setSelectedType("VOLUNTEER_ROSTER")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedType === "VOLUNTEER_ROSTER"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Marshals & Volunteers</span>
          </button>
        </div>
      </div>

      {/* Manifest Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          <p className="text-xs">Loading operational logistics...</p>
        </div>
      ) : logistics.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-semibold">No active manifests found for this category.</p>
          {isCoordinator && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
            >
              + Create new manifest now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logistics.map((item) => {
            let parsedDetails: any = {};
            try {
              parsedDetails = JSON.parse(item.details || "{}");
            } catch {
              parsedDetails = { notes: item.details };
            }

            const isFull = item.currentCount >= item.capacity;

            return (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isFull ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}>
                      {item.currentCount} / {item.capacity} {isFull ? "FULL" : "SEATS"}
                    </span>
                  </div>

                  {item.raceEdition && (
                    <div className="text-xs font-semibold text-emerald-400 mt-1">
                      Target Event: {item.raceEdition.name}
                    </div>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    {parsedDetails.pickupPoint && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="truncate">{parsedDetails.pickupPoint}</span>
                      </div>
                    )}
                    {parsedDetails.departureTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>Departure / Station Time: {parsedDetails.departureTime}</span>
                      </div>
                    )}
                    {parsedDetails.notes && (
                      <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                        {parsedDetails.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Status: <strong className="text-slate-300">{item.status}</strong></span>
                  <button
                    onClick={() => alert(`Manifest roster details for: ${item.title}`)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    View Roster →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Create New Logistics Manifest</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManifest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manifest Title / Bus Unit / Station</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus 1 - 60 Seater Luxury Coach (Soweto - Durban)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Departure / Call Time</label>
                  <input
                    type="text"
                    placeholder="05:00 AM"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assembly / Pick-up Point</label>
                <input
                  type="text"
                  placeholder="Super Eagles Clubhouse or Station Point"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operational Instructions & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Luggage tags required, refreshment packs provided, marshal emergency contact..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
                >
                  {submitting ? "Saving..." : "Create Manifest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
