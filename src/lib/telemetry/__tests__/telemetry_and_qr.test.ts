import { describe, it, expect } from "vitest";
import { parseGpxString } from "../gpxParser";
import { generateQrSvg, generateQrMatrix } from "../../qr/qrGenerator";

describe("Smartwatch Telemetry & QR Engine Verification", () => {
  it("parses sample GPX telemetry XML accurately", () => {
    const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Forerunner 965">
  <metadata><name>Zoo Lake Morning Tempo</name></metadata>
  <trk>
    <trkseg>
      <trkpt lat="-26.1680" lon="28.0280"><ele>1600.0</ele><time>2026-03-09T06:00:00Z</time></trkpt>
      <trkpt lat="-26.1690" lon="28.0290"><ele>1610.0</ele><time>2026-03-09T06:01:00Z</time></trkpt>
      <trkpt lat="-26.1700" lon="28.0300"><ele>1605.0</ele><time>2026-03-09T06:02:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const parsed = parseGpxString(sampleGpx, "zoo_lake.gpx");
    expect(parsed.trackPointsCount).toBe(3);
    expect(parsed.totalDistanceKm).toBeGreaterThan(0.1);
    expect(parsed.totalDurationSeconds).toBe(120);
    expect(parsed.elevationGainMeters).toBe(10);
    expect(parsed.elevationLossMeters).toBe(5);
    expect(parsed.suggestedWorkoutType).toBeDefined();
  });

  it("generates deterministic ISO QR SVG and matrix for athlete check-in", () => {
    const qrPayload = "SEA-001|Sipho Sithole|ath-test-123";
    const matrix = generateQrMatrix(qrPayload);
    expect(matrix.length).toBe(29);
    expect(matrix[0].length).toBe(29);

    const svg = generateQrSvg(qrPayload, 240);
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<rect");
    expect(svg.length).toBeGreaterThan(200);
  });
});
