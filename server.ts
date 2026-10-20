import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import Stripe from "stripe";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getClientAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore as getClientFirestore, collection, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";
import cron from "node-cron";
import {
  requireAdminAuth,
  requireOperatorAuth,
  requireCronAuth,
  rateLimit,
  isAllowedProxyTarget,
  assertSafeOutboundUrl,
  assertAllowedUpload,
  buildStoredFilename,
  maskPhone,
} from "./src/server/security.js";

async function sendWhatsApp(cleanPhone: string, message: string, dbInstance: any): Promise<{ success: boolean; status: string; details: any }> {
  let activeProvider = process.env.WHATSAPP_PROVIDER || "simulation";
  let ultramsgConfig = {
    instanceId: process.env.ULTRAMSG_INSTANCE_ID || "",
    token: process.env.ULTRAMSG_TOKEN || ""
  };
  let twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    senderPhone: process.env.TWILIO_SENDER_NUMBER || ""
  };
  let customHttpConfig = {
    apiEndpoint: process.env.CUSTOM_WHATSAPP_URL || "",
    method: process.env.CUSTOM_WHATSAPP_METHOD || "POST",
    jsonBodyTemplate: process.env.CUSTOM_WHATSAPP_BODY || ""
  };

  if (dbInstance) {
    try {
      const whatsappSettingsDoc = await getDoc(doc(dbInstance, "settings", "whatsapp"));
      if (whatsappSettingsDoc.exists()) {
        const settingsData = whatsappSettingsDoc.data();
        if (settingsData.activeProvider) {
          activeProvider = settingsData.activeProvider;
        }
        if (settingsData.ultramsg) {
          ultramsgConfig = { ...ultramsgConfig, ...settingsData.ultramsg };
        }
        if (settingsData.twilio) {
          twilioConfig = { ...twilioConfig, ...settingsData.twilio };
        }
        if (settingsData.customHttp) {
          customHttpConfig = { ...customHttpConfig, ...settingsData.customHttp };
        }
      }
    } catch (err) {
      console.warn("Failed to load whatsapp settings from database, using env fallback:", err);
    }
  }

  // Support dynamic and robust provider matching (case-insensitive & space/character independent)
  const providerLower = (activeProvider || "").toLowerCase().trim().replace(/[-_\s]/g, "");
  
  const isUltraMsg = providerLower === "ultramsg" || providerLower === "ultra_msg";
  const isTwilio = providerLower === "twilio";
  const isCustom = providerLower === "custom" || providerLower === "customhttp" || providerLower === "custom_http" || providerLower === "custom_gateway";

  let dispatchStatus = "SIMULATED";
  let details: any = {};

  try {
    if (isUltraMsg && ultramsgConfig.instanceId && ultramsgConfig.token) {
      // --- 1. Real UltraMsg Integration ---
      const instanceId = ultramsgConfig.instanceId;
      const token = ultramsgConfig.token;
      const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          to: cleanPhone,
          body: message,
          priority: 10
        })
      });
      const responseData = await response.json().catch(() => ({}));
      dispatchStatus = response.ok ? "SENT_ULTRAMSG" : "FAILED_ULTRAMSG";
      details = { status: response.status, data: responseData };
    } else if (isTwilio && twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.senderPhone) {
      // --- 2. Real Twilio Integration ---
      const accountSid = twilioConfig.accountSid;
      const authToken = twilioConfig.authToken;
      const twilioSender = twilioConfig.senderPhone; // e.g. "whatsapp:+14155238886"
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const twilioTo = cleanPhone.startsWith("+") ? `whatsapp:${cleanPhone}` : `whatsapp:+${cleanPhone}`;
      
      const params = new URLSearchParams();
      params.append("To", twilioTo);
      params.append("From", twilioSender);
      params.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
      const responseText = await response.text();
      dispatchStatus = response.ok ? "SENT_TWILIO" : "FAILED_TWILIO";
      details = { status: response.status, data: responseText };
    } else if (isCustom && customHttpConfig.apiEndpoint) {
      // --- 3. Custom Gateway / Webhook Integration ---
      const url = customHttpConfig.apiEndpoint;
      const method = customHttpConfig.method || "POST";
      
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.CUSTOM_WHATSAPP_HEADERS) {
        try {
          headers = { ...headers, ...JSON.parse(process.env.CUSTOM_WHATSAPP_HEADERS) };
        } catch (e) {
          console.error("Failed to parse custom whatsapp headers", e);
        }
      }

      let bodyObj: any = { to: cleanPhone, message: message };
      if (customHttpConfig.jsonBodyTemplate) {
        try {
          const bodyStr = customHttpConfig.jsonBodyTemplate
            .replace(/\{phone\}/g, cleanPhone)
            .replace(/\{message\}/g, message.replace(/"/g, '\\"').replace(/\n/g, '\\n'));
          bodyObj = JSON.parse(bodyStr);
        } catch (e) {
          console.error("Failed to parse custom body template", e);
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body: method === "GET" ? undefined : JSON.stringify(bodyObj)
      });
      const responseText = await response.text();
      dispatchStatus = response.ok ? "SENT_CUSTOM" : "FAILED_CUSTOM";
      details = { status: response.status, data: responseText };
    } else {
      dispatchStatus = "SIMULATED";
    }
  } catch (dispatchErr: any) {
    console.error("🔴 WhatsApp Send Error:", dispatchErr);
    dispatchStatus = "FAILED_GATEWAY_CRITICAL";
    details = { error: dispatchErr.toString() };
  }

  return {
    success: dispatchStatus.startsWith("SENT") || dispatchStatus === "SIMULATED",
    status: dispatchStatus,
    details
  };
}

async function startServer() {
  const app = express();

  // Cloud Run and App Engine both inject the port the process must listen on
  // and route traffic to exactly that port; a hardcoded value means the
  // container starts, passes no traffic, and times out. Falling back to 3000
  // keeps local development working when PORT is absent.
  const PORT = (() => {
    const raw = process.env.PORT;
    if (!raw) return 3000;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      throw new Error(`PORT must be a valid TCP port, received "${raw}"`);
    }
    return parsed;
  })();

  let serverDb: any = null;
  let isServerAuthReady = false;

  async function trackWebhookAttempt(
    id: string,
    name: string,
    type: 'dept' | 'service' | string,
    url: string,
    success: boolean,
    statusCode: number | string
  ) {
    if (!serverDb) return;
    try {
      const isFailure = !success || (typeof statusCode === 'number' && statusCode >= 400) || statusCode === 'ERR';
      const trackerRef = doc(serverDb, "webhook_failure_trackers", id);
      const trackerDoc = await getDoc(trackerRef);
      let currentCount = 0;
      if (trackerDoc.exists()) {
        currentCount = trackerDoc.data()?.count || 0;
      }

      if (isFailure) {
        const newCount = currentCount + 1;
        await setDoc(trackerRef, {
          id,
          name,
          type,
          url,
          count: newCount,
          lastResult: "failure",
          statusCode,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (newCount === 3) {
          // Trigger In-App Notification to supervisors (all administrators)
          const typeLabel = type === 'dept' ? '🏢 قسم إداري' : '🏡 خدمة عقارية';
          const notificationRef = doc(collection(serverDb, "notifications"));
          await setDoc(notificationRef, {
            userId: "all",
            title: "⚠️ فشل متكرر في الـ Webhook الفرعي!",
            message: `تم رصد 3 حالات فشل متتالية للـ Webhook الفرعي المبرمج لـ (${name} - ${typeLabel}).\nالرابط المتأثر: ${url}\nآخر كود استجابة: ${statusCode}.\nيرجى التحقق من استقرار اتصال النظام الخارجي مسبقاً لضمان الاستمرارية.`,
            status: "unread",
            type: "general",
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Success: reset consecutive failure count
        await setDoc(trackerRef, {
          id,
          name,
          type,
          url,
          count: 0,
          lastResult: "success",
          statusCode,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error in trackWebhookAttempt:", err);
    }
  }

  // Make sure upload directory exists and serve it statically
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve uploads as inert binary downloads.
  // - `nosniff` stops the browser from re-interpreting a file by its content.
  // - `Content-Disposition: attachment` forces a download rather than inline
  //   rendering, so an uploaded file can never execute in the site origin.
  // - `Content-Security-Policy: sandbox` is a second layer if disposition is
  //   ever dropped by a proxy.
  app.use(
    "/uploads",
    (req, res, next) => {
      const requested = path.basename(decodeURIComponent(req.path || ""));
      if (requested !== req.path?.slice(1) || requested.includes("..")) {
        return res.status(400).send("Invalid file reference");
      }
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
      res.setHeader("Content-Disposition", `attachment; filename="${requested.replace(/"/g, "")}"`);
      next();
    },
    express.static(uploadDir, { dotfiles: "deny", index: false, fallthrough: false })
  );
  // --- Global security headers + rate limiters ---
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    next();
  });
  const globalLimiter = rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "global" });
  const aiLimiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "ai" });
  const messageLimiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: "msg" });
  const uploadLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "upload" });
  const paymentLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "pay" });
  const proxyLimiter = rateLimit({ windowMs: 60_000, max: 600, keyPrefix: "proxy" });

  // Upload handling.
  // Uploads are held in memory so the real content can be validated before a
  // single byte reaches the filesystem. The previous disk-storage approach
  // trusted the client filename and extension, which allowed an attacker to
  // land an .html/.svg/.exe in a directory that was then served statically.
  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
  const storage = multer.memoryStorage();
  const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } });

  app.post("/api/upload-app", requireOperatorAuth, uploadLimiter, upload.single("appFile"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate by content. Rejects mismatched extensions, scripts, and
    // anything whose magic bytes do not match a permitted type.
    let detectedMime: string;
    try {
      detectedMime = assertAllowedUpload(req.file.buffer, req.file.originalname, req.file.mimetype);
    } catch (validateErr: any) {
      console.warn(`⛔ [UPLOAD] Rejected "${req.file.originalname}" (${req.file.mimetype}): ${validateErr.message}`);
      return res.status(415).json({ error: "unsupported_file_type", message: validateErr.message });
    }

    // Storage name is fully server-generated: the client name never reaches
    // the path, so traversal and null-byte tricks are impossible.
    const storedName = buildStoredFilename(detectedMime);
    const targetPath = path.join(uploadDir, storedName);
    if (path.dirname(path.resolve(targetPath)) !== path.resolve(uploadDir)) {
      return res.status(400).json({ error: "invalid_path" });
    }

    try {
      fs.writeFileSync(targetPath, req.file.buffer);
    } catch (writeErr: any) {
      console.error("Upload write failed:", writeErr);
      return res.status(500).json({ error: "Failed to store file" });
    }

    res.json({
      success: true,
      fileUrl: `/uploads/${storedName}`,
      size: req.file.size,
      detectedType: detectedMime,
      originalName: path.basename(req.file.originalname).slice(0, 200),
    });
  });

  // Raw body parser specifically for the proxy route to forward bytes exactly
  app.use("/api-proxy", express.raw({ type: "*/*", limit: "10mb" }));

  // JSON parser for other API endpoints
  app.use(express.json({ limit: "2mb" }));

  // Coarse limiter covering every /api/ route.
  app.use("/api/", globalLimiter);

  // Automated WhatsApp Dispatcher Endpoint
  app.post("/api/whatsapp/send", requireOperatorAuth, messageLimiter, async (req, res) => {
    const { phone, message, departmentId, serviceId } = req.body;
    let cleanPhone = (phone || "").replace(/[^0-9]/g, "");

    if (typeof message !== "string" || message.trim().length === 0 || message.length > 4096) {
      return res.status(400).json({ error: "الرسالة مطلوبة ويجب ألا تتجاوز 4096 حرف." });
    }
    if (cleanPhone.length < 8 || cleanPhone.length > 20) {
      return res.status(400).json({ error: "رقم الهاتف غير صالح." });
    }

    // Auto-prepend Syrian country code if it starts with local '09'
    if (cleanPhone.startsWith("09")) {
      cleanPhone = "963" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
      cleanPhone = "963" + cleanPhone;
    }

    const sender = process.env.SENDER_WHATSAPP_NUMBER || "0945430030";
    
    const { success, status, details } = await sendWhatsApp(cleanPhone, message, serverDb);

    console.log("\n=======================================================");
    console.log(`🟢 [AUTOMATED WHATSAPP DISPATCH GATEWAY] - ${status}`);
    console.log(`SENDER NUMBER  : ${maskPhone(sender)}`);
    console.log(`CLIENT PHONE   : ${maskPhone(cleanPhone)}`);
    console.log(`MESSAGE LENGTH : ${message.length}`);
    console.log(`STATUS_DETAILS :`, JSON.stringify(details));
    console.log("=======================================================\n");

    // Asynchronously dispatch to sub-webhooks if configured
    if (serverDb) {
      try {
        const whatsappSettingsDoc = await getDoc(doc(serverDb, "settings", "whatsapp"));
        if (whatsappSettingsDoc.exists()) {
          const settingsData = whatsappSettingsDoc.data();
          
          // 1. Department Sub-Webhook Routing
          if (departmentId && settingsData.departmentWebhooks?.[departmentId]?.enabled) {
            const deptConfig = settingsData.departmentWebhooks[departmentId];
            if (deptConfig.url) {
              let deptUrl: URL | null = null;
              try {
                deptUrl = assertSafeOutboundUrl(deptConfig.url);
              } catch (guardErr: any) {
                console.error(`⛔ [SUB-WEBHOOK] Refused unsafe department webhook target for "${departmentId}": ${guardErr.message}`);
                return res.status(400).json({ error: "unsafe_webhook_target", message: `رابط الـ Webhook للقسم غير مسموح: ${guardErr.message}` });
              }
              console.log(`🔌 [SUB-WEBHOOK ROUTING] Routing department ${departmentId} notification to third-party host: ${deptUrl!.hostname}`);
              fetch(deptUrl!.toString(), {
                method: deptConfig.method || "POST",
                headers: { "Content-Type": "application/json" },
                body: deptConfig.method === "GET" ? undefined : JSON.stringify({
                  event: "department_notification_routed",
                  departmentId,
                  phone: cleanPhone,
                  message,
                  timestamp: new Date().toISOString()
                })
              })
              .then(async (response) => {
                await trackWebhookAttempt(
                  departmentId,
                  deptConfig.name || `قسم ${departmentId}`,
                  'dept',
                  deptConfig.url,
                  response.ok,
                  response.status
                );
              })
              .catch(async (err) => {
                console.error(`Failed to route sub-webhook for department ${departmentId}:`, err);
                await trackWebhookAttempt(
                  departmentId,
                  deptConfig.name || `قسم ${departmentId}`,
                  'dept',
                  deptConfig.url,
                  false,
                  'ERR'
                );
              });
            }
          }

          // 2. Service Sub-Webhook Routing
          if (serviceId && settingsData.serviceWebhooks?.[serviceId]?.enabled) {
            const srvConfig = settingsData.serviceWebhooks[serviceId];
            if (srvConfig.url) {
              let srvUrl: URL | null = null;
              try {
                srvUrl = assertSafeOutboundUrl(srvConfig.url);
              } catch (guardErr: any) {
                console.error(`⛔ [SUB-WEBHOOK] Refused unsafe service webhook target for "${serviceId}": ${guardErr.message}`);
                return res.status(400).json({ error: "unsafe_webhook_target", message: `رابط الـ Webhook للخدمة غير مسموح: ${guardErr.message}` });
              }
              console.log(`🔌 [SUB-WEBHOOK ROUTING] Routing service ${serviceId} notification to third-party host: ${srvUrl!.hostname}`);
              fetch(srvUrl!.toString(), {
                method: srvConfig.method || "POST",
                headers: { "Content-Type": "application/json" },
                body: srvConfig.method === "GET" ? undefined : JSON.stringify({
                  event: "service_notification_routed",
                  serviceId,
                  phone: cleanPhone,
                  message,
                  timestamp: new Date().toISOString()
                })
              })
              .then(async (response) => {
                await trackWebhookAttempt(
                  serviceId,
                  srvConfig.title || `خدمة ${serviceId}`,
                  'service',
                  srvConfig.url,
                  response.ok,
                  response.status
                );
              })
              .catch(async (err) => {
                console.error(`Failed to route sub-webhook for service ${serviceId}:`, err);
                await trackWebhookAttempt(
                  serviceId,
                  srvConfig.title || `خدمة ${serviceId}`,
                  'service',
                  srvConfig.url,
                  false,
                  'ERR'
                );
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to process advanced sub-webhooks routing:", err);
      }
    }

    res.json({
      success,
      status,
      sender,
      receiver: cleanPhone,
      message,
      messageId: "wa_msg_" + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString()
    });
  });

  // Transparent Network Proxy for bypassing Syrian IP blocks.
  // Restricted to a fixed allowlist of Google/Firebase hosts. Without this the
  // endpoint is an open relay: anyone could aim it at any host on the internet
  // and the egress bandwidth would be billed to this project.
  app.all("/api-proxy/*", proxyLimiter, async (req, res) => {
    // Handle CORS preflight requests directly to avoid extra latency and potential preflight failures
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Max-Age", "86400");
      return res.sendStatus(200);
    }

    try {
      // 1. Extract target from originalUrl to preserve URL-encoding perfectly
      const targetPathWithQuery = req.originalUrl.substring("/api-proxy/".length);
      if (!targetPathWithQuery) {
        return res.status(400).send("Proxy Error: Missing target URL path");
      }

      // 2. Enforce the allowlist BEFORE any outbound socket is opened.
      const verdict = isAllowedProxyTarget(targetPathWithQuery);
      if (!verdict.ok) {
        console.warn(`⛔ [PROXY] Blocked disallowed proxy target: ${verdict.host || targetPathWithQuery.split("/")[0]}`);
        return res.status(403).json({
          error: "proxy_target_not_allowed",
          message: "This proxy only forwards to approved Google/Firebase API hosts.",
        });
      }

      const targetUrl = new URL(`https://${targetPathWithQuery}`);

      console.log(`[PROXY] Forwarding ${req.method} request to allowed host: ${verdict.host}`);

      // 3. Clone and clean incoming HTTP headers
      const headers: { [key: string]: string } = {};
      for (const [key, value] of Object.entries(req.headers)) {
        const lowerKey = key.toLowerCase();
        // Remove host & origin headers to let the destination API validate standard CORS & secure handshakes
        // Also remove accept-encoding to prevent receiving compressed data that could cause parsing issues
        if (
          lowerKey !== "host" && 
          lowerKey !== "origin" && 
          lowerKey !== "referer" && 
          lowerKey !== "content-length" &&
          lowerKey !== "accept-encoding"
        ) {
          if (typeof value === "string") {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(", ");
          }
        }
      }

      // Add a clean connection and keep-alive
      headers["connection"] = "keep-alive";

      // 4. Configure fetch options
      const hasBody = !["GET", "HEAD"].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
      const options: RequestInit = {
        method: req.method,
        headers: headers,
        body: hasBody ? new Uint8Array(req.body) : undefined,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      };

      // 5. Execute proxy call
      const response = await fetch(targetUrl, options);

      // 6. Return response status
      res.status(response.status);

      // 7. Map response headers back to the client
      response.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        // Skip chunked-encoding and content-encoding if handled on gateway layer
        if (
          lowerName !== "content-encoding" && 
          lowerName !== "transfer-encoding" && 
          lowerName !== "connection"
        ) {
          res.setHeader(name, value);
        }
      });

      // Ensure CORS headers are present so client accepts proxied response
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "*");

      // 8. Stream output buffer
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("[PROXY ERROR]:", error);
      res.status(502).send(`Gateway Proxy Error: ${error.message}`);
    }
  });

  // Gemini API Sentiment Analysis Endpoint
  app.post("/api/gemini/sentiment", aiLimiter, async (req, res) => {
    const { text } = req.body;
    if (typeof text !== "string" || text.trim().length === 0 || text.length > 5000) {
      return res.status(400).json({ success: false, error: "Text is required and must be under 5000 characters." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined. Falling back to simple heuristic rule.");
        // Fallback heuristic if key is missing
        const textLower = text.toLowerCase();
        let sentiment = "neutral";
        let reason = "تحليل كهرومغناطيسي لغوي بسيط بسبب عدم إعداد مفتاح API.";
        if (textLower.includes("مرفوض") || textLower.includes("مشكلة") || textLower.includes("تأخر") || textLower.includes("غاضب") || textLower.includes("بطيء") || textLower.includes("فشل") || textLower.includes("تعديل") || textLower.includes("لماذا") || textLower.includes("لم يتواصل")) {
          sentiment = "negative";
          reason = "الرسالة تحتوي على تعبير يعكس مشكلة أو شكوى من العميل.";
        } else if (textLower.includes("شكرا") || textLower.includes("جميل") || textLower.includes("مقبول") || textLower.includes("ممتاز") || textLower.includes("رائع") || textLower.includes("يسعدنا") || textLower.includes("بخير")) {
          sentiment = "positive";
          reason = "الرسالة تحتوي على عبارات شكر وامتنان تعبر عن الرضا.";
        } else {
          reason = "الرسالة روتينية أو استفسار عام بدون أي نبرة انفعالية واضحة.";
        }
        return res.json({ success: true, sentiment, reason });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the sentiment/tone of this client support ticket or chat message in Arabic. Return a JSON object containing two fields:
1. "sentiment": must be exactly one of the strings: "positive", "neutral", or "negative".
2. "reason": a short, concise description of the reason in Arabic (maximum 10 words).

Message to analyze: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: {
                type: Type.STRING,
                description: "Must be 'positive', 'neutral', or 'negative'."
              },
              reason: {
                type: Type.STRING,
                description: "A short Arabic sentence (under 10 words) explaining why this sentiment is chosen."
              }
            },
            required: ["sentiment", "reason"]
          }
        }
      });

      const responseText = response.text || "";
      const result = JSON.parse(responseText.trim());
      res.json({
        success: true,
        sentiment: result.sentiment,
        reason: result.reason
      });
    } catch (error: any) {
      console.error("🔴 Sentiment Analysis API Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to analyze sentiment." });
    }
  });

  // Gemini AI Decor Image Generation Endpoint
  app.post("/api/gemini/generate-decor-image", aiLimiter, async (req, res) => {
    try {
      const { roomType, style, colorScheme, customPrompt, imageBase64, aspectRatio = "1:1" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const fullPrompt = `High-end architectural photography of a luxury interior design.
Room Type: ${roomType || "Living Room"}.
Design Style: ${style || "Neoclassic Modern"}.
Color Palette: ${colorScheme || "Earthy Warm with Gold & Marble"}.
Details: ${customPrompt || "Elegant ambient warm LED strip lighting, marble flooring, high-end velvet seating, wood panelling on walls, accent lighting, ultra-detailed, photorealistic 8k studio architectural render"}.`;

      let generatedImageUrl: string | null = null;
      let aiAnalysis: any = null;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          // Prepare contents
          const parts: any[] = [];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
              }
            });
            parts.push({
              text: `Transform and redesign this interior space in style: ${style}. Room type: ${roomType}. Colors: ${colorScheme}. ${customPrompt || ''}`
            });
          } else {
            parts.push({ text: fullPrompt });
          }

          // Generate image with gemini-3.1-flash-lite-image
          const imageResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "1:1") as any
              }
            }
          });

          if (imageResponse.candidates && imageResponse.candidates[0]?.content?.parts) {
            for (const part of imageResponse.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
          }

          // Also generate a detailed design breakdown using gemini-3.6-flash
          const textAnalysisResponse = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `أنت مهندس ديكور خبير وتصميم داخلي لدى شركة البراء النعيمي للتطوير العقاري والديكور.
قم بتوزيع العناصر واستخراج تقرير هندسي كامل بلغة عربية احترافية لهذا التصميم:
نوع الغرفة: ${roomType}
النمط المعماري: ${style}
الألوان: ${colorScheme}
تفاصيل إضافية: ${customPrompt || 'لا يوجد'}

أرجع الإجابة بتنسيق JSON يحتوي الحقول التالية:
1. "materials": قائمة بـ 4 مواد أساسية مستخدمة (مثل: بديل رخام ميامي، بديل خشب الجوز، دهان جوتن مفيّف، سيراميك إسباني).
2. "lighting": نص يوضح توزيع الإضاءة (إضاءة مخفية LED، سبوتات، ثريا مودرن).
3. "furnitureList": قائمة بـ 4 قطع أثاث موصى بها مع وصف قصير للأنواع والأقمشة.
4. "estimatedCost": تقدير تكلفة المتر المربع بـ USD (مثال: "45 - 75 $ / م²").
5. "designerAdvice": نصيحة هندسية ذهبية لاستغلال المساحة بأسلوب النعيمي.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lighting: { type: Type.STRING },
                  furnitureList: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedCost: { type: Type.STRING },
                  designerAdvice: { type: Type.STRING }
                },
                required: ["materials", "lighting", "furnitureList", "estimatedCost", "designerAdvice"]
              }
            }
          });

          if (textAnalysisResponse.text) {
            try {
              aiAnalysis = JSON.parse(textAnalysisResponse.text.trim());
            } catch (pErr) {
              console.warn("Could not parse text analysis JSON:", pErr);
            }
          }

        } catch (genErr) {
          console.error("Gemini image generation attempt failed, using high-end fallback:", genErr);
        }
      }

      // Fallback curated architectural image if generated image is null
      if (!generatedImageUrl) {
        const fallbackGallery: Record<string, string> = {
          "مجلس رجال": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop",
          "صالون ضيوف": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
          "غرفة نوم رئيسية": "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop",
          "مطبخ مودرن": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop",
          "حمام ماستر": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop",
          "مكتب تنفيذي": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
          "تراس وحديقة": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop"
        };
        const defaultImg = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop";
        generatedImageUrl = fallbackGallery[roomType] || defaultImg;
      }

      if (!aiAnalysis) {
        aiAnalysis = {
          materials: ["بديل الرخام الإسباني Finiture", "ألواح بديل الخشب السويدي", "دهانات جوتن المخملية", "إضاءات LED مخفية دافئة"],
          lighting: "توزيع إضاءة ثنائية القناة: إضاءة مخفية دافئة (3000K) في الجبس بورد مع إضاءة مركزية مودرن وسبوتات موجهة.",
          furnitureList: ["طقم أثاث مخملي أوف وايت مع أطراف مذهبة", "طاولة وسط رخام ميامي بحواف ستانلس ستيل", "وحدة تلفزيون جدارية بديل خشب ورخام", "سجاد إيراني ناعم بألوان ترابية"],
          estimatedCost: "50 - 85 $ / م²",
          designerAdvice: "ينصح باعتماد الإضاءة المخفية غير المباشرة لإعطاء شعور بالاتساع والرحابة، مع دمج الرخام مع الخشب الداكن لإضفاء لمسة فخامة دفينة."
        };
      }

      res.json({
        success: true,
        imageUrl: generatedImageUrl,
        analysis: aiAnalysis,
        promptUsed: fullPrompt
      });
    } catch (err: any) {
      console.error("🔴 AI Decor Image Endpoint Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate decor image." });
    }
  });

  // --- Gemini AI General Image Generation & Editing Studio Endpoint ---
  app.post("/api/gemini/generate-edit-image", aiLimiter, async (req, res) => {
    try {
      const { prompt, imageBase64, aspectRatio = "1:1", style = "photorealistic" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const styleModifiers: Record<string, string> = {
        photorealistic: "Photorealistic 8k resolution, ultra-detailed architectural photography, studio lighting",
        "3d_render": "High-end 3D architectural render, unreal engine 5, ray tracing, architectural visualization",
        cinematic: "Cinematic lighting, dramatic shadows, moody atmospheric real estate showcase",
        minimalist: "Clean minimalist design, neutral earth tones, natural soft daylight, elegant composition",
        watercolor: "Artistic watercolor illustration, delicate architectural sketch, fine art style",
        sketch: "Precise architectural CAD sketch and blueprint line art with subtle shading"
      };

      const modifier = styleModifiers[style] || styleModifiers.photorealistic;
      const fullPrompt = `${prompt || "Luxury real estate property view"}. Style: ${modifier}.`;

      let generatedImageUrl: string | null = null;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const parts: any[] = [];
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
              }
            });
            parts.push({
              text: `Edit and transform this image according to instructions: ${prompt}. Style: ${modifier}`
            });
          } else {
            parts.push({ text: fullPrompt });
          }

          const imageResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "1:1") as any
              }
            }
          });

          if (imageResponse.candidates && imageResponse.candidates[0]?.content?.parts) {
            for (const part of imageResponse.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
                break;
              }
            }
          }
        } catch (genErr) {
          console.error("Gemini Image Studio API generation error, falling back:", genErr);
        }
      }

      if (!generatedImageUrl) {
        // Fallback curated stock architectural images
        const fallbacks = [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop"
        ];
        generatedImageUrl = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }

      res.json({
        success: true,
        imageUrl: generatedImageUrl,
        promptUsed: fullPrompt,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("🔴 AI Image Studio Endpoint Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate or edit image." });
    }
  });

  // --- Gemini AI Veo Video Generation Endpoint ---
  app.post("/api/gemini/generate-video", aiLimiter, async (req, res) => {
    try {
      const { prompt, imageBase64, aspectRatio = "16:9" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      let videoUrl: string | null = null;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const validAspectRatio = ["16:9", "9:16"].includes(aspectRatio) ? aspectRatio : "16:9";

          const videoParams: any = {
            model: "veo-3.1-fast-generate-preview",
            config: {
              aspectRatio: validAspectRatio,
              numberOfVideos: 1
            }
          };

          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            videoParams.source = {
              prompt: prompt || "Cinematic movement and animation of this architectural property view",
              image: {
                imageBytes: cleanBase64,
                mimeType: "image/jpeg"
              }
            };
          } else {
            videoParams.source = {
              prompt: prompt || "Cinematic 4k video showcase of luxury real estate property and modern architecture"
            };
          }

          let operation = await ai.models.generateVideos(videoParams);

          // Poll operation until done (max 20 attempts, 3s interval)
          let attempts = 0;
          while (!operation.done && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            operation = await ai.operations.getVideosOperation({ operation });
            attempts++;
          }

          if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            videoUrl = operation.response.generatedVideos[0].video.uri;
          }
        } catch (videoErr) {
          console.error("Gemini Veo Video Generation API error, falling back:", videoErr);
        }
      }

      if (!videoUrl) {
        const sampleVideos = [
          "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-building-with-large-windows-42998-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-luxury-pool-in-a-modern-house-42997-large.mp4",
          "https://assets.mixkit.co/videos/preview/mixkit-cozy-living-room-with-a-fireplace-43003-large.mp4"
        ];
        videoUrl = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];
      }

      res.json({
        success: true,
        videoUrl,
        aspectRatio: aspectRatio === "9:16" ? "9:16" : "16:9",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("🔴 AI Veo Video Generation Endpoint Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate video using Veo." });
    }
  });

  // Gemini AI Decor Consultant Advice Endpoint
  app.post("/api/gemini/decor-consultant", aiLimiter, async (req, res) => {
    try {
      const { roomType, dimensions, style, budget, customDetails } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          consultation: {
            title: `خطة ديكور مخصصة لـ (${roomType || 'الغرفة'})`,
            styleRecommendation: style || 'مودرن نيو كلاسيك',
            colorCodes: ['#F5F2EB (Off-White)', '#9C7C45 (Brand Gold)', '#2C3E50 (Deep Navy)', '#333333 (Charcoal)'],
            costEstimateSYP: "15,000,000 - 35,000,000 ل.س",
            costEstimateUSD: "1,000 - 2,300 $",
            keyFeatures: [
              "تركيب جدار ديكوري خشبي بأسلوب السلات الخشبية المودرن",
              "إضاءة مخفية LED شريطية متكاملة خلف الشاشة والجدران",
              "أرضيات سيراميك أو بورشيلان مقاس 120×60 سم رخامي",
              "أثاث مخصص بقماش مقاوم للبقع مع وسائد ديكورية"
            ],
            adviceText: "نوصي بالتركيز على جدار بؤري واحد (Accent Wall) خلف الشاشة أو الجلسة الرئيسية لتقليل التكلفة مع إعطاء تأثير بصري فخم ومبهر."
          }
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `أنت كبير مهندسي الديكور والتصميم الداخلي في شركة البراء النعيمي للتطوير العقاري والديكور.
قم بتقديم استشارة هندسية وديكورية متكاملة ومفصلة باللغة العربية بناءً على المدخلات التالية:
- نوع المساحة: ${roomType || 'غرفة معيشة'}
- الأبعاد / المساحة: ${dimensions || '25 متر مربع'}
- النمط المفضل: ${style || 'نيو كلاسيك مودرن'}
- مستوى الميزانية: ${budget || 'متوسطة فاخرة'}
- تفاصيل إضافية: ${customDetails || 'لا يوجد'}

يرجى إرجاع الإجابة ككائن JSON يحتوي الحقول التالية:
1. "title": عنوان استشارة جذاب ومحترف.
2. "styleRecommendation": ملخص النمط الموصى به وأسباب اختياره.
3. "colorCodes": مصفوفة بـ 4 درجات ألوان مكملة مع رموز HEX وأسمائها باللغة العربية.
4. "costEstimateSYP": تقدير التكلفة الإجمالية بالليرة السورية.
5. "costEstimateUSD": تقدير التكلفة الإجمالية بالدولار الأمريكي.
6. "keyFeatures": مصفوفة بـ 4 نقاط عمل تنفيذية للتنفيذ الميداني.
7. "adviceText": نصيحة المهندس الشاملة للعميل.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              styleRecommendation: { type: Type.STRING },
              colorCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
              costEstimateSYP: { type: Type.STRING },
              costEstimateUSD: { type: Type.STRING },
              keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
              adviceText: { type: Type.STRING }
            },
            required: ["title", "styleRecommendation", "colorCodes", "costEstimateSYP", "costEstimateUSD", "keyFeatures", "adviceText"]
          }
        }
      });

      const result = JSON.parse(response.text?.trim() || '{}');
      res.json({ success: true, consultation: result });
    } catch (err: any) {
      console.error("🔴 Decor Consultant Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate consultation." });
    }
  });

  // Gemini AI Property Recommendations Endpoint based on client profile & history
  app.post("/api/gemini/recommend-properties", aiLimiter, async (req, res) => {
    try {
      const { appointments = [], favoriteProperties = [], allProperties = [] } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          analysis: "تحليل ذكي تفاعلي لملف العميل وسجل مواعيده وعقاراته المفضلة لاقتراح أفضل الفرص الاستثمارية.",
          recommendedIds: allProperties.slice(0, 3).map((p: any) => p.id),
          reasons: { [allProperties[0]?.id || '']: "بناءً على تكرار اهتمامك بالمواقع السكنية والتجارية الفاخرة بدمشق وريفها." }
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `أنت خبير استثمار عقاري ومستشار ذكاء اصطناعي لشركة البراء النعيمي للاستثمار العقاري.
قم بتحليل ملف العميل استناداً إلى البيانات التالية:
- المواعيد المحجوزة أو السابقة: ${JSON.stringify(appointments)}
- العقارات المفضلة لدى العميل: ${JSON.stringify(favoriteProperties)}
- قائمة العقارات المتاحة في الشركة: ${JSON.stringify(allProperties.map((p: any) => ({ id: p.id, title: p.title, location: p.location, price: p.price, category: p.category, classification: p.classification, rooms: p.rooms })))}

قم باختيار أفضل 3 عقارات مناسبة لاهتمامات العميل الاستثمارية ومواعيده، وقدم تحليلاً احترافياً باللغة العربية.
أرجع الإجابة بتنسيق JSON يحتوي على:
1. "analysis": تحليل نصي ذكي ومخصص لاهتمامات العميل الاستثمارية (حدود 40 كلمة).
2. "recommendedIds": مصفوفة تحتوي على معرّفات العقارات الثلاثة المختارة (IDs).
3. "reasons": كائن يربط كل ID لعقار بسبب التوصية الخاصة به (باللغة العربية).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              recommendedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasons: { type: Type.OBJECT, properties: {}, additionalProperties: { type: Type.STRING } }
            },
            required: ["analysis", "recommendedIds", "reasons"]
          }
        }
      });

      const result = JSON.parse(response.text?.trim() || "{}");
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("🔴 Gemini Property Recommendation Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate recommendations." });
    }
  });

  // Stripe Payment Intent Endpoint
  // Stripe Payment Intent Endpoint.
  // The amount is NEVER taken from the request body. A client-supplied amount
  // lets anyone create an intent for 1 cent (or a negative/overflow value) and
  // settle a real booking for it, so the price must be resolved server-side.
  app.post("/api/payment/create-intent", paymentLimiter, async (req, res) => {
    try {
      const { appointmentId } = req.body;
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        return res.status(500).json({ error: "Stripe key not configured" });
      }
      if (!serverDb || !isServerAuthReady) {
        return res.status(503).json({ error: "Database not ready" });
      }
      if (typeof appointmentId !== "string" || appointmentId.length === 0 || appointmentId.length > 128) {
        return res.status(400).json({ error: "appointmentId is required" });
      }

      // Resolve the canonical amount from the stored appointment.
      const bookingRef = doc(serverDb, "appointments", appointmentId);
      const bookingSnap = await getDoc(bookingRef);
      if (!bookingSnap.exists()) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      const booking = bookingSnap.data() as any;

      // Prefer a server-side price; fall back to a fixed configured booking fee.
      const configuredFee = Number.parseInt(process.env.BOOKING_FEE_CENTS || "0", 10);
      const amountCents = Number.isInteger(booking.amountCents) && booking.amountCents > 0
        ? booking.amountCents
        : configuredFee;

      if (!Number.isInteger(amountCents) || amountCents <= 0) {
        return res.status(400).json({ error: "No payable amount is configured for this appointment." });
      }

      const stripe = new Stripe(key);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: process.env.STRIPE_CURRENCY || "usd",
        metadata: { appointmentId },
        automatic_payment_methods: { enabled: true },
      });
      res.json({ clientSecret: paymentIntent.client_secret, amount: amountCents, currency: process.env.STRIPE_CURRENCY || "usd" });
    } catch (error: any) {
      console.error("Payment intent creation failed:", error);
      res.status(500).json({ error: "Unable to create payment intent." });
    }
  });

  // WhatsApp Ping Endpoint (outbound request performed by the server).
  app.post("/api/whatsapp/ping", requireOperatorAuth, messageLimiter, async (req, res) => {
    const { webhookUrl, authProtocol, authValue, timeout } = req.body;
    if (!webhookUrl) return res.status(400).json({ success: false, error: "URL مطلوب" });

    // Guard against using the server as an SSRF pivot into internal hosts.
    let targetUrl: URL;
    try {
      targetUrl = assertSafeOutboundUrl(webhookUrl);
    } catch (guardErr: any) {
      return res.status(400).json({ success: false, error: `الرابط غير مسموح: ${guardErr.message}` });
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), Math.min(Number.parseInt(String(timeout), 10) || 5000, 15000));
      
      const headers: any = {};
      if (authProtocol === 'bearer' && authValue) headers['Authorization'] = `Bearer ${authValue}`;
      if (authProtocol === 'api-key' && authValue) headers['x-api-key'] = authValue;

      await fetch(targetUrl.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'error',
      });
      clearTimeout(id);
      res.json({ success: true });
    } catch (error: any) {
      res.json({ success: false, error: error.message });
    }
  });

  // Test Sub-Webhook Endpoint
  app.post("/api/whatsapp/test-sub-webhook", requireOperatorAuth, messageLimiter, async (req, res) => {
    const { id, type, url, method, departmentName, serviceTitle, message: customMessage } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "رابط الـ Webhook الفرعي مطلوب" });

    // Same SSRF guard as the live routing path: the tester must not be able to
    // reach loopback or internal addresses that the live path would refuse.
    let targetUrl: URL;
    try {
      targetUrl = assertSafeOutboundUrl(url);
    } catch (guardErr: any) {
      return res.status(400).json({ success: false, error: `الرابط غير مسموح: ${guardErr.message}` });
    }

    const targetId = id || (departmentName ? `dept_${departmentName}` : serviceTitle ? `srv_${serviceTitle}` : 'unknown_test');
    const targetType = type || (departmentName ? 'dept' : 'service');
    const targetName = departmentName || serviceTitle || 'فحص تجريبي عشوائي';

    try {
      const controller = new AbortController();
      const idTimeout = setTimeout(() => controller.abort(), 5000);
      
      const payload = {
        event: "department_notification",
        timestamp: new Date().toISOString(),
        department: departmentName || null,
        service: serviceTitle || null,
        message: customMessage || `إشعار تجريبي مخصص من نظام البراء النعيمي للتسويق العقاري لتجربة توجيه الـ Webhook الفرعي للأقسام والخدمات.`,
        data: {
          phone: "963945430030",
          status: "simulated_test"
        }
      };

      const options: any = {
        method: ["POST", "GET"].includes(String(method || "POST").toUpperCase()) ? String(method).toUpperCase() : "POST",
        signal: controller.signal,
        redirect: "error",
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Al-Baraa-Al-Nuaimi-Real-Estate-Webhook-Agent'
        }
      };

      if (options.method === 'POST') {
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(targetUrl.toString(), options);
      const text = await response.text();
      clearTimeout(idTimeout);

      await trackWebhookAttempt(
        targetId,
        targetName,
        targetType,
        url,
        response.ok,
        response.status
      );

      res.json({ 
        success: response.ok, 
        status: response.status, 
        statusText: response.statusText,
        responseText: text.substring(0, 500)
      });
    } catch (error: any) {
      await trackWebhookAttempt(
        targetId,
        targetName,
        targetType,
        url,
        false,
        'ERR'
      );
      res.json({ success: false, error: error.message });
    }
  });

  // Root health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "alnaimi-realestate-api" });
  });

  // Daily Cron Trigger Endpoints.
  // These dispatch real WhatsApp messages, so they are never public. The
  // scheduler must present INTERNAL_API_TOKEN (or an operator ADMIN_API_TOKEN).
  app.all("/api/cron/appointments-reminders", requireCronAuth, async (req, res) => {
    try {
      console.log("⚡ [API CRON TRIGGER] - Triggered via HTTP request.");
      const result = await runDailyAppointmentsCronCheck();
      res.json({
        message: "Daily appointments reminder scan executed successfully.",
        timestamp: new Date().toISOString(),
        result
      });
    } catch (err: any) {
      res.status(500).json({
        error: "Failed to execute cron-trigger via endpoint",
        message: err.message
      });
    }
  });

  app.all("/api/cron/reminders", requireCronAuth, async (req, res) => {
    try {
      console.log("⚡ [API CRON TRIGGER ALIAS] - Triggered via HTTP request.");
      const result = await runDailyAppointmentsCronCheck();
      res.json({
        message: "Daily appointments reminder scan executed successfully via alias.",
        timestamp: new Date().toISOString(),
        result
      });
    } catch (err: any) {
      res.status(500).json({
        error: "Failed to execute cron-trigger via endpoint alias",
        message: err.message
      });
    }
  });

// Vite integration for development vs. production
if (process.env.NODE_ENV !== "production") {
  // Imported lazily on purpose. Vite is a dev dependency, and the production
  // image runs `npm prune --omit=dev`, so a top-level `import ... from "vite"`
  // would make the whole bundle throw "Cannot find module 'vite'" before the
  // server could listen. The symptom was a container that never started and
  // a public domain that answered 404 on every path.
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      // A tunnel or a preview host arrives with its own Host header. Without
      // this, Vite answers "Blocked request" for every HTML and asset request
      // even though the API routes keep working.
      allowedHosts: true,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
  console.log("[SERVER] Vite dev middlewear mounted successfully.");
} else {
  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  // Without this the process would start, fail every request for a file that
  // was never copied into the image, and the only symptom in the logs would be
  // 404s from real visitors.
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `NODE_ENV=production but ${indexPath} is missing. The image was built without ` +
        "the client bundle; run the build stage before starting the server."
    );
  }

  // A service worker is only ever updated when the browser fetches it again.
  // If it is served from cache, an already-installed app keeps running the old
  // code forever, so these two files must never be cached.
  app.use((req, res, next) => {
    if (req.path === "/sw.js" || req.path === "/manifest.json") {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      // Registered from the site root, so it may control the whole origin.
      if (req.path === "/sw.js") res.setHeader("Service-Worker-Allowed", "/");
    }
    next();
  });

  // The site must be deployable to a new host without an edit: canonical, og:url,
  // JSON-LD, robots and sitemap all use the host this request arrived at, so the
  // AI Studio preview URL that used to be hardcoded can never leak into search.
  const serveWithOrigin = (req: express.Request, res: express.Response, file: string, type: string) => {
    const p = path.join(distPath, file);
    if (!fs.existsSync(p)) return res.status(404).end();
    const body = fs.readFileSync(p, "utf8").split("__SITE_ORIGIN__").join("https://" + req.get("host")!);
    res.setHeader("Content-Type", type + "; charset=UTF-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(body);
  };

  app.get(["/", "/robots.txt", "/sitemap.xml"], (req, res) => {
    if (req.path === "/robots.txt") return serveWithOrigin(req, res, "robots.txt", "text/plain");
    if (req.path === "/sitemap.xml") return serveWithOrigin(req, res, "sitemap.xml", "application/xml");
    serveWithOrigin(req, res, "index.html", "text/html");
  });

  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    serveWithOrigin(req, res, "index.html", "text/html");
  });
  console.log(`[SERVER] Static files served in Production Mode from ${distPath}.`);
}


  // --- AUTOMATED WhatsApp 24-Hour Reminder Worker ---
  serverDb = null;
  isServerAuthReady = false;

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      
      const clientApp = initializeClientApp(firebaseConfig);
      const clientAuth = getClientAuth(clientApp);
      serverDb = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);

      // Service account for the background reminder workers.
      // These credentials were previously hardcoded in this file, which meant
      // anyone with a copy of the source (or the built bundle) had full admin
      // access to the project. They are now read from the environment and the
      // account is never auto-provisioned, so a leaked copy of the repo is
      // worthless on its own.
      const serverEmail = process.env.FIREBASE_SERVICE_EMAIL;
      const serverPass = process.env.FIREBASE_SERVICE_PASSWORD;

      if (!serverEmail || !serverPass) {
        console.warn(
          "⚠️ [SERVER APPLET] FIREBASE_SERVICE_EMAIL / FIREBASE_SERVICE_PASSWORD are not set. " +
          "Automated WhatsApp reminders are DISABLED. See docs/DEPLOYMENT.md to provision the service account."
        );
      } else {
        const attemptAuth = async () => {
          try {
            const userCredential = await signInWithEmailAndPassword(clientAuth, serverEmail, serverPass);

            // Ensure the user profile exists in Firestore FIRST
            const uid = userCredential.user.uid;
            const userDocRef = doc(serverDb, "users", uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              await setDoc(userDocRef, {
                uid,
                email: serverEmail,
                name: "Server Reminder Admin",
                role: "admin",
                createdAt: new Date().toISOString()
              });
              console.log("🟢 [SERVER APPLET] Created missing server admin user profile in Firestore.");
            }

            isServerAuthReady = true;
            console.log("🟢 [SERVER APPLET] Reminder Worker authenticated and profile verified as admin successfully.");
          } catch (authErr: any) {
            if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential" || authErr.code === "auth/invalid-email" || authErr.message?.includes("INVALID_LOGIN_CREDENTIALS")) {
              console.error(
                "🔴 [SERVER APPLET] Service account could not sign in. It is NOT created automatically; " +
                "create it once in Firebase Console > Authentication and set FIREBASE_SERVICE_EMAIL/PASSWORD."
              );
            } else {
              console.error("🔴 [SERVER APPLET] Firebase sign-in failed:", authErr?.code || authErr);
            }
          }
        };

        // Run auth in background to avoid blocking server startup (e.g. on slow connections or when blocked by firewalls)
        attemptAuth().catch((err) => {
          console.error("🔴 [SERVER APPLET] background auth failed:", err);
        });
      }
    }
  } catch (fbInitErr) {
    console.error("🔴 [SERVER APPLET] Firebase initialization failed in server.ts:", fbInitErr);
  }

  async function runDailyAppointmentsCronCheck() {
    if (!serverDb || !isServerAuthReady) {
      console.log("⚠️ [DAILY CRON WORKER] Database or Auth not ready, skipping check.");
      return { success: false, error: "Database or Auth not ready" };
    }

    console.log("🕒 [DAILY CRON WORKER] - Starting Scheduled Daily Appointments Scan...");
    const sentList: any[] = [];
    const errors: any[] = [];

    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      const tomorrowStr = `${yyyy}-${mm}-${dd}`;

      const snapshot = await getDocs(collection(serverDb, "appointments"));

      for (const docSnap of snapshot.docs) {
        const app = docSnap.data();
        const id = docSnap.id;
        const appDateStr = app.date;
        const appTimeStr = app.time || "12:00";

        if (!appDateStr) continue;

        const appDate = new Date(`${appDateStr}T${appTimeStr}:00`);
        const diffMs = appDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        const isTomorrow = appDateStr === tomorrowStr;
        const isWithin24hWindow = diffHours > 0 && diffHours <= 30;

        if (
          (isTomorrow || isWithin24hWindow) &&
          app.status !== "cancelled" &&
          app.clientPhone &&
          app.reminderSent !== true
        ) {
          console.log(`⏰ [DAILY CRON WORKER] - Found appointment ${id} for client: ${app.clientName} scheduled on ${app.date} (in ${diffHours.toFixed(1)}h) needing reminder.`);

          const messageText = `مرحباً سيد/ة ${app.clientName}،\n\nنود تذكيركم بموعدكم المجدول غداً بتاريخ ${app.date} في تمام الساعة ${app.time} لـ "${app.serviceTitle || 'معاينة عقارية'}" .\n\nنتطلع للقائكم قريباً! في حال رغبتكم بتأكيد الموعد أو تعديله، يرجى الرد على هذه الرسالة.\n\nشركة البراء النعيمي للتطوير العقاري 🇸🇾`;

          let cleanPhone = (app.clientPhone || "").replace(/[^0-9]/g, "");
          if (cleanPhone.startsWith("09")) {
            cleanPhone = "963" + cleanPhone.substring(1);
          } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
            cleanPhone = "963" + cleanPhone;
          }

          let dispatchStatus = "SIMULATED";
          try {
            const { success: isSent, status: sentStatus } = await sendWhatsApp(cleanPhone, messageText, serverDb);
            dispatchStatus = sentStatus;
          } catch (sendErr: any) {
            console.error("🔴 [DAILY CRON WORKER] WhatsApp send failed:", sendErr);
            dispatchStatus = "FAILED_SEND";
            errors.push({ appointmentId: id, clientName: app.clientName, error: sendErr.message });
          }

          await updateDoc(doc(serverDb, "appointments", id), {
            reminderSent: true,
            reminderSentAt: new Date().toISOString()
          });

          try {
            const newLogDoc = doc(collection(serverDb, "whatsapp_logs"));
            await setDoc(newLogDoc, {
              id: newLogDoc.id,
              sender: "0945430030",
              receiverName: app.clientName,
              receiverPhone: app.clientPhone,
              receiverEmail: app.clientEmail || "غير محدد",
              message: messageText,
              status: "success",
              createdAt: new Date().toISOString(),
              type: "reminder_24h_cron_daily",
              dispatchMethod: dispatchStatus
            });
          } catch (logErr) {
            console.error("🔴 Failed to write automated log to Firestore:", logErr);
          }

          sentList.push({
            appointmentId: id,
            clientName: app.clientName,
            clientPhone: cleanPhone,
            diffHours: diffHours.toFixed(2),
            status: dispatchStatus
          });
        }
      }

      console.log(`💚 [DAILY CRON WORKER] Scheduled Daily Scan completed. Dispatched: ${sentList.length} reminders.`);
      return { success: true, processed: sentList.length, dispatched: sentList, errors };
    } catch (err: any) {
      console.error("🔴 [DAILY CRON WORKER] Error in scheduled daily cron scanner:", err);
      return { success: false, error: err.message };
    }
  }

  async function runAutomaticRemindersCheck() {
    if (!serverDb || !isServerAuthReady) {
      console.log("⚠️ [SERVER APPLET REMINDER WORKER] - Database or Auth not ready, skipping check.");
      return;
    }

    console.log("🕒 [SERVER APPLET REMINDER WORKER] - Running Automatic WhatsApp Reminders Check (24h Confirmed & 6h Unconfirmed Manual)...");

    try {
      const waSettingsDoc = await getDoc(doc(serverDb, "settings", "whatsapp"));
      const waSettings = waSettingsDoc.exists() ? waSettingsDoc.data() : {};
      const reminderThreshold = parseFloat(waSettings.reminderThresholdHours || '24');

      const snapshot = await getDocs(collection(serverDb, "appointments"));
      const now = new Date();

      for (const docSnap of snapshot.docs) {
        const app = docSnap.data();
        const id = docSnap.id;
        const appDateStr = app.date;
        const appTimeStr = app.time || "12:00";

        if (!appDateStr) continue;

        // Parse appointment date-time
        const appDate = new Date(`${appDateStr}T${appTimeStr}:00`);
        const diffMs = appDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // 1. Regular Automatic Reminder (Confirmed + whatsappReminder enabled)
        if (
          app.status === "confirmed" &&
          app.whatsappReminder === true &&
          app.clientPhone &&
          app.reminderSent !== true &&
          diffHours > 0 &&
          diffHours <= reminderThreshold
        ) {
          console.log(`⏰ [SERVER APPLET REMINDER WORKER] - Found appointment needing ${reminderThreshold}h reminder: ${id} for client: ${app.clientName} scheduled on ${app.date} inside ${diffHours.toFixed(1)} hours.`);

          const messageText = `مرحباً سيد/ة ${app.clientName}،\n\nنود تذكيركم بموعد المعاينة العقارية لمشروعكم/عقاركم: "${app.serviceTitle || 'معاينة عقارية'}" المجدول بتاريخ ${app.date} في تمام الساعة ${app.time}.\n\nنتطلع للقائكم قريباً! في حال وجود أي استفسار، لا تتردد بالرد على هذه الرسالة.\n\nشركة البراء النعيمي للتطوير العقاري 🇸🇾`;

          // Clean phone number
          let cleanPhone = (app.clientPhone || "").replace(/[^0-9]/g, "");
          if (cleanPhone.startsWith("09")) {
            cleanPhone = "963" + cleanPhone.substring(1);
          } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
            cleanPhone = "963" + cleanPhone;
          }

          console.log(`📡 [SERVER APPLET REMINDER WORKER] - Dispatching automated WhatsApp message to ${maskPhone(cleanPhone)}...`);

          let dispatchStatus = "SIMULATED";
          try {
            const { success: isSent, status: sentStatus } = await sendWhatsApp(cleanPhone, messageText, serverDb);
            dispatchStatus = sentStatus;
          } catch (sendErr) {
            console.error("🔴 [SERVER APPLET REMINDER WORKER] WhatsApp send failed:", sendErr);
            dispatchStatus = "FAILED_SEND";
          }

          // Update appointment in Firestore
          await updateDoc(doc(serverDb, "appointments", id), {
            reminderSent: true,
            reminderSentAt: new Date().toISOString()
          });

          // Insert log into whatsapp_logs
          try {
            const newLogDoc = doc(collection(serverDb, "whatsapp_logs"));
            await setDoc(newLogDoc, {
              id: newLogDoc.id,
              sender: "0945430030",
              receiverName: app.clientName,
              receiverPhone: app.clientPhone,
              receiverEmail: app.clientEmail || "غير محدد",
              message: messageText,
              status: "success",
              createdAt: new Date().toISOString(),
              type: "reminder_24h_auto",
              dispatchMethod: dispatchStatus
            });
          } catch (logErr) {
            console.error("🔴 Failed to write automated log to Firestore:", logErr);
          }

          console.log(`💚 [SERVER APPLET REMINDER WORKER] - Successfully sent automatic reminder to ${app.clientName} (Phone: ${maskPhone(cleanPhone)})!`);
        }

        // 2. New 6-hour Manual Reminder for Unconfirmed Appointments
        if (
          app.sixHourManualReminder === true &&
          app.sixHourReminderSent !== true &&
          app.status !== "confirmed" &&
          app.clientPhone &&
          diffHours > 0 &&
          diffHours <= 6
        ) {
          console.log(`⏰ [SERVER APPLET REMINDER WORKER] - Found appointment needing manual 6-hour reminder: ${id} scheduled on ${app.date} inside ${diffHours.toFixed(1)} hours.`);

          const messageText = `⚠️ تنبيه تذكيري عاجل من شركة البراء النعيمي للتطوير العقاري 🏛️\n\nعزيزنا العميل ${app.clientName}،\n\nنود إعلامكم بتفاصيل موعد المعاينة العقارية المجدول بعد حوالي 6 ساعات:\n📌 الخدمة/العقار: "${app.serviceTitle || 'معاينة عقارية مخصصة'}"\n📅 التاريخ: ${app.date}\n⏰ الوقت: ${app.time}\n\n⚠️ نظراً لعدم تأكيد الموعد بشكل نهائي من قبل الطرفين حتى الآن، يرجى الاستجابة الفورية لهذه الرسالة أو التواصل معنا لتأكيد وتثبيت حضوركم.\n\nنتمنى لكم يوماً سعيداً وننتظر تأكيدكم! 🤝`;

          // Clean phone number
          let cleanPhone = (app.clientPhone || "").replace(/[^0-9]/g, "");
          if (cleanPhone.startsWith("09")) {
            cleanPhone = "963" + cleanPhone.substring(1);
          } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
            cleanPhone = "963" + cleanPhone;
          }

          console.log(`📡 [SERVER APPLET REMINDER WORKER] - Dispatching manual 6-hour confirmation alert to ${maskPhone(cleanPhone)}...`);

          let dispatchStatus = "SIMULATED";
          try {
            const { success: isSent, status: sentStatus } = await sendWhatsApp(cleanPhone, messageText, serverDb);
            dispatchStatus = sentStatus;
          } catch (sendErr) {
            console.error("🔴 [SERVER APPLET REMINDER WORKER] Manual 6h WhatsApp send failed:", sendErr);
            dispatchStatus = "FAILED_SEND";
          }

          // Update appointment in Firestore
          await updateDoc(doc(serverDb, "appointments", id), {
            sixHourReminderSent: true,
            sixHourReminderSentAt: new Date().toISOString()
          });

          // Insert log into whatsapp_logs
          try {
            const newLogDoc = doc(collection(serverDb, "whatsapp_logs"));
            await setDoc(newLogDoc, {
              id: newLogDoc.id,
              sender: "0945430030",
              receiverName: app.clientName,
              receiverPhone: app.clientPhone,
              receiverEmail: app.clientEmail || "غير محدد",
              message: messageText,
              status: "success",
              createdAt: new Date().toISOString(),
              type: "reminder_6h_manual",
              dispatchMethod: dispatchStatus
            });
          } catch (logErr) {
            console.error("🔴 Failed to write manual 6h log to Firestore:", logErr);
          }

          console.log(`💚 [SERVER APPLET REMINDER WORKER] - Successfully sent manual 6-hour reminder to ${app.clientName} (Phone: ${maskPhone(cleanPhone)})!`);
        }
      }

      // --- NEW: 6-hour Broker Task Deadline Automatic Alerts ---
      console.log("🕒 [SERVER APPLET TASK WORKER] - Running Broker Task 6-hour Deadline Alerts Check...");
      try {
        const brokersSnapshot = await getDocs(collection(serverDb, "brokers"));
        for (const brokerDoc of brokersSnapshot.docs) {
          const broker = brokerDoc.data();
          const brokerId = brokerDoc.id;
          const tasks = broker.tasks || [];
          let hasChanges = false;

          for (const task of tasks) {
            if (task.status === "in_progress" && task.dueDate) {
              const taskDueDate = new Date(task.dueDate);
              const diffMs = taskDueDate.getTime() - now.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);

              if (diffHours > 0 && diffHours <= 6 && task.sixHourDeadlineAlertSent !== true) {
                console.log(`⏰ [SERVER APPLET TASK WORKER] - Task "${task.title}" for broker ${broker.name} is due in ${diffHours.toFixed(1)} hours. Dispatching alert...`);

                const brokerPhone = broker.phone;
                if (brokerPhone) {
                  const messageText = `⚠️ تنبيه عاجل للمندوب/الوسيط: ${broker.name || 'الوسيط العقاري'}\n\nنود تذكيرك بالموعد النهائي المتبقي له أقل من 6 ساعات لإنجاز المهمة الميدانية المسندة إليك:\n📌 المهمة: "${task.title}"\n⏰ الموعد النهائي: ${new Date(task.dueDate).toLocaleString('ar-SY')}\n\nيرجى العمل على إنجاز المهمة وتحديث حالتها إلى "مكتملة" في النظام وتوثيقها لتجنب التأخير. شكراً لجهودكم!\n\nإدارة شركة البراء النعيمي للتطوير العقاري 🇸🇾`;

                  let cleanPhone = brokerPhone.replace(/[^0-9]/g, "");
                  if (cleanPhone.startsWith("09")) {
                    cleanPhone = "963" + cleanPhone.substring(1);
                  } else if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
                    cleanPhone = "963" + cleanPhone;
                  }

                  let dispatchStatus = "SIMULATED";
                  try {
                    const { success: isSent, status: sentStatus } = await sendWhatsApp(cleanPhone, messageText, serverDb);
                    dispatchStatus = sentStatus;
                  } catch (sendErr) {
                    console.error("🔴 [SERVER APPLET TASK WORKER] WhatsApp send failed:", sendErr);
                    dispatchStatus = "FAILED_SEND";
                  }

                  task.sixHourDeadlineAlertSent = true;
                  task.sixHourDeadlineAlertSentAt = new Date().toISOString();
                  hasChanges = true;

                  try {
                    const newLogDoc = doc(collection(serverDb, "whatsapp_logs"));
                    await setDoc(newLogDoc, {
                      id: newLogDoc.id,
                      sender: "0945430030",
                      receiverName: broker.name,
                      receiverPhone: broker.phone,
                      receiverEmail: broker.email || "غير محدد",
                      message: messageText,
                      status: "success",
                      createdAt: new Date().toISOString(),
                      type: "broker_task_6h_alert",
                      dispatchMethod: dispatchStatus
                    });
                  } catch (logErr) {
                    console.error("🔴 Failed to write broker task alert log:", logErr);
                  }
                }
              }
            }
          }

          if (hasChanges) {
            await updateDoc(doc(serverDb, "brokers", brokerId), {
              tasks: tasks
            });
          }
        }
      } catch (brokerErr) {
        console.error("🔴 [SERVER APPLET TASK WORKER] Error during broker task alert check:", brokerErr);
      }
    } catch (err) {
      console.error("🔴 [SERVER APPLET REMINDER WORKER] Error in automatic checker:", err);
    }
  }

  if (serverDb) {
    // Run automatic checks every 5 minutes
    setInterval(runAutomaticRemindersCheck, 5 * 60 * 1000);
    // Also run first check after 10 seconds of startup
    setTimeout(runAutomaticRemindersCheck, 10000);

    // Schedule the daily cron-like job triggered by the system
    // Running daily at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("🕒 [CRON] Daily scheduled appointment reminder scan running...");
      await runDailyAppointmentsCronCheck();
    });

    // Also trigger a cron check 30 seconds after startup for validation
    setTimeout(async () => {
      console.log("🕒 [CRON] Running initial startup check for daily reminders...");
      await runDailyAppointmentsCronCheck();
    }, 30000);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[START] Full-stack Server is running smoothly on port ${PORT}`);
  });
}

startServer();
