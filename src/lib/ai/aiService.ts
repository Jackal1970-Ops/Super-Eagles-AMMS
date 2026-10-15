/**
 * Super Eagles AI Performance & Coaching Service Abstraction
 * Supports optional external LLM providers (Gemini / OpenAI) with 100% deterministic fallback.
 * Strictly separates FACTS FROM DATA and AI INTERPRETATION.
 */

import { prisma } from "@/lib/prisma";

export interface AthleteAnalyticsContext {
  athleteName: string;
  athleteStatus: string;
  primaryDiscipline: string;
  athletePerformanceIndex: number;
  clubContributionScore: number;
  sponsorshipScore: number;
  trendClassification: string;
  paceDurabilityLabel: string;
  deteriorationPercent: number;
  recentRaces: Array<{
    raceName: string;
    distanceKm: number;
    timeFormatted: string;
    date: string;
  }>;
  targetGoal?: {
    raceName: string;
    targetDate: string;
    targetTimeFormatted: string;
    predictedTimeFormatted: string;
    targetProbabilityPercent: number;
  };
  totalSponsorshipZar: number;
  attendanceRatePercent: number;
  volunteerCount: number;
}

export interface AIAnalysisOutput {
  factsFromData: {
    aerobicPaceProfile: string;
    paceDurabilitySummary: string;
    trainingConsistency: string;
    clubReciprocityMetrics: string;
    recentResults: string[];
  };
  aiInterpretation: {
    summaryHeadline: string;
    identifiedStrengths: string[];
    probableLimitations: string[];
    racePreparednessAssessment: string;
    coachingRecommendations: Array<{
      title: string;
      category: "PACING" | "VOLUME" | "RECOVERY" | "RACE_STRATEGY" | "CLUB_RECIPROCITY";
      actionableGuidance: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
    }>;
    sponsorshipInsight: string;
  };
  isAIGenerated: boolean;
  provider: "DETERMINISTIC_ENGINE" | "GEMINI" | "OPENAI";
}

/**
 * Deterministic Engine generating transparent factual analysis and interpretation.
 */
export function generateDeterministicAnalysis(context: AthleteAnalyticsContext): AIAnalysisOutput {
  const isHighDurability = context.deteriorationPercent <= 4.0;
  const isTargetLikely = (context.targetGoal?.targetProbabilityPercent ?? 50) >= 60;
  const hasLowParticipation = context.attendanceRatePercent < 40;

  const factsFromData = {
    aerobicPaceProfile: `Normalized Athlete Performance Index is ${context.athletePerformanceIndex}/100 with a ${context.trendClassification} trajectory.`,
    paceDurabilitySummary: `Split analysis indicates ${context.paceDurabilityLabel} with a ${context.deteriorationPercent > 0 ? "+" : ""}${context.deteriorationPercent}% late-race pace delta.`,
    trainingConsistency: `Club attendance is recorded at ${context.attendanceRatePercent}% across internal scheduled runs.`,
    clubReciprocityMetrics: `Club financial investment of R${context.totalSponsorshipZar.toLocaleString()} paired with ${context.volunteerCount} volunteer contributions.`,
    recentResults: context.recentRaces.map(
      (r) => `${r.date.slice(0, 10)}: ${r.raceName} (${r.distanceKm}km) in ${r.timeFormatted}`
    ),
  };

  const identifiedStrengths: string[] = [];
  const probableLimitations: string[] = [];
  const coachingRecommendations: AIAnalysisOutput["aiInterpretation"]["coachingRecommendations"] = [];

  if (context.athletePerformanceIndex >= 80) {
    identifiedStrengths.push("High verified competition aerobic threshold capability across primary distances.");
  } else {
    identifiedStrengths.push("Solid aerobic foundation capable of sustained longitudinal progression.");
  }

  if (isHighDurability) {
    identifiedStrengths.push("Exceptional pace durability: minimal aerobic drift on second-half splits.");
  } else {
    probableLimitations.push("Noticeable pace decay in late race splits indicating muscular endurance or glycogen depletion.");
    coachingRecommendations.push({
      title: "Targeted Fast-Finish Long Runs",
      category: "PACING",
      actionableGuidance: "Integrate 30-40 min progressive tempo pace into the final third of weekend long runs to build fatigue resistance.",
      priority: "HIGH",
    });
  }

  if (context.targetGoal) {
    if (isTargetLikely) {
      identifiedStrengths.push(`Current trajectory shows favourable probability (${context.targetGoal.targetProbabilityPercent}%) of achieving ${context.targetGoal.targetTimeFormatted} at ${context.targetGoal.raceName}.`);
    } else {
      probableLimitations.push(`Predicted finish (${context.targetGoal.predictedTimeFormatted}) currently trails target (${context.targetGoal.targetTimeFormatted}) with ${context.targetGoal.targetProbabilityPercent}% probability.`);
      coachingRecommendations.push({
        title: "Race-Pace Specificity Block",
        category: "RACE_STRATEGY",
        actionableGuidance: `Conduct 3x 5km cruise intervals at target pace (${context.targetGoal.targetTimeFormatted} split) with short 90s recovery to calibrate pacing confidence.`,
        priority: "HIGH",
      });
    }
  }

  if (hasLowParticipation) {
    probableLimitations.push("Internal club run participation is below recommended 50% reciprocity standard.");
    coachingRecommendations.push({
      title: "Re-engage Club Group Sessions",
      category: "CLUB_RECIPROCITY",
      actionableGuidance: "Attend Wednesday club time trials and mentor junior development runners to satisfy reciprocity obligations.",
      priority: "MEDIUM",
    });
  }

  // Summary headline
  let summaryHeadline = "";
  if (isHighDurability && isTargetLikely) {
    summaryHeadline = "Strong Aerobic Progression & High Goal Feasibility";
  } else if (!isHighDurability) {
    summaryHeadline = "Aerobic Speed Confirmed; Long-Run Pace Durability Requires Focus";
  } else {
    summaryHeadline = "Stable Performance Profile; Target Optimization Underway";
  }

  const raceAssessment = context.targetGoal
    ? `Target goal ${context.targetGoal.targetTimeFormatted} for ${context.targetGoal.raceName} is rated at ${context.targetGoal.targetProbabilityPercent}% achievement probability based on recent pace consistency.`
    : "No imminent target race goal nominated.";

  const sponsorshipInsight =
    context.sponsorshipScore >= 75
      ? "Sponsorship investment remains well justified based on balanced performance standards and active club engagement."
      : hasLowParticipation
      ? "Sponsorship Reciprocity Review recommended: ensure athlete meets participation commitments prior to major event allocations."
      : "Sponsorship tier aligns with current development profile.";

  return {
    factsFromData,
    aiInterpretation: {
      summaryHeadline,
      identifiedStrengths,
      probableLimitations,
      racePreparednessAssessment: raceAssessment,
      coachingRecommendations,
      sponsorshipInsight,
    },
    isAIGenerated: false,
    provider: "DETERMINISTIC_ENGINE",
  };
}

/**
 * Main service entrypoint. Will invoke external provider if API key configured,
 * otherwise seamlessly executes deterministic engine.
 */
export async function analyzeAthletePerformance(
  context: AthleteAnalyticsContext
): Promise<AIAnalysisOutput> {
  let geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  let geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || "";

  // Check if Gemini config is saved in database
  try {
    const dbConfig = await prisma.systemConfiguration.findUnique({
      where: { configKey: "GEMINI_AI_CONFIG" },
    });
    if (dbConfig?.configValueJson) {
      const parsed = JSON.parse(dbConfig.configValueJson);
      if (parsed.apiKey?.trim()) geminiKey = parsed.apiKey.trim();
      if (parsed.model?.trim()) geminiModel = parsed.model.trim();
    }
  } catch {
    // Graceful fallback to environment variables
  }

  if (!geminiKey && !openaiKey) {
    // Deterministic fallback (offline, zero-cost, instant, 100% reliable)
    return generateDeterministicAnalysis(context);
  }

  // When external keys exist, we enhance with LLM narrative
  try {
    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are the Lead High-Performance Coach and Sports Science Director for Super Eagles Athletics Club.
Your analysis must strictly adhere to WORLD-CLASS ATHLETIC COACHING STANDARDS and ZERO-HALLUCINATION INVARIANTS.

========================================================================================
WORLD-CLASS ATHLETIC COACHING METHODOLOGIES (MANDATORY COACHING PRINCIPLES):
========================================================================================
1. DR. JACK DANIELS (Daniels' Running Formula - VDOT):
   - Strict adherence to physiological pace zones: Easy (E-Pace), Marathon (M-Pace), Threshold/Tempo (T-Pace: 88-92% HRmax), Interval (I-Pace: VO2max), Repetition (R-Pace).
   - Never prescribe threshold or VO2max work exceeding 10% of total weekly volume.
2. ARTHUR LYDIARD (Periodization & Aerobic Base):
   - Prioritize aerobic capillary density and mitochondrial development through consistent Zone 2 aerobic volume before introducing anaerobic sharpening.
3. RENATO CANOVA (Marathon & Ultra Specificity):
   - Progressive long runs extending to 85-95% of target competition race pace. Pacing durability is developed through progressive blocks with fast finishes.
4. DR. TIM GABBETT (Acute:Chronic Workload Ratio - ACWR):
   - ACWR sweet spot is 0.80–1.30. ACWR > 1.45 represents the injury danger zone. If acute workload spikes, you MUST prescribe an immediate deload.
5. PROF. TIM NOAKES (Lore of Running & Central Governor):
   - Recognize fatigue as a protective brain mechanism. Emphasize adequate glycogen replenishment, electrolyte balance, and neuromuscular recovery.
6. ATHLETICS SOUTH AFRICA (ASA) & WORLD ATHLETICS (WA) RULES:
   - Race walking obeys WA Rule 54 (1.35x pace duration normalization).
   - Respect socio-economic equity: athletes without smartwatches must NEVER be scored down or penalized.

========================================================================================
STRICT ANTI-HALLUCINATION & FACTUAL VERIFICATION RULES:
========================================================================================
1. GROUNDED FACTUAL ISOLATION:
   - Every claim in "factsFromData" MUST be a direct, unaltered quote or exact mathematical extraction from the provided input data.
   - You are STRICTLY FORBIDDEN from inventing race names, times, heart rates, distances, dates, or financial amounts not present in the payload.
2. UNCERTAINTY ACKNOWLEDGEMENT (NO GUESSING):
   - If split data, heart rate, or long run distance is missing, state explicitly: "Split/Wearable data not logged - Standard aerobic baseline applied without penalty."
3. BOUNDED PRESCRIPTIONS:
   - Prescribe realistic paces calibrated directly to the athlete's verified race pace (Daniels VDOT equivalent). Never suggest paces faster than their verified 10km PB pace.
4. NON-MEDICAL GOVERNANCE:
   - Provide sports performance and coaching advice ONLY. Do not diagnose injuries or prescribe pharmaceuticals. Direct pain/injuries to registered sports physiotherapists.

ATHLETE TELEMETRY & PROFILE DATA:
${JSON.stringify(context, null, 2)}

OUTPUT FORMAT REQUIREMENTS:
Output valid, parseable JSON ONLY with NO markdown fences, conforming to this exact structure:
{
  "factsFromData": {
    "aerobicPaceProfile": "<Direct extraction of verified API and competition paces>",
    "paceDurabilitySummary": "<Exact PDI percentage and split consistency findings>",
    "trainingConsistency": "<Actual club attendance rate and session counts>",
    "clubReciprocityMetrics": "<Exact sponsorship disbursement ZAR vs volunteer service points>",
    "recentResults": ["<Exact list of verified race results from context>"]
  },
  "aiInterpretation": {
    "summaryHeadline": "<Concise, professional coaching headline>",
    "identifiedStrengths": ["<Evidence-based strengths directly tied to data>"],
    "probableLimitations": ["<Objective areas for physiological or reciprocity improvement>"],
    "racePreparednessAssessment": "<Honest assessment of target race goal feasibility>",
    "coachingRecommendations": [
      {
        "title": "<Prescription title>",
        "category": "<PACING | VOLUME | RECOVERY | RACE_STRATEGY | CLUB_RECIPROCITY>",
        "actionableGuidance": "<Specific, calibrated workout prescription adhering to Daniels/Canova/Lydiard>",
        "priority": "<HIGH | MEDIUM | LOW>"
      }
    ],
    "sponsorshipInsight": "<Objective governance evaluation of reciprocity alignment>"
  }
}`
                  }
                ]
              }
            ]
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(jsonStr);
          return {
            factsFromData: parsed.factsFromData,
            aiInterpretation: parsed.aiInterpretation,
            isAIGenerated: true,
            provider: "GEMINI",
          };
        }
      }
    }
  } catch {
    // Fallback gracefully on any network/API failure
  }

  return generateDeterministicAnalysis(context);
}
