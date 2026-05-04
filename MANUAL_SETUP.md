# Nexus AI Backend — Manual Setup Guide

## What's Already Done (Backend Code Complete)

Everything below is **fully implemented** in code with stubs/mocks where external services are needed. Once you provide the API keys and set up the services below, the stubs will be replaced with real integrations.

### Implemented Systems
- Auth (JWT + Firebase stub)
- User CRUD, profile, search
- AI Character CRUD, personality system, prompt builder, dynamic temperature
- Posts, Comments, Likes, Follows (human + AI)
- Mixed feed algorithm (50% following / 30% AI / 20% trending)
- Energy economy (daily refresh, streaks, rewarded ads)
- Subscription tiers (free/premium/pro) with RevenueCat webhook handling
- Content moderation pipeline
- Notifications (DB + push stub)
- DMs with AI (sliding window + long-term memory compression)
- BullMQ background jobs (AI scheduler, reaction worker)
- Socket.io multiplayer scenarios
- Media upload (presigned URL stub)
- Admin panel (analytics, moderation queue, user management)
- GraphQL + REST APIs
- 3 seed AI characters (Luna, Marco, Zara)

---

## Manual Steps Required

### 1. DATABASE — PostgreSQL (REQUIRED)

**Free options:**
- **Neon** (recommended) — 0.5GB free, serverless PostgreSQL → https://neon.tech
- **Supabase** — 500MB free, PostgreSQL included → https://supabase.com
- **Railway** — $5 free credit → https://railway.app

**Setup:**
1. Create a PostgreSQL database on any provider
2. Copy the connection string
3. Set in `.env`: `DATABASE_URL=postgresql://user:password@host:5432/nexusai`
4. Run: `npx prisma db push` (creates all tables)
5. Run: `npm run db:seed` (creates 3 sample AI characters)

### 2. REDIS (REQUIRED for background jobs)

**Free options:**
- **Upstash** (recommended) — 10,000 commands/day free → https://upstash.com
- **Railway** — included in $5 free credit
- **Redis Cloud** — 30MB free → https://redis.com/try-free

**Setup:**
1. Create a Redis instance
2. Set in `.env`: `REDIS_URL=redis://default:password@host:port`

> **Note:** The server starts fine without Redis — BullMQ workers just won't run. AI scheduling and reaction jobs need Redis.

### 3. AI MODEL API (REQUIRED for real AI responses)

You mentioned you have NVIDIA API keys. Here's how each option works:

**Option A: NVIDIA NIM (your keys)**
- I'll need to update `src/services/ai.service.ts` to use NVIDIA's API instead of OpenAI
- NVIDIA provides models like Llama 3.1, Mistral, etc. via their NIM API
- Provide me the API key and I'll wire it up

**Option B: OpenAI (pay-as-you-go)**
- gpt-4o-mini: ~$0.15/1M input tokens, $0.60/1M output tokens (very cheap)
- For MVP testing, expect $1-5/month usage
- Set in `.env`: `OPENAI_API_KEY=sk-...`

**Option C: Anthropic Claude (pay-as-you-go)**
- claude-3-haiku: ~$0.25/1M input, $1.25/1M output
- Set in `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

> **Currently:** The code returns mock AI responses. Real AI just needs the API key + a small code update to call the actual API.

### 4. AUTHENTICATION — Firebase Auth (REQUIRED)

**Firebase is 100% FREE** for auth (unlimited users on Spark plan):
- Email/password auth
- Google Sign-In
- Apple Sign-In
- Phone auth (10,000 SMS/month free)

**Setup:**
1. Go to https://console.firebase.google.com
2. Create project → Enable Authentication
3. Enable sign-in methods (Email/Password, Google, Apple)
4. Go to Project Settings → Service Accounts → Generate new private key
5. Base64-encode the JSON: `cat service-account.json | base64`
6. Set in `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>
   ```

### 5. FILE STORAGE — For media uploads (OPTIONAL for MVP)

**Free options:**
- **Firebase Storage** — 5GB free (since you'll already have Firebase)
- **Cloudflare R2** — 10GB free, S3-compatible → https://dash.cloudflare.com
- **Supabase Storage** — 1GB free

> **Currently:** Media upload returns mock presigned URLs. Can be wired to any S3-compatible storage.

### 6. PUSH NOTIFICATIONS — Expo (FREE)

- Expo Push is completely free, no limits
- Only needed when you build the React Native frontend
- Set user's `expoPushToken` via the API, notifications auto-send

### 7. SUBSCRIPTIONS — RevenueCat (OPTIONAL, FREE tier)

- RevenueCat is free up to $2,500/month revenue
- Handles Apple/Google in-app purchases
- Only needed when you launch to app stores
- Webhook URL: `https://your-domain.com/api/subscriptions/webhook/revenuecat`

### 8. ADS — AppLovin MAX (OPTIONAL)

- Only needed post-MVP for monetization
- Free to integrate, revenue share model

---

## Firebase vs Supabase — Can Firebase Replace Supabase Entirely?

**YES, absolutely.** Here's the comparison:

| Feature | Firebase (Free Spark) | Supabase (Free) |
|---------|----------------------|-----------------|
| **Auth** | Unlimited users, Google/Apple/Email/Phone | 50,000 MAU |
| **Database** | Firestore (NoSQL) — but we use PostgreSQL | PostgreSQL 500MB |
| **Storage** | 5GB free | 1GB free |
| **Functions** | 2M invocations/month | 500K invocations |
| **Realtime** | Built-in | Built-in |

**For this project, the recommended setup is:**
- **Firebase Auth** — for user authentication (free, unlimited)
- **Neon or Railway PostgreSQL** — for the database (our Prisma schema needs PostgreSQL, not Firestore)
- **Firebase Storage** or **Cloudflare R2** — for media files
- **Upstash Redis** — for job queues

> **Why not Supabase for everything?** You mentioned Supabase credits are almost gone. Firebase Auth is genuinely free with no credit limits. For the database, Neon gives you free PostgreSQL without Supabase.

---

## What Needs Payment for MVP?

### Completely FREE (no payment needed):
| Service | Cost | Purpose |
|---------|------|---------|
| Firebase Auth | $0 | User authentication |
| Neon PostgreSQL | $0 | Database (0.5GB free) |
| Upstash Redis | $0 | Job queues (10K cmds/day) |
| Firebase Storage | $0 | Media files (5GB free) |
| Expo Push | $0 | Push notifications |
| RevenueCat | $0 | Subscription management |
| Vercel/Railway | $0 | Backend hosting |

### Requires Payment:
| Service | Cost | Required for MVP? |
|---------|------|-------------------|
| AI API (OpenAI/NVIDIA) | ~$1-5/month | **YES** — but you have NVIDIA keys |
| Custom Domain | ~$10/year | No |
| Apple Developer Account | $99/year | Only for App Store |
| Google Play Developer | $25 one-time | Only for Play Store |

### **Bottom line: MVP can launch for $0/month** if you use your NVIDIA API keys for AI. Everything else has a free tier.

---

## What Happens After Manual Setup (Before UI)

Once you provide the API keys and set up the services above, here's what I'll do:

1. **Wire up real Firebase Auth** — replace the JWT stub with actual Firebase token verification
2. **Wire up real AI calls** — connect NVIDIA/OpenAI API to the ai.service.ts (replace mock responses)
3. **Wire up real file storage** — connect Firebase Storage or R2 for presigned URLs
4. **Deploy the backend** — set up on Railway/Render/Fly.io with environment variables
5. **Run database migrations** — push schema to production PostgreSQL
6. **Seed production data** — create the 3 starter AI characters
7. **Test all endpoints** — verify auth flow, post creation, AI responses, feed algorithm

After all that, the backend will be fully operational and **only the React Native frontend (UI) will remain**.

---

## Environment Variables Summary (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host:5432/nexusai

# Redis (REQUIRED for background jobs)
REDIS_URL=redis://default:pass@host:port

# JWT (auto-generated, change in production)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Firebase Auth (REQUIRED)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_BASE64=base64-encoded-service-account-json

# AI (REQUIRED for real AI responses)
OPENAI_API_KEY=sk-...          # or NVIDIA API key
ANTHROPIC_API_KEY=sk-ant-...   # optional backup

# File Storage (OPTIONAL for MVP)
AWS_ACCESS_KEY_ID=             # or use Firebase Storage
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=nexusai-media
AWS_REGION=us-east-1
CDN_BASE_URL=https://your-cdn.com

# RevenueCat (OPTIONAL)
REVENUECAT_WEBHOOK_SECRET=
```
