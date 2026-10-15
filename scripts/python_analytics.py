"""
Super Eagles Athletics Club — Python Sports Analytics & Prediction Helper
Performs advanced statistical distribution analysis on athlete race results and training data.
"""

import sqlite3
import math
import os
import sys

# Force UTF-8 stdout for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def analyze_performance_data(db_path="dev.db"):
    # Check current dir or prisma dir
    if not os.path.exists(db_path):
        if os.path.exists(os.path.join("prisma", db_path)):
            db_path = os.path.join("prisma", db_path)
        else:
            print(f"Database {db_path} not found. Please run seed script first.")
            return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM Athlete")
    athlete_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM RaceResult")
    result_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM TrainingActivity")
    training_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM SponsorshipTransaction")
    sponsorship_count = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(amount) FROM SponsorshipTransaction")
    total_spend = cursor.fetchone()[0] or 0

    print("=" * 60)
    print("SUPER EAGLES ATHLETICS CLUB - PYTHON ANALYTICS ENGINE")
    print("=" * 60)
    print(f"• Total Athletes Registered:      {athlete_count}")
    print(f"• Verified Race Results:          {result_count}")
    print(f"• Training Activities Logged:     {training_count}")
    print(f"• Total Sponsorship Transactions: {sponsorship_count}")
    print(f"• Total Club Support Disbursed:   R {total_spend:,.2f}")
    print("=" * 60)

    # Top performers by marathon time
    cursor.execute("""
        SELECT a.firstName, a.lastName, a.athleteNumber, r.raceName, r.officialTimeSeconds 
        FROM RaceResult r
        JOIN Athlete a ON r.athleteId = a.id
        WHERE r.distanceKm >= 42.0 AND r.verificationStatus = 'VERIFIED'
        ORDER BY r.officialTimeSeconds ASC
        LIMIT 5
    """)
    top_marathons = cursor.fetchall()
    print("\nTop 5 Marathon Performances:")
    for i, (fn, ln, num, race, secs) in enumerate(top_marathons, 1):
        hours = secs // 3600
        mins = (secs % 3600) // 60
        s = secs % 60
        print(f"  {i}. {fn} {ln} ({num}): {hours}:{mins:02d}:{s:02d} - {race}")

    conn.close()

if __name__ == "__main__":
    db_file = sys.argv[1] if len(sys.argv) > 1 else "dev.db"
    analyze_performance_data(db_file)
