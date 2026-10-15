import { NextResponse } from "next/server";
import os from "os";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const nets = os.networkInterfaces();
    const interfaces: { name: string; ip: string; port: number; url: string }[] = [];

    const port = 3000;

    for (const name of Object.keys(nets)) {
      const netList = nets[name];
      if (!netList) continue;
      for (const net of netList) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (net.family === "IPv4" && !net.internal) {
          interfaces.push({
            name,
            ip: net.address,
            port,
            url: `http://${net.address}:${port}`,
          });
        }
      }
    }

    // Default primary IP (prefer Wi-Fi or Ethernet)
    const primary =
      interfaces.find((i) => i.name.toLowerCase().includes("wi-fi") || i.name.toLowerCase().includes("eth")) ||
      interfaces[0] || {
        name: "Local",
        ip: "localhost",
        port,
        url: `http://localhost:${port}`,
      };

    // Check if a remote Cloudflare / public tunnel URL is configured in DB or ENV
    let remoteTunnelUrl: string | null = process.env.PUBLIC_TUNNEL_URL || null;
    try {
      const savedConfig = await prisma.systemConfiguration.findUnique({
        where: { configKey: "REMOTE_TUNNEL_URL" },
      });
      if (savedConfig?.configValueJson) {
        const parsed = JSON.parse(savedConfig.configValueJson);
        if (parsed.url) {
          remoteTunnelUrl = parsed.url;
        }
      }
    } catch {
      // Graceful fallback if database lookup fails
    }

    return NextResponse.json({
      primaryUrl: primary.url,
      primaryIp: primary.ip,
      port,
      interfaces,
      hostname: os.hostname(),
      remoteTunnelUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve local network information." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: administrator access required." }, { status: 403 });
    }

    const { url } = await req.json();
    const cleanUrl = url ? String(url).trim() : "";
    if (cleanUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(cleanUrl);
      } catch {
        return NextResponse.json({ error: "Enter a valid HTTPS tunnel URL." }, { status: 400 });
      }
      if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
        return NextResponse.json({ error: "Remote tunnel URLs must use HTTPS and may not contain credentials." }, { status: 400 });
      }
    }

    await prisma.systemConfiguration.upsert({
      where: { configKey: "REMOTE_TUNNEL_URL" },
      update: {
        configValueJson: JSON.stringify({ url: cleanUrl }),
        updatedAt: new Date(),
      },
      create: {
        configKey: "REMOTE_TUNNEL_URL",
        configValueJson: JSON.stringify({ url: cleanUrl }),
      },
    });

    return NextResponse.json({ success: true, remoteTunnelUrl: cleanUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save remote tunnel URL." },
      { status: 500 }
    );
  }
}
