import sqlite3

columns_to_add = [
    ("membershipCategory", "TEXT DEFAULT 'SENIOR_RUNNER'"),
    ("disciplineCategory", "TEXT DEFAULT 'RUNNER'"),
    ("asaLicenseNumber", "TEXT"),
    ("membershipExpiry", "DATETIME"),
    ("membershipFeeStatus", "TEXT DEFAULT 'PAID'"),
]

race_columns_to_add = [
    ("bibNumber", "TEXT"),
    ("certificateUrl", "TEXT"),
    ("officialResultsUrl", "TEXT"),
]

for db_path in ['dev.db', 'prisma/dev.db']:
    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(Athlete)")
    existing_cols = {r[1] for r in cur.fetchall()}
    
    for col_name, col_type in columns_to_add:
        if col_name not in existing_cols:
            sql = f"ALTER TABLE Athlete ADD COLUMN {col_name} {col_type}"
            print(f"  Adding column: {col_name}")
            cur.execute(sql)
        else:
            print(f"  Column already exists: {col_name}")
            
    cur.execute("PRAGMA table_info(RaceResult)")
    existing_race_cols = {r[1] for r in cur.fetchall()}
    for col_name, col_type in race_columns_to_add:
        if col_name not in existing_race_cols:
            sql = f"ALTER TABLE RaceResult ADD COLUMN {col_name} {col_type}"
            print(f"  Adding RaceResult column: {col_name}")
            cur.execute(sql)
        else:
            print(f"  RaceResult column already exists: {col_name}")

    # Set default values for any rows
    cur.execute("UPDATE Athlete SET membershipCategory = 'SENIOR_RUNNER' WHERE membershipCategory IS NULL")
    cur.execute("UPDATE Athlete SET disciplineCategory = 'RUNNER' WHERE disciplineCategory IS NULL")
    cur.execute("UPDATE Athlete SET membershipFeeStatus = 'PAID' WHERE membershipFeeStatus IS NULL")
    cur.execute("UPDATE Athlete SET membershipExpiry = '2026-12-31 23:59:59' WHERE membershipExpiry IS NULL")
    
    # Assign ASA license numbers if missing
    cur.execute("SELECT id, athleteNumber FROM Athlete WHERE asaLicenseNumber IS NULL")
    rows = cur.fetchall()
    for idx, (ath_id, ath_num) in enumerate(rows):
        asa_num = f"2026-ASA-{9900 + idx}"
        cur.execute("UPDATE Athlete SET asaLicenseNumber = ? WHERE id = ?", (asa_num, ath_id))
        
    conn.commit()
    conn.close()
    print(f"[OK] Migration complete for {db_path}\n")
