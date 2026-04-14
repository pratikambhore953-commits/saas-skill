import { Router, Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import prisma from "../lib/prisma";

let _io: SocketIOServer | null = null;

export function setIo(io: SocketIOServer): void {
  _io = io;
}

const router = Router();

// GET /api/health
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  let dbStatus: "connected" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const hasEnv = (key: string): "configured" | "missing" =>
    process.env[key] ? "configured" : "missing";

  const resendStatus = hasEnv("RESEND_API_KEY");
  const googleStatus =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? "configured"
      : "missing";
  const cloudinaryStatus =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
      ? "configured"
      : "missing";
  const agoraStatus =
    process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE
      ? "configured"
      : "missing";
  const jwtStatus =
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET
      ? "configured"
      : "missing";
  const socketStatus: "running" | "error" = _io ? "running" : "error";

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      resend: resendStatus,
      google_oauth: googleStatus,
      cloudinary: cloudinaryStatus,
      agora: agoraStatus,
      jwt: jwtStatus,
      socket_io: socketStatus,
    },
  });
});

// GET /api/health/database
router.get("/database", async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.user.findFirst();
    const usersCount = await prisma.user.count();
    res.json({ connected: true, users_count: usersCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ connected: false, error: message });
  }
});

// POST /api/health/test-email
router.post("/test-email", async (req: Request, res: Response): Promise<void> => {
  const { to } = req.body as { to?: string };
  if (!to) {
    res.status(400).json({ sent: false, error: "Missing 'to' in request body" });
    return;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "long",
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>SkillSwap Email Test</title></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:system-ui,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#1E293B;border-radius:12px;overflow:hidden;">
    <div style="background:#F59E0B;padding:32px 40px;">
      <h1 style="margin:0;font-size:24px;color:#0F172A;font-weight:700;">Email is working!</h1>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 16px;color:#CBD5E1;font-size:16px;line-height:1.6;">
        Your Resend email integration is configured correctly on SkillSwap.
      </p>
      <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;line-height:1.6;">
        This test email was sent to verify that your Resend API key and email sending pipeline
        are fully operational.
      </p>
      <div style="background:#0F172A;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;color:#64748B;font-size:12px;">
          Sent at: <span style="color:#F59E0B;">${timestamp} UTC</span>
        </p>
      </div>
    </div>
    <div style="padding:16px 40px;border-top:1px solid #334155;">
      <p style="margin:0;color:#64748B;font-size:12px;">SkillSwap — Integration Test</p>
    </div>
  </div>
</body>
</html>`;

    const result = await resend.emails.send({
      from: "SkillSwap <onboarding@resend.dev>",
      to: [to],
      subject: "SkillSwap \u2014 Email Integration Test",
      html,
    });

    if (result.error) {
      res.status(500).json({ sent: false, error: result.error.message });
      return;
    }

    res.json({ sent: true, message_id: result.data?.id ?? "unknown" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ sent: false, error: message });
  }
});

// POST /api/health/test-cloudinary
router.post(
  "/test-cloudinary",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { v2: cloudinary } = await import("cloudinary");

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // 1x1 transparent PNG in base64
      const testImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const uploadResult = await cloudinary.uploader.upload(testImage, {
        folder: "skillswap/tests",
        public_id: `health_test_${Date.now()}`,
      });

      const url: string = uploadResult.secure_url;
      const publicId: string = uploadResult.public_id;

      // Delete immediately after upload
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Deletion failure is non-fatal
      }

      res.json({ uploaded: true, url });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ uploaded: false, error: message });
    }
  },
);

// GET /api/health/test-socket
router.get("/test-socket", (_req: Request, res: Response): void => {
  try {
    if (!_io) {
      res.json({ running: false, connected_clients: 0 });
      return;
    }
    const sockets = _io.sockets.sockets;
    const connectedClients: number = sockets.size;
    res.json({ running: true, connected_clients: connectedClients });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ running: false, error: message });
  }
});

// GET /api/health/test-agora
router.get("/test-agora", (_req: Request, res: Response): void => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      res.status(500).json({
        generated: false,
        error: "AGORA_APP_ID or AGORA_APP_CERTIFICATE is not configured",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RtcTokenBuilder, RtcRole } = require("agora-token") as {
      RtcTokenBuilder: {
        buildTokenWithUid: (
          appId: string,
          appCertificate: string,
          channelName: string,
          uid: number,
          role: number,
          privilegeExpiredTs: number,
        ) => string;
      };
      RtcRole: { PUBLISHER: number };
    };

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      "test",
      0,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
    );

    res.json({
      generated: true,
      token,
      app_id: appId.substring(0, 8),
      expires_in: "1 hour",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ generated: false, error: message });
  }
});

export default router;
