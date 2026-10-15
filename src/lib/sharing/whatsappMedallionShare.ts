/**
 * Super Eagles Athletics Club - WhatsApp Medallion Share Utility
 * Formats official club conferral announcements with verified criteria and one-click WhatsApp broadcast link.
 */

export interface MedallionSharePayload {
  awardTitle: string;
  awardType: "ATHLETE_OF_THE_MONTH" | "ATHLETE_OF_THE_YEAR" | string;
  trackCategory: "COMPETITIVE" | "HEALTH_WELLNESS" | string;
  period: string;
  athleteName: string;
  athleteNumber: string;
  citation: string;
  conferredBy: string;
  metrics?: Record<string, string | number | boolean | null | undefined>;
}

export function formatWhatsAppMedallionMessage(payload: MedallionSharePayload): string {
  const isCompetitive = payload.trackCategory === "COMPETITIVE";
  const isYearly = payload.awardType === "ATHLETE_OF_THE_YEAR";

  const banner = isYearly
    ? "🏆🦅 *SUPER EAGLES ATHLETICS CLUB — ANNUAL HONORS* 🦅🏆"
    : "🥇🦅 *SUPER EAGLES ATHLETICS CLUB — MONTHLY CONFERRAL* 🦅🥇";

  const trackBadge = isCompetitive
    ? "⚡ *TRACK*: Competitive High Performance & Racing"
    : "🌱 *TRACK*: Community Health, Wellness & Loyalty";

  const header = `*OFFICIAL CONFERRAL OF THE MEDALLION*\n${payload.awardTitle.toUpperCase()}`;

  let metricsSection = "";
  if (payload.metrics && Object.keys(payload.metrics).length > 0) {
    metricsSection = "\n📊 *VERIFIED CRITERIA & PERFORMANCE PROOF*:\n";
    for (const [key, value] of Object.entries(payload.metrics)) {
      const formattedKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
      metricsSection += `  • ${formattedKey}: *${value}*\n`;
    }
  }

  const message = `${banner}

${header}
📅 *Period*: ${payload.period}
👤 *Honoree*: *${payload.athleteName}* (${payload.athleteNumber})
${trackBadge}

📜 *CITATION OF MERIT*:
"${payload.citation}"
${metricsSection}
🏛️ *Conferred By*:
_${payload.conferredBy}_

🎉 *Let's congratulate our champion in true Super Eagles spirit!*
#FlyHigh #SuperEaglesAthletics #AthleteOfThe${isYearly ? "Year" : "Month"}`;

  return message;
}

export function openWhatsAppMedallionBroadcast(payload: MedallionSharePayload): void {
  const text = formatWhatsAppMedallionMessage(payload);
  const encoded = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}
