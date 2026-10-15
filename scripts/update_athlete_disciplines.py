import sqlite3

for db_path in ['dev.db', 'prisma/dev.db']:
    print(f"Updating {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Brandon Naidoo (SEA-007) - Race Walker
    cur.execute("UPDATE Athlete SET disciplineCategory = 'WALKER', membershipCategory = 'SENIOR_WALKER', primaryDiscipline = 'RACE_WALK' WHERE athleteNumber = 'SEA-007'")
    
    # Chantelle de Klerk (SEA-010) - Fitness Walker
    cur.execute("UPDATE Athlete SET disciplineCategory = 'WALKER', membershipCategory = 'SENIOR_WALKER', primaryDiscipline = 'FITNESS_WALK' WHERE athleteNumber = 'SEA-010'")
    
    # Johanna Viljoen (SEA-017) - Dual Athlete (Run & Walk)
    cur.execute("UPDATE Athlete SET disciplineCategory = 'DUAL', membershipCategory = 'SENIOR_DUAL' WHERE athleteNumber = 'SEA-017'")
    
    # Assign ASA license numbers in 2026-ASA-XXXX format
    cur.execute("SELECT id, athleteNumber, asaLicenseNumber FROM Athlete ORDER BY athleteNumber ASC")
    rows = cur.fetchall()
    for idx, (ath_id, ath_num, existing_asa) in enumerate(rows):
        if not existing_asa or not existing_asa.startswith('2026-ASA-'):
            asa_num = f"2026-ASA-{8400 + idx:04d}"
            cur.execute("UPDATE Athlete SET asaLicenseNumber = ? WHERE id = ?", (asa_num, ath_id))
            
    cur.execute("UPDATE Athlete SET membershipFeeStatus = 'PAID' WHERE membershipFeeStatus IS NULL")
    cur.execute("UPDATE Athlete SET membershipExpiry = '2026-12-31 23:59:59' WHERE membershipExpiry IS NULL")
    
    conn.commit()
    cur.execute("SELECT disciplineCategory, count(*) FROM Athlete GROUP BY disciplineCategory")
    print("Counts:", cur.fetchall())
    conn.close()

print("All databases successfully updated!")
