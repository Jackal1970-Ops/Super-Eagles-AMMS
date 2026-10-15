# Super Eagles Athletics Club — Athlete Performance Intelligence & Sponsorship Management System (AMS)

An enterprise-grade, evidence-based sports performance intelligence, coaching, and sponsorship reciprocity management web application built with **React (Next.js 16), TypeScript, Tailwind CSS, and Prisma ORM**.

---

## 🦅 Primary Business Philosophy

$$\text{MEASURE} \longrightarrow \text{NORMALISE} \longrightarrow \text{TREND} \longrightarrow \text{PREDICT} \longrightarrow \text{RECOMMEND} \longrightarrow \text{HUMAN DECISION}$$

The club sponsors and develops athletes. The system provides fair, transparent mathematical evidence evaluating:
1. **Athletic Performance & Improvement**
2. **Future Target Race Potential & Pace Durability**
3. **Internal Club Run Participation & Volunteering**
4. **Reciprocal Accountability & Responsible Resource Use**

> [!IMPORTANT]
> **Three Strictly Segregated Scores (Never Combined):**
> - **Athlete Performance Index (API: 0–100)**: Reflects athletic capability, longitudinal improvement, reliability, and race targets.
> - **Club Sponsorship Score (CSS: 0–100)**: Evaluates sponsorship justification by blending verified performance with club contribution and compliance.
> - **Athlete Readiness / Coaching Score (ARCS)**: Non-medical sports coaching indicator (High / Normal / Caution / Insufficient Data) that **never** reduces an athlete's sponsorship funding.

---

## 📱 How Athletes Can Login from Another Device (Mobile Phones, Tablets & Remote)

Even though the database and server run on your local computer, athletes and coaches can easily access the system from their smartphones or tablets in two simple ways:

### Option 1: On the Same Wi-Fi / Local Network (Instant, No Internet Setup Required)
1. Ensure the host computer running the application is connected to the Wi-Fi.
2. The server is configured to bind to `0.0.0.0:3000`.
3. Find the host computer's local IP address (e.g., run `ipconfig` in terminal, currently: `172.25.8.121`).
4. On any mobile phone or tablet connected to the same Wi-Fi, open the mobile browser and visit:
   ```
   http://172.25.8.121:3000
   ```
5. In the local demonstration dataset, the athlete logs in with the documented demo credentials. Never use these credentials in a production deployment.
6. From their phone, the athlete can:
   - View their **360° Athlete Profile**
   - Log self-reported **Wellness Check-Ins** (sleep quality, perceived fatigue, muscle soreness)
   - Log **Training Workouts & Long Runs**
   - Check **Deterministic Race Predictions** and target race probability
   - View their **Club Contribution & Attendance status**
   - Review **Sponsorship Obligations & Covenants**
   - Strict POPIA privacy rules ensure athletes cannot access other athletes' confidential profiles.

---

### Option 2: Remote Access from Anywhere (When Athletes are on 4G/5G Cellular or at Home)
If athletes need to log in while away from the clubhouse Wi-Fi, you can expose your local server securely without paying for cloud hosting or modifying router firewalls:

#### Using Cloudflare Tunnel (Recommended, 100% Free & Secure HTTPS):
1. On the host computer, run:
   ```powershell
   npx.cmd cloudflared tunnel --url http://localhost:3000
   ```
2. Cloudflare will generate a secure, temporary HTTPS link, for example:
   ```
   https://super-eagles-ams.trycloudflare.com
   ```
3. Share this link with your athletes and coaches. They can open it on their mobile phones anywhere in the world!

---

## 🚀 First-Run Startup Guide

### 1. Prerequisites
- **Node.js**: v20+ or v22+ (tested and verified on Node.js v26)
- **npm**: v10+

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-eagles-secret-key-athletes-performance-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialize Database & Seed Synthetic Demo Data
```powershell
# Generate Prisma client and sync SQLite schema
node ./node_modules/prisma/build/index.js db push

# Populate 20 diverse athletes, coaches, races, attendance, and transactions
node scripts/seed.mjs
```

### 4. Start the Application
```powershell
npm.cmd start
# Or for development with live reload:
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 👥 Demo Test Accounts (Role-Based Access Control)

The system includes pre-configured personas for all 5 roles. You can either sign in with these credentials or use the **1-Click Test Personas** on the login page or the **Role Switcher** in the top navbar:

| Role | Email | Password | Scope & Privileges |
|---|---|---|---|
| **General Manager (Super Admin)** | `admin@supereagles.co.za` | `AdminPass2026!` (demo only) | Full executive dashboard, matrix, sponsorship decisions, overrides, audit logs |
| **Coach** | `coach.hendrik@supereagles.co.za` | `CoachPass2026!` (demo only) | Assigned training squad, readiness, race predictions, AI coaching review |
| **Athlete** | `athlete.sipho@supereagles.co.za` | `AthletePass2026!` (demo only) | Self-profile, own results, mobile wellness check-ins, goals, obligations only |
| **Club Administrator** | `admin.club@supereagles.co.za` | `ClubPass2026!` (demo only) | Athlete management, bulk attendance, official race capture, CSV imports |
| **Sponsorship Committee** | `committee@supereagles.co.za` | `CommitteePass2026!` (demo only) | Review sponsorship cases, vote, recommend decisions & inspect reciprocity |

---

## 🧮 Mathematical Engines & Formulas

### 1. Athlete Performance Index (API: 0–100)
$$\text{API} = (S_{\text{perf}} \times 35\%) + (S_{\text{imprv}} \times 30\%) + (S_{\text{target}} \times 20\%) + (S_{\text{rel}} \times 15\%)$$
- Weights are fully configurable in **Settings & Weights**.

### 2. Pace Durability Index (PDI)
$$\text{Pace Deterioration } \% = \left( \frac{\text{Late Race Pace (min/km)} - \text{Early Race Pace (min/km)}}{\text{Early Race Pace (min/km)}} \right) \times 100$$
- $\le +2\%$: **Excellent Durability** (even / negative split)
- $+2\% \text{ to } +6\%$: **Good Durability**
- $+6\% \text{ to } +12\%$: **Moderate Durability**
- $> +12\%$: **Poor Durability**

### 3. Deterministic Race Prediction Engine
$$T_2 = T_1 \times \left(\frac{D_2}{D_1}\right)^{1.06 + \delta_{\text{durability}} - \delta_{\text{consistency}}}$$
- Central estimate with predicted range and probability of achieving the nominated target goal time.

### 4. Club Contribution & Loyalty Index (CCLI: 0–100)
$$\text{CCLI} = (C_{\text{runs}} \times 30\%) + (C_{\text{vol}} \times 20\%) + (C_{\text{rep}} \times 15\%) + (C_{\text{ment}} \times 10\%) + (C_{\text{meet}} \times 10\%) + (C_{\text{obl}} \times 10\%) + (C_{\text{tenure}} \times 5\%)$$
- **Approved Exemption Rule**: Valid exemptions adjust the expected attendance denominator rather than penalizing the athlete.

### 5. Club Sponsorship Score (CSS: 0–100)
$$\text{CSS} = (S_{\text{perf}} \times 25\%) + (S_{\text{imprv}} \times 20\%) + (S_{\text{potential}} \times 15\%) + (S_{\text{rel}} \times 10\%) + (\text{CCLI} \times 20\%) + (C_{\text{comp}} \times 10\%)$$
- Generates transparent recommendations (Elite, Performance, Development, Maintain, Increase, Conditional, Review, Reduce, Non-Sponsored) with mandatory audit recording for overrides.

---

## 🧪 Testing Suite

### Unit & Formula Verification
Run all 18 automated mathematical formula tests:
```powershell
npm.cmd test
```
Tests verify numerical precision across pace deterioration, World Athletics normalisation, API weights, CCLI exemptions, and CSS recommendations.

---

## 📋 Compliance & Governance

- **POPIA Act Privacy Guard**: Athletes cannot view other athletes' profiles. Coaching and non-invasive wellness parameters are strictly role-isolated.
- **Medical Disclaimer**:
  > "This system provides sports-performance information and does not provide medical diagnosis or medical advice."
- **Immutable Audit Trail**: All athlete updates, result captures, scoring weight alterations, and sponsorship decisions/overrides are recorded with user timestamps and state deltas.
