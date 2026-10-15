# Super Eagles Athletics & Membership Management System (AMMS)
## Cloud Deployment & Porting Guide

This guide outlines how to port and deploy the **Super Eagles AMMS** application from a local clubhouse computer to a 24/7 cloud environment (Vercel, Railway, AWS, or DigitalOcean) so all athletes, coaches, and administrators across South Africa and internationally can access the application anytime without relying on a local machine.

---

### Cloud Architecture Overview

| Layer | Local Clubhouse Environment | Production Cloud Environment |
| :--- | :--- | :--- |
| **Frontend & API** | Next.js 16 (`localhost:3000`) | Vercel Serverless OR Docker Container |
| **Database** | SQLite (`file:./dev.db`) | Managed PostgreSQL (Neon, Supabase, AWS RDS, Railway) |
| **Authentication** | HTTP-only JWT Cookie | Secure HTTPS SameSite Cookie |
| **Storage & Emblem** | Local `/public/images/emblem.png` | CDN / Object Storage (S3 / Cloudflare R2) |
| **Mobile Access** | Clubhouse Wi-Fi or Cloudflare Tunnel | Public HTTPS Custom Domain (e.g. `portal.supereagles.co.za`) |

---

### Option 1: Fast 1-Click Deployment on Vercel + Neon/Supabase (Recommended)

Vercel is the creator of Next.js and offers the fastest, zero-downtime deployment with global CDN and automated SSL.

1. **Create Cloud PostgreSQL Database (Free Tier)**:
   - Create a free database on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
   - Copy your connection string:
     ```env
     DATABASE_URL="postgresql://user:password@ep-cool-frost-12345.us-east-2.aws.neon.tech/supereagles_db?sslmode=require"
     ```

2. **Push Schema to Cloud Database**:
   - Swap to the PostgreSQL Prisma schema:
     ```bash
     npx prisma db push --schema=prisma/schema.postgresql.prisma
     ```
   - Create the first production administrator without loading destructive demo data:
     ```bash
     INITIAL_ADMIN_EMAIL="admin@example.org" \
     INITIAL_ADMIN_NAME="System Administrator" \
     INITIAL_ADMIN_PASSWORD="use-a-unique-secret-from-your-password-manager" \
     npm run bootstrap:admin
     ```
   - Do not run `npm run prisma:seed` against production. It deletes existing records and loads public demonstration accounts; the script now refuses to run under `NODE_ENV=production` unless an isolated demo environment explicitly sets `ALLOW_DEMO_SEED=true`.

3. **Deploy to Vercel**:
   - Push this repository to GitHub, GitLab, or Bitbucket.
   - Import the project into [Vercel](https://vercel.com).
   - In **Settings > Environment Variables**, configure:
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `JWT_SECRET`: A cryptographically random secret of at least 32 characters (64 characters recommended). Do not use the documentation examples as a real secret.
     - `NEXT_PUBLIC_APP_URL`: Your live domain (e.g. `https://portal.supereagles.co.za`).
   - Set the Vercel **Build Command** to `npm run build:postgres`. This is required so the generated Prisma client uses PostgreSQL rather than the local SQLite development provider.
   - Click **Deploy**!

---

### Option 2: Full-Stack Container Deployment via Docker (Railway / Render / AWS)

The repository includes a production-optimized `Dockerfile` configured for multi-stage caching and non-root security execution.

1. **Build Container Image**:
   ```bash
   docker build -t supereagles-amms:latest .
   ```

   The container build targets PostgreSQL by default. For a local SQLite-only container, use `docker build --build-arg PRISMA_SCHEMA=prisma/schema.prisma -t supereagles-amms:sqlite .` and mount persistent storage for the database and backups.

2. **Run Container Locally or in Cloud**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e DATABASE_URL="postgresql://user:pass@host:5432/supereagles_db" \
     -e JWT_SECRET="your-production-jwt-secret-key" \
     -e NEXT_PUBLIC_APP_URL="https://portal.supereagles.co.za" \
     --name amms-app \
     supereagles-amms:latest
   ```

3. **Railway / Render 1-Click Deployment**:
   - Link repository to [Railway.app](https://railway.app).
   - Add a PostgreSQL service plugin.
   - Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`).
   - Railway will automatically detect the `Dockerfile` and deploy with custom domain support.

---

### Option 3: Remote Gateway from Local Computer (Zero Cost, No Cloud Subscription)

If you wish to keep the database on your clubhouse computer while allowing athletes everywhere in South Africa to log in from their phones:

1. Double-click `start-remote.bat` in the project root.
2. It launches the local server and connects an encrypted Cloudflare Tunnel.
3. It generates an instant, public HTTPS address (e.g., `https://supereagles-ams.trycloudflare.com`).
4. Share this link on the club WhatsApp group or email newsletter.
5. Athletes open the link on their phones, tap **"Add to Home Screen"**, and log in.

---

### Environment Variables Reference

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Connection string for SQLite or PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | **Yes** | Cryptographically random session-signing secret (32+ characters) | Generate uniquely in your secret manager |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Public canonical URL for HTTPS cookie rules | `https://portal.supereagles.co.za` |
| `OPENAI_API_KEY` | *Optional* | Key for external LLM coaching narrative synthesis | `sk-proj-...` |
| `GEMINI_API_KEY` | *Optional* | Key for Gemini coaching engine integration | `AIzaSy...` |
| `NODE_ENV` | **Yes** | Runtime environment mode | `production` |

### Production Backup Requirement

The in-app backup control creates a physical database copy for SQLite and a structured JSON operational snapshot for PostgreSQL. For PostgreSQL production deployments, also enable the managed database provider's encrypted automated backups and point-in-time recovery; the JSON export is not a replacement for a provider-native full database backup.
