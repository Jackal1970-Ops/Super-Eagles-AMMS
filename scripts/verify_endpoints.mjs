/** HTTP smoke and authorization regression checks for a running AMMS server. */
import pkg from "@prisma/client";
const { PrismaClient } = pkg;


const baseUrl = (process.argv.find((arg) => arg.startsWith("--base-url="))?.split("=")[1] || "http://127.0.0.1:3000").replace(/\/$/, "");
const prisma = new PrismaClient();
const personas = {
  admin: ["admin@supereagles.co.za", "AdminPass2026!"],
  coach: ["coach.hendrik@supereagles.co.za", "CoachPass2026!"],
  athlete: ["athlete.sipho@supereagles.co.za", "AthletePass2026!"],
  clubAdmin: ["admin.club@supereagles.co.za", "ClubPass2026!"],
  committee: ["committee@supereagles.co.za", "CommitteePass2026!"],
};

let passed = 0;
let failed = 0;
const createdWellnessIds = [];

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}`);
  }
}

async function request(path, { method = "GET", payload, cookie } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    redirect: "manual",
  });
  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await response.json() : await response.text();
  return { status: response.status, body, cookie: response.headers.get("set-cookie")?.split(";", 1)[0] };
}

async function login(label) {
  const [email, password] = personas[label];
  const result = await request("/api/auth/login", { method: "POST", payload: { email, password } });
  check(result.status === 200 && result.body.user?.email === email && result.cookie, `${label} login and session cookie`);
  return { cookie: result.cookie, user: result.body.user };
}

async function cleanup() {
  for (const id of createdWellnessIds) {
    await prisma.auditLog.deleteMany({ where: { entityId: id } });
    await prisma.wellnessEntry.deleteMany({ where: { id } });
  }
}

async function run() {
  const anonymous = await request("/api/athletes");
  check(anonymous.status === 401, "anonymous athlete API access is denied");
  const anonymousNetwork = await request("/api/network-info");
  check(anonymousNetwork.status === 401, "anonymous network metadata access is denied");

  const sessions = {};
  for (const label of Object.keys(personas)) {
    sessions[label] = await login(label);
    const me = await request("/api/auth/me", { cookie: sessions[label].cookie });
    check(me.status === 200 && me.body.user?.role === sessions[label].user.role, `${label} session round-trip`);
  }

  const athleteDirectory = await request("/api/athletes", { cookie: sessions.athlete.cookie });
  check(athleteDirectory.status === 200 && athleteDirectory.body.athletes?.length === 1, "athlete directory API is scoped to the signed-in athlete");
  const athletePayments = await request("/api/payments", { cookie: sessions.athlete.cookie });
  check(athletePayments.status === 200 && athletePayments.body.summary?.totalMembers === 1, "athlete payment aggregates are scoped to the signed-in athlete");
  const ownAthleteId = sessions.athlete.user.athleteId;
  const otherAthlete = await prisma.athlete.findFirst({ where: { id: { not: ownAthleteId } }, select: { id: true } });
  const coachUnassignedAthlete = await prisma.athlete.findFirst({
    where: { coachAssignments: { none: { coachId: sessions.coach.user.id, status: "ACTIVE" } } },
    select: { id: true },
  });

  if (coachUnassignedAthlete) {
    const restrictedProfile = await request(`/athletes/${coachUnassignedAthlete.id}`, { cookie: sessions.coach.cookie });
    check(
      restrictedProfile.status === 200 && restrictedProfile.body.includes("Access Restricted"),
      "coach cannot open an unassigned athlete profile by direct URL"
    );
    const restrictedProfileApi = await request(`/api/athletes/${coachUnassignedAthlete.id}`, { cookie: sessions.coach.cookie });
    check(restrictedProfileApi.status === 403, "coach cannot read an unassigned athlete through the API");
    const restrictedProfileEdit = await request(`/api/athletes/${coachUnassignedAthlete.id}`, {
      method: "PATCH",
      payload: { preferredName: "Unauthorized change" },
      cookie: sessions.coach.cookie,
    });
    check(restrictedProfileEdit.status === 403, "coach cannot edit an unassigned athlete through the API");
  }

  const athleteNetworkMutation = await request("/api/network-info", {
    method: "POST",
    payload: { url: "https://example.trycloudflare.com" },
    cookie: sessions.athlete.cookie,
  });
  check(athleteNetworkMutation.status === 403, "athlete cannot change remote tunnel configuration");

  const forbiddenChecks = [
    ["/api/admin/csv-import", { importType: "ATHLETES", rows: [{}] }, "athlete CSV import"],
    ["/api/club-activities/attendance", { activityId: "invalid", attendedAthleteIds: [] }, "athlete bulk attendance"],
    ["/api/settings", { configKey: "X", configValueJson: "{}" }, "athlete settings mutation"],
    ["/api/training", { athleteId: otherAthlete.id, distanceKm: 10, durationSeconds: 3600 }, "cross-athlete training write"],
    ["/api/races/results", { athleteId: otherAthlete.id, raceName: "Tamper", distanceKm: 10, officialTimeSeconds: 3600 }, "cross-athlete result write"],
  ];
  for (const [path, payload, label] of forbiddenChecks) {
    const result = await request(path, { method: "POST", payload, cookie: sessions.athlete.cookie });
    check(result.status === 403, `${label} is denied`);
  }

  const recommendation = await prisma.aIRecommendation.findFirst({ select: { id: true } });
  if (recommendation) {
    const result = await request(`/api/ai/recommendations/${recommendation.id}`, { method: "PATCH", payload: { status: "APPROVED_BY_COACH" }, cookie: sessions.committee.cookie });
    check(result.status === 403, "committee cannot alter coach-governed AI recommendations");
  }

  const demoSwitch = await request("/api/auth/demo-switch", { method: "POST", payload: { email: personas.coach[0] }, cookie: sessions.admin.cookie });
  check(demoSwitch.status === 403, "demo role switching is disabled by default");

  const wellness = await request("/api/wellness", {
    method: "POST",
    cookie: sessions.athlete.cookie,
    payload: { athleteId: ownAthleteId, sleepQuality: 4, sleepDurationHours: 7.5, fatigueLevel: 2, muscleSoreness: 2, stressLevel: 2, restingHeartRate: 50, notes: "Automated burn-in check; removed after verification." },
  });
  check(wellness.status === 200 && wellness.body.entry?.athleteId === ownAthleteId, "athlete wellness write reaches persistence");
  if (wellness.status === 200) createdWellnessIds.push(wellness.body.entry.id);

  // Multi-role sidebar navigation verification
  const roleSidebarTabs = {
    admin: ["/dashboard", "/athletes", "/performance", "/training", "/races", "/club-activities", "/loyalty", "/sponsorship", "/ai-insights", "/reports", "/admin", "/settings"],
    coach: ["/dashboard", "/athletes", "/performance", "/training", "/races", "/club-activities", "/loyalty", "/ai-insights"],
    athlete: [`/athletes/${ownAthleteId}`, "/training", "/races", "/club-activities"],
    clubAdmin: ["/dashboard", "/athletes", "/club-activities", "/loyalty", "/reports", "/admin"],
    committee: ["/dashboard", "/sponsorship", "/reports"],
  };

  for (const [roleKey, tabs] of Object.entries(roleSidebarTabs)) {
    for (const tabPath of tabs) {
      const result = await request(tabPath, { cookie: sessions[roleKey].cookie });
      check(result.status === 200, `[${roleKey.toUpperCase()}] sidebar tab works: ${tabPath} (got ${result.status})`);
    }
  }

  // Verify athletes cannot access restricted management tabs
  const athleteBlockedTabs = ["/dashboard", "/admin", "/settings", "/sponsorship", "/reports", "/performance"];
  for (const blockedPath of athleteBlockedTabs) {
    const result = await request(blockedPath, { cookie: sessions.athlete.cookie });
    check(result.status === 302 || result.status === 307 || result.status === 403, `[ATHLETE] blocked/redirected from restricted tab: ${blockedPath} (${result.status})`);
  }
}

try {
  await run();
} catch (error) {
  failed++;
  console.error("[FATAL]", error);
} finally {
  await cleanup();
  await prisma.$disconnect();
}

console.log(`\nHTTP BURN-IN: ${passed} passed / ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
