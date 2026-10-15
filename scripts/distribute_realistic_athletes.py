import sqlite3

# Define realistic profiles for all 20 athletes
profiles = [
    # 1. Priority Elite Squad (High Perf >= 72, High Loyalty >= 60)
    {"num": "SEA-001", "time": 8640, "runs": 9, "vols": 4, "meetings": 4, "perf": 92, "tenure": 4.5},
    {"num": "SEA-009", "time": 8820, "runs": 8, "vols": 4, "meetings": 4, "perf": 89, "tenure": 5.0},
    {"num": "SEA-011", "time": 9450, "runs": 7, "vols": 3, "meetings": 3, "perf": 83, "tenure": 4.0},
    {"num": "SEA-014", "time": 9600, "runs": 8, "vols": 3, "meetings": 4, "perf": 81, "tenure": 2.5},
    {"num": "SEA-012", "time": 9780, "runs": 7, "vols": 3, "meetings": 3, "perf": 79, "tenure": 6.5},
    {"num": "SEA-017", "time": 10100, "runs": 8, "vols": 4, "meetings": 4, "perf": 76, "tenure": 5.0},
    {"num": "SEA-020", "time": 10250, "runs": 7, "vols": 2, "meetings": 3, "perf": 74, "tenure": 6.0},

    # 2. Reciprocity Review (High Perf >= 72, Low Loyalty < 60)
    {"num": "SEA-002", "time": 8460, "runs": 1, "vols": 0, "meetings": 1, "perf": 93, "tenure": 2.0},
    {"num": "SEA-015", "time": 9100, "runs": 2, "vols": 0, "meetings": 1, "perf": 86, "tenure": 3.8},
    {"num": "SEA-007", "time": 9800, "runs": 2, "vols": 1, "meetings": 1, "perf": 78, "tenure": 2.2},

    # 3. Development Talent (Lower Perf < 72, High Loyalty >= 60)
    {"num": "SEA-003", "time": 11200, "runs": 8, "vols": 4, "meetings": 4, "perf": 68, "tenure": 1.5},
    {"num": "SEA-005", "time": 11500, "runs": 9, "vols": 4, "meetings": 4, "perf": 66, "tenure": 6.0},
    {"num": "SEA-019", "time": 11400, "runs": 8, "vols": 3, "meetings": 4, "perf": 67, "tenure": 2.0},
    {"num": "SEA-008", "time": 11800, "runs": 7, "vols": 3, "meetings": 3, "perf": 63, "tenure": 3.5},
    {"num": "SEA-016", "time": 12000, "runs": 7, "vols": 2, "meetings": 3, "perf": 61, "tenure": 1.0},
    {"num": "SEA-010", "time": 12200, "runs": 8, "vols": 3, "meetings": 4, "perf": 58, "tenure": 1.0},
    {"num": "SEA-006", "time": 11000, "runs": 4, "vols": 2, "meetings": 3, "perf": 70, "tenure": 3.0},

    # 4. Management Review (Lower Perf < 72, Low Loyalty < 60)
    {"num": "SEA-013", "time": 12800, "runs": 3, "vols": 0, "meetings": 1, "perf": 58, "tenure": 2.0},
    {"num": "SEA-004", "time": 13800, "runs": 2, "vols": 1, "meetings": 1, "perf": 54, "tenure": 8.0},
    {"num": "SEA-018", "time": 13500, "runs": 1, "vols": 0, "meetings": 1, "perf": 50, "tenure": 3.0},
]

for db_path in ['dev.db', 'prisma/dev.db']:
    print(f"Updating athlete distributions in {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Fetch all club activity IDs
    cur.execute("SELECT id FROM ClubActivity ORDER BY date ASC")
    activity_ids = [r[0] for r in cur.fetchall()]
    total_acts = len(activity_ids)
    print(f"Total club activities: {total_acts}")

    for p in profiles:
        cur.execute("SELECT id FROM Athlete WHERE athleteNumber = ?", (p["num"],))
        ath_row = cur.fetchone()
        if not ath_row:
            continue
        ath_id = ath_row[0]

        # 1. Update race results time to reflect performance level
        cur.execute(
            "UPDATE RaceResult SET officialTimeSeconds = ?, distanceKm = 42.195 WHERE athleteId = ?",
            (p["time"], ath_id)
        )

        # 2. Synchronize ClubAttendance records to exact count
        cur.execute("DELETE FROM ClubAttendance WHERE athleteId = ?", (ath_id,))
        for act_id in activity_ids[:p["runs"]]:
            cur.execute(
                "INSERT INTO ClubAttendance (id, clubActivityId, athleteId, attended, recordedBy, createdAt) VALUES (?, ?, ?, 1, 'VERIFIED_COACH', datetime('now'))",
                (f"att_{ath_id}_{act_id}", act_id, ath_id)
            )

        # 3. Synchronize VolunteerContribution records
        cur.execute("DELETE FROM VolunteerContribution WHERE athleteId = ?", (ath_id,))
        for idx in range(p["vols"]):
            if idx < len(activity_ids):
                act_id = activity_ids[idx]
                cur.execute(
                    "INSERT INTO VolunteerContribution (id, clubActivityId, athleteId, roleName, hoursServed, pointsAwarded, createdAt) VALUES (?, ?, ?, 'MARSHAL_WATER_POINT', 3.0, 30, datetime('now'))",
                    (f"vol_{ath_id}_{act_id}_{idx}", act_id, ath_id)
                )

    conn.commit()
    conn.close()
    print(f"[OK] Distribution updated for {db_path}\n")

print("All athlete profiles successfully balanced across all 4 quadrants!")
