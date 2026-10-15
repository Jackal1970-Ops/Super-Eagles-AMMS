"""
Super Eagles Athletics Management System (AMMS)
Comprehensive Hands-On MS Word Operational Manual & System Guide
Generates: Super_Eagles_AMMS_User_Manual.docx
"""

import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_callout(doc, text, title="IMPORTANT NOTICE", border_color="16A34A", bg_color="F0FDF4"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_shading(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    run_title = p.add_run(f"[{title}] ")
    run_title.bold = True
    run_title.font.name = "Segoe UI"
    run_title.font.size = Pt(10)
    run_title.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A) if border_color == "16A34A" else RGBColor(0x0F, 0x17, 0x2A) if border_color == "0F172A" else RGBColor(0xEA, 0x58, 0x0C)
    
    run_text = p.add_run(text)
    run_text.font.name = "Calibri"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(6)

def format_heading(p, text, level=1):
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    run.font.name = "Segoe UI"
    if level == 1:
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(17)
        run.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A) # Forest Green
    elif level == 2:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A) # Navy/Dark Slate
    elif level == 3:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return run

def add_body_p(doc, text="", space_after=6, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    if text:
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_bullet_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10)
        r_pre.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    r = p.add_run(text)
    r.font.name = "Calibri"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_num_p(doc, num_str, bold_title, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    
    r_num = p.add_run(f"{num_str}. ")
    r_num.bold = True
    r_num.font.name = "Calibri"
    r_num.font.size = Pt(10)
    r_num.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A)

    r_title = p.add_run(f"{bold_title}: ")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def create_styled_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    hdr_row = tbl.rows[0]
    for i, title in enumerate(headers):
        cell = hdr_row.cells[i]
        set_cell_shading(cell, "0F172A")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(title)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
    for r_idx, row_data in enumerate(data):
        row = tbl.rows[r_idx + 1]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            set_cell_shading(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(val))
            r.font.name = "Calibri"
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            
    if col_widths:
        for row in tbl.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(8)
    return tbl

def build_comprehensive_manual():
    print("[1/5] Initializing MS Word Engine for In-Depth Manual...")
    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    logo_path = os.path.join(os.getcwd(), "public", "images", "logo.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(os.getcwd(), "public", "images", "emblem.png")

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    print("[2/5] Creating Official Cover Page with Super Eagles Crest...")
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(36)
    p_logo.paragraph_format.space_after = Pt(14)
    if os.path.exists(logo_path):
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(2.2))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("SUPER EAGLES ATHLETICS CLUB")
    r_title.bold = True
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A)

    p_title2 = doc.add_paragraph()
    p_title2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title2.paragraph_format.space_before = Pt(0)
    p_title2.paragraph_format.space_after = Pt(8)
    r_title2 = p_title2.add_run("ATHLETICS MANAGEMENT SYSTEM (AMMS)")
    r_title2.bold = True
    r_title2.font.name = "Segoe UI"
    r_title2.font.size = Pt(18)
    r_title2.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(20)
    r_sub = p_sub.add_run(
        "Official Practical User Manual, Everyday Operation Guide & Hardware Architecture\n"
        "How to Use the App as a Member, Coach, Executive Admin & Sponsorship Board\n"
        "— Includes Smartphone QR Scanning, Local Server Setup & Backup Guides —"
    )
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_div.paragraph_format.space_after = Pt(28)
    r_div = p_div.add_run("—" * 38)
    r_div.font.color.rgb = RGBColor(0xEA, 0xB3, 0x08) # Gold

    meta_tbl = doc.add_table(rows=5, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Document Type", "Official Club Standard Operating Procedure & User Manual"),
        ("System Architecture", "Zero-Dependency Embedded Node.js / SQLite (100% Local Portability)"),
        ("Club Motto", "'Fly High, Run True, Serve the Club' (Super Eagles AC)"),
        ("Release Version", "AMMS v2.6.0 Enterprise Production Edition (September 2026)"),
        ("Applicable Roles", "Athletes, Walkers, Coaches, Executive Committee, Marshals"),
    ]
    for idx, (label, val) in enumerate(meta_data):
        c_lbl = meta_tbl.cell(idx, 0)
        c_val = meta_tbl.cell(idx, 1)
        set_cell_shading(c_lbl, "F1F5F9")
        set_cell_shading(c_val, "FFFFFF")
        set_cell_margins(c_lbl, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c_val, top=60, bottom=60, left=100, right=100)
        
        p1 = c_lbl.paragraphs[0]
        r1 = p1.add_run(label)
        r1.bold = True
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        
        p2 = c_val.paragraphs[0]
        r2 = p2.add_run(val)
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    print("[3/5] Generating Practical Navigation Index...")
    format_heading(doc.add_paragraph(), "TABLE OF CONTENTS", level=1)
    
    toc_lines = [
        "CHAPTER 1: WHAT IS AMMS & WHAT PROBLEM DOES IT SOLVE?",
        "  1.1 The Real Problems Faced by Athletics Clubs",
        "  1.2 The Super Eagles Solution: Core Capabilities Overview",
        "  1.3 Why the App Runs 100% Locally Without Cloud Subscriptions",
        "CHAPTER 2: HOW HARDWARE COMMUNICATES (THE CLUB COMPUTER VS. SMARTPHONES)",
        "  2.1 The Big Question: How to Scan with Your Phone if App is on Club Laptop?",
        "  2.2 Method 1: Using Your Smartphone as a Wireless Scanner Over Wi-Fi/Hotspot",
        "  2.3 Method 2: Athlete Shows QR Badge on Phone, Club Laptop Webcam Scans It",
        "  2.4 Method 3: Ultra-Fast Manual Entry on the Club Computer (No Phones Needed)",
        "  2.5 USB Handheld Barcode Scanners (Plug-and-Play Setup)",
        "CHAPTER 3: HOW TO USE THE APP AS A CLUB MEMBER & ATHLETE",
        "  3.1 Logging In & POPIA Privacy (Why You Only See Your Own Profile)",
        "  3.2 The 360° Athlete Profile Explained (Every Section & What It Means)",
        "  3.3 The 60-Second Daily Wellness Check-In & Readiness Battery (Green/Amber/Red)",
        "  3.4 Uploading Workouts & GPS Files (Garmin, Strava, Polar, Apple Watch)",
        "  3.5 Viewing Your Verified Race Results & Future Race Time Predictions",
        "  3.6 Checking In to Saturday Pack Runs & Tracking Your CCLI Points",
        "  3.7 Inspecting Your Medallions & Sharing Certificates to WhatsApp",
        "CHAPTER 4: HOW TO USE THE APP AS AN EXECUTIVE COMMITTEE MEMBER & ADMIN",
        "  4.1 Executive Dashboard: Reading the KPI Strip & The 4-Quadrant Talent Matrix",
        "  4.2 How to Filter the 3 Elite Squad Athletes vs. The Entire Club",
        "  4.3 Registering a Brand New Member (Runners, Walkers, ASA Licenses, Fees)",
        "  4.4 Organizing Club Runs, Time Trials & Marshalling",
        "  4.5 Conferring Athlete of the Month & Athlete of the Year Medallions",
        "  4.6 In-App System Health Checks & 1-Click Autonomous Self-Healing",
        "  4.7 Backing Up the Entire Club Database to a USB Flash Drive or External Hard Drive",
        "CHAPTER 5: HOW TO USE THE APP AS A HEAD COACH OR COACHING STAFF",
        "  5.1 The Performance Engine: Pace Durability & Fading Curves (PDI)",
        "  5.2 Monitoring Training Load & Injury Risk (Dr. Tim Gabbett ACWR Sweet Spot)",
        "  5.3 Reviewing & Approving AI Coaching Recommendations",
        "CHAPTER 6: HOW TO USE THE APP AS THE SPONSORSHIP & FINANCE COMMITTEE",
        "  6.1 The Reciprocity Principle: Balancing Performance with Club Service",
        "  6.2 The Club Sponsorship Score (CSS) Algorithm",
        "  6.3 Catching 'Take-and-Run' Behaviors: Reciprocity Flags & Corrective Reviews",
        "  6.4 Capturing Direct Sponsorship Disbursements on Member Profiles",
        "  6.5 Symmetric Financial Interface Design & Visual Order",
        "CHAPTER 7: DAY-TO-DAY REAL WORLD PLAYBOOKS",
        "  7.1 Playbook A: Saturday Morning 10km Club Run (Step-by-Step Marshal Guide)",
        "  7.2 Playbook B: New Member Joins at the Clubhouse",
        "  7.3 Playbook C: Monthly Awards Ceremony & WhatsApp Broadcast",
        "  7.4 Playbook D: End-of-Day Backup & Packing Up the Laptop",
        "  7.5 Playbook E: Load-Shedding & Power Outage Protocol (Offline Mode)",
        "CHAPTER 8: NATIONWIDE REMOTE ATHLETE ACCESS & HARDWARE SCANNING",
        "  8.1 The Nationwide Challenge: Athletes Traveling Across South Africa",
        "  8.2 The Solution: The Zero-Cost Cloudflare Mobile Tunnel",
        "  8.3 Step-by-Step: How the Club Admin Launches the Tunnel (1-Click)",
        "  8.4 Step-by-Step: How Remote Athletes Use the Portal on Their Phones",
        "  8.5 Alternative: Official Race Timing System Bulk Import (FinishTime, ChampionChip)",
        "  8.7 Official Race Results Evidence Layer & Certificate Verification",
        "  8.8 Hardware USB Barcode/QR Scanner & Live Event Switcher",
        "  8.9 Digital Membership Card CR80 One-Click PDF Export",
        "CHAPTER 9: PROOF-OF-PAYMENT (POP) & BANKING RECONCILIATION",
        "  9.1 The Financial Challenge: Dues, Race Entries & Unmatched Bank Deposits",
        "  9.2 POP Ingestion: Uploading EFT Slips, ATM Receipts & Mobile PDF Statements",
        "  9.3 Two-Stage Treasurer Verification Queue & Arrears Gatekeeper Resolution",
        "  9.4 1-Click WhatsApp Official Receipt Dispatch",
        "CHAPTER 10: LOCAL-FIRST TELEMETRY & AWAY EVENT FLEET LOGISTICS",
        "  10.1 Zero-Cloud Local GPX & CSV Ingestion (Garmin, Coros, Strava)",
        "  10.2 Race Fleet Transport Manifests & Bus Captain Assignments",
        "  10.3 Hotel Accommodation Allocations & Rooming Rosters",
        "  10.4 Volunteer Marshal Scheduling & Instant CCLI Loyalty Accrual",
        "CHAPTER 11: STATUTORY ASA SEASON ROLLOVER & 1-CLICK BACKUP RESTORATION",
        "  11.1 Annual Athletics South Africa (ASA) Age-Group Rollover Engine",
        "  11.2 Historical Snapshot Archiving & Next-Season Budget Forecasting",
        "  11.3 1-Click WhatsApp & Email Notice Dispatch Architecture",
        "  11.4 In-App 1-Click Disaster Recovery & Database Restoration Protocol",
    ]

    for line in toc_lines:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r = p_t.add_run(line)
        r.font.name = "Calibri"
        r.font.size = Pt(9.5)
        if line.startswith("CHAPTER"):
            r.bold = True
            r.font.color.rgb = RGBColor(0x16, 0xA3, 0x4A)
        else:
            r.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 1: WHAT IS AMMS & WHAT PROBLEM DOES IT SOLVE?
    # =========================================================================
    print("[4/5] Writing Detailed Plain-English Manual Chapters...")
    format_heading(doc.add_paragraph(), "CHAPTER 1: WHAT IS AMMS & WHAT PROBLEM DOES IT SOLVE?", level=1)
    
    format_heading(doc.add_paragraph(), "1.1 The Real Problems Faced by Athletics Clubs", level=2)
    add_body_p(doc, 
        "Running and athletics clubs everywhere struggle with the same frustrating operational bottlenecks:"
    )
    add_bullet_p(doc, "Lost Spreadsheets: Membership records live in disorganized Excel sheets scattered across committee laptops. When a new committee is elected, historical records and ASA license numbers vanish.", bold_prefix="Fragmented Records: ")
    add_bullet_p(doc, "Arguments Over Sponsorship & Gear: Every year, runners demand club funds for Comrades or Two Oceans entry fees, shoes, and transport. The committee has no fair, objective way to prove who earned sponsorship versus who just takes money and disappears.", bold_prefix="Sponsorship Disputes: ")
    add_bullet_p(doc, "Walkers and Community Members Feel Left Out: Traditional clubs only focus on the top 3 runners winning medals. Slower runners, pack walkers, and volunteers feel invisible despite being the backbone of club revenue.", bold_prefix="Community Disconnect: ")
    add_bullet_p(doc, "Coaches Don't Know Who is Overtraining: Athletes train hard, burn out, get hamstring tears or stress fractures before major races because coaches cannot track acute workload spikes.", bold_prefix="Preventable Injuries: ")
    add_bullet_p(doc, "Saturday Attendance is Chaos: Marshals use soggy clipboards and paper sheets at the finish line. Names are illegible, times are lost, and nobody knows who attended enough runs to earn club awards.", bold_prefix="Manual Race Operations: ")

    format_heading(doc.add_paragraph(), "1.2 The Super Eagles Solution: Core Capabilities Overview", level=2)
    add_body_p(doc, 
        "The Super Eagles Athletics Management System (AMMS) replaces chaotic spreadsheets and paper clipboards with a single, "
        "rock-solid application designed to run on the club's computer. It brings five transformative solutions to the club:"
    )
    add_num_p(doc, "1", "360° Athlete Digital Profiles", "Every single member—from Comrades gold medalists to weekend health walkers—has a personal digital profile storing their ASA license, best race times, attendance history, and honors.")
    add_num_p(doc, "2", "Scientific Workload & Injury Protection", "Implements Dr. Tim Gabbett's Acute:Chronic Workload Ratio (ACWR). The system monitors weekly mileage spikes and alerts the coach BEFORE an athlete tears a tendon.")
    add_num_p(doc, "3", "The Reciprocity Governance Engine", "Eliminates favoritism in sponsorship. If an athlete receives R15,000 for travel and gear, the system automatically checks if they attended club runs and volunteered at water points. If they take resources without giving back, the system flags them for review.")
    add_num_p(doc, "4", "Dual-Track Medallions (Competitive + Wellness)", "Recognizes BOTH race champions (Athlete of the Month/Year - Competitive) and devoted community members who walk, volunteer, and mentor (Athlete of the Month/Year - Health & Wellness).")
    add_num_p(doc, "5", "Instant QR Code Check-In & WhatsApp Sharing", "Marshals scan runner badges in 1 second. Certificates and honors generate 1-click formatted announcements ready to paste straight into the club WhatsApp group.")

    format_heading(doc.add_paragraph(), "1.3 Why the App Runs 100% Locally Without Cloud Subscriptions", level=2)
    add_body_p(doc,
        "Many sports software platforms charge hundreds of dollars per month in mandatory cloud fees and stop working the moment you cancel. "
        "AMMS was built with a strict Local-First Portability Guarantee:"
    )
    add_bullet_p(doc, "The entire database (dev.db) is stored directly inside the club's computer. You own 100% of your data forever.", bold_prefix="Embedded Local Database: ")
    add_bullet_p(doc, "No monthly cloud hosting bills, no AWS fees, and no per-user software licensing.", bold_prefix="Zero Subscription Cost: ")
    add_bullet_p(doc, "Works flawlessly during South African load-shedding and cellular network outages. You can run it on a laptop powered by battery at the race venue.", bold_prefix="Load-Shedding Proof: ")
    add_bullet_p(doc, "Compliance with the POPIA Act: Athlete personal details, phone numbers, and addresses are stored safely on the club's machine, not on third-party servers.", bold_prefix="POPIA Privacy Compliant: ")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 2: HOW HARDWARE COMMUNICATES
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 2: HOW HARDWARE COMMUNICATES (THE CLUB COMPUTER VS. SMARTPHONES)", level=1)
    
    format_heading(doc.add_paragraph(), "2.1 The Big Question: How to Scan with Your Phone if App is on Club Laptop?", level=2)
    add_body_p(doc, 
        "This is the most common operational question asked by committee members: "
        "'If the application is running on the club's laptop at the clubhouse desk, how can a marshal standing 50 meters away at the finish line use their Samsung or iPhone to scan runners?'"
    )
    add_body_p(doc,
        "The answer is simple, powerful, and built directly into AMMS: "
        "The club computer acts as a Local Web Server. Any smartphone connected to the same local Wi-Fi network (or connected to a phone hotspot) "
        "can open the app in Safari or Chrome without installing anything from the Google Play Store or Apple App Store!"
    )

    format_heading(doc.add_paragraph(), "2.2 Method 1: Using Your Smartphone as a Wireless Scanner Over Wi-Fi/Hotspot (RECOMMENDED)", level=2)
    add_body_p(doc, "Here is the exact step-by-step setup to turn any marshal's smartphone into a wireless scanner:")
    add_num_p(doc, "Step 1", "Establish a Shared Connection", 
        "Ensure both the club laptop and the marshal's phone are on the same Wi-Fi network (e.g. the clubhouse Wi-Fi). "
        "IF YOU ARE OUT IN THE FIELD WITH NO WI-FI: The marshal simply turns on their phone's 'Personal Hotspot' (Mobile Hotspot) and connects the club laptop to the phone's hotspot! This creates a free, private local network between the two devices.")
    add_num_p(doc, "Step 2", "Find the Laptop's Local Network Address",
        "On the club laptop, open AMMS and click 'Club Runs & Walks' -> 'Open QR Marshal Scanner'. "
        "Click the link: 'Want to use your smartphone's camera to scan?'. "
        "The screen will display the computer's network address in bright green, for example: http://192.168.1.105:3000/club-activities (or http://172.25.8.121:3000).")
    add_num_p(doc, "Step 3", "Open the Address on Your Smartphone",
        "On the marshal's phone, open Chrome or Safari. Type the address shown on the laptop screen (e.g. http://192.168.1.105:3000).")
    add_num_p(doc, "Step 4", "Log In & Tap Scanner",
        "Log in with your Coach or Admin account. Tap 'Club Runs & Walks' and tap 'Open QR Marshal Scanner'.")
    add_num_p(doc, "Step 5", "Scan with Your Phone Camera",
        "Your phone's browser will ask for camera permission. Tap 'Allow'. The marshal now points their phone camera at runners' QR codes as they cross the finish line! "
        "Every single scan taken on the phone sends the check-in instantly over Wi-Fi into the club laptop's database in less than 50 milliseconds!")

    add_callout(doc,
        "Why Method 1 is brilliant:\n"
        "• You do NOT need internet or mobile data! It communicates over the local Wi-Fi/hotspot.\n"
        "• You do NOT need to download an app from the App Store.\n"
        "• Multiple marshals can use their phones simultaneously! Three marshals can scan at three different finish funnels, and all records feed into the one club laptop.",
        title="OPERATIONAL BREAKTHROUGH: ZERO-DATA WIRELESS SCANNING",
        border_color="16A34A",
        bg_color="F0FDF4"
    )

    format_heading(doc.add_paragraph(), "2.3 Method 2: Athlete Shows QR Badge on Phone, Club Laptop Webcam Scans It", level=2)
    add_body_p(doc, 
        "If the marshal prefers to sit at the registration desk with the club laptop, you can do the reverse:"
    )
    add_bullet_p(doc, "The athlete opens their Super Eagles profile on their phone (or saves a screenshot of their digital membership QR card to their phone photo gallery).", bold_prefix="Athlete Phone: ")
    add_bullet_p(doc, "The marshal clicks 'Open QR Marshal Scanner' on the club laptop. The laptop's built-in webcam turns on.", bold_prefix="Club Laptop: ")
    add_bullet_p(doc, "The athlete holds their phone screen in front of the laptop webcam. The scanner beeps, shows a green checkmark, and logs: 'Sipho Sithole Verified & Checked In! +15 Points awarded'.", bold_prefix="Instant Verification: ")

    format_heading(doc.add_paragraph(), "2.4 Method 3: Ultra-Fast Manual Entry on the Club Computer (No Phones Needed)", level=2)
    add_body_p(doc,
        "What if an athlete forgot their phone at home, or their battery died? Or what if you are out in the pouring rain where nobody wants to take out a phone?"
    )
    add_body_p(doc,
        "Inside the 'QR Marshal Scanner' modal on the club computer, there is a prominent Search / Entry Box:"
    )
    add_bullet_p(doc, "The runner simply tells the marshal their number: 'I am SEA-001' (or 'Sipho').")
    add_bullet_p(doc, "The marshal types '001' and hits ENTER on the laptop keyboard.")
    add_bullet_p(doc, "Done! Check-in is recorded in 0.5 seconds. Fast manual entry ensures no runner is ever delayed at the registration table.")

    format_heading(doc.add_paragraph(), "2.5 Optional 2D QR Code Handheld Scanners (Hardware Scanner Accessory)", level=2)
    add_body_p(doc,
        "All Super Eagles member digital passes, badges, and attendance tokens use standard 2D QR Codes. "
        "For major mass events with 200+ runners, marshals can optionally plug an inexpensive handheld 2D USB optical QR scanner gun (available for ~R250) "
        "into the club laptop's USB port. No software drivers or setup are required. When the marshal triggers the optical laser at a runner's phone screen or laminated card, "
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 3: HOW TO USE THE APP AS A CLUB MEMBER & ATHLETE
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 3: HOW TO USE THE APP AS A CLUB MEMBER & ATHLETE", level=1)
    
    format_heading(doc.add_paragraph(), "3.1 Logging In & POPIA Privacy (Why You Only See Your Own Profile)", level=2)
    add_body_p(doc,
        "When you log in with an Athlete account (e.g. sipho@supereagles.co.za):"
    )
    add_bullet_p(doc, "Strict Privacy Isolation: Under South African POPIA laws, you will only see what is applicable to you. You will NOT see other members' phone numbers, addresses, or private financial records.", bold_prefix="Privacy Protection: ")
    add_bullet_p(doc, "Automatic Redirection: You do not have to hunt for your profile. As soon as you log in, AMMS takes you directly to your personal 360° Athlete Profile.", bold_prefix="Instant Landing: ")
    add_bullet_p(doc, "Simplified Navigation: The sidebar navigation automatically hides complex executive modules (Executive Dashboard, Finance, System Admin) and displays only the tabs relevant to you: My Profile, Training Log, Races, and Club Activities.", bold_prefix="Clutter-Free View: ")

    format_heading(doc.add_paragraph(), "3.2 The 360° Athlete Profile Explained", level=2)
    add_body_p(doc, "Your profile is organized into clear, intuitive cards:")
    add_bullet_p(doc, "Header Bar: Shows your photo, ASA License number, membership category (Senior Runner, Veteran, Walker), and your Conferred Medallions.", bold_prefix="Member Identification: ")
    add_bullet_p(doc, "The Athlete Performance Index (API) Dial: A 0-100 gauge that objectively rates your current running fitness based on your latest verified race results, consistency, and improvement.", bold_prefix="Performance Dial: ")
    add_bullet_p(doc, "Club Contribution & Loyalty (CCLI): A 0-100 score showing your club loyalty based on your attendance at Saturday runs, volunteering at water points, and club meetings.", bold_prefix="Loyalty Score: ")
    add_bullet_p(doc, "Digital QR Member Card: A dynamic QR code containing your SEA membership number that marshals scan at Saturday runs.", bold_prefix="Digital Membership Card: ")

    format_heading(doc.add_paragraph(), "3.3 The 60-Second Daily Wellness Check-In & Readiness Battery", level=2)
    add_body_p(doc,
        "Every morning, before putting on your running shoes, spend 60 seconds logging your wellness. This prevents injuries and helps your coach adjust your workouts:"
    )
    add_num_p(doc, "1", "Click the Wellness Button", "On your profile, click 'Daily Wellness Check-In'.")
    add_num_p(doc, "2", "Rate Your 4 Vital Indicators", "Select 1 (poor) to 5 (optimal) for Sleep Quality, Fatigue Level, Muscle Soreness, and Stress.")
    add_num_p(doc, "3", "Enter Morning Resting Heart Rate", "Take your pulse on your wrist or smart watch and type the BPM (e.g. 52 bpm).")
    add_num_p(doc, "4", "Click Submit", "Your Readiness Battery updates immediately with three clear color tiers:")
    add_bullet_p(doc, "GREEN (Ready to Train - Score 80-100): Your nervous system and muscles are fully recovered. You can safely execute hard interval speedwork, tempo runs, or long mileage.", bold_prefix="Green Battery: ")
    add_bullet_p(doc, "AMBER (Moderate Stimulus Only - Score 55-79): Mild fatigue or elevated stress. Stick to easy aerobic recovery runs; avoid heavy sprint intervals.", bold_prefix="Amber Battery: ")
    add_bullet_p(doc, "RED (Active Recovery Required - Score < 55): High muscle soreness or elevated resting HR indicates impending illness or injury. Take a rest day, foam roll, or do light walking only.", bold_prefix="Red Battery: ")

    format_heading(doc.add_paragraph(), "3.4 Uploading Workouts & GPS Files (Garmin, Strava, Polar, Apple Watch)", level=2)
    add_body_p(doc, "You can log your training in two ways:")
    add_bullet_p(doc, "Manual Entry: Click 'Record Workout', enter the distance (e.g. 12 km), duration (e.g. 1 hour 05 mins), and how hard it felt (RPE from 1 to 10).", bold_prefix="Option A (Manual): ")
    add_bullet_p(doc, "GPX File Upload: Click 'Import GPX Telemetry'. Drag and drop the .gpx file exported from Garmin Connect, Strava, or Polar. The system automatically plots your elevation profile, calculates km-by-km splits, and analyzes your Pace Deterioration Index (PDI).", bold_prefix="Option B (GPS File): ")

    format_heading(doc.add_paragraph(), "3.5 Viewing Your Verified Race Results & Future Race Predictions", level=2)
    add_body_p(doc,
        "Under the 'Races & Results' tab, you will find every verified ASA race you have run (e.g. Soweto Marathon, Kaapsehoop, Two Oceans). "
        "The system highlights your Personal Bests (PBs) with a gold badge. "
        "Based on your recent 10K or 21K times, the intelligent Riegel algorithm computes your predicted finish time for upcoming races so you know exactly what pace to maintain on race day."
    )

    format_heading(doc.add_paragraph(), "3.6 Checking In to Saturday Pack Runs & Tracking Your CCLI Points", level=2)
    add_body_p(doc,
        "Every time you attend a Saturday 5K/10K club run or Thursday time trial, show your digital QR badge to the marshal. "
        "Each attendance awards +10 to +15 CCLI points. These points determine your eligibility for year-end club awards, discounted club kit, and sponsorship."
    )

    format_heading(doc.add_paragraph(), "3.7 Inspecting Your Medallions & Sharing Certificates to WhatsApp", level=2)
    add_body_p(doc,
        "If you are awarded Athlete of the Month or Athlete of the Year, an embossed metallic medallion (Gold, Platinum, or Emerald) appears on your profile. "
        "Click the medallion to open your official Certificate of Merit. "
        "Click 'Share to WhatsApp Group' to automatically open WhatsApp with a pre-formatted message celebrating your award with fellow club members!"
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 4: HOW TO USE THE APP AS AN EXECUTIVE ADMIN
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 4: HOW TO USE THE APP AS AN EXECUTIVE COMMITTEE MEMBER & ADMIN", level=1)
    
    format_heading(doc.add_paragraph(), "4.1 Executive Dashboard: Reading the KPI Strip & The 4-Quadrant Talent Matrix", level=2)
    add_body_p(doc,
        "The Executive Dashboard (/dashboard) gives the Chairman, Secretary, and Committee an immediate strategic overview of club health:"
    )
    add_bullet_p(doc, "KPI Cards: Displays total active members, sponsored athletes, elite squad count, and total YTD financial support disbursed.", bold_prefix="KPI Summary: ")
    add_bullet_p(doc, "Reigning Medallions Banner: Highlights the current Athlete of the Month and Athlete of the Year titleholders across both Competitive and Wellness categories.", bold_prefix="Champions Showcase: ")
    add_bullet_p(doc, "Interactive 4-Quadrant Matrix: Plots all 20 athletes on a 2D graph (Performance on the vertical axis, Club Contribution on the horizontal axis).", bold_prefix="4-Quadrant Matrix: ")
    add_bullet_p(doc, "Top-Right (Priority Elite): High performance and high club loyalty. These are the club's ambassadors who deserve maximum support.", bold_prefix="★ Priority Elite: ")
    add_bullet_p(doc, "Top-Left (Reciprocity Alert): High performance, but low club contribution. They win races but rarely wear club colors at time trials. The committee must monitor these athletes.", bold_prefix="⚠ Reciprocity Review: ")
    add_bullet_p(doc, "Bottom-Right (Loyal Development): Heart-and-soul club members who attend every run and volunteer, with developing running times.", bold_prefix="♥ Development & Loyalty: ")
    add_bullet_p(doc, "Bottom-Left (Management Watch): Low performance and low attendance.", bold_prefix="Management Watch: ")

    format_heading(doc.add_paragraph(), "4.2 How to Filter the 3 Elite Squad Athletes vs. The Entire Club", level=2)
    add_body_p(doc,
        "In previous versions, clicking 'Elite Squad' accidentally displayed the entire club. This has been permanently resolved:"
    )
    add_bullet_p(doc, "On the Executive Dashboard KPI strip, click the 'Elite Squad' card (or go to /athletes and select 'Elite Squad Only' from the squad dropdown).", bold_prefix="To View Only Elite Athletes: ")
    add_bullet_p(doc, "The view will filter INSTANTLY to strictly the 3 Elite Squad members (Sipho Sithole, Kagiso Mokoena, Bongani Radebe). No other club members will appear.", bold_prefix="Result: ")
    add_bullet_p(doc, "To view the entire club again, simply change the dropdown back to 'All Squads'.", bold_prefix="To View All Members: ")

    format_heading(doc.add_paragraph(), "4.3 Registering a Brand New Member", level=2)
    add_body_p(doc, "When a new runner or walker joins the club:")
    add_num_p(doc, "1", "Click Add Athlete", "Go to 'Members & Athletes' (/athletes) and click '+ Register New Athlete'.")
    add_num_p(doc, "2", "Enter Personal Details", "Type First Name, Last Name, Email, Phone Number, Date of Birth, and Gender.")
    add_num_p(doc, "3", "Select Discipline Category", "Choose whether the member is a RUNNER, a WALKER, or DUAL (both). This ensures walkers are not judged on marathon paces.")
    add_num_p(doc, "4", "Enter ASA License & Fee Status", "Enter their Athletics South Africa (ASA) license number and mark membership fees as 'PAID' or 'PENDING'.")
    add_num_p(doc, "5", "Assign Squad Status", "Select ELITE, PERFORMANCE, or DEVELOPMENT.")
    add_num_p(doc, "6", "Save", "Click 'Save & Register Athlete'. A digital QR badge and profile are generated immediately.")

    format_heading(doc.add_paragraph(), "4.4 Organizing Club Runs, Time Trials & Marshalling", level=2)
    add_body_p(doc, "Under 'Club Runs & Walks' (/club-activities):")
    add_bullet_p(doc, "Click '+ Schedule Activity', enter the title (e.g. 'Saturday 10K Pack Run'), date, meeting point, and points value (usually 10 points).", bold_prefix="Create Event: ")
    add_bullet_p(doc, "On race morning, open the 'QR Marshal Scanner' modal to log attendance via smartphone, webcam, USB scanner, or manual search as detailed in Chapter 2.", bold_prefix="Log Attendance: ")

    format_heading(doc.add_paragraph(), "4.5 Conferring Athlete of the Month & Athlete of the Year Medallions", level=2)
    add_body_p(doc, "At the end of each month or at the annual club banquet:")
    add_num_p(doc, "1", "Open Athlete Profile", "Navigate to the deserving athlete's profile.")
    add_num_p(doc, "2", "Click 'Confer Medallion'", "Found in the Honors and Distinctions card.")
    add_num_p(doc, "3", "Choose the Distinction Track", "Select 'Competitive Track' (for race performance) OR 'Health & Wellness Track' (for pack walking, loyalty, and volunteering).")
    add_num_p(doc, "4", "Select the Badge Variant", "Choose Gold Champion Laurel, Platinum Elite Star, or Emerald Wellness Crest.")
    add_num_p(doc, "5", "Type the Formal Citation", "Enter the committee's reason for the award (e.g., 'Awarded for running a 2:38 marathon PB and volunteering at the water point').")
    add_num_p(doc, "6", "Publish & Share", "Click 'Confer & Publish Distinction'. Click the green WhatsApp button to share the announcement directly with the club WhatsApp group!")

    format_heading(doc.add_paragraph(), "4.6 In-App System Health Checks & 1-Click Autonomous Self-Healing", level=2)
    add_body_p(doc, "Under 'System Administration' (/admin):")
    add_bullet_p(doc, "Nervous System & Module Health: View 16 live checkpoints auditing database latency, memory usage, and pipeline health. If all are green, your system is running at peak speed.", bold_prefix="Diagnostics Tab: ")
    add_bullet_p(doc, "Autonomous Self-Healing: If a configuration was altered or database mirrors drifted, click the orange 'Run Autonomous Self-Healing' button. The system automatically repairs itself in 0.2 seconds with zero technical knowledge required.", bold_prefix="Self-Healing Tab: ")

    format_heading(doc.add_paragraph(), "4.7 Backing Up the Entire Club Database to a USB Flash Drive", level=2)
    add_body_p(doc, "Never risk losing club history! Back up regularly to a USB stick:")
    add_num_p(doc, "1", "Insert USB Drive", "Plug your USB stick into the laptop (e.g. Drive D: or E:).")
    add_num_p(doc, "2", "Open Drive Backup Tab", "Go to /admin and click 'Drive Backup & Scheduling'.")
    add_num_p(doc, "3", "Set Your Target Drive", "In the 'Target Backup Drive' box, type your USB path (e.g. D:\\SuperEaglesBackups). Click 'Save Preferences'.")
    add_num_p(doc, "4", "Click 'Backup Now'", "The system instantly generates a full database snapshot (.sqlite.bak) and JSON data export with a cryptographic SHA-256 integrity hash.")
    add_num_p(doc, "5", "In-Browser Download", "You can also click 'Download' next to any backup in the list to download the file directly via your browser.")

    format_heading(doc.add_paragraph(), "4.8 Editing Existing Member Details & Athletic Credentials", level=2)
    add_body_p(doc, "Club Administrators and Coaches can update any member's profile at any time:")
    add_num_p(doc, "1", "Access the Member Record", "From the Members Directory (/athletes) or directly from an athlete's 360° Profile (/athletes/[id]), click the orange 'Edit Member' button.")
    add_num_p(doc, "2", "Update Information Across 4 Tabs", "Modify Personal Bio (names, birth date, gender), Contact & Emergency info (phone, WhatsApp, emergency contact), Athletic Profile (runner/walker, primary discipline, development/performance/elite squad), and Administrative details (club number, ASA license, membership category).")
    add_num_p(doc, "3", "Save Changes", "Click 'Save Member Details'. All linked records, linked user account logins, and audit logs are updated simultaneously.")

    format_heading(doc.add_paragraph(), "4.9 Member Archival (Soft Archive) vs. Permanent Deletion", level=2)
    add_body_p(doc, "When a member resigns, relocates, or passes away, administrators have two distinct removal options:")
    add_bullet_p(doc, "Soft Archive (Recommended): Sets membership status to 'LAPSED' and marks the user account inactive. All historical race records, training sessions, and audit entries are preserved for statistical and historical accuracy.", bold_prefix="Soft Archive (Preserve History): ")
    add_bullet_p(doc, "Permanent Hard Delete: Irreversibly purges the athlete record from the database. Requires typing 'DELETE' in capital letters as an administrative confirmation safeguard.", bold_prefix="Permanent Deletion: ")

    format_heading(doc.add_paragraph(), "4.10 Annual Membership Renewal Cycle & The Arrears Gatekeeper", level=2)
    add_body_p(doc, 
        "Super Eagles AMMS enforces the club's standard annual membership cycle (per annum, expiring 31 December):"
    )
    add_bullet_p(doc, "Annual Dues Expiry: All memberships follow the calendar year cycle ending 31 December. Admins can renew dues with a single click in the directory or profile, which advances the expiry date to 31 December of the target cycle.", bold_prefix="Per Annum Cycle: ")
    add_bullet_p(doc, "Arrears Payment Gatekeeper: If a member's fee status is 'PENDING' or standing is 'LAPSED', the system automatically locks them from uploading training workouts, logging wellness check-ins, or submitting official race results. A clear notice informs them that renewal dues must be settled.", bold_prefix="Arrears Gatekeeper: ")
    add_bullet_p(doc, "In-App Notifications: When dues are renewed, the athlete immediately receives an in-app and WhatsApp notification confirming that their credential is valid through 31 Dec and all submission tools are unlocked.", bold_prefix="Live Notifications: ")

    format_heading(doc.add_paragraph(), "4.11 Exporting Standardized Blank CSV Files for Error-Free Re-Upload", level=2)
    add_body_p(doc,
        "To eliminate CSV formatting errors, missing columns, or delimiter misalignment, AMMS provides a standardized blank template export function:"
    )
    add_bullet_p(doc, "1. In the Members Directory (/athletes) or Bulk Ingestion Center (/admin/csv-import), click 'Export Blank CSV'.", bold_prefix="1-Click Export: ")
    add_bullet_p(doc, "2. A clean CSV template is downloaded with all exact column headers for Athletes, Race Results, Training, Club Activities, Attendance, or Sponsorship.", bold_prefix="Exact Header Match: ")
    add_bullet_p(doc, "3. Populate the spreadsheet in Microsoft Excel, Google Sheets, or LibreOffice, save it, and upload it back into the Ingestion Center with 100% alignment guaranteed.", bold_prefix="Guaranteed Alignment: ")

    format_heading(doc.add_paragraph(), "4.12 Dedicated Membership Payments & Dues Management (/payments)", level=2)
    add_body_p(doc,
        "The dedicated Payment Management Center (/payments) provides the Executive Committee, Club Treasurer, and Secretary with total financial oversight over membership dues:"
    )
    add_bullet_p(doc, "KPI Financial Ribbon: Real-time calculation of Total Projected Revenue vs. Revenue Collected vs. Outstanding Arrears for the active annual cycle (1 Jan – 31 Dec).", bold_prefix="Revenue Reconciliation: ")
    add_bullet_p(doc, "Official Banking Coordinates: Displays Standard Bank club account details, account number, branch code, and SnapScan QR format for members and treasurers.", bold_prefix="Club Banking Details: ")
    add_bullet_p(doc, "Multi-Status Filtering: Filter all members by All, In Arrears (Pending), Paid Up, Exempt (Life Members), or Subsidized.", bold_prefix="Dues Filter Tabs: ")
    add_bullet_p(doc, "1-Click Renewal & Record Payment Modal: Record EFT, Cash, Card, or SnapScan receipts with reference numbers, automatically advancing membership validity through 31 December.", bold_prefix="Receipt Recording: ")
    add_bullet_p(doc, "1-Click WhatsApp Dues Reminder: Generates pre-formatted payment reminder messages containing the athlete's name, dues amount, and official club bank details ready to send directly to WhatsApp.", bold_prefix="WhatsApp Reminders: ")
    add_bullet_p(doc, "Export Dues Spreadsheet: Download an official CSV audit report of all member payment statuses for executive meetings and AGMs.", bold_prefix="Dues CSV Audit: ")

    format_heading(doc.add_paragraph(), "4.13 Member Self-Registration & 'Join the Club' Workflow (/register)", level=2)
    add_body_p(doc,
        "Prospective athletes, walkers, and community members can now join Super Eagles independently through the web application without administrative bottlenecks:"
    )
    add_bullet_p(doc, "1. Prospective members click 'New Member? Join the Club & Create Profile' directly on the login screen (/login) or navigate to /register.", bold_prefix="Self-Service Portal: ")
    add_bullet_p(doc, "2. The applicant fills in their Personal Bio (names, date of birth, gender, cell/WhatsApp number), chooses their own password, selects their category (Senior Runner, Senior Walker, Master, Junior, Social), primary discipline, and emergency contact.", bold_prefix="Profile Creation: ")
    add_bullet_p(doc, "3. Upon submission, the system automatically assigns the next sequential Club ID (e.g. SEA-017), provisions their secure account, generates their 2D QR Digital Membership Card, logs them in instantly, and redirects them to their 360° Athlete Profile.", bold_prefix="Instant Provisioning: ")

    format_heading(doc.add_paragraph(), "4.14 Member Password Management: Retrieval & Changing Passwords", level=2)
    add_body_p(doc,
        "Super Eagles AMMS provides dual-tier password management designed specifically for local-first reliability:"
    )
    add_bullet_p(doc, "Forgot Password Retrieval (/login): On the login screen, members click 'Forgot Password?'. The system verifies identity via registered email and either their registered phone number, birth date (YYYY-MM-DD), or Club ID (SEA-XXX). Once verified, the member sets their new password immediately without requiring internet email servers.", bold_prefix="Local-First Password Recovery: ")
    add_bullet_p(doc, "Profile Password Change (/athletes/[id]): Logged-in athletes and administrators can click the 'Change Password' button directly in their 360° Profile to update their password at any time.", bold_prefix="In-Profile Password Update: ")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: HOW TO USE THE APP AS A COACH
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 5: HOW TO USE THE APP AS A HEAD COACH OR COACHING STAFF", level=1)
    
    format_heading(doc.add_paragraph(), "5.1 The Performance Engine: Pace Durability & Fading Curves (PDI)", level=2)
    add_body_p(doc, 
        "Coaches must look beyond average pace. Under 'Performance Engine' (/performance), AMMS analyzes late-race pace decay (PDI):"
    )
    add_bullet_p(doc, "If an athlete runs the first 10km at 4:00/km and the second 10km at 4:06/km, their deterioration is +2.5% (GOOD Durability).", bold_prefix="Even Split Pacing: ")
    add_bullet_p(doc, "If an athlete runs the first 21km at 4:00/km and fades to 5:15/km in the second half, their deterioration is +31.2% (POOR Durability). This athlete has a muscular endurance deficit; the coach must prescribe longer aerobic tempo runs rather than more speedwork.", bold_prefix="Heavy Fade / Bonking: ")

    format_heading(doc.add_paragraph(), "5.2 Monitoring Training Load & Injury Risk (Gabbett ACWR Sweet Spot)", level=2)
    add_body_p(doc, "On the athlete's profile and coaching hub, inspect the Acute:Chronic Workload Ratio (ACWR):")
    add_bullet_p(doc, "Sweet Spot (0.8 to 1.3): The athlete's training volume is increasing safely. The soft-tissue injury risk is at its absolute minimum (< 4%).", bold_prefix="Optimal Zone: ")
    add_bullet_p(doc, "Under-Training (< 0.8): The athlete has dropped training volume too rapidly. Fitness will begin to decay unless stimulus is restored.", bold_prefix="Under-Training Zone: ")
    add_bullet_p(doc, "Danger Zone (> 1.5): Acute load over the past 7 days is more than 50% higher than chronic monthly conditioning. This is where Achilles tendonitis, shin splints, and hamstring tears happen. The coach should immediately mandate a rest or easy recovery week.", bold_prefix="High Injury Risk Zone: ")

    format_heading(doc.add_paragraph(), "5.3 Reviewing & Approving AI Coaching Recommendations", level=2)
    add_body_p(doc, 
        "Under 'AI Coaching Insights' (/ai-insights), the deterministic coaching engine analyzes each athlete's latest readiness, "
        "race target, and ACWR, generating targeted weekly training prescriptions. "
        "Coaches retain complete authority: you can click 'Approve' to send the directive to the athlete, or 'Override' with your own notes."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: HOW TO USE THE APP AS THE SPONSORSHIP COMMITTEE
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 6: HOW TO USE THE APP AS THE SPONSORSHIP & FINANCE COMMITTEE", level=1)
    
    format_heading(doc.add_paragraph(), "6.1 The Reciprocity Principle: Balancing Performance with Club Service", level=2)
    add_body_p(doc, 
        "The Super Eagles Sponsorship & Reciprocity Framework (/sponsorship) ends favoritism and protects club funds. "
        "Club sponsorship is NOT charity; it is a partnership. Athletes who receive club financial support must represent the club proudly, "
        "attend club events, and volunteer to help the next generation of runners."
    )

    format_heading(doc.add_paragraph(), "6.2 The Club Sponsorship Score (CSS) Algorithm", level=2)
    add_body_p(doc, "The system calculates an objective 0-100 CSS score based on six auditable pillars:")
    add_bullet_p(doc, "1. Verified Race Performance (25%): Podium finishes, national rankings, and personal best times.")
    add_bullet_p(doc, "2. Track Record Improvement (20%): Month-over-month trajectory and personal progress.")
    add_bullet_p(doc, "3. Future Championship Potential (15%): Likelihood of qualifying for Comrades, Two Oceans, or national championships.")
    add_bullet_p(doc, "4. Training & Data Reliability (10%): Consistency in logging workouts and attending coaching sessions.")
    add_bullet_p(doc, "5. Club Loyalty & Volunteering (20%): Attendance at club pack runs, time trials, and water point marshalling.")
    add_bullet_p(doc, "6. Covenant & Conduct Compliance (10%): Wearing official club colors, attending club AGMs, and upholding sportsmanship.")

    format_heading(doc.add_paragraph(), "6.3 Catching 'Take-and-Run' Behaviors: Reciprocity Flags", level=2)
    add_body_p(doc,
        "If an athlete consumes more than R25,000 in club funding but attends less than 35% of club activities or volunteers zero times, "
        "the system automatically flags them with a 'RECIPROCITY ALERT'. "
        "The Sponsorship Committee receives an immediate notification to pause future disbursements until the athlete meets with the committee."
    )

    format_heading(doc.add_paragraph(), "6.4 Capturing Direct Sponsorship Disbursements on Member Profiles", level=2)
    add_body_p(doc,
        "Super Eagles AMMS provides an authorized, audit-logged mechanism for committee members to record financial disbursements directly on an athlete's 360° profile:"
    )
    add_bullet_p(doc, "Authorized Committee Roles: Only users with SUPER_ADMIN or SPONSORSHIP_COMMITTEE privileges can record disbursements or modify tier assignments. Regular members and coaches can view approved allocations but cannot add transactions.", bold_prefix="Role-Based Security: ")
    add_bullet_p(doc, "Direct Profile Access: From the Members Directory (/athletes) or Executive Dashboard, open the athlete's profile (e.g. /athletes/SEA-002) and click the 'SPONSORSHIP' tab.", bold_prefix="Profile Navigation: ")
    add_bullet_p(doc, "Financial Allocation Header: Displays the athlete's current sponsorship tier (ELITE, PERFORMANCE, DEVELOPMENT), their live CCLI reciprocity score, and their total Year-to-Date (YTD) financial support received in ZAR.", bold_prefix="Executive Summary: ")
    add_bullet_p(doc, "1-Click '+ Record Disbursement': Clicking this emerald button launches the streamlined financial capture modal.", bold_prefix="Capture Workflow: ")
    
    add_body_p(doc, "Step-by-Step Disbursement Capture Modal Inputs:")
    add_num_p(doc, "1", "Support Category", "Select the expenditure type: Cash Stipend, Official Race Entry (e.g. Comrades / Two Oceans), Running Equipment & Shoes, Travel & Accommodation, Physiotherapy & Sports Massage, or Nutritional Support.")
    add_num_p(doc, "2", "Disbursement Amount (ZAR)", "Type the exact amount in South African Rands (e.g. 2500 for a race entry or 6000 for a monthly stipend). The system enforces positive non-zero validation.")
    add_num_p(doc, "3", "Funding Source", "Specify which club budget pool is funding the transaction: Club General Treasury, Comrades Marathon 2026 Campaign, Direct Corporate Sponsor, or Community CSI Grant.")
    add_num_p(doc, "4", "Transaction Date", "Defaults to today's date, or can be set to the exact date of bank EFT release.")
    add_num_p(doc, "5", "Description & Voucher Reference", "Enter the invoice number, EFT reference, or specific purpose (e.g., 'Two Oceans Ultra 56km entry fee receipt #TO-9921').")
    add_num_p(doc, "6", "Submit & Atomic Ledger Update", "Click 'Confirm Disbursement'. The transaction is committed atomically. The modal closes, the live YTD total updates immediately, the transaction appears at the top of the ledger, and an immutable entry is recorded in the administrative audit log.")

    format_heading(doc.add_paragraph(), "6.5 Symmetric Financial Interface Design & Visual Order", level=2)
    add_body_p(doc,
        "In strict adherence to the club's design axiom: 'Every eye is built for order and symmetry', the sponsorship and disbursement interfaces are engineered to prevent visual clutter and cognitive fatigue:"
    )
    add_bullet_p(doc, "Balanced Dual-Column Grid: Form inputs and financial cards are arranged in balanced, proportional two-column grids with consistent 16px and 24px gutters, avoiding cramped or asymmetrical rows.", bold_prefix="Geometric Order: ")
    add_bullet_p(doc, "Tabular Numeric Typography: All currency amounts use monospace numerical fonts (font-mono) aligned cleanly to tabular columns, ensuring instantaneous readability for auditors.", bold_prefix="Monospace Clarity: ")
    add_bullet_p(doc, "High-Contrast Calm Palette: Deep slate card backgrounds (bg-[#1E293B]/85) paired with crisp border delineation (border-slate-700/80) and vivid emerald highlights (text-emerald-400) eliminate visual noise while maximizing legibility in field environments.", bold_prefix="Calm Visual Palette: ")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 7: DAY-TO-DAY REAL WORLD PLAYBOOKS
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 7: DAY-TO-DAY REAL WORLD PLAYBOOKS", level=1)

    format_heading(doc.add_paragraph(), "7.1 Playbook A: Saturday Morning 10km Club Run (Start-to-Finish)", level=2)
    add_num_p(doc, "06:00", "Setup at Clubhouse", "Turn on the club laptop. Plug in power or run on battery. Open AMMS in the browser.")
    add_num_p(doc, "06:15", "Connect Marshal Phones", "Coach or marshal turns on their phone hotspot and connects the laptop. The marshal opens the laptop's IP address on their phone (e.g. http://192.168.1.105:3000) and taps 'Open QR Marshal Scanner'.")
    add_num_p(doc, "06:30", "Runner Check-In at Start Line", "As runners arrive, marshals scan runners' digital badges or printed QR cards with their phones. Late runners give their SEA numbers to the desk marshal who enters them manually.")
    add_num_p(doc, "07:00", "The Run Takes Place", "Athletes run the course. The laptop remains at the table.")
    add_num_p(doc, "08:15", "Finish Line Verification", "Marshals scan finishers at the finish funnel. CCLI loyalty points are instantly awarded.")
    add_num_p(doc, "08:45", "Review & Backup", "Go to /admin, click 'Drive Backup', and tap 'Backup Now' to a USB stick. Shut down the laptop.")

    format_heading(doc.add_paragraph(), "7.2 Playbook B: New Member Joins at the Clubhouse", level=2)
    add_body_p(doc, "A prospective member arrives and pays cash fees:")
    add_bullet_p(doc, "1. Open 'Members & Athletes' -> Click '+ Register New Athlete'.")
    add_bullet_p(doc, "2. Enter their name, contact details, and ASA license number. Mark fee as 'PAID'.")
    add_bullet_p(doc, "3. Assign their initial squad (e.g. 'Development Squad'). Click Save.")
    add_bullet_p(doc, "4. Print or display their digital QR member card. The runner can now take a photo of their card on their phone for all future runs!")

    format_heading(doc.add_paragraph(), "7.3 Playbook C: Monthly Awards Ceremony & WhatsApp Broadcast", level=2)
    add_body_p(doc, "On the last Friday of each month:")
    add_bullet_p(doc, "1. The committee reviews the 4-Quadrant Talent Matrix to select the top competitive breakthrough and top community volunteer.")
    add_bullet_p(doc, "2. Open the winner's profile -> Click 'Confer Medallion'. Select Month, Year, and Badge Variant.")
    add_bullet_p(doc, "3. Enter formal citation (e.g., 'Awarded for running a 2:38 marathon PB at Kaapsehoop'). Click Confer.")
    add_bullet_p(doc, "4. Click the green WhatsApp button. The formatted announcement opens in WhatsApp with congratulations, ready to send to the group with one click!")

    format_heading(doc.add_paragraph(), "7.4 Playbook D: End-of-Day Backup & Packing Up the Laptop", level=2)
    add_body_p(doc, "Never pack the laptop without taking a backup:")
    add_bullet_p(doc, "1. Insert the club USB flash drive into the laptop.")
    add_bullet_p(doc, "2. Go to /admin -> Click 'Drive Backup & Scheduling'.")
    add_bullet_p(doc, "3. Click 'Backup Now'. Check that the file size is ~376 KB with a green SHA-256 badge.")
    add_bullet_p(doc, "4. Safely eject the USB flash drive and keep it in the club safe or secretary's bag.")

    format_heading(doc.add_paragraph(), "7.5 Playbook E: Load-Shedding & Power Outage Protocol", level=2)
    add_body_p(doc, "If the power grid drops or cellular signal dies during a club event:")
    add_bullet_p(doc, "1. AMMS remains 100% operational because it runs locally on the laptop battery.")
    add_bullet_p(doc, "2. Marshals continue scanning. All attendance records queue safely in browser memory.")
    add_bullet_p(doc, "3. No data is lost, no cloud connection is needed, and no race operation is interrupted.")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 8: NATIONWIDE REMOTE ATHLETE ACCESS & CLOUDFLARE SECURE TUNNEL
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 8: NATIONWIDE REMOTE ATHLETE ACCESS & CLOUDFLARE SECURE TUNNEL", level=1)

    format_heading(doc.add_paragraph(), "8.1 The Nationwide Challenge: Athletes Traveling Across South Africa", level=2)
    add_body_p(doc,
        "Super Eagles athletes frequently travel across the country to compete in national marathons and ultra-marathons: "
        "the Comrades Marathon in Durban, the Two Oceans 56km in Cape Town, the Kaapsehoop Marathon in Nelspruit, or high-altitude training in Dullstroom. "
        "During these trips, athletes are hundreds or thousands of kilometers away from the clubhouse laptop hosting the application. "
        "A common question is: How can members log their daily wellness check-ins, upload their GPX training runs, and submit their official race times "
        "when they are not in the physical vicinity of the clubhouse computer?"
    )

    format_heading(doc.add_paragraph(), "8.2 The Solution: The Zero-Cost Cloudflare Mobile Tunnel", level=2)
    add_body_p(doc,
        "The Super Eagles AMMS solves this without expensive cloud hosting or paid database subscriptions. "
        "Using an encrypted, zero-configuration Cloudflare Tunnel, your club laptop is given a secure, encrypted public HTTPS address "
        "(e.g., https://<unique-id>.trycloudflare.com or your club domain https://portal.supereaglesclub.co.za). "
        "This tunnel establishes an outbound encrypted connection directly from the laptop to Cloudflare Edge. "
        "It requires ZERO port forwarding on your router, ZERO firewall modifications, and costs R0.00."
    )
    add_callout(doc,
        "Full Security & Privacy: Data transmitted through the Cloudflare Tunnel is encrypted end-to-end with TLS 1.3. "
        "Information is written directly into your laptop's local database (dev.db). "
        "No athlete telemetry or medical records are ever stored on third-party cloud servers, guaranteeing 100% POPIA compliance.",
        title="POPIA & DATA ENCRYPTION ASSURANCE",
        border_color="16A34A",
        bg_color="F0FDF4"
    )

    format_heading(doc.add_paragraph(), "8.3 Step-by-Step: How the Club Admin Launches the Tunnel (1-Click)", level=2)
    add_body_p(doc, "To enable nationwide mobile access for traveling athletes, the Club Administrator follows three simple steps:")
    add_num_p(doc, "Step 1", "Launch the Automated Tunnel Script", 
        "On the club laptop, open the scripts folder and double-click 'start-remote-tunnel.bat' (or run 'cloudflared tunnel --url http://localhost:3000'). "
        "The script will automatically detect the local AMMS app and open an encrypted tunnel.")
    add_num_p(doc, "Step 2", "Locate and Save the Public Tunnel Address",
        "The script will display a public link in green text ending in '.trycloudflare.com' (for example: https://supereagles-run.trycloudflare.com). "
        "Copy this URL, open AMMS on the laptop, navigate to 'System Rules & Club Configuration' (/settings), "
        "paste the URL into the 'Nationwide Remote Mobile Access' box, and click 'Save'.")
    add_num_p(doc, "Step 3", "Broadcast to Athletes via WhatsApp",
        "Click the green 'Share on WhatsApp Group' button inside the settings card. "
        "This immediately launches WhatsApp with a pre-composed message inviting all members to access the mobile portal.")

    format_heading(doc.add_paragraph(), "8.4 Step-by-Step: How Remote Athletes Use the Portal on Their Phones", level=2)
    add_body_p(doc, "An athlete sitting in a hotel room in Durban or Cape Town performs the following:")
    add_bullet_p(doc, "1. Tap the link received in the club WhatsApp group on any smartphone (iPhone Safari, Android Chrome, Samsung Internet).")
    add_bullet_p(doc, "2. Log in using their assigned Athlete ID (e.g. SEA-001) or club credentials.")
    add_bullet_p(doc, "3. Daily Wellness Check-In: Tap '60-Second Wellness Check-In' on their profile to rate Sleep, Fatigue, Soreness, Stress, and Mood (1-5 scale).")
    add_bullet_p(doc, "4. Uploading GPX Training Data: Under 'Training Activities', tap 'Upload GPX File' to select a track exported from Garmin Connect, Strava, or Coros. "
                       "The system calculates pace, elevation, and Gabbett ACWR training load automatically.")
    add_bullet_p(doc, "5. Submitting Race Results: Under 'Record Race Result' (/races/results/new), enter the event name (e.g. Comrades Marathon 2026), distance (89 km), "
                       "and official finish time. The system validates the Riegel fatigue curve and updates the club leaderboard immediately.")

    format_heading(doc.add_paragraph(), "8.5 Alternative: Official Race Timing System Bulk Import (FinishTime, ChampionChip)", level=2)
    add_body_p(doc,
        "For major races, individual athletes do not even need to type their results. "
        "South African marathons use electronic RFID timing mats (FinishTime, ChampionChip, RaceTec, UltimateLive):")
    add_bullet_p(doc, "1. The morning after the race, the Club Secretary downloads the official race results CSV/Excel sheet from the timing provider website.")
    add_bullet_p(doc, "2. Go to /admin/csv-import -> Select 'Race Results' from the dropdown.")
    add_bullet_p(doc, "3. Drop the CSV file into the ingestion box and click 'Process & Import'.")
    add_bullet_p(doc, "4. In under 3 seconds, all Super Eagles runners' official gun times, chip times, positions, and category medals are mapped to their profiles automatically.")

    format_heading(doc.add_paragraph(), "8.7 Official Race Results Evidence Layer & Certificate Verification", level=2)
    add_body_p(doc,
        "To maintain 100% integrity across official race times and eliminate unverified submissions, "
        "the AMMS features a multi-tiered Evidence Verification Layer:")
    add_bullet_p(doc, "1. Timing Certificate Upload: When an athlete records a race result via '/races/results/new' or directly on their athlete profile, "
                       "they can upload an official finisher certificate or timing slip in PDF, PNG, JPEG, or WebP format (up to 8 MB).")
    add_bullet_p(doc, "2. Official Race Results Link: Members can provide the exact URL to their individual race split page on official timing portals (e.g. FinishTime, ChampionChip, RaceTec).")
    add_bullet_p(doc, "3. Official Race Bib Number: Capture the athlete's assigned event race number (e.g. Bib #4102) for official verification by club marshals and selectors.")
    add_bullet_p(doc, "4. Profile Lightbox Modal: In the athlete's 'Official Race Results' table, an 'Evidence' column provides a one-click '[Certificate]' button opening a secure lightbox modal to inspect the document, alongside direct links to external timing websites.")

    format_heading(doc.add_paragraph(), "8.8 Hardware USB Barcode/QR Scanner & Live Event Switcher", level=2)
    add_body_p(doc,
        "For club training runs, pack walks, and time trials, marshals can utilize standard handheld USB or Bluetooth 2D barcode/QR scanner guns:")
    add_bullet_p(doc, "1. Zero Driver Setup: The scanner operates as an automated USB HID keyboard wedge, transmitting scanned badge data instantly upon trigger press.")
    add_bullet_p(doc, "2. In-Modal Dynamic Event Switcher: If the club hosts multiple simultaneous events (such as a 'Wednesday 5km Pack Walk' and a 'Wednesday 8km Time Trial Run'), "
                       "the marshal can switch between active club events directly from an in-modal dropdown inside the scanner header without exiting or reopening the modal.")
    add_bullet_p(doc, "3. Instant Attendance Binding: Each scan immediately binds the athlete to the selected activity, records their check-in timestamp, and updates their CCLI loyalty score.")

    format_heading(doc.add_paragraph(), "8.9 Digital Membership Card CR80 One-Click PDF Export", level=2)
    add_body_p(doc,
        "Members and race organizers frequently require printed or digital PDF accreditation cards for provincial championship check-in:")
    add_bullet_p(doc, "1. Digital Pass Modal: Click 'Digital Pass' from the athlete profile action bar to open the gold-foil luxury membership credential.")
    add_bullet_p(doc, "2. One-Click PDF Export: Click the 'Export to PDF / Print' button. The built-in print stylesheet isolates the card into the international standard CR80 format (credit card size), preserving official club emblems, ASA license numbers, and the 2D QR verification code.")
    add_bullet_p(doc, "3. Offline Accreditation: Race marshals can scan the PDF card directly off another phone screen or printed card even in areas without cellular connectivity.")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 9: PROOF-OF-PAYMENT (POP) & BANKING RECONCILIATION
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 9: PROOF-OF-PAYMENT (POP) & BANKING RECONCILIATION", level=1)

    format_heading(doc.add_paragraph(), "9.1 The Financial Challenge: Dues, Race Entries & Unmatched Bank Deposits", level=2)
    add_body_p(doc,
        "Athletics clubs face ongoing friction reconciling bulk electronic fund transfers (EFTs), ATM cash deposits, and race entry payments. "
        "Athletes often make payments without clear reference numbers, causing disputes over unallocated dues and blocking race registrations."
    )

    format_heading(doc.add_paragraph(), "9.2 POP Ingestion: Uploading EFT Slips, ATM Receipts & Mobile PDF Statements", level=2)
    add_body_p(doc, "AMMS allows both members and treasurers to attach official proof-of-payment directly to member accounts:")
    add_bullet_p(doc, "1. Member Self-Service Upload: In the athlete profile under 'Financial Standing', click 'Upload Proof of Payment'. Drag and drop bank transaction PDFs, screenshots, or camera photos of ATM receipts.")
    add_bullet_p(doc, "2. Reference Tagging: Enter the bank reference code (e.g. 'DUES-SEA001' or athlete surname) and exact amount paid (ZAR).")
    add_bullet_p(doc, "3. Staging Status: Uploaded documents immediately enter the 'Pending Verification' queue, timestamped and linked to the athlete's ID.")

    format_heading(doc.add_paragraph(), "9.3 Two-Stage Treasurer Verification Queue & Arrears Gatekeeper Resolution", level=2)
    add_body_p(doc, "The Club Treasurer manages the reconciliation queue from '/payments':")
    add_bullet_p(doc, "1. Audit Queue: The treasurer views all unallocated and pending proofs of payment with split-pane receipt preview.")
    add_bullet_p(doc, "2. Reconciliation Verification: Compare the bank deposit against club bank statements. Click 'Verify & Clear Payment' to approve.")
    add_bullet_p(doc, "3. Arrears Gatekeeper Deactivation: Approval updates the member's payment status to 'UP_TO_DATE' immediately, lifting the 403 arrears lock and restoring training/race entry privileges.")

    format_heading(doc.add_paragraph(), "9.4 1-Click WhatsApp Official Receipt Dispatch", level=2)
    add_body_p(doc,
        "Upon verification, the system enables 1-click receipt dispatch. The treasurer clicks 'Send WhatsApp Receipt', "
        "which launches WhatsApp with an official club receipt message containing the transaction reference, amount cleared, "
        "and ASA license release confirmation."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 10: LOCAL-FIRST TELEMETRY & AWAY EVENT FLEET LOGISTICS
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 10: LOCAL-FIRST TELEMETRY & AWAY EVENT FLEET LOGISTICS", level=1)

    format_heading(doc.add_paragraph(), "10.1 Zero-Cloud Local GPX & CSV Ingestion (Garmin, Coros, Strava)", level=2)
    add_body_p(doc,
        "AMMS features a zero-cloud ingestion pipeline for athlete GPS activity files. "
        "Athletes and coaches can upload raw .GPX files directly into the browser. "
        "The embedded TypeScript parser computes haversine distance, elevation gain, split paces, and Gabbett workload metrics locally on CPU, "
        "eliminating reliance on third-party cloud fitness APIs."
    )

    format_heading(doc.add_paragraph(), "10.2 Race Fleet Transport Manifests & Bus Captain Assignments", level=2)
    add_body_p(doc,
        "For major away events like the Comrades Marathon or Two Oceans, the Event Logistics module (/events/logistics) provides comprehensive fleet management:")
    add_bullet_p(doc, "1. Bus Allocation: Assign athletes to numbered club luxury coaches or minibuses with departure time and location tags.")
    add_bullet_p(doc, "2. Capacity Controls: System prevents overbooking by enforcing strict seat capacities per vehicle.")
    add_bullet_p(doc, "3. Bus Captain Rostering: Designate lead athletes as bus captains with mobile contact numbers for roll call.")

    format_heading(doc.add_paragraph(), "10.3 Hotel Accommodation Allocations & Rooming Rosters", level=2)
    add_body_p(doc,
        "Organize club accommodation effortlessly:")
    add_bullet_p(doc, "1. Rooming Lists: Allocate athletes to hotel rooms, lodges, or dormitories with occupancy limits.")
    add_bullet_p(doc, "2. Special Requests: Record dietary requirements, early breakfast slots, and travel companion preferences.")
    add_bullet_p(doc, "3. Manifest Export: Export complete hotel rooming manifests to printable sheets or CSV rosters.")

    format_heading(doc.add_paragraph(), "10.4 Volunteer Marshal Scheduling & Instant CCLI Loyalty Accrual", level=2)
    add_body_p(doc,
        "Deploy and reward club volunteers at club events and water points:")
    add_bullet_p(doc, "1. Station Rostering: Assign marshals to water stations, turnaround points, and registration tables.")
    add_bullet_p(doc, "2. Attendance Credit: Marshals check in using QR badges or name search, automatically accruing CCLI loyalty points toward annual awards.")

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 11: STATUTORY ASA SEASON ROLLOVER & 1-CLICK BACKUP RESTORATION
    # =========================================================================
    format_heading(doc.add_paragraph(), "CHAPTER 11: STATUTORY ASA SEASON ROLLOVER & 1-CLICK BACKUP RESTORATION", level=1)

    format_heading(doc.add_paragraph(), "11.1 Annual Athletics South Africa (ASA) Age-Group Rollover Engine", level=2)
    add_body_p(doc,
        "On December 31st of each calendar year, athletics clubs must transition their membership rosters to the new competition year. "
        "The AMMS Rollover Engine automates this complex statutory process:")
    add_bullet_p(doc, "1. Age Classification: Recalculates all athlete ages as of December 31st and updates their official ASA category (Senior, Sub-Vet 35+, Veteran 40+, Master 50+, Grandmaster 60+).")
    add_bullet_p(doc, "2. Roster Transition: Moves active athletes to 'PENDING_RENEWAL' status while archiving prior-year performance records.")
    add_bullet_p(doc, "3. Fee Recalculation: Applies new season fee schedules according to updated age categories.")

    format_heading(doc.add_paragraph(), "11.2 Historical Snapshot Archiving & Next-Season Budget Forecasting", level=2)
    add_body_p(doc,
        "Before executing any season rollover, AMMS creates an immutable historical archive snapshot. "
        "The system projects expected club revenue based on active member renewal rates and category distributions, "
        "giving the Executive Committee clear visibility into upcoming financial resources.")

    format_heading(doc.add_paragraph(), "11.3 1-Click WhatsApp & Email Notice Dispatch Architecture", level=2)
    add_body_p(doc,
        "The unified communication engine allows club executives to dispatch standardized notifications:")
    add_bullet_p(doc, "1. Annual Renewal Notices: Send personalized season renewal reminders with banking details and ASA license fees.")
    add_bullet_p(doc, "2. Race Logistics Bulletins: Broadcast departure times, bus numbers, and hotel directions to traveling athletes.")
    add_bullet_p(doc, "3. Zero Gateway Cost: Leverages browser intent protocols (WhatsApp Web and mailto) with E.164 phone formatting, requiring zero third-party gateway fees.")

    format_heading(doc.add_paragraph(), "11.4 In-App 1-Click Disaster Recovery & Database Restoration Protocol", level=2)
    add_body_p(doc,
        "System administrators can restore backups directly within the application without touching the command line:")
    add_bullet_p(doc, "1. Automated Pre-Restore Snapshot: The engine takes an instant safety snapshot of current data before applying any restore.")
    add_bullet_p(doc, "2. SQLite Integrity Verification: Validates the target backup file with 'PRAGMA quick_check' to ensure zero corruption.")
    add_bullet_p(doc, "3. Dual-Mirror Synchronization: Atomically updates dev.db and prisma/dev.db simultaneously, guaranteeing zero schema drift.")

    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(28)
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_e = p_end.add_run("Super Eagles Athletics Club • 'Fly High, Run True, Serve the Club' • Official Technical & Operational Manual")
    r_e.font.name = "Calibri"
    r_e.font.size = Pt(9)
    r_e.italic = True
    r_e.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)

    output_path = os.path.join(os.getcwd(), "Super_Eagles_AMMS_User_Manual.docx")
    print(f"[4/5] Saving redesigned manual to {output_path}...")
    doc.save(output_path)
    print(f"[5/5] SUCCESS! Document created ({os.path.getsize(output_path):,} bytes).")
    return output_path

if __name__ == "__main__":
    build_comprehensive_manual()
