/**
 * Super Eagles AMMS — Publication-Grade Implementation & User Manual PDF Generator
 * Generates a comprehensive, symmetric, print-ready HTML document with embedded
 * high-resolution crest and vector SVG architecture diagrams, then compiles to PDF
 * using Headless Chromium (--print-to-pdf).
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const EMBLEM_PATH = path.join(ROOT, "public", "images", "emblem.png");
const TEMP_HTML = path.join(ROOT, "scripts", "_manual_render.html");
const OUT_PDF = path.join(ROOT, "Super_Eagles_AMMS_Implementation_and_User_Manual.pdf");
const GDRIVE_PDF = path.join(ROOT, "Google_Drive_Ready", "Super_Eagles_AMMS_Implementation_and_User_Manual.pdf");

const emblemBase64 = fs.existsSync(EMBLEM_PATH)
  ? `data:image/png;base64,${fs.readFileSync(EMBLEM_PATH).toString("base64")}`
  : "";

// ============================================================================
// CUSTOM VECTOR SVG DIAGRAMS (Razor-sharp at any zoom level)
// ============================================================================

const SVG_PIPELINE = `
<svg viewBox="0 0 820 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  <defs>
    <linearGradient id="navyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#15803D"/>
      <stop offset="100%" stop-color="#16A34A"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B45309"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="820" height="220" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
  <text x="410" y="24" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="#0F172A" letter-spacing="1.2">THE 6-STAGE EVIDENCE-BASED PERFORMANCE &amp; GOVERNANCE PIPELINE</text>

  <!-- 6 Stages -->
  <g transform="translate(18, 42)">
    <rect x="0" y="0" width="114" height="58" rx="8" fill="url(#navyGrad)"/>
    <text x="57" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#4ADE80">1. MEASURE</text>
    <text x="57" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">Races, GPX/CSV,</text>
    <text x="57" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">QR Runs, Wellness</text>
    <line x1="114" y1="29" x2="132" y2="29" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>

    <rect x="134" y="0" width="114" height="58" rx="8" fill="url(#navyGrad)"/>
    <text x="191" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#4ADE80">2. NORMALISE</text>
    <text x="191" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">Club Benchmarks &amp;</text>
    <text x="191" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">Riegel 10km Scale</text>
    <line x1="248" y1="29" x2="266" y2="29" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>

    <rect x="268" y="0" width="114" height="58" rx="8" fill="url(#navyGrad)"/>
    <text x="325" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#38BDF8">3. TREND</text>
    <text x="325" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">3 / 6 / 12-Month</text>
    <text x="325" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">Verified Trajectory</text>
    <line x1="382" y1="29" x2="400" y2="29" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>

    <rect x="402" y="0" width="114" height="58" rx="8" fill="url(#navyGrad)"/>
    <text x="459" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#38BDF8">4. PREDICT</text>
    <text x="459" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">Riegel Power Curve</text>
    <text x="459" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#CBD5E1">&amp; Gaussian Prob.</text>
    <line x1="516" y1="29" x2="534" y2="29" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>

    <rect x="536" y="0" width="114" height="58" rx="8" fill="url(#greenGrad)"/>
    <text x="593" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#FFFFFF">5. RECOMMEND</text>
    <text x="593" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#DCFCE7">Tier Guidance &amp;</text>
    <text x="593" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#DCFCE7">Coaching Directives</text>
    <line x1="650" y1="29" x2="668" y2="29" stroke="#64748B" stroke-width="2" marker-end="url(#arrow)"/>

    <rect x="670" y="0" width="114" height="58" rx="8" fill="url(#goldGrad)"/>
    <text x="727" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#FFFFFF">6. HUMAN VOTE</text>
    <text x="727" y="37" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#FEF3C7">Audited Approval</text>
    <text x="727" y="49" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#FEF3C7">or Reasoned Override</text>
  </g>

  <!-- 3 Segregated Pillars underneath -->
  <g transform="translate(18, 120)">
    <rect x="0" y="0" width="248" height="82" rx="8" fill="#FFFFFF" stroke="#16A34A" stroke-width="1.5"/>
    <rect x="0" y="0" width="248" height="22" rx="8" fill="#16A34A"/>
    <text x="124" y="15" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="800" fill="#FFFFFF">PILLAR 1: ATHLETE PERFORMANCE INDEX (API)</text>
    <text x="12" y="38" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Pure athletic speed, progression &amp; reliability</text>
    <text x="12" y="53" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Scale: 0–100 (35% Perf / 30% Imprv / 20% Goal / 15% Rel)</text>
    <text x="12" y="68" font-family="Segoe UI, Arial" font-size="8.8" font-weight="700" fill="#15803D">• Strictly separated from loyalty &amp; readiness</text>

    <rect x="268" y="0" width="248" height="82" rx="8" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5"/>
    <rect x="268" y="0" width="248" height="22" rx="8" fill="#D97706"/>
    <text x="392" y="15" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="800" fill="#FFFFFF">PILLAR 2: CLUB SPONSORSHIP SCORE (CSS)</text>
    <text x="280" y="38" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Blends performance with Club Loyalty (CCLI 20%)</text>
    <text x="280" y="53" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Drives 9 transparent sponsorship tier advisories</text>
    <text x="280" y="68" font-family="Segoe UI, Arial" font-size="8.8" font-weight="700" fill="#B45309">• Approved exemptions never penalize athletes</text>

    <rect x="536" y="0" width="248" height="82" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
    <rect x="536" y="0" width="248" height="22" rx="8" fill="#0284C7"/>
    <text x="660" y="15" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="800" fill="#FFFFFF">PILLAR 3: READINESS &amp; WORKLOAD (ARCS)</text>
    <text x="548" y="38" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Non-medical coaching wellness &amp; Foster ACWR</text>
    <text x="548" y="53" font-family="Segoe UI, Arial" font-size="8.8" fill="#334155">• Outputs: High / Normal / Caution / Insufficient</text>
    <text x="548" y="68" font-family="Segoe UI, Arial" font-size="8.8" font-weight="700" fill="#0369A1">• NEVER reduces sponsorship funding</text>
  </g>
</svg>
`;

const SVG_TOPOLOGY = `
<svg viewBox="0 0 820 295" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  <defs>
    <marker id="arrBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7"/>
    </marker>
    <marker id="arrGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#16A34A"/>
    </marker>
    <marker id="arrAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="820" height="295" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
  <text x="410" y="24" text-anchor="middle" font-family="Segoe UI, Arial" font-size="11" font-weight="700" fill="#0F172A" letter-spacing="1.1">SUPPORTED DEPLOYMENT TOPOLOGY: HOST WORKSTATION + LOCAL SQLITE + MOBILE HTTP ACCESS</text>

  <!-- Left: Network Drive / Shared Storage -->
  <rect x="20" y="48" width="185" height="145" rx="10" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="112" y="68" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10" font-weight="800" fill="#92400E">NETWORK / SHARED DRIVE</text>
  <text x="112" y="83" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#B45309">(Optional Archive &amp; Backup)</text>
  <rect x="34" y="96" width="157" height="36" rx="6" fill="#FFFFFF" stroke="#FCD34D"/>
  <text x="112" y="112" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" font-weight="700" fill="#1E293B">App Files &amp; ZIP Backups</text>
  <text x="112" y="124" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.8" fill="#64748B">Read/Copy Source &amp; Snapshots</text>
  <rect x="34" y="142" width="157" height="38" rx="6" fill="#FEF2F2" stroke="#FCA5A5"/>
  <text x="112" y="158" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#991B1B">NO LIVE MULTI-PC SQLITE</text>
  <text x="112" y="171" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.5" fill="#B91C1C">Prevents SMB File-Lock Corruption</text>

  <!-- Center: Clubhouse Host Workstation -->
  <rect x="255" y="42" width="275" height="232" rx="12" fill="#0F172A" stroke="#16A34A" stroke-width="2"/>
  <text x="392" y="64" text-anchor="middle" font-family="Segoe UI, Arial" font-size="11" font-weight="800" fill="#4ADE80">CLUBHOUSE HOST WORKSTATION (PC)</text>
  <text x="392" y="79" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#94A3B8">Launched via start.bat (Production Mode)</text>

  <rect x="273" y="92" width="239" height="58" rx="8" fill="#1E293B" stroke="#334155"/>
  <text x="392" y="110" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="700" fill="#FFFFFF">Next.js 16 HTTP Server (Node.js)</text>
  <text x="392" y="125" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" fill="#38BDF8">Bound to 0.0.0.0:3000 (Local + Wi-Fi LAN)</text>
  <text x="392" y="139" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8" fill="#CBD5E1">37 REST APIs • JWT Cookies • POPIA RBAC</text>

  <rect x="273" y="162" width="239" height="62" rx="8" fill="#064E3B" stroke="#10B981"/>
  <text x="392" y="180" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="700" fill="#FFFFFF">Local SSD SQLite Database Engine</text>
  <text x="392" y="195" text-anchor="middle" font-family="Consolas, monospace" font-size="7.8" fill="#A7F3D0">%LOCALAPPDATA%\\SuperEaglesAMMS\\dev.db</text>
  <text x="392" y="211" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.8" fill="#D1FAE5">+ Auto startup_snapshot.db on every launch</text>

  <rect x="273" y="234" width="239" height="28" rx="6" fill="#1E293B" stroke="#475569"/>
  <text x="392" y="252" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" font-weight="600" fill="#FDE047">Local Browser: http://localhost:3000</text>

  <!-- Arrow Network -> Host -->
  <line x1="205" y1="120" x2="253" y2="120" stroke="#D97706" stroke-width="2" marker-end="url(#arrAmber)"/>
  <text x="229" y="112" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.5" font-weight="700" fill="#B45309">Backup</text>
  <text x="229" y="133" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.5" fill="#B45309">Sync</text>

  <!-- Right Top: Clubhouse Wi-Fi LAN Devices -->
  <rect x="585" y="42" width="215" height="110" rx="10" fill="#ECFDF5" stroke="#16A34A" stroke-width="1.5"/>
  <text x="692" y="62" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10" font-weight="800" fill="#14532D">CLUBHOUSE WI-FI / LAN</text>
  <text x="692" y="77" text-anchor="middle" font-family="Consolas, monospace" font-size="8.5" font-weight="700" fill="#15803D">http://&lt;HOST-IP&gt;:3000</text>
  <text x="598" y="96" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Athlete Phones (Self-Register, QR)</text>
  <text x="598" y="111" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Marshal Tablets (QR Camera Scan)</text>
  <text x="598" y="126" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Coach Laptops (Squad Analytics)</text>
  <text x="598" y="141" font-family="Segoe UI, Arial" font-size="8" font-weight="700" fill="#15803D">• Zero Internet Required (Offline Queue)</text>

  <!-- Right Bottom: Nationwide Remote via Cloudflare Tunnel -->
  <rect x="585" y="166" width="215" height="108" rx="10" fill="#EFF6FF" stroke="#0284C7" stroke-width="1.5"/>
  <text x="692" y="186" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10" font-weight="800" fill="#0C4A6E">NATIONWIDE 4G/5G REMOTE</text>
  <text x="692" y="201" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.3" font-weight="700" fill="#0369A1">Encrypted Cloudflare Tunnel (HTTPS)</text>
  <text x="598" y="219" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Launched via start-remote.bat</text>
  <text x="598" y="234" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Athletes log wellness from home</text>
  <text x="598" y="249" font-family="Segoe UI, Arial" font-size="8.3" fill="#1E293B">• Upload POPs &amp; GPX anywhere in SA</text>
  <text x="598" y="264" font-family="Segoe UI, Arial" font-size="8" font-weight="700" fill="#0369A1">• Data never stored on 3rd-party cloud</text>

  <!-- Arrows Host -> Right -->
  <line x1="530" y1="106" x2="583" y2="96" stroke="#16A34A" stroke-width="2" marker-end="url(#arrGreen)" marker-start="url(#arrGreen)"/>
  <text x="556" y="92" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.5" font-weight="700" fill="#15803D">HTTP</text>

  <line x1="530" y1="140" x2="583" y2="215" stroke="#0284C7" stroke-width="2" stroke-dasharray="4,2" marker-end="url(#arrBlue)" marker-start="url(#arrBlue)"/>
  <text x="556" y="192" text-anchor="middle" font-family="Segoe UI, Arial" font-size="7.5" font-weight="700" fill="#0369A1">HTTPS</text>

  <!-- Note bar bottom-left -->
  <rect x="20" y="206" width="185" height="68" rx="8" fill="#F1F5F9" stroke="#94A3B8"/>
  <text x="112" y="224" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.5" font-weight="800" fill="#0F172A">CLOUD OPTION (24/7)</text>
  <text x="112" y="239" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8" fill="#334155">Vercel + Neon/Supabase PG</text>
  <text x="112" y="252" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8" fill="#334155">OR Docker (Dockerfile)</text>
  <text x="112" y="265" text-anchor="middle" font-family="Consolas, monospace" font-size="7.5" fill="#0284C7">npm run build:postgres</text>
</svg>
`;

const SVG_MATRIX = `
<svg viewBox="0 0 780 320" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  <rect x="0" y="0" width="780" height="320" rx="12" fill="#0F172A"/>
  <text x="390" y="26" text-anchor="middle" font-family="Segoe UI, Arial" font-size="11.5" font-weight="800" fill="#FFFFFF" letter-spacing="1">EXECUTIVE 4-QUADRANT MATRIX: PERFORMANCE INDEX (Y) vs. CLUB LOYALTY / CCLI (X)</text>

  <!-- Plot Area -->
  <g transform="translate(80, 44)">
    <!-- Q2 Top-Left: Reciprocity Review (X < 60, Y >= 72) -->
    <rect x="0" y="0" width="372" height="106" fill="#451A03" fill-opacity="0.55" stroke="#78350F" stroke-width="1"/>
    <text x="14" y="22" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#FBBF24">⚠ RECIPROCITY REVIEW</text>
    <text x="14" y="38" font-family="Segoe UI, Arial" font-size="8.8" fill="#FDE68A">High Performance (≥ 72) • Low Club Loyalty (&lt; 60)</text>
    <text x="14" y="55" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">Action: Conditional sponsorship covenant required.</text>
    <text x="14" y="69" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">Assign internal club run pacing or marshal shifts.</text>

    <!-- Q1 Top-Right: Priority Talent (X >= 60, Y >= 72) -->
    <rect x="372" y="0" width="248" height="106" fill="#064E3B" fill-opacity="0.65" stroke="#047857" stroke-width="1"/>
    <text x="386" y="22" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#34D399">★ PRIORITY ELITE TALENT</text>
    <text x="386" y="38" font-family="Segoe UI, Arial" font-size="8.8" fill="#A7F3D0">High Perf (≥ 72) • High Loyalty (≥ 60)</text>
    <text x="386" y="55" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">Action: Tier-1 stipend, premier</text>
    <text x="386" y="69" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">race entries, kit &amp; travel priority.</text>

    <!-- Q4 Bottom-Left: Management Watchlist (X < 60, Y < 72) -->
    <rect x="0" y="106" width="372" height="124" fill="#1E293B" fill-opacity="0.7" stroke="#334155" stroke-width="1"/>
    <text x="14" y="128" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#94A3B8">MANAGEMENT WATCHLIST</text>
    <text x="14" y="144" font-family="Segoe UI, Arial" font-size="8.8" fill="#CBD5E1">Developing Performance (&lt; 72) • Low Club Loyalty (&lt; 60)</text>
    <text x="14" y="162" font-family="Segoe UI, Arial" font-size="8.3" fill="#94A3B8">Action: Standard club membership (Non-Sponsored). Encourage</text>
    <text x="14" y="176" font-family="Segoe UI, Arial" font-size="8.3" fill="#94A3B8">Saturday pack runs &amp; verify approved medical/study exemptions.</text>

    <!-- Q3 Bottom-Right: Development Opportunity (X >= 60, Y < 72) -->
    <rect x="372" y="106" width="248" height="124" fill="#134E4A" fill-opacity="0.55" stroke="#0F766E" stroke-width="1"/>
    <text x="386" y="128" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#2DD4BF">DEVELOPMENT OPPORTUNITY</text>
    <text x="386" y="144" font-family="Segoe UI, Arial" font-size="8.8" fill="#99F6E4">Developing Perf (&lt; 72) • Loyal (≥ 60)</text>
    <text x="386" y="162" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">Action: Strong club ambassadors.</text>
    <text x="386" y="176" font-family="Segoe UI, Arial" font-size="8.3" fill="#E2E8F0">Invest coaching &amp; race-entry grants.</text>

    <!-- Threshold Crosshairs -->
    <line x1="0" y1="106" x2="620" y2="106" stroke="#4ADE80" stroke-width="2.2"/>
    <line x1="372" y1="0" x2="372" y2="230" stroke="#38BDF8" stroke-width="2.2"/>

    <!-- Threshold Badges -->
    <rect x="-58" y="95" width="52" height="22" rx="4" fill="#14532D" stroke="#4ADE80"/>
    <text x="-32" y="109" text-anchor="middle" font-family="Consolas, monospace" font-size="9" font-weight="800" fill="#4ADE80">API 72</text>

    <rect x="336" y="236" width="72" height="20" rx="4" fill="#0C4A6E" stroke="#38BDF8"/>
    <text x="372" y="249" text-anchor="middle" font-family="Consolas, monospace" font-size="9" font-weight="800" fill="#38BDF8">CCLI 60</text>

    <!-- Axis Labels -->
    <text x="-38" y="10" text-anchor="end" font-family="Consolas, monospace" font-size="9" fill="#94A3B8">100</text>
    <text x="-38" y="228" text-anchor="end" font-family="Consolas, monospace" font-size="9" fill="#94A3B8">0</text>
    <text x="0" y="248" font-family="Consolas, monospace" font-size="9" fill="#94A3B8">0</text>
    <text x="615" y="248" text-anchor="end" font-family="Consolas, monospace" font-size="9" fill="#94A3B8">100</text>
    <text x="310" y="268" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9.5" font-weight="700" fill="#CBD5E1">CLUB CONTRIBUTION &amp; LOYALTY INDEX (CCLI) — Configurable Policy Crosshair →</text>

    <!-- Sample Dispersed Athlete Nodes (illustrative, clear of text) -->
    <circle cx="536" cy="86" r="12" fill="#16A34A" stroke="#FFFFFF" stroke-width="2"/>
    <text x="536" y="90" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#FFFFFF">E1</text>
    <circle cx="586" cy="76" r="12" fill="#16A34A" stroke="#FFFFFF" stroke-width="2"/>
    <text x="586" y="80" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#FFFFFF">E2</text>
    <circle cx="295" cy="86" r="12" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
    <text x="295" y="90" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#FFFFFF">R1</text>
    <circle cx="515" cy="204" r="12" fill="#0D9488" stroke="#FFFFFF" stroke-width="2"/>
    <text x="515" y="208" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#FFFFFF">D1</text>
    <circle cx="235" cy="206" r="12" fill="#475569" stroke="#FFFFFF" stroke-width="2"/>
    <text x="235" y="210" text-anchor="middle" font-family="Segoe UI, Arial" font-size="8.2" font-weight="800" fill="#FFFFFF">W1</text>
  </g>
</svg>
`;

const SVG_RBAC = `
<svg viewBox="0 0 820 185" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
  <rect x="0" y="0" width="820" height="185" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1"/>
  <text x="410" y="22" text-anchor="middle" font-family="Segoe UI, Arial" font-size="10.5" font-weight="800" fill="#0F172A" letter-spacing="1">POPIA ACT DATA ISOLATION &amp; 5-ROLE SECURITY ARCHITECTURE</text>

  <g transform="translate(18, 36)">
    <!-- Role 1 -->
    <rect x="0" y="0" width="148" height="132" rx="8" fill="#FFFFFF" stroke="#15803D" stroke-width="1.5"/>
    <rect x="0" y="0" width="148" height="26" rx="8" fill="#15803D"/>
    <text x="74" y="17" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9" font-weight="800" fill="#FFFFFF">SUPER_ADMIN (GM)</text>
    <text x="8" y="44" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Full Executive Matrix</text>
    <text x="8" y="59" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Sponsorship &amp; Payouts</text>
    <text x="8" y="74" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Season Rollover &amp; QA</text>
    <text x="8" y="89" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Compliance &amp; Backups</text>
    <text x="8" y="104" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Weight Calibration</text>
    <text x="8" y="121" font-family="Segoe UI, Arial" font-size="7.8" font-weight="700" fill="#15803D">Scope: Club-Wide + Audit</text>

    <!-- Role 2 -->
    <rect x="159" y="0" width="148" height="132" rx="8" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5"/>
    <rect x="159" y="0" width="148" height="26" rx="8" fill="#0284C7"/>
    <text x="233" y="17" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9" font-weight="800" fill="#FFFFFF">COACH</text>
    <text x="167" y="44" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Assigned Squad Only</text>
    <text x="167" y="59" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Telemetry &amp; ACWR</text>
    <text x="167" y="74" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ AI Coach Workbench</text>
    <text x="167" y="89" font-family="Segoe UI, Arial" font-size="8.2" fill="#DC2626">✕ Unassigned Profiles</text>
    <text x="167" y="104" font-family="Segoe UI, Arial" font-size="8.2" fill="#DC2626">✕ Club Finance / Dues</text>
    <text x="167" y="121" font-family="Segoe UI, Arial" font-size="7.8" font-weight="700" fill="#0369A1">Scope: Assigned Athletes</text>

    <!-- Role 3 -->
    <rect x="318" y="0" width="148" height="132" rx="8" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.5"/>
    <rect x="318" y="0" width="148" height="26" rx="8" fill="#7C3AED"/>
    <text x="392" y="17" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9" font-weight="800" fill="#FFFFFF">ATHLETE / MEMBER</text>
    <text x="326" y="44" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Own 360° Profile Only</text>
    <text x="326" y="59" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Wellness, GPX, QR Pass</text>
    <text x="326" y="74" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Own POP &amp; Event RSVP</text>
    <text x="326" y="89" font-family="Segoe UI, Arial" font-size="8.2" fill="#DC2626">✕ Other Members (403)</text>
    <text x="326" y="104" font-family="Segoe UI, Arial" font-size="8.2" fill="#DC2626">✕ Executive / Admin</text>
    <text x="326" y="121" font-family="Segoe UI, Arial" font-size="7.8" font-weight="700" fill="#6D28D9">Scope: Self-Isolated</text>

    <!-- Role 4 -->
    <rect x="477" y="0" width="148" height="132" rx="8" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5"/>
    <rect x="477" y="0" width="148" height="26" rx="8" fill="#D97706"/>
    <text x="551" y="17" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9" font-weight="800" fill="#FFFFFF">CLUB_ADMIN</text>
    <text x="485" y="44" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Directory &amp; CSV Import</text>
    <text x="485" y="59" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ QR Attendance &amp; Bus</text>
    <text x="485" y="74" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ POP &amp; Dues Verify</text>
    <text x="485" y="89" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Official Race Capture</text>
    <text x="485" y="104" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Compliance &amp; Rollover</text>
    <text x="485" y="121" font-family="Segoe UI, Arial" font-size="7.8" font-weight="700" fill="#B45309">Scope: Club Operations</text>

    <!-- Role 5 -->
    <rect x="636" y="0" width="148" height="132" rx="8" fill="#FFFFFF" stroke="#0D9488" stroke-width="1.5"/>
    <rect x="636" y="0" width="148" height="26" rx="8" fill="#0D9488"/>
    <text x="710" y="17" text-anchor="middle" font-family="Segoe UI, Arial" font-size="9" font-weight="800" fill="#FFFFFF">SPONSORSHIP COMM.</text>
    <text x="644" y="44" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Reciprocity Matrix</text>
    <text x="644" y="59" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Vote &amp; Decisions</text>
    <text x="644" y="74" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Direct Disbursements</text>
    <text x="644" y="89" font-family="Segoe UI, Arial" font-size="8.2" fill="#1E293B">✓ Covenant Conditions</text>
    <text x="644" y="104" font-family="Segoe UI, Arial" font-size="8.2" fill="#DC2626">✕ System Backup/Reset</text>
    <text x="644" y="121" font-family="Segoe UI, Arial" font-size="7.8" font-weight="700" fill="#0F766E">Scope: Sponsorship Gov.</text>
  </g>
</svg>
`;

// ============================================================================
// FULL HTML DOCUMENT
// ============================================================================

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Super Eagles AMMS — Implementation &amp; User Manual</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
    @top-left {
      content: "SUPER EAGLES AMMS — IMPLEMENTATION & USER MANUAL";
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.6px;
    }
    @top-right {
      content: "v2.0 PRODUCTION EDITION";
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #15803D;
      letter-spacing: 0.6px;
    }
    @bottom-left {
      content: "Super Eagles Athletics Club • POPIA & ASA Compliant Operations Reference";
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 7.5pt;
      color: #64748B;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #0F172A;
    }
  }

  @page :first {
    margin: 0;
    @top-left { content: none; }
    @top-right { content: none; }
    @bottom-left { content: none; }
    @bottom-right { content: none; }
  }

  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
    font-size: 9.4pt;
    line-height: 1.52;
    color: #1E293B;
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Cover Page */
  .cover {
    width: 210mm;
    height: 297mm;
    background: linear-gradient(160deg, #090F1E 0%, #0F172A 55%, #062C1E 100%);
    color: #FFFFFF;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24mm 20mm 18mm 20mm;
    page-break-after: always;
    overflow: hidden;
  }
  .cover-accent-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, #16A34A 0%, #EAB308 50%, #16A34A 100%);
  }
  .cover-accent-side {
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: 8px;
    background: linear-gradient(180deg, #16A34A, #0F172A 60%, #EAB308);
  }
  .cover-badge {
    display: inline-block;
    border: 1px solid rgba(74, 222, 128, 0.45);
    background: rgba(22, 163, 74, 0.16);
    color: #86EFAC;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 999px;
  }
  .cover-center {
    text-align: center;
    margin-top: 8mm;
  }
  .cover-crest {
    width: 58mm;
    height: auto;
    margin: 0 auto 10mm auto;
    display: block;
    filter: drop-shadow(0 12px 24px rgba(0,0,0,0.65));
  }
  .cover-club {
    font-size: 12pt;
    font-weight: 800;
    letter-spacing: 3px;
    color: #FACC15;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .cover-title {
    font-size: 28pt;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.5px;
    margin: 0 0 10px 0;
    color: #FFFFFF;
  }
  .cover-subtitle {
    font-size: 13pt;
    font-weight: 400;
    color: #CBD5E1;
    margin: 0 auto 14mm auto;
    max-width: 155mm;
    line-height: 1.45;
  }
  .cover-divider {
    width: 70mm;
    height: 3px;
    background: linear-gradient(90deg, #16A34A, #FACC15);
    margin: 0 auto 12mm auto;
    border-radius: 2px;
  }
  .cover-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    text-align: left;
    margin-top: 4mm;
  }
  .cover-card {
    background: rgba(30, 41, 59, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 10px;
    padding: 11px 14px;
  }
  .cover-card-label {
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #4ADE80;
    margin-bottom: 3px;
  }
  .cover-card-val {
    font-size: 9.2pt;
    font-weight: 600;
    color: #F8FAFC;
  }
  .cover-footer {
    border-top: 1px solid rgba(148, 163, 184, 0.25);
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #94A3B8;
  }

  /* Typography & Structure */
  .part-banner {
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 70%, #064E3B 100%);
    color: #FFFFFF;
    padding: 14px 18px;
    border-radius: 10px;
    border-left: 6px solid #16A34A;
    margin: 0 0 14px 0;
    page-break-before: always;
    break-inside: avoid;
  }
  .part-banner .part-kicker {
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #FACC15;
    margin-bottom: 3px;
  }
  .part-banner h1 {
    margin: 0;
    font-size: 16.5pt;
    font-weight: 900;
    color: #FFFFFF;
    border: none;
    padding: 0;
  }
  .part-banner p {
    margin: 4px 0 0 0;
    font-size: 8.8pt;
    color: #CBD5E1;
  }

  h1.chapter {
    font-size: 14.5pt;
    font-weight: 900;
    color: #0F172A;
    margin: 18px 0 8px 0;
    padding-bottom: 5px;
    border-bottom: 2.5px solid #16A34A;
    page-break-after: avoid;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  h1.chapter .ch-num {
    display: inline-block;
    background: #0F172A;
    color: #4ADE80;
    font-size: 8.5pt;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 5px;
    letter-spacing: 0.8px;
    vertical-align: middle;
  }
  h2 {
    font-size: 11.2pt;
    font-weight: 800;
    color: #0F172A;
    margin: 13px 0 5px 0;
    page-break-after: avoid;
    border-left: 3.5px solid #D97706;
    padding-left: 8px;
  }
  h3 {
    font-size: 9.8pt;
    font-weight: 700;
    color: #15803D;
    margin: 10px 0 4px 0;
    page-break-after: avoid;
  }
  p { margin: 0 0 7px 0; text-align: left; }
  ul, ol { margin: 4px 0 8px 0; padding-left: 18px; }
  li { margin-bottom: 3.5px; }
  li strong { color: #0F172A; }

  /* Code & Formula Boxes */
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.4pt;
    background: #F1F5F9;
    color: #0F172A;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #E2E8F0;
  }
  pre {
    background: #0F172A;
    color: #E2E8F0;
    padding: 10px 13px;
    border-radius: 8px;
    font-family: Consolas, "Courier New", monospace;
    font-size: 8.2pt;
    line-height: 1.45;
    overflow-x: hidden;
    white-space: pre-wrap;
    margin: 6px 0 10px 0;
    border-left: 4px solid #16A34A;
    break-inside: avoid;
  }
  .formula-box {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-left: 4px solid #0284C7;
    border-radius: 7px;
    padding: 9px 13px;
    margin: 7px 0 10px 0;
    font-family: "Cambria Math", "Segoe UI", serif;
    font-size: 9.6pt;
    color: #0F172A;
    break-inside: avoid;
  }
  .formula-title {
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 7.8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #0369A1;
    margin-bottom: 3px;
  }

  /* Callout Boxes */
  .callout {
    border-radius: 8px;
    padding: 9px 13px;
    margin: 8px 0 10px 0;
    break-inside: avoid;
    font-size: 8.9pt;
  }
  .callout-title {
    font-weight: 800;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 3px;
  }
  .callout-info { background: #EFF6FF; border: 1px solid #BFDBFE; border-left: 4px solid #0284C7; }
  .callout-info .callout-title { color: #0369A1; }
  .callout-warn { background: #FFFBEB; border: 1px solid #FDE68A; border-left: 4px solid #D97706; }
  .callout-warn .callout-title { color: #B45309; }
  .callout-danger { background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid #DC2626; }
  .callout-danger .callout-title { color: #991B1B; }
  .callout-success { background: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #16A34A; }
  .callout-success .callout-title { color: #15803D; }

  /* Grids & Cards */
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 7px 0 10px 0;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    margin: 7px 0 10px 0;
  }
  .card {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 10px 12px;
    break-inside: avoid;
  }
  .card h4 {
    margin: 0 0 4px 0;
    font-size: 9.2pt;
    font-weight: 800;
    color: #0F172A;
  }
  .card p, .card ul {
    font-size: 8.5pt;
    margin-bottom: 3px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 7px 0 11px 0;
    font-size: 8.4pt;
    break-inside: auto;
  }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th {
    background: #0F172A;
    color: #FFFFFF;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #1E293B;
    font-size: 8pt;
    letter-spacing: 0.3px;
  }
  td {
    padding: 5.5px 8px;
    border: 1px solid #CBD5E1;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #F8FAFC; }

  .badge {
    display: inline-block;
    padding: 1.5px 6px;
    border-radius: 4px;
    font-size: 7.4pt;
    font-weight: 800;
    text-transform: uppercase;
  }
  .b-green { background: #DCFCE7; color: #166534; }
  .b-amber { background: #FEF3C7; color: #92400E; }
  .b-blue { background: #DBEAFE; color: #1E40AF; }
  .b-purple { background: #EDE9FE; color: #5B21B6; }
  .b-red { background: #FEE2E2; color: #991B1B; }
  .b-slate { background: #E2E8F0; color: #334155; }

  .figure {
    margin: 9px 0 12px 0;
    break-inside: avoid;
  }
  .figure-caption {
    font-size: 8pt;
    font-weight: 700;
    color: #475569;
    text-align: center;
    margin-top: 4px;
  }

  .toc-box {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 8px;
  }
  .toc-col {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-top: 4px solid #0F172A;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .toc-col.part2 { border-top-color: #16A34A; }
  .toc-col h3 {
    margin: 0 0 8px 0;
    font-size: 9.8pt;
    color: #0F172A;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  .toc-item {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dotted #CBD5E1;
    padding: 4px 0;
    font-size: 8.6pt;
  }
  .toc-item strong { color: #0F172A; }
  .toc-sub {
    font-size: 7.9pt;
    color: #64748B;
    margin: 0 0 5px 10px;
  }
  .page-break { page-break-before: always; }

  .step-list { counter-reset: step; list-style: none; padding-left: 0; }
  .step-list > li {
    counter-increment: step;
    position: relative;
    padding-left: 26px;
    margin-bottom: 6px;
  }
  .step-list > li::before {
    content: counter(step);
    position: absolute;
    left: 0; top: 1px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #16A34A;
    color: #FFFFFF;
    font-size: 8pt;
    font-weight: 800;
    text-align: center;
    line-height: 18px;
  }
  .step-list ul {
    list-style: disc;
    padding-left: 16px;
    margin-top: 4px;
  }
</style>
</head>
<body>

<!-- ====================================================================== -->
<!-- COVER PAGE                                                             -->
<!-- ====================================================================== -->
<section class="cover">
  <div class="cover-accent-top"></div>
  <div class="cover-accent-side"></div>

  <div style="display:flex;justify-content:space-between;align-items:center;">
    <span class="cover-badge">Official Technical &amp; Operations Manual</span>
    <span style="font-size:8.5pt;font-weight:700;color:#94A3B8;letter-spacing:1px;">RELEASE 2.0 • PRODUCTION FIELD-TRIAL</span>
  </div>

  <div class="cover-center">
    ${emblemBase64 ? `<img src="${emblemBase64}" class="cover-crest" alt="Super Eagles Official Crest"/>` : ""}
    <div class="cover-club">Super Eagles Athletics Club</div>
    <h1 class="cover-title">Athletics &amp; Membership<br/>Management System (AMMS)</h1>
    <p class="cover-subtitle">
      In-Depth Technical Implementation Guide, Grounded Sports Science Specification,
      and Role-Based Operations &amp; User Manual
    </p>
    <div class="cover-divider"></div>

    <div class="cover-grid">
      <div class="cover-card">
        <div class="cover-card-label">Platform Architecture</div>
        <div class="cover-card-val">Next.js 16 • React 19 • TypeScript • Prisma • SQLite / PostgreSQL</div>
      </div>
      <div class="cover-card">
        <div class="cover-card-label">Supported Topologies</div>
        <div class="cover-card-val">Clubhouse PC + Wi-Fi LAN Phones • Cloudflare Tunnel • Cloud</div>
      </div>
      <div class="cover-card">
        <div class="cover-card-label">Governance &amp; Compliance</div>
        <div class="cover-card-val">POPIA Act Role Isolation • ASA Age Categories • Audit Ledger</div>
      </div>
      <div class="cover-card">
        <div class="cover-card-label">Verification &amp; Release Gate</div>
        <div class="cover-card-val">117/117 Automated Tests Passed • 59 Routes • Zero Test Data</div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <span><strong>Document ID:</strong> SE-AMMS-IMPL-UM-v2.0</span>
    <span><strong>Audience:</strong> Club Executives, Administrators, Coaches, Athletes &amp; IT</span>
    <span><strong>Classification:</strong> Official Club Reference</span>
  </div>
</section>

<!-- ====================================================================== -->
<!-- TABLE OF CONTENTS & EXECUTIVE ORIENTATION                              -->
<!-- ====================================================================== -->
<h1 class="chapter" style="margin-top:0;"><span class="ch-num">GUIDE</span> Table of Contents &amp; Document Orientation</h1>
<p>
  This manual serves as the single authoritative reference for deploying, administering, coaching with, and operating the
  <strong>Super Eagles Athletics &amp; Membership Management System (AMMS)</strong>. It is divided into two structured parts:
  <strong>Part I</strong> covers systems architecture, workstation/phone networking, clean production field-trial setup, POPIA security,
  and grounded mathematical formulas; <strong>Part II</strong> provides complete role-by-role user workflows, day-to-day club playbooks,
  troubleshooting procedures, and full route/command appendices.
</p>

<div class="toc-box">
  <div class="toc-col">
    <h3>Part I — Technical Implementation</h3>
    <div class="toc-item"><strong>Ch. 1: System Overview &amp; Core Architecture</strong><span>p. 3</span></div>
    <div class="toc-sub">Evidence pipeline, 3 segregated scores, tech stack, surface inventory</div>

    <div class="toc-item"><strong>Ch. 2: Deployment Topologies &amp; Networking</strong><span>p. 4</span></div>
    <div class="toc-sub">Workstation + local SQLite rule, Wi-Fi phones, Cloudflare Tunnel, Cloud</div>

    <div class="toc-item"><strong>Ch. 3: Installation &amp; Clean Field-Trial Setup</strong><span>p. 5</span></div>
    <div class="toc-sub">Turnkey ZIP launch, .env reference, clean DB reset, admin bootstrap</div>

    <div class="toc-item"><strong>Ch. 4: Database Schema, RBAC &amp; POPIA Security</strong><span>p. 7</span></div>
    <div class="toc-sub">30 Prisma models, 5-role matrix, upload &amp; auth hardening, audit trail</div>

    <div class="toc-item"><strong>Ch. 5: Grounded Sports Science &amp; Math Engines</strong><span>p. 9</span></div>
    <div class="toc-sub">Club normalisation, API, PDI, Riegel prediction, Foster ACWR, CCLI, CSS</div>
  </div>

  <div class="toc-col part2">
    <h3>Part II — User Manual &amp; Club Playbooks</h3>
    <div class="toc-item"><strong>Ch. 6: Getting Started, UI &amp; Mobile Offline Mode</strong><span>p. 11</span></div>
    <div class="toc-sub">Sign-in, self-registration, navigation, offline queue &amp; WhatsApp sync</div>

    <div class="toc-item"><strong>Ch. 7: Athlete &amp; Lifestyle Member Guide</strong><span>p. 11</span></div>
    <div class="toc-sub">360° profile, social walkers, wellness, GPX/race capture, POP, QR pass</div>

    <div class="toc-item"><strong>Ch. 8: Coach &amp; Performance Staff Guide</strong><span>p. 12</span></div>
    <div class="toc-sub">Squad isolation, readiness console, AI Coach Workbench, bulk telemetry</div>

    <div class="toc-item"><strong>Ch. 9: Club Administrator Operations Guide</strong><span>p. 13</span></div>
    <div class="toc-sub">Directory, CSV import, QR marshal scanner, away bus fleet, POP verify</div>

    <div class="toc-item"><strong>Ch. 10: Sponsorship Committee &amp; Executive GM</strong><span>p. 14</span></div>
    <div class="toc-sub">4-Quadrant Matrix, thresholds, committee voting, direct disbursements</div>

    <div class="toc-item"><strong>Ch. 11: System Admin, ASA Rollover &amp; Recovery</strong><span>p. 15</span></div>
    <div class="toc-sub">Health diagnostics, QA benchmarks, season rollover, 1-click backups</div>

    <div class="toc-item"><strong>Ch. 12: Day-to-Day Club Playbooks (SOPs)</strong><span>p. 16</span></div>
    <div class="toc-sub">5 operational runbooks from Saturday runs to annual season rollover</div>

    <div class="toc-item"><strong>Ch. 13 &amp; Appendices A–B: Troubleshooting &amp; Ref</strong><span>p. 16</span></div>
    <div class="toc-sub">Issue resolution table, 21 pages + 37 APIs, CLI command cheat sheet</div>
  </div>
</div>

<div class="callout callout-success" style="margin-top:12px;">
  <div class="callout-title">Quick-Start Pointer for Clubhouse Administrators</div>
  If you already have <code>Super_Eagles_AMMS_FULL_WORKING_APP.zip</code> and want to launch the clean production field trial on your
  clubhouse PC immediately, jump straight to <strong>Chapter 3 (Section 3.1)</strong>: extract the ZIP, double-click <code>start.bat</code>,
  sign in with <code>admin@supereagles.co.za</code>, and share the displayed Wi-Fi address with members.
</div>

<div class="callout callout-warn">
  <div class="callout-title">Mandatory Non-Medical &amp; Grounded-Data Governance Notice</div>
  This system provides sports-performance analytics, club administration, and sponsorship decision support. It <strong>does not provide
  medical diagnosis, clinical injury probability estimates, or medical advice</strong>. All official World Athletics scoring tables remain
  distinct from Super Eagles internal club policy scores.
</div>

<!-- ====================================================================== -->
<!-- PART I BANNER                                                          -->
<!-- ====================================================================== -->
<div class="part-banner">
  <div class="part-kicker">Part I — Engineering, Architecture &amp; Deployment</div>
  <h1>Technical Implementation &amp; Systems Reference</h1>
  <p>System philosophy, workstation &amp; mobile network topology, clean field-trial deployment, POPIA database security, and peer-reviewed analytical formulas.</p>
</div>

<!-- ====================================================================== -->
<!-- CHAPTER 1                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter" style="margin-top:6px;"><span class="ch-num">CH 01</span> System Overview, Philosophy &amp; Core Architecture</h1>

<h2>1.1 Purpose &amp; Operational Philosophy</h2>
<p>
  <strong>Super Eagles AMMS</strong> replaces fragmented WhatsApp threads, error-prone spreadsheets, paper attendance registers, and subjective
  sponsorship debates with a unified, local-first web application tailored for South African athletics and walking clubs (Athletics South Africa / ASA compliant).
  Every decision in the platform follows a transparent six-stage evidence pipeline—ensuring mathematics informs leadership while
  <strong>humans retain 100% final governance authority</strong>.
</p>

<div class="figure">
  ${SVG_PIPELINE}
  <div class="figure-caption">Figure 1.1 — The 6-Stage Super Eagles Evidence Pipeline and Three Strictly Segregated Scoring Pillars.</div>
</div>

<h2>1.2 The Golden Rule: Three Strictly Segregated Scores</h2>
<p>
  A core architectural invariant enforced throughout the database, APIs, and automated test suite is that the club's three core indices are
  <strong>never merged into a single ambiguous number</strong>:
</p>
<div class="grid-3">
  <div class="card">
    <h4>1. Athlete Performance Index (API)</h4>
    <p>Measures pure athletic capability, verified chronological progression, target race capability, and reliability on a <strong>0–100</strong> scale. Used by coaches and athletes for competitive planning.</p>
  </div>
  <div class="card">
    <h4>2. Club Sponsorship Score (CSS)</h4>
    <p>Measures whether club financial investment is justified by blending verified athletic performance with <strong>Club Contribution &amp; Loyalty (CCLI)</strong> and covenant compliance. Drives sponsorship tiers.</p>
  </div>
  <div class="card">
    <h4>3. Athlete Readiness (ARCS)</h4>
    <p>Non-medical sports coaching indicator (<code>HIGH</code>, <code>NORMAL</code>, <code>CAUTION</code>, <code>INSUFFICIENT_DATA</code>) based on sleep, fatigue, soreness, and ACWR. <strong>Never reduces funding.</strong></p>
  </div>
</div>

<h2>1.3 Full Technology Stack &amp; Application Surface</h2>
<table>
  <thead>
    <tr><th style="width:22%;">Architecture Layer</th><th style="width:30%;">Technology &amp; Version</th><th style="width:48%;">Role in Super Eagles AMMS</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Frontend &amp; SSR</strong></td><td>Next.js 16.3.4 (Turbopack), React 19</td><td>App Router serving 21 pages (34 static assets + dynamic SSR portals) for desktop &amp; mobile PWA.</td></tr>
    <tr><td><strong>Language &amp; Validation</strong></td><td>TypeScript 5.7.3, Zod 3.24.2</td><td>End-to-end strict typing across 142 source files; strict payload validation on all write APIs.</td></tr>
    <tr><td><strong>Styling &amp; Visuals</strong></td><td>Tailwind CSS 3.4, Lucide Icons, Recharts</td><td>High-contrast dark-slate &amp; emerald UI designed around visual symmetry and mobile readability.</td></tr>
    <tr><td><strong>ORM &amp; Database</strong></td><td>Prisma 6.4.0 (SQLite / PostgreSQL)</td><td>30 relational data models. Zero-config local SQLite for clubhouses; 1-command switch to PostgreSQL.</td></tr>
    <tr><td><strong>Auth &amp; Cryptography</strong></td><td>bcryptjs, jsonwebtoken (JWT), HTTP-only cookies</td><td>Salted password hashing, signed role-scoped sessions, dynamic HTTPS cookie security.</td></tr>
    <tr><td><strong>Data Ingestion</strong></td><td>PapaParse 5.5.2, Custom GPX/TCX/QR Parsers</td><td>10 MB capped telemetry imports, bulk member CSV wizard, native deterministic SVG QR generator.</td></tr>
    <tr><td><strong>Automated QA</strong></td><td>Vitest 3.0.5 (16 Suites, 117 Tests)</td><td>Verifies formulas, POPIA RBAC isolation, chaos fuzzing, backup integrity, and 4D workflows.</td></tr>
  </tbody>
</table>

<!-- ====================================================================== -->
<!-- CHAPTER 2                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 02</span> Deployment Topologies &amp; Hardware Architecture</h1>

<h2>2.1 Supported Topologies Overview</h2>
<p>
  Super Eagles AMMS is engineered to operate seamlessly across three deployment models depending on the club's budget and internet infrastructure—from
  a zero-cost offline clubhouse computer up to a 24/7 global cloud deployment.
</p>

<div class="figure">
  ${SVG_TOPOLOGY}
  <div class="figure-caption">Figure 2.1 — Recommended Clubhouse Workstation Topology with Local SQLite Engine, Network Backup Share, Wi-Fi Phone LAN, and Optional Cloudflare Tunnel.</div>
</div>

<div class="callout callout-danger">
  <div class="callout-title">CRITICAL ARCHITECTURE RULE — SQLITE ON NETWORK DRIVES (SMB / UNC)</div>
  SQLite databases must <strong>NEVER</strong> be opened directly over a shared network drive (SMB/CIFS/UNC) simultaneously by multiple computers.
  Network filesystems do not guarantee POSIX/Win32 advisory file locks, which causes intermittent database locking errors and file corruption.
  <br/><strong>Enforced Solution:</strong> You may store the extracted application files and backup archives on a networked drive, but <code>start.bat</code>
  automatically places and runs the live SQLite database locally on the single Host PC at <code>%LOCALAPPDATA%\\SuperEaglesAMMS\\dev.db</code>.
  All other PCs, tablets, and phones connect strictly via HTTP over the network (<code>http://&lt;HOST-IP&gt;:3000</code>)—never by opening the <code>.db</code> file directly.
</div>

<h2>2.2 Topology Comparison Matrix</h2>
<table>
  <thead>
    <tr><th style="width:20%;">Topology</th><th style="width:18%;">Hosting Cost</th><th style="width:22%;">Database Engine</th><th style="width:40%;">Best Use Case &amp; Connectivity</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>A. Clubhouse PC + Wi-Fi LAN</strong><br/><span class="badge b-green">Field-Trial Recommended</span></td>
      <td>R 0 / month</td>
      <td>Local Host SQLite<br/>(<code>%LOCALAPPDATA%</code>)</td>
      <td>Run <code>start.bat</code> on one clubhouse PC. Works 100% without internet. Phones &amp; tablets connect via clubhouse Wi-Fi to <code>http://&lt;HOST-IP&gt;:3000</code>.</td>
    </tr>
    <tr>
      <td><strong>B. Clubhouse PC + Cloudflare Tunnel</strong><br/><span class="badge b-blue">Zero-Cost Remote</span></td>
      <td>R 0 / month</td>
      <td>Local Host SQLite<br/>(POPIA on-premise)</td>
      <td>Run <code>start-remote.bat</code>. Creates an encrypted public HTTPS URL (<code>*.trycloudflare.com</code>) so athletes on 4G/5G at home can log in while data stays on the club PC.</td>
    </tr>
    <tr>
      <td><strong>C. 24/7 Cloud (Vercel / Docker)</strong><br/><span class="badge b-purple">Enterprise Scale</span></td>
      <td>Free Tier – Low Monthly</td>
      <td>Managed PostgreSQL<br/>(Neon / Supabase / RDS)</td>
      <td>Always-on global access with custom domain (e.g. <code>portal.supereagles.co.za</code>). Requires <code>npm run build:postgres</code> and provider automated backups.</td>
    </tr>
  </tbody>
</table>

<h2>2.3 Hardware, Software &amp; Firewall Prerequisites</h2>
<div class="grid-2">
  <div class="card">
    <h4>Host Workstation (Clubhouse PC)</h4>
    <ul>
      <li><strong>OS:</strong> Windows 10 or Windows 11 (64-bit)</li>
      <li><strong>Runtime:</strong> Node.js v20 LTS or v22+ (verified up to v26)</li>
      <li><strong>Storage:</strong> 2 GB free on local SSD/NVMe (500 MB app + backups)</li>
      <li><strong>RAM:</strong> 4 GB minimum (8 GB recommended for smooth multi-user load)</li>
      <li><strong>Python (Optional):</strong> Not required for core operation; detected automatically if installed.</li>
    </ul>
  </div>
  <div class="card">
    <h4>Mobile Devices &amp; Network Requirements</h4>
    <ul>
      <li><strong>Phones / Tablets:</strong> Any modern iOS Safari or Android Chrome browser (no App Store install needed).</li>
      <li><strong>QR Hardware:</strong> Built-in smartphone/tablet camera, USB webcam, or plug-and-play USB 2D barcode/QR scanner.</li>
      <li><strong>Windows Firewall:</strong> Allow inbound <strong>TCP Port 3000</strong> on <em>Private Networks</em> so phones on clubhouse Wi-Fi can reach the host PC. Do <strong>not</strong> port-forward port 3000 directly to the public internet.</li>
    </ul>
  </div>
</div>

<!-- ====================================================================== -->
<!-- CHAPTER 3                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 03</span> Installation, Environment &amp; Clean Field-Trial Setup</h1>

<h2>3.1 Turnkey Deployment from Pre-Built Archive (Recommended)</h2>
<p>
  The pre-built archive <code>Super_Eagles_AMMS_FULL_WORKING_APP.zip</code> (482.5 MB, SHA-256 verified) ships with all Node.js dependencies
  (<code>node_modules</code>), the pre-compiled Next.js production bundle (<code>.next</code>), a clean production database (0 dummy records),
  and a secure <code>.env</code> configuration with a freshly generated cryptographic JWT secret and <code>ENABLE_DEMO_ROLE_SWITCH="false"</code>.
</p>

<ol class="step-list">
  <li><strong>Extract the Archive:</strong> Right-click <code>Super_Eagles_AMMS_FULL_WORKING_APP.zip</code> and extract to a clean local directory such as <code>C:\\SuperEaglesAMMS</code>. Avoid extracting directly inside a temporary ZIP preview window.</li>
  <li><strong>Verify Node.js Installation:</strong> Ensure Node.js (v20+) is installed on the host computer (download from <code>https://nodejs.org</code> if not already present).</li>
  <li><strong>Launch via <code>start.bat</code>:</strong> Double-click <code>start.bat</code> in the extracted folder. The launcher automatically executes six verified startup gates:
    <ul>
      <li><strong>[1/6]</strong> Checks optional Python availability (never downloads unsolicited packages).</li>
      <li><strong>[2/6]</strong> Verifies active Node.js runtime version.</li>
      <li><strong>[3/6]</strong> Confirms pre-packaged <code>node_modules</code> are present.</li>
      <li><strong>[4/6]</strong> Generates the local Prisma client, copies the clean database into <code>%LOCALAPPDATA%\\SuperEaglesAMMS\\dev.db</code> (if not already present), and refreshes <code>startup_snapshot.db</code>.</li>
      <li><strong>[5/6]</strong> Validates the compiled <code>.next\\BUILD_ID</code> production bundle.</li>
      <li><strong>[6/6]</strong> Verifies TCP port 3000 is free (refuses to kill unrelated services), resolves your local Wi-Fi IPv4 address, opens your browser to <code>http://localhost:3000</code>, and starts Next.js on <code>0.0.0.0:3000</code>.</li>
    </ul>
  </li>
  <li><strong>Allow Private Network Firewall Access:</strong> If Windows Defender Firewall prompts for Node.js, check <strong>Private networks</strong> and click <strong>Allow access</strong>.</li>
  <li><strong>First Sign-In &amp; Password Rotation:</strong> Sign in at <code>http://localhost:3000/login</code> using the provisioned administrator account (<code>admin@supereagles.co.za</code> / <code>AdminPass2026!</code>), then immediately change your password under <strong>Settings → Security</strong>.</li>
</ol>

<h2>3.2 Source Code Installation &amp; Cloud Deployment</h2>
<p>When deploying from GitHub (<code>https://github.com/Jackal1970-Ops/Super-Eagles-AMMS.git</code>) or <code>Super_Eagles_AMMS_Source_Clean.zip</code>:</p>
<pre>
# 1. Install exact locked dependencies
npm.cmd ci

# 2. Copy environment template and configure a 32+ char random JWT_SECRET
copy .env.example .env

# 3. Generate Prisma client &amp; push database schema
npm.cmd run prisma:generate
npm.cmd run prisma:push

# 4. Initialize clean production database (0 test records + Super Admin)
npm.cmd run db:clean-production

# 5. Build optimized production bundle and launch
npm.cmd run build
npm.cmd start
</pre>

<div class="callout callout-info">
  <div class="callout-title">Cloud Deployment Quick Path (Vercel + Neon/Supabase PostgreSQL or Docker)</div>
  For 24/7 cloud hosting, set <code>DATABASE_URL</code> to your PostgreSQL connection string, push the PostgreSQL schema via
  <code>npx prisma db push --schema=prisma/schema.postgresql.prisma</code>, create your first admin via <code>npm run bootstrap:admin</code>
  (using <code>INITIAL_ADMIN_EMAIL</code>, <code>INITIAL_ADMIN_NAME</code>, and a 14+ character <code>INITIAL_ADMIN_PASSWORD</code>), and set your
  Vercel build command to <code>npm run build:postgres</code>. For containers, build with <code>docker build -t supereagles-amms:latest .</code>.
</div>

<h2>3.3 Environment Variables Reference (<code>.env</code>)</h2>
<table>
  <thead>
    <tr><th style="width:26%;">Variable</th><th style="width:12%;">Required</th><th style="width:62%;">Purpose &amp; Production Best Practice</th></tr>
  </thead>
  <tbody>
    <tr><td><code>DATABASE_URL</code></td><td><span class="badge b-red">Yes</span></td><td>SQLite path (e.g. <code>file:./dev.db</code>; overridden to <code>%LOCALAPPDATA%</code> by <code>start.bat</code>) or PostgreSQL URI.</td></tr>
    <tr><td><code>JWT_SECRET</code></td><td><span class="badge b-red">Yes</span></td><td>Cryptographically random 32–64+ character signing key for HTTP-only session cookies. Never share.</td></tr>
    <tr><td><code>ENABLE_DEMO_ROLE_SWITCH</code></td><td><span class="badge b-amber">Prod: false</span></td><td>Must be <code>"false"</code> in production/field trials. Hides 1-click test personas on Login and Navbar role switcher.</td></tr>
    <tr><td><code>NEXT_PUBLIC_APP_URL</code></td><td><span class="badge b-red">Yes</span></td><td>Canonical base URL (e.g. <code>http://localhost:3000</code> or <code>https://portal.supereagles.co.za</code>).</td></tr>
    <tr><td><code>SESSION_COOKIE_SECURE</code></td><td><span class="badge b-slate">Optional</span></td><td>Leave unset to auto-detect HTTP vs. HTTPS; set <code>"true"</code> only behind an HTTPS reverse proxy.</td></tr>
    <tr><td><code>GEMINI_API_KEY</code> / <code>OPENAI_API_KEY</code></td><td><span class="badge b-slate">Optional</span></td><td>Optional external AI narrative keys. All deterministic analytics &amp; coaching directives work 100% without keys.</td></tr>
  </tbody>
</table>

<h2>3.4 Dual-Mode Database Lifecycle Scripts</h2>
<table>
  <thead>
    <tr><th style="width:30%;">NPM Command</th><th style="width:28%;">Underlying Script</th><th style="width:42%;">Operational Effect</th></tr>
  </thead>
  <tbody>
    <tr><td><code>npm.cmd run db:clean-production</code></td><td><code>scripts/clean_production_reset.mjs</code></td><td>Creates timestamped backup in <code>backups/</code>, wipes all synthetic athletes/tests, seeds official scoring weights, creates primary <code>SUPER_ADMIN</code>, and syncs <code>%LOCALAPPDATA%</code>.</td></tr>
    <tr><td><code>npm.cmd run bootstrap:admin</code></td><td><code>scripts/bootstrap_admin.mjs</code></td><td>Non-destructively creates or updates a production <code>SUPER_ADMIN</code> using env vars (<code>INITIAL_ADMIN_*</code>, enforcing 14–256 char password).</td></tr>
    <tr><td><code>npm.cmd run db:restore-demo</code></td><td><code>scripts/seed.mjs</code></td><td>Populates 20 realistic benchmark athletes, 5 test roles, races, and transactions for QA testing. Blocked in <code>NODE_ENV=production</code> unless <code>ALLOW_DEMO_SEED=true</code>.</td></tr>
  </tbody>
</table>

<!-- ====================================================================== -->
<!-- CHAPTER 4                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 04</span> Database Schema, RBAC &amp; POPIA Governance</h1>

<h2>4.1 Complete 30-Model Relational Data Architecture</h2>
<p>
  The Prisma schema (<code>prisma/schema.prisma</code> for SQLite and auto-synced <code>prisma/schema.postgresql.prisma</code> for PostgreSQL)
  organizes all club records across six cleanly normalized domains with foreign-key referential integrity:
</p>
<table>
  <thead>
    <tr><th style="width:22%;">Data Domain</th><th style="width:38%;">Prisma Models (30 Total)</th><th style="width:40%;">Key Entities &amp; Relationships</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>1. Identity &amp; Access</strong></td><td><code>User</code>, <code>Notification</code></td><td>Salted bcrypt credentials, 5 RBAC roles, active status, unread alerts &amp; arrears banners.</td></tr>
    <tr><td><strong>2. Athlete &amp; Coaching</strong></td><td><code>Athlete</code>, <code>CoachAssignment</code>, <code>AthleteGoal</code>, <code>CoachReview</code></td><td>Sequential <code>SEA-XXX</code> Club IDs, ASA license #, gender, DOB, emergency contacts, squad links, target races.</td></tr>
    <tr><td><strong>3. Performance &amp; Telemetry</strong></td><td><code>TrainingActivity</code>, <code>TrainingSplit</code>, <code>WellnessEntry</code>, <code>Race</code>, <code>RaceEdition</code>, <code>RaceResult</code>, <code>PerformanceScore</code></td><td>GPX/TCX/CSV runs, km splits, RPE/sleep/soreness logs, verified race certificates, longitudinal API scores.</td></tr>
    <tr><td><strong>4. Club Loyalty &amp; Events</strong></td><td><code>ClubActivity</code>, <code>ClubAttendance</code>, <code>VolunteerContribution</code>, <code>LoyaltyExemption</code>, <code>EventRegistration</code>, <code>EventLogistics</code></td><td>Club runs, pack walks, QR check-ins, marshal shifts, approved exemptions, away-race bus seats &amp; hotels.</td></tr>
    <tr><td><strong>5. Finance &amp; Sponsorship</strong></td><td><code>Sponsorship</code>, <code>SponsorshipTransaction</code>, <code>SponsorshipCondition</code>, <code>SponsorshipDecision</code>, <code>AthleteObligation</code>, <code>MembershipPayment</code></td><td>Tiers, atomic ZAR disbursements (stipends, travel, kit), covenants, committee votes, POP membership receipts.</td></tr>
    <tr><td><strong>6. AI, Awards &amp; Audit</strong></td><td><code>AIRecommendation</code>, <code>AthleteMedallion</code>, <code>SystemConfiguration</code>, <code>AuditLog</code>, <code>SeasonArchive</code></td><td>Explainable coaching directives, competitive &amp; wellness medallions, configurable weights, immutable audit &amp; season archives.</td></tr>
  </tbody>
</table>

<h2>4.2 Five-Role RBAC &amp; POPIA Data Isolation</h2>
<div class="figure">
  ${SVG_RBAC}
  <div class="figure-caption">Figure 4.1 — Enforced POPIA Role Isolation Across All Five User Roles.</div>
</div>

<table>
  <thead>
    <tr><th style="width:26%;">System Capability / Endpoint</th><th style="width:14%;">SUPER_ADMIN</th><th style="width:15%;">CLUB_ADMIN</th><th style="width:15%;">COACH</th><th style="width:15%;">SPONSORSHIP</th><th style="width:15%;">ATHLETE</th></tr>
  </thead>
  <tbody>
    <tr><td>Executive Matrix &amp; Club Dashboard</td><td><span class="badge b-green">Full</span></td><td><span class="badge b-green">Full</span></td><td><span class="badge b-blue">Assigned</span></td><td><span class="badge b-green">Full</span></td><td><span class="badge b-red">Blocked</span></td></tr>
    <tr><td>View Athlete Profiles (<code>/athletes/[id]</code>)</td><td><span class="badge b-green">All</span></td><td><span class="badge b-green">All</span></td><td><span class="badge b-blue">Assigned Only</span></td><td><span class="badge b-green">All</span></td><td><span class="badge b-purple">Self Only</span></td></tr>
    <tr><td>Telemetry CSV/GPX Import</td><td><span class="badge b-green">All</span></td><td><span class="badge b-green">All</span></td><td><span class="badge b-blue">Assigned Only</span></td><td><span class="badge b-red">Blocked</span></td><td><span class="badge b-purple">Self Only</span></td></tr>
    <tr><td>Membership Dues &amp; POP Finance Ledger</td><td><span class="badge b-green">Full</span></td><td><span class="badge b-green">Full</span></td><td><span class="badge b-red">Blocked</span></td><td><span class="badge b-amber">Read/Review</span></td><td><span class="badge b-purple">Self Only</span></td></tr>
    <tr><td>Sponsorship Decisions &amp; ZAR Payouts</td><td><span class="badge b-green">Full</span></td><td><span class="badge b-red">Read Only</span></td><td><span class="badge b-red">Blocked</span></td><td><span class="badge b-green">Full</span></td><td><span class="badge b-red">Blocked</span></td></tr>
    <tr><td>Compliance Reports &amp; Season Rollover</td><td><span class="badge b-green">Allowed</span></td><td><span class="badge b-green">Allowed</span></td><td><span class="badge b-red">401/403</span></td><td><span class="badge b-red">401/403</span></td><td><span class="badge b-red">401/403</span></td></tr>
    <tr><td>Backups, Restore &amp; Weight Settings</td><td><span class="badge b-green">Allowed</span></td><td><span class="badge b-amber">Limited</span></td><td><span class="badge b-red">Blocked</span></td><td><span class="badge b-red">Blocked</span></td><td><span class="badge b-red">Blocked</span></td></tr>
  </tbody>
</table>

<h2>4.3 Production Security Hardening Controls</h2>
<ul>
  <li><strong>Authentication &amp; Session Integrity:</strong> All passwords are salted and hashed using <code>bcryptjs</code> (cost factor 10–12). Authenticated sessions use signed HTTP-only JWT cookies with dynamic <code>Secure</code> attribute detection.</li>
  <li><strong>Password Reset Hardening:</strong> Public Club IDs (<code>SEA-XXX</code>) are strictly excluded as password-reset verification credentials; resets require private member verification data.</li>
  <li><strong>Strict Upload &amp; Telemetry Safeguards:</strong> Telemetry imports enforce a <strong>10 MB maximum file cap</strong> and wrap multi-row CSV writes inside atomic Prisma database transactions (zero partial commits). Proof-of-Payment (POP) and race certificate uploads verify ownership/assignment, validate file magic bytes/MIME types, sanitize filenames, and write asynchronously with exclusive file creation flags to prevent overwrites.</li>
  <li><strong>Safe Diagnostic Self-Healing:</strong> The health diagnostic engine inspects database connectivity, schema sync, and file permissions without ever executing destructive live shell commands (such as runtime <code>npm install</code>) from the running server.</li>
  <li><strong>Immutable Audit Ledger:</strong> Every sponsorship override, direct disbursement, weight calibration, rollover execution, and sensitive profile update writes an immutable record to <code>AuditLog</code> capturing operator ID, timestamp, action type, and before/after JSON deltas.</li>
</ul>

<!-- ====================================================================== -->
<!-- CHAPTER 5                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 05</span> Grounded Sports Science &amp; Mathematical Engines</h1>

<div class="callout callout-info">
  <div class="callout-title">Scientific Grounding &amp; Zero-Fabrication Policy</div>
  Every analytical module in Super Eagles AMMS cleanly distinguishes between <strong>peer-reviewed sports science equations</strong>
  (Riegel 1977, Foster et al. 2001, Gabbett 2016, IUGG/NOAA Haversine) and <strong>transparent club policy scales</strong>.
  The system never fabricates official World Athletics scoring-table points, never fabricates percentiles, never fabricates injury-risk
  percentages, and never assigns "Improving" or "Declining" trend labels without at least two verified chronological race observations.
</div>

<h2>5.1 Performance Normalisation Engine (0–100 Club Policy Scale)</h2>
<p>
  Implemented in <code>src/lib/analytics/normalisation.ts</code>, this engine converts competition finish times across eight standard road
  and ultra distances onto an internal 0–100 club scale using published world-reference anchors and Super Eagles Club Elite/Qualifying standards:
</p>
<table>
  <thead>
    <tr><th>Distance Category</th><th>Distance</th><th>Male Club Elite</th><th>Male Qualifying</th><th>Female Club Elite</th><th>Female Qualifying</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>5 km Road / Parkrun</strong></td><td>5.0 km</td><td>14:45</td><td>20:00</td><td>16:45</td><td>23:00</td></tr>
    <tr><td><strong>10 km Road</strong></td><td>10.0 km</td><td>31:00</td><td>42:00</td><td>35:30</td><td>48:00</td></tr>
    <tr><td><strong>15 km Road</strong></td><td>15.0 km</td><td>48:00</td><td>1:05:00</td><td>55:00</td><td>1:15:00</td></tr>
    <tr><td><strong>Half Marathon</strong></td><td>21.0975 km</td><td>1:07:00</td><td>1:30:00</td><td>1:17:00</td><td>1:45:00</td></tr>
    <tr><td><strong>Standard Marathon</strong></td><td>42.195 km</td><td>2:20:00</td><td>3:10:00</td><td>2:42:00</td><td>3:40:00</td></tr>
    <tr><td><strong>50 km Ultra</strong></td><td>50.0 km</td><td>3:00:00</td><td>4:15:00</td><td>3:30:00</td><td>4:50:00</td></tr>
    <tr><td><strong>Two Oceans Ultra</strong></td><td>56.0 km</td><td>3:30:00</td><td>5:00:00</td><td>4:00:00</td><td>5:45:00</td></tr>
    <tr><td><strong>Comrades Marathon</strong></td><td>89.0 km</td><td>6:00:00</td><td>8:15:00</td><td>6:45:00</td><td>9:00:00</td></tr>
  </tbody>
</table>

<h2>5.2 Athlete Performance Index (API) &amp; Chronological Trend Derivation</h2>
<div class="formula-box">
  <div class="formula-title">Athlete Performance Index (API: 0–100) — Configurable Default Weights</div>
  <strong>API</strong> = (S<sub>verified_perf</sub> × 0.35) + (S<sub>improvement</sub> × 0.30) + (S<sub>target_goal</sub> × 0.20) + (S<sub>reliability</sub> × 0.15)
</div>
<p>
  <strong>Verified Improvement Derivation:</strong> Non-rejected chronological race results are first converted to an equivalent 10 km time via
  <code>T<sub>10k</sub> = T<sub>official</sub> × (10 / D<sub>km</sub>)<sup>1.06</sup></code>. Percentage improvement is measured across
  3-month (40% weight), 6-month (35% weight), and 12-month (25% weight) windows. Athletes with fewer than 2 valid race observations
  automatically receive a neutral <strong>Stable / Insufficient History</strong> classification rather than an invented trajectory:
</p>
<ul>
  <li><strong>≥ +6.0%:</strong> Rapid Improvement &nbsp;|&nbsp; <strong>+2.0% to +5.9%:</strong> Improving &nbsp;|&nbsp; <strong>−2.0% to +1.9%:</strong> Stable</li>
  <li><strong>−6.0% to −2.1%:</strong> Watch &nbsp;|&nbsp; <strong>−12.0% to −6.1%:</strong> Declining &nbsp;|&nbsp; <strong>&lt; −12.0%:</strong> Significant Decline</li>
</ul>

<h2>5.3 Pace Durability Index (PDI) &amp; Deterministic Race Prediction</h2>
<div class="grid-2">
  <div class="formula-box" style="margin:0;">
    <div class="formula-title">Pace Durability Deterioration (%)</div>
    <strong>Decay %</strong> = ((Pace<sub>late</sub> − Pace<sub>early</sub>) / Pace<sub>early</sub>) × 100<br/>
    <span style="font-size:8.2pt;color:#475569;">≤ +2%: Excellent • +2–6%: Good • +6–12%: Moderate • &gt; +12%: Poor</span>
  </div>
  <div class="formula-box" style="margin:0;">
    <div class="formula-title">Modified Riegel Power Curve (1977)</div>
    <strong>T<sub>2</sub></strong> = T<sub>1</sub> × (D<sub>2</sub> / D<sub>1</sub>)<sup>1.06 + δ<sub>durability</sub> − δ<sub>consistency</sub></sup><br/>
    <span style="font-size:8.2pt;color:#475569;">Outputs central finish time, min–max range &amp; Gaussian CDF target probability.</span>
  </div>
</div>

<h2 style="margin-top:0;">5.4 Workload Ratio (ACWR) &amp; Non-Medical Readiness (ARCS)</h2>
<div class="formula-box" style="padding:7px 11px;margin:5px 0 7px 0;font-size:9pt;">
  <div class="formula-title">Foster et al. (2001) Session Load &amp; Rolling Acute:Chronic Workload Ratio (Gabbett, 2016)</div>
  <strong>Session Load (AU)</strong> = Session RPE (1–10) × Duration (minutes) &nbsp;|&nbsp;
  <strong>ACWR</strong> = Sum of Load (7d) ÷ [ Sum of Load (28d) ÷ 4 ]
</div>
<table style="font-size:7.9pt;margin:5px 0 8px 0;">
  <thead>
    <tr><th style="width:19%;padding:4.5px 7px;">ACWR Ratio</th><th style="width:22%;padding:4.5px 7px;">System Status</th><th style="width:59%;padding:4.5px 7px;">Coaching Interpretation (Strictly Advisory &amp; Non-Medical)</th></tr>
  </thead>
  <tbody>
    <tr><td style="padding:4px 7px;">No valid 28d data</td><td style="padding:4px 7px;"><span class="badge b-slate">INSUFFICIENT_DATA</span></td><td style="padding:4px 7px;">Prompt athlete to record valid duration and session-RPE before interpreting progression.</td></tr>
    <tr><td style="padding:4px 7px;"><strong>&lt; 0.80</strong></td><td style="padding:4px 7px;"><span class="badge b-blue">UNDER_TRAINING</span></td><td style="padding:4px 7px;">Tapering or reduced aerobic stimulus relative to 4-week chronic baseline.</td></tr>
    <tr><td style="padding:4px 7px;"><strong>0.80 – 1.30</strong></td><td style="padding:4px 7px;"><span class="badge b-green">OPTIMAL</span></td><td style="padding:4px 7px;">Balanced workload progression ("Aerobic Sweet Spot"). Continue scheduled plan.</td></tr>
    <tr><td style="padding:4px 7px;"><strong>1.31 – 1.50</strong></td><td style="padding:4px 7px;"><span class="badge b-amber">OVER_REACHING</span></td><td style="padding:4px 7px;">Elevated acute load ratio. Avoid consecutive hard threshold days; prioritize recovery.</td></tr>
    <tr><td style="padding:4px 7px;"><strong>&gt; 1.50</strong></td><td style="padding:4px 7px;"><span class="badge b-red">DANGER_ZONE</span></td><td style="padding:4px 7px;">Sharp acute workload spike (&gt;1.5). Coach review recommended; interpret with wellness context.</td></tr>
  </tbody>
</table>

<h2 style="margin-top:8px;">5.5 Club Contribution &amp; Loyalty Index (CCLI) &amp; Sponsorship Score (CSS)</h2>
<div class="grid-2" style="margin:5px 0 7px 0;">
  <div class="formula-box" style="margin:0;padding:7px 11px;font-size:8.7pt;">
    <div class="formula-title">Club Contribution &amp; Loyalty Index (CCLI: 0–100)</div>
    <strong>CCLI</strong> = Runs(30%) + Vol(20%) + Rep(15%) + Mentor(10%) + Meet(10%) + Compl(10%) + Tenure(5%)<br/>
    <span style="font-size:7.8pt;color:#15803D;"><strong>Exemption Rule:</strong> Approved exemptions adjust the expected denominator rather than penalizing attendance.</span>
  </div>
  <div class="formula-box" style="margin:0;padding:7px 11px;font-size:8.7pt;">
    <div class="formula-title">Club Sponsorship Score (CSS: 0–100)</div>
    <strong>CSS</strong> = Perf(25%) + Imprv(20%) + Potential(15%) + Rel(10%) + CCLI(20%) + Compl(10%)<br/>
    <span style="font-size:7.8pt;color:#B45309;"><strong>Reciprocity Trigger:</strong> Perf ≥ 80 &amp; CCLI &lt; 45 flags <em>Conditional Sponsorship</em> with club service covenants.</span>
  </div>
</div>

<h2 style="margin-top:8px;">5.6 Sponsorship Tier Classification Matrix (All 9 Advisory Tiers)</h2>
<p style="margin-bottom:4px;font-size:8.6pt;">
  Based on the combined Club Sponsorship Score (CSS), verified performance, CCLI reciprocity, and covenant compliance,
  <code>src/lib/analytics/sponsorshipScore.ts</code> outputs one of nine transparent recommendations for human committee voting:
</p>
<table style="font-size:7.6pt;margin:4px 0 0 0;">
  <thead>
    <tr><th style="width:27%;padding:4px 6px;">Recommended Tier</th><th style="width:26%;padding:4px 6px;">Trigger Criteria</th><th style="width:47%;padding:4px 6px;">Recommended Committee Action</th></tr>
  </thead>
  <tbody>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-purple">ELITE CLUB ATHLETE</span></td><td style="padding:3.5px 6px;">Perf ≥ 88, CCLI ≥ 75, CSS ≥ 82</td><td style="padding:3.5px 6px;">Award Tier-1 stipend, premier race entries, full kit &amp; travel support.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-green">INCREASE SPONSORSHIP</span></td><td style="padding:3.5px 6px;">High upward trend &amp; strong CCLI</td><td style="padding:3.5px 6px;">Upgrade allocation tier or add specialized physio/nutrition grants.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-green">PERFORMANCE ATHLETE</span></td><td style="padding:3.5px 6px;">Strong CSS &amp; balanced loyalty</td><td style="padding:3.5px 6px;">Award standard performance race-entry &amp; travel sponsorship tier.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-blue">DEVELOPMENT ATHLETE</span></td><td style="padding:3.5px 6px;">Promising progression, CCLI ≥ 60</td><td style="padding:3.5px 6px;">Invest coaching support, kit, and developmental race-entry grants.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-blue">MAINTAIN SPONSORSHIP</span></td><td style="padding:3.5px 6px;">Stable performance &amp; compliance</td><td style="padding:3.5px 6px;">Renew existing allocation unchanged for the upcoming cycle.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-amber">CONDITIONAL SPONSORSHIP</span></td><td style="padding:3.5px 6px;">Perf ≥ 80 &amp; CCLI &lt; 45</td><td style="padding:3.5px 6px;">Tie funding to ≥60% club run attendance, 2 marshal shifts, &amp; club kit.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-amber">SPONSORSHIP REVIEW</span></td><td style="padding:3.5px 6px;">Borderline metrics / decline watch</td><td style="padding:3.5px 6px;">Convene committee check-in to evaluate context or exemptions.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-red">REDUCE SPONSORSHIP</span></td><td style="padding:3.5px 6px;">Breached covenants / sustained drop</td><td style="padding:3.5px 6px;">Formal review to adjust or reduce stipend and race allocations.</td></tr>
    <tr><td style="padding:3.5px 6px;"><span class="badge b-slate">NON-SPONSORED</span></td><td style="padding:3.5px 6px;">Standard club membership</td><td style="padding:3.5px 6px;">Full access to club runs, pack walks, training tools &amp; social events.</td></tr>
  </tbody>
</table>

<!-- ====================================================================== -->
<!-- PART II BANNER                                                         -->
<!-- ====================================================================== -->
<div class="part-banner">
  <div class="part-kicker">Part II — Club Operations &amp; Role-Based User Manual</div>
  <h1>Role-Based User Guide &amp; Operational Playbooks</h1>
  <p>Step-by-step instructions for Athletes, Lifestyle Walkers, Coaches, Club Administrators, Sponsorship Committee Members, and General Managers.</p>
</div>

<!-- ====================================================================== -->
<!-- CHAPTER 6                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter" style="margin-top:6px;"><span class="ch-num">CH 06</span> Getting Started, Navigation &amp; Mobile Offline Mode</h1>

<h2>6.1 Signing In, Self-Registration &amp; Password Recovery</h2>
<div class="grid-3">
  <div class="card">
    <h4>1. Standard Sign-In (<code>/login</code>)</h4>
    <p>Open <code>http://localhost:3000</code> (club PC) or the Wi-Fi IP address (phone). Enter your email and password. Staff/Admins route to <code>/dashboard</code>; Athletes route directly to their personal <code>/athletes/[id]</code> portal.</p>
  </div>
  <div class="card">
    <h4>2. Member Self-Registration (<code>/register</code>)</h4>
    <p>Tap <strong>New Member? Join Club &amp; Create Profile</strong>. Members enter personal details, discipline (Runner / Walker / Social), DOB, emergency contact, and password. AMMS auto-assigns the next sequential <code>SEA-XXX</code> Club ID.</p>
  </div>
  <div class="card">
    <h4>3. Offline Password Reset</h4>
    <p>Click <strong>Forgot Password?</strong> on the login screen. Verify identity using your registered email and private verification details (no external email server required). Public Club IDs are rejected for security.</p>
  </div>
</div>

<h2>6.2 Interface Orientation</h2>
<ul>
  <li><strong>Top Navigation Bar:</strong> Displays the Super Eagles crest, role-scoped <strong>Quick Search</strong> (staff only; athletes see their Personal Portal Badge), <strong>Remote / Offline Setup Guide</strong> button, <strong>In-App Manual</strong> shortcut, <strong>Notification Bell</strong> (with unread count and live membership arrears warnings), and your <strong>Profile / Sign-Out</strong> menu.</li>
  <li><strong>Collapsible Sidebar:</strong> Organizes modules cleanly by permission level—athletes only see personal pages (Profile, Club Activities, Races, Training, Payments, Manual), while executives see the full intelligence suite.</li>
  <li><strong>Add to Home Screen (Mobile PWA):</strong> On iOS Safari tap <em>Share → Add to Home Screen</em>; on Android Chrome tap <em>Menu (⋮) → Install / Add to Home Screen</em> for an instant full-screen app icon.</li>
</ul>

<h2>6.3 Offline Queue &amp; Automatic WhatsApp Fallback</h2>
<p>
  Built for South African club realities (load-shedding, away races, or clubhouse PC powered off): whenever an athlete submits a wellness check-in
  or event attendance while the clubhouse server is unreachable, the <strong>Offline Sync Manager</strong> safely stores the payload in encrypted
  browser storage on the phone:
</p>
<ul>
  <li>A floating amber <strong>Pending Sync</strong> badge appears automatically on the phone screen.</li>
  <li>Every <strong>15 seconds</strong>, the app checks connectivity to the clubhouse PC. As soon as the athlete returns to clubhouse Wi-Fi, queued items auto-sync to the database.</li>
  <li>If immediate reporting is needed while away, tap <strong>Share via WhatsApp</strong> or <strong>Copy Summary</strong> to send a pre-formatted structured report directly to the club captain or coach with zero SMS/gateway fees.</li>
</ul>

<!-- ====================================================================== -->
<!-- CHAPTER 7                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 07</span> Athlete &amp; Lifestyle Member User Guide</h1>

<h2>7.1 Navigating Your 360° Personal Athlete Profile</h2>
<p>
  Athletes operate inside a strictly POPIA-isolated personal workspace (<code>/athletes/[your-id]</code>). Attempting to open another member's
  profile URL automatically returns an access restriction notice. Your profile is organized into symmetric tabs:
</p>
<table>
  <thead>
    <tr><th style="width:24%;">Profile Tab</th><th style="width:76%;">What You Can View &amp; Do</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Overview &amp; Digital Pass</strong></td><td>View your official <code>SEA-XXX</code> Club ID, ASA age category, membership fee status, reigning medallions, and your scannable <strong>Digital Club QR Pass</strong> for race-morning attendance.</td></tr>
    <tr><td><strong>Performance &amp; Races</strong></td><td>Inspect your API score, verified race history, Pace Durability Index, Comrades/Two Oceans qualification status, and deterministic Riegel predictions for upcoming target goals.</td></tr>
    <tr><td><strong>Training &amp; Readiness</strong></td><td>Review weekly volume, ACWR workload battery, sleep/fatigue trends, and submit new daily wellness check-ins or workout logs.</td></tr>
    <tr><td><strong>Club Loyalty (CCLI)</strong></td><td>Track internal club run attendance percentage, volunteer marshal points, approved exemptions, and active club obligations.</td></tr>
    <tr><td><strong>Sponsorship</strong></td><td>View active sponsorship tier, allocated YTD support in ZAR, individual disbursement records, and covenant compliance status.</td></tr>
  </tbody>
</table>

<h2>7.2 Social Walkers &amp; Lifestyle Members</h2>
<p>
  Super Eagles AMMS celebrates recreational walkers and wellness members equally alongside elite marathoners. Members categorized as
  <strong>Social / Walking / Lifestyle</strong> receive the dedicated <strong>Lifestyle &amp; Pack Walk View</strong>, featuring:
</p>
<ul>
  <li>Upcoming weekend social pack walks (e.g. Saturday 8 km Pack Walk &amp; Social Coffee, Sunday 10 km Scenic Trail Walk) with 1-tap RSVP.</li>
  <li>Health &amp; Wellness Medallions celebrating consistency and community spirit rather than purely elite race times.</li>
  <li>Full participation in club QR check-ins, bus bookings, and annual ASA membership renewals.</li>
</ul>

<h2>7.3 Daily Workflows for Athletes</h2>
<div class="grid-2">
  <div class="card">
    <h4>Logging Wellness &amp; Training (<code>/training</code>)</h4>
    <ol>
      <li>Tap <strong>Log Wellness Check-In</strong> (takes 15 seconds): rate Sleep Quality (1–5), Fatigue (1–5), Muscle Soreness (1–5), Stress (1–5), and optional Resting Heart Rate / HRV.</li>
      <li>Log workouts manually (distance, duration, Session RPE 1–10) or upload exported <strong>GPX, TCX, or CSV</strong> files from Garmin, Strava, Polar, or Coros (up to 10 MB).</li>
    </ol>
  </div>
  <div class="card">
    <h4>Submitting Races &amp; POP Payments</h4>
    <ol>
      <li><strong>Race Results (<code>/races/results/new</code>):</strong> Enter official finish time, event distance, and attach your timing certificate image/PDF for admin verification.</li>
      <li><strong>Membership Fees (<code>/payments</code>):</strong> View category-specific club &amp; ASA license dues, upload your bank Proof-of-Payment (PDF/JPG/PNG), and track approval status from <code>PENDING</code> to <code>PAID</code>.</li>
    </ol>
  </div>
</div>

<!-- ====================================================================== -->
<!-- CHAPTER 8                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 08</span> Coach &amp; Performance Staff User Guide</h1>

<h2>8.1 POPIA Squad Scoping &amp; Training Oversight</h2>
<p>
  Coaches (<code>COACH</code> role) have deep analytical visibility into every athlete explicitly assigned to their training squad via
  <code>CoachAssignment</code>. In full compliance with POPIA governance, coaches <strong>cannot</strong> view unassigned athlete profiles,
  cannot import telemetry for unassigned athletes, and cannot view general membership fee/banking records.
</p>

<h2>8.2 Performance Analytics &amp; Readiness Console</h2>
<ul>
  <li><strong>Performance Hub (<code>/performance</code>):</strong> Compare assigned athletes' API scores, verified chronological 10 km-normalised progression trends, Pace Durability decay percentages, and Championship qualification benchmarks (Comrades Marathon ≤ 4:50:00 qualifier; Two Oceans Half ≤ 2:00:00).</li>
  <li><strong>Training &amp; Workload Console (<code>/training</code>):</strong> Monitor rolling 7-day Acute vs. 28-day Chronic workload batteries across the squad. Filter for athletes showing <code>OVER_REACHING (&gt;1.3)</code>, <code>DANGER_ZONE (&gt;1.5)</code>, or <code>CAUTION</code> wellness flags to proactively adjust track intervals or long-run volume.</li>
  <li><strong>Bulk Squad Telemetry Import:</strong> Upload multi-session CSV exports (up to 10 MB) for assigned athletes; atomic transactions guarantee either 100% clean import or zero corrupted partial rows.</li>
</ul>

<h2>8.3 Interactive AI Coach Workbench (<code>/ai-insights</code>)</h2>
<p>
  The AI Coach Workbench synthesizes verified telemetry, split durability, and club reciprocity data into structured, explainable coaching
  directives (aligned with ISO 9241-110 explainable decision support):
</p>
<ol class="step-list">
  <li>Select a specific assigned athlete (or <em>All Assigned Squad Athletes</em>) from the dynamic squad selector.</li>
  <li>Choose the intervention focus: <strong>Aerobic Threshold &amp; Split Decay Control</strong>, <strong>Overtraining &amp; ACWR Load Protection</strong>, <strong>Club Mentorship &amp; Pacing Alignment</strong>, or <strong>Pre-Marathon 3-Week Progressive Taper</strong>.</li>
  <li>Optionally enter a custom coach observation (e.g., <em>"Kaapsehoop Marathon qualifier in 4 weeks"</em>) and click <strong>Generate Tailored Directive</strong>.</li>
  <li>Review the cited biometric facts, prescribed session, and pacing splits. Click <strong>Approve &amp; Send to Athlete</strong>, or record a documented modification/rejection in the Coach Review workflow (<code>PATCH /api/ai/recommendations/[id]</code>).</li>
</ol>

<!-- ====================================================================== -->
<!-- CHAPTER 9                                                              -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 09</span> Club Administrator Operations Guide</h1>

<h2>9.1 Athlete Directory &amp; Bulk CSV Roster Import</h2>
<ul>
  <li><strong>Directory Management (<code>/athletes</code>):</strong> Search by name, <code>SEA-XXX</code> Club ID, ASA license number, squad status, or fee standing. Register walk-in members directly at <code>/athletes/new</code> or process annual renewals. When members depart, use <strong>Soft Archive (LAPSED)</strong> to deactivate login access while preserving historical race records and audit trails.</li>
  <li><strong>Bulk CSV Roster Import (<code>/admin/csv-import</code>):</strong> Download the official template (<code>/api/admin/csv-template</code>), paste your existing club spreadsheet columns, preview validation checks, and bulk-import dozens or hundreds of real members in a single atomic transaction.</li>
</ul>

<h2>9.2 Club Activities &amp; Race-Morning QR Marshal Scanner</h2>
<p>
  Under <strong>Club Activities (<code>/club-activities</code>)</strong>, administrators schedule recurring Saturday club runs, Wednesday time
  trials, social pack walks, marshal volunteer shifts, and club meetings. On event morning, open the <strong>QR Marshal Scanner</strong> modal
  which supports four seamless check-in modes:
</p>
<div class="grid-2">
  <div class="card">
    <h4>Hardware &amp; Camera Scanning</h4>
    <ul>
      <li><strong>Smartphone / Tablet Camera:</strong> Point at the athlete's digital QR pass on their phone or laminated membership card.</li>
      <li><strong>USB 2D Barcode/QR Scanner:</strong> Plug into the clubhouse laptop; scans register instantaneously as keyboard-wedge input.</li>
    </ul>
  </div>
  <div class="card">
    <h4>Fallback &amp; Self-Check-In</h4>
    <ul>
      <li><strong>Manual Quick-Search:</strong> Type the athlete's surname or <code>SEA-XXX</code> number to check them in within 2 seconds.</li>
      <li><strong>Member Self-Check-In:</strong> Athletes connected to clubhouse Wi-Fi can tap <em>Confirm My Attendance</em> directly on their phone.</li>
    </ul>
  </div>
</div>

<h2>9.3 Away Race Fleet Logistics &amp; Zero-Cost Bulletins (<code>/races</code>)</h2>
<p>
  Manage club travel for major events (Comrades, Two Oceans, Kaapsehoop, Soweto Marathon) via <code>/api/events/logistics</code>:
</p>
<ul>
  <li>Configure event dates, entry fees, luxury bus seat capacity, departure times/locations, and accommodation allocations with strict input validation (invalid dates, negative costs, duplicate registrations, and disabled-bus bookings are automatically rejected).</li>
  <li>Export passenger manifests and broadcast instant departure bulletins via native WhatsApp Web and email links (E.164 phone formatting)—requiring <strong>R 0 in third-party SMS gateway fees</strong>.</li>
</ul>

<h2>9.4 Proof-of-Payment (POP) &amp; Banking Reconciliation (<code>/payments</code>)</h2>
<p>
  Review every member's uploaded POP receipt (PDF or image) side-by-side against the club bank statement. Verify the amount, payment method
  (EFT / Cash / Card), and category-specific annual dues (Senior / Junior / Social / Grandmaster + ASA License). Clicking <strong>Verify &amp; Approve</strong>
  updates the member's fee status to <code>PAID</code>, clears arrears notification banners, and logs the administrator's approval in the audit trail.
</p>

<!-- ====================================================================== -->
<!-- CHAPTER 10                                                             -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 10</span> Sponsorship Committee &amp; Executive GM Guide</h1>

<h2>10.1 Mastering the 4-Quadrant Performance vs. Loyalty Matrix</h2>
<p>
  The Executive Dashboard (<code>/dashboard</code>) features the interactive <strong>Performance vs. Club Contribution Matrix</strong>. A
  deterministic collision-free dispersion engine plots every athlete cleanly without overlapping labels while mathematically locking every node
  inside its true policy quadrant:
</p>

<div class="figure">
  ${SVG_MATRIX}
  <div class="figure-caption">Figure 10.1 — Executive 4-Quadrant Matrix with Configurable Policy Threshold Crosshairs (Default: API 72 / CCLI 60).</div>
</div>

<ul>
  <li><strong>Interactive Filtering:</strong> Click any of the four Quadrant KPI badges above the plot to isolate Priority Talent, Reciprocity Review cases, Development Opportunities, or Watchlist members.</li>
  <li><strong>Hover &amp; Drill-Down:</strong> Hover over any athlete bubble to inspect exact API, CCLI, discipline, and placement; double-click any bubble to jump straight into their 360° profile.</li>
  <li><strong>Dynamic Policy Calibration:</strong> Executives can adjust the Elite Performance crosshair (default 72) and Loyalty crosshair (default 60) live or save updated institutional weights permanently under <strong>Settings &amp; Weights (<code>/settings</code>)</strong>.</li>
</ul>

<h2>10.2 Sponsorship Governance, Committee Voting &amp; Direct Disbursements</h2>
<div class="grid-2">
  <div class="card">
    <h4>Sponsorship Decisions &amp; Overrides (<code>/sponsorship</code>)</h4>
    <p>Review each candidate's CSS breakdown, CCLI loyalty rate, and active exemptions. Record formal committee decisions across all 9 tiers. If the committee overrides the mathematical recommendation (e.g. granting support during injury rehabilitation), the system requires a written rationale recorded permanently in <code>AuditLog</code>.</p>
  </div>
  <div class="card">
    <h4>Direct Disbursement Capture (ZAR Ledger)</h4>
    <p>Inside any athlete's <strong>Profile → Sponsorship Tab</strong>, authorized Executives and Sponsorship Committee members can click <strong>Record Disbursement</strong> (<code>POST /api/sponsorship/transactions</code>) to log Stipends, Race Entries, Equipment, Travel, Physio, or Nutrition payouts. YTD support totals recalculate atomically.</p>
  </div>
</div>

<h2>10.3 Compliance &amp; Executive Reporting (<code>/reports</code>)</h2>
<p>
  Generate printable, audit-ready compliance reports (<code>/api/admin/reports/compliance</code> — strictly Administrator-only) covering active
  membership standing, ASA licensing compliance, sponsorship disbursements by tier, and club reciprocity averages for AGM presentations and
  provincial athletics audits.
</p>

<!-- ====================================================================== -->
<!-- CHAPTER 11                                                             -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 11</span> System Administration, ASA Rollover &amp; Disaster Recovery</h1>

<h2>11.1 System Health Diagnostics &amp; Authoritative QA Suite (<code>/admin</code>)</h2>
<ul>
  <li><strong>Live Health Check (<code>/api/admin/health</code>):</strong> Inspects database read/write responsiveness, schema table counts, storage availability, and QR/telemetry pipeline readiness. Diagnostic self-healing provides safe actionable instructions without executing destructive live shell mutations.</li>
  <li><strong>Authoritative Mathematical Benchmark Audit (<code>/api/admin/qa</code>):</strong> Runs live verification vectors against Peter Riegel (1977), Dr. Tim Gabbett (2016) / Foster (2001) ACWR, and Haversine geodesic equations, reporting exact error deltas (&lt;3% tolerance) and 100% pass badges.</li>
</ul>

<h2>11.2 Statutory Annual ASA Season Rollover (<code>/api/admin/rollover</code>)</h2>
<p>
  Every January, Athletics South Africa (ASA) updates athlete age categories based on age attained by <strong>31 December</strong> of the new
  competition year. Only authenticated Administrators (<code>SUPER_ADMIN</code> / <code>CLUB_ADMIN</code>) can preview or execute rollover:
</p>
<ol class="step-list">
  <li>Open <strong>Admin Hub → Annual Season Rollover</strong> and click <strong>Preview Rollover Impact</strong> (read-only simulation).</li>
  <li>Inspect all automatic age-category transitions: <strong>Junior (&lt;20)</strong>, <strong>Senior (20–39)</strong>, <strong>Veteran (40–49)</strong>, <strong>Master (50–59)</strong>, <strong>Grandmaster (60–69)</strong>, and <strong>Great Grandmaster (70+)</strong>.</li>
  <li>Click <strong>Execute Official Rollover</strong>. AMMS archives the completed season's metrics into <code>SeasonArchive</code>, updates every athlete's ASA age category, resets seasonal fee flags for renewal collection, and records the authenticated operator ID in the audit trail.</li>
</ol>

<h2>11.3 Backup, Download &amp; 1-Click Disaster Recovery</h2>
<ul>
  <li><strong>Automated Startup Snapshots:</strong> Every time <code>start.bat</code> launches, a fresh safety copy is written to <code>%LOCALAPPDATA%\\SuperEaglesAMMS\\startup_snapshot.db</code>.</li>
  <li><strong>On-Demand Backups (<code>/api/admin/backup</code>):</strong> Administrators can trigger a timestamped snapshot anytime, download the physical SQLite <code>.db</code> file (or structured JSON operational snapshot on PostgreSQL) to a USB flash drive or network share (<code>/api/admin/backup/download</code>), and perform 1-click restoration (<code>/api/admin/backup/restore</code>) if hardware fails.</li>
</ul>

<!-- ====================================================================== -->
<!-- CHAPTER 12                                                             -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 12</span> Day-to-Day Real-World Club Playbooks (SOPs)</h1>

<div class="grid-2">
  <div class="card">
    <h4>Playbook A: Saturday Morning Club Run (15 Min)</h4>
    <ol>
      <li>Turn on clubhouse PC and double-click <code>start.bat</code>.</li>
      <li>Display the Wi-Fi LAN URL (e.g. <code>http://192.168.1.105:3000</code>) on the noticeboard.</li>
      <li>Club Admin creates/opens today's run in <strong>Club Activities</strong> and launches <strong>QR Marshal Scanner</strong> on a tablet or laptop.</li>
      <li>Scan arriving athletes' QR passes (or let members self-check-in on Wi-Fi). Attendance instantly updates every runner's CCLI loyalty score.</li>
    </ol>
  </div>
  <div class="card">
    <h4>Playbook B: New Member Onboarding &amp; POP</h4>
    <ol>
      <li>New member opens <code>/register</code> on their phone, enters details, and receives their automatic <code>SEA-XXX</code> Club ID.</li>
      <li>Member pays annual club &amp; ASA license dues via EFT and uploads the bank POP PDF/photo under <strong>Payments</strong>.</li>
      <li>Treasurer / Club Admin verifies payment on the bank statement, clicks <strong>Approve Payment</strong>, and assigns an official ASA license number on the athlete's profile.</li>
    </ol>
  </div>
  <div class="card">
    <h4>Playbook C: Away Race Bus &amp; Travel Dispatch</h4>
    <ol>
      <li>Club Admin opens <strong>Races &amp; Logistics</strong>, creates the away event (e.g. Kaapsehoop Marathon), sets bus capacity (e.g. 45 seats) and pickup times.</li>
      <li>Athletes register and book seats from their phones (system prevents duplicate bookings and over-capacity errors).</li>
      <li>48 hours before race day, Admin prints the bus manifest and clicks <strong>WhatsApp Logistics Bulletin</strong> to alert all passengers.</li>
    </ol>
  </div>
  <div class="card">
    <h4>Playbook D: Quarterly Sponsorship Review</h4>
    <ol>
      <li>General Manager &amp; Sponsorship Chair open <strong>Dashboard → 4-Quadrant Matrix</strong>.</li>
      <li>Filter <strong>Priority Talent</strong> to confirm renewals and <strong>Reciprocity Review</strong> to review high-speed/low-attendance cases (checking approved exemptions first).</li>
      <li>Record formal committee decisions in <code>/sponsorship</code> and capture approved stipends or race-entry disbursements in each athlete's Sponsorship tab.</li>
    </ol>
  </div>
</div>

<div class="card" style="margin-top:2px;">
  <h4>Playbook E: Annual ASA Season Rollover &amp; Year-End Archiving (January)</h4>
  <ol>
    <li><strong>Pre-Rollover Backup:</strong> In <strong>Admin Hub → Backups</strong>, trigger a full snapshot and download a copy to an external USB drive or club network archive.</li>
    <li><strong>Preview Transitions:</strong> Open <strong>Annual Season Rollover</strong> and run the read-only preview to audit every member's upcoming ASA age category shift (Junior → Senior → Veteran → Master → Grandmaster → Great Grandmaster).</li>
    <li><strong>Execute &amp; Notify:</strong> Execute the official rollover (creating an immutable <code>SeasonArchive</code> record) and announce annual membership renewal + POP upload instructions via the club WhatsApp broadcast.</li>
  </ol>
</div>

<!-- ====================================================================== -->
<!-- CHAPTER 13                                                             -->
<!-- ====================================================================== -->
<h1 class="chapter"><span class="ch-num">CH 13</span> Troubleshooting, Maintenance &amp; Verification</h1>

<h2>13.1 Common Operational Issues &amp; Exact Resolutions</h2>
<table>
  <thead>
    <tr><th style="width:26%;">Symptom / Error</th><th style="width:32%;">Root Cause</th><th style="width:42%;">Exact Resolution</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Phones cannot open <code>http://&lt;IP&gt;:3000</code></strong></td><td>Windows Defender Firewall blocks inbound TCP 3000 or phone is on mobile data (4G/5G).</td><td>Confirm phone is on the <strong>same clubhouse Wi-Fi</strong>. Open Windows Firewall → Allow inbound TCP Port <strong>3000</strong> for <em>Private</em> networks.</td></tr>
    <tr><td><strong>"TCP port 3000 is already in use"</strong></td><td>A previous AMMS window or another service is already listening on port 3000.</td><td>Close the existing AMMS terminal window (check taskbar) and relaunch <code>start.bat</code>.</td></tr>
    <tr><td><strong>PowerShell blocks <code>npm</code> scripts</strong></td><td>Windows Execution Policy restricts unsigned <code>npm.ps1</code> PowerShell wrappers.</td><td>Always invoke <code>npm.cmd</code> (e.g. <code>npm.cmd test</code>, <code>npm.cmd run build</code>) instead of bare <code>npm</code> in PowerShell.</td></tr>
    <tr><td><strong>Demo role buttons not visible</strong></td><td>Intended production security behavior (<code>ENABLE_DEMO_ROLE_SWITCH="false"</code>).</td><td>Normal for field trials. Only set <code>ENABLE_DEMO_ROLE_SWITCH="true"</code> in <code>.env</code> on an isolated local training PC.</td></tr>
    <tr><td><strong>Empty dashboard after reset</strong></td><td>Clean production reset purged all 20 synthetic test athletes.</td><td>Expected for field trials! Register real members via <code>/register</code>, import via <code>/admin/csv-import</code>, or run <code>npm.cmd run db:restore-demo</code> for demo data.</td></tr>
    <tr><td><strong>Database moved to a new PC</strong></td><td>Live SQLite DB lives in <code>%LOCALAPPDATA%\\SuperEaglesAMMS\\dev.db</code>.</td><td>Download a backup via <strong>Admin → Backup</strong> on the old PC and restore it on the new PC (or copy <code>dev.db</code> into the new PC's <code>%LOCALAPPDATA%\\SuperEaglesAMMS\\</code>).</td></tr>
  </tbody>
</table>

<h2>13.2 Full Automated Release Verification Battery</h2>
<p>Before deploying upgrades or after modifying club configurations, IT administrators can run the complete automated release gate:</p>
<pre>
# 1. TypeScript strict compiler verification (must exit 0 with 0 errors)
npm.cmd run lint

# 2. Full Vitest automated test suite (16 test files, 117 tests — requires demo seed DB)
npm.cmd run db:restore-demo
npm.cmd test

# 3. Optimized production build verification (compiles all 59 routes)
npm.cmd run build

# 4. Return to clean production field-trial database (0 dummy records)
npm.cmd run db:clean-production
</pre>

<!-- ====================================================================== -->
<!-- APPENDIX A & B                                                         -->
<!-- ====================================================================== -->
<h1 class="chapter page-break"><span class="ch-num">APP A</span> Complete Application Route &amp; API Reference</h1>

<h2>A.1 All 21 Web Application Pages</h2>
<table>
  <thead>
    <tr><th style="width:24%;">Page Route</th><th style="width:28%;">Module Name</th><th style="width:20%;">Allowed Roles</th><th style="width:28%;">Primary Function</th></tr>
  </thead>
  <tbody>
    <tr><td><code>/login</code>, <code>/register</code></td><td>Authentication &amp; Onboarding</td><td>Public</td><td>Clean production login, offline password reset, member self-registration.</td></tr>
    <tr><td><code>/dashboard</code></td><td>Executive Command Center</td><td>Staff / Committee</td><td>Club KPIs, 4-Quadrant Matrix, Comrades/Two Oceans trackers.</td></tr>
    <tr><td><code>/athletes</code>, <code>/athletes/new</code></td><td>Athlete Directory &amp; Intake</td><td>Staff / Committee</td><td>Searchable roster, status filters, walk-in member registration.</td></tr>
    <tr><td><code>/athletes/[id]</code></td><td>360° Athlete Profile</td><td>Role-Scoped (Self/Assigned/All)</td><td>Complete profile, QR pass, predictions, loyalty, sponsorship payouts.</td></tr>
    <tr><td><code>/performance</code></td><td>Performance Analytics</td><td>Staff / Committee</td><td>API leaderboards, longitudinal progression, durability breakdowns.</td></tr>
    <tr><td><code>/training</code></td><td>Training &amp; Wellness Hub</td><td>All Authenticated</td><td>Wellness check-ins, ACWR batteries, GPX/TCX/CSV telemetry logs.</td></tr>
    <tr><td><code>/races</code>, <code>/races/results/new</code></td><td>Races &amp; Away Logistics</td><td>All Authenticated</td><td>Official race library, certificate capture, away bus &amp; hotel booking.</td></tr>
    <tr><td><code>/club-activities</code></td><td>Club Runs &amp; QR Check-In</td><td>All Authenticated</td><td>Run/walk calendar, member self-check-in, QR Marshal Scanner.</td></tr>
    <tr><td><code>/loyalty</code></td><td>Loyalty &amp; Reciprocity</td><td>Staff / Committee</td><td>CCLI standings, volunteer logs, exemption review &amp; approvals.</td></tr>
    <tr><td><code>/sponsorship</code></td><td>Sponsorship Governance</td><td>Admin / Committee</td><td>CSS scoring cases, committee voting, override audit &amp; covenants.</td></tr>
    <tr><td><code>/payments</code></td><td>Membership Dues &amp; POP</td><td>Admin / Self</td><td>POP receipt upload, banking reconciliation, arrears tracking.</td></tr>
    <tr><td><code>/ai-insights</code></td><td>AI Coach Workbench</td><td>Admin / Coach</td><td>Explainable coaching directives, prescription approval workflow.</td></tr>
    <tr><td><code>/reports</code></td><td>Compliance &amp; Audit Reports</td><td>Admin / Committee</td><td>ASA compliance exports, sponsorship finance summaries.</td></tr>
    <tr><td><code>/admin</code>, <code>/admin/csv-import</code></td><td>System Administration</td><td>Admin</td><td>Health check, QA benchmarks, ASA rollover, backups, bulk CSV import.</td></tr>
    <tr><td><code>/settings</code>, <code>/manual</code></td><td>Settings &amp; Built-In Manual</td><td>Admin (Settings) / All (Manual)</td><td>Scoring weight calibration, club profile, embedded quick manual.</td></tr>
  </tbody>
</table>

<h2>A.2 Complete REST API Surface (37 Endpoints)</h2>
<div class="grid-2">
  <div class="card">
    <h4>Auth, Athletes &amp; Operations (19 Routes)</h4>
    <ul style="font-size:7.9pt;">
      <li><code>POST /api/auth/login</code> &amp; <code>/logout</code></li>
      <li><code>GET /api/auth/me</code> (user + demoSwitch flag)</li>
      <li><code>POST /api/auth/register</code> (self-onboarding)</li>
      <li><code>POST /api/auth/change-password</code> &amp; <code>/reset-password</code></li>
      <li><code>POST /api/auth/demo-switch</code> (disabled in prod)</li>
      <li><code>GET/POST /api/athletes</code> &amp; <code>/athletes/[id]</code></li>
      <li><code>POST /api/athletes/renew</code> (annual renewal)</li>
      <li><code>GET /api/dashboard</code> &amp; <code>/api/network-info</code></li>
      <li><code>GET/PATCH /api/notifications</code></li>
      <li><code>GET/POST /api/settings</code></li>
      <li><code>GET/POST /api/club-activities/attendance</code></li>
      <li><code>POST /api/club-activities/check-in</code></li>
      <li><code>GET/POST /api/events/logistics</code></li>
      <li><code>GET/POST /api/training</code> &amp; <code>/training/import</code></li>
      <li><code>GET/POST /api/wellness</code></li>
    </ul>
  </div>
  <div class="card">
    <h4>Races, Finance, AI &amp; Admin (18 Routes)</h4>
    <ul style="font-size:7.9pt;">
      <li><code>GET/POST /api/races/results</code></li>
      <li><code>POST /api/races/upload-certificate</code></li>
      <li><code>GET/POST/PATCH /api/payments</code></li>
      <li><code>POST /api/payments/upload-pop</code></li>
      <li><code>POST /api/sponsorship/decisions</code></li>
      <li><code>POST /api/sponsorship/transactions</code> (ZAR payouts)</li>
      <li><code>PATCH /api/ai/recommendations/[id]</code></li>
      <li><code>GET/POST /api/admin/backup</code></li>
      <li><code>GET /api/admin/backup/download</code></li>
      <li><code>POST /api/admin/backup/restore</code></li>
      <li><code>POST /api/admin/csv-import</code> &amp; <code>GET /csv-template</code></li>
      <li><code>GET /api/admin/health</code> &amp; <code>POST /health/heal</code></li>
      <li><code>GET /api/admin/qa</code> (authoritative math audit)</li>
      <li><code>GET /api/admin/reports/compliance</code> (Admin-only)</li>
      <li><code>GET/POST /api/admin/rollover</code> (Admin-only)</li>
    </ul>
  </div>
</div>

<h1 class="chapter"><span class="ch-num">APP B</span> Quick-Reference Command &amp; Credentials Cheat Sheet</h1>
<table>
  <thead>
    <tr><th style="width:32%;">Task</th><th style="width:42%;">Command / Action</th><th style="width:26%;">Notes</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Start Clubhouse Server (Prod)</strong></td><td>Double-click <code>start.bat</code></td><td>Local SSD DB + Wi-Fi LAN</td></tr>
    <tr><td><strong>Start Nationwide Remote Tunnel</strong></td><td>Double-click <code>start-remote.bat</code></td><td>Free HTTPS Cloudflare URL</td></tr>
    <tr><td><strong>Reset to Clean Field-Trial DB</strong></td><td><code>npm.cmd run db:clean-production</code></td><td>Auto-backup + 0 dummy rows</td></tr>
    <tr><td><strong>Restore 20 Demo Test Athletes</strong></td><td><code>npm.cmd run db:restore-demo</code></td><td>For QA / training demos</td></tr>
    <tr><td><strong>Create Custom Production Admin</strong></td><td><code>npm.cmd run bootstrap:admin</code></td><td>Uses <code>INITIAL_ADMIN_*</code> env</td></tr>
    <tr><td><strong>Run Full 117-Test Verification</strong></td><td><code>npm.cmd test</code></td><td>Vitest 16 suites</td></tr>
    <tr><td><strong>Rebuild Production Packages</strong></td><td><code>powershell -ExecutionPolicy Bypass -File scripts/package_distributions.ps1</code></td><td>Outputs 4 SHA-256 ZIPs</td></tr>
    <tr><td><strong>Default Initial Admin Login</strong></td><td><code>admin@supereagles.co.za</code> / <code>AdminPass2026!</code></td><td><strong>Change immediately on first login</strong></td></tr>
  </tbody>
</table>

<div class="callout callout-success" style="margin-top:10px;text-align:center;">
  <div class="callout-title">Super Eagles Athletics Club — "Fly High, Run True, Serve the Club"</div>
  End of Official Implementation &amp; User Manual (v2.0 Production Field-Trial Edition).
  All formulas, routes, security invariants, and workflows verified against Git commit <code>137029f</code>.
</div>

</body>
</html>
`;

fs.writeFileSync(TEMP_HTML, html, "utf-8");
console.log(`✓ Generated HTML source (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);

const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browser = chromePaths.find((p) => fs.existsSync(p));
if (!browser) {
  throw new Error("No Chromium/Edge browser found for PDF compilation.");
}

const fileUrl = `file:///${TEMP_HTML.replace(/\\/g, "/")}`;
console.log(`✓ Compiling publication-grade PDF via ${path.basename(browser)}...`);

execFileSync(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=5000",
    `--print-to-pdf=${OUT_PDF}`,
    fileUrl,
  ],
  { stdio: "inherit" }
);

// Clean up temporary HTML file
fs.unlinkSync(TEMP_HTML);

const stats = fs.statSync(OUT_PDF);
console.log(`✓ PDF created: ${OUT_PDF} (${(stats.size / 1024).toFixed(1)} KB)`);

if (fs.existsSync(path.dirname(GDRIVE_PDF))) {
  fs.copyFileSync(OUT_PDF, GDRIVE_PDF);
  console.log(`✓ Synced copy to: ${GDRIVE_PDF}`);
}
