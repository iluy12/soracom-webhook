const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

const crypto = require("crypto");

// משתנים מתוך Render (Environment)
const ZADARMA_KEY = process.env.ZADARMA_KEY;       // ה-Key מ-Zadarma
const ZADARMA_SECRET = process.env.ZADARMA_SECRET; // ה-Secret מ-Zadarma
const MAKE_TOKEN = process.env.MAKE_TOKEN;         // סיסמה קטנה שלנו, למנוע ניצול

function buildQuery(params) {
  const keys = Object.keys(params).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function hmacSha1Base64(data, secret) {
  return crypto.createHmac("sha1", secret).update(data).digest("base64");
}

// Endpoint שמייק יקרא אליו
app.post("/zadarma/callback", async (req, res) => {
  try {
    // הגנה בסיסית: רק Make שמכיר את הטוקן יכול להפעיל שיחות
    const token = req.header("x-make-token");
    if (!MAKE_TOKEN || token !== MAKE_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (!ZADARMA_KEY || !ZADARMA_SECRET) {
      return res.status(500).json({ ok: false, error: "Missing ZADARMA_KEY or ZADARMA_SECRET" });
    }

    const from = req.body?.from;
    const to = req.body?.to;

    // Zadarma רוצה מספרים בלי +, לדוגמה 9725XXXXXXXX
    if (!from || !to) {
      return res.status(400).json({ ok: false, error: "Missing from/to" });
    }

    const methodPath = "/v1/request/callback/";
    const paramsStr = buildQuery({ from, to });

    // חתימה לפי שיטת Zadarma: methodPath + params + md5(params)
    const dataToSign = methodPath + paramsStr + md5(paramsStr);
    const signature = hmacSha1Base64(dataToSign, ZADARMA_SECRET);

    // Authorization בפורמט ש-Zadarma מצפה לו
    const authHeader = `${ZADARMA_KEY}:${signature}`;

    const url = `https://api.zadarma.com${methodPath}`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": authHeader,
      },
      body: paramsStr,
    });

    const text = await r.text();
    return res.status(r.status).send(text);
  } catch (e) {
    console.log("❌ zadarma callback error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// בדיקת חיים
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// קליטת אירוע מכפתור Soracom
app.post("/soracom", (req, res) => {
  const now = new Date();

  const event = {
    receivedAt: now.toISOString(),      // זמן קבלה
    receivedTimestamp: now.getTime(),   // זמן קבלה (מספר)
    imsi: req.body?.imsi || null,
    iccid: req.body?.iccid || null,
    data: req.body || {},

    // שדות לעתיד
    status: "NEW",                      // NEW / IN_PROGRESS / CLOSED
    handler: null,                      // מי טיפל
    handledAt: null,
    closedAt: null,
    handlingDurationSec: null
  };

  console.log("🚨 NEW BUTTON EVENT");
  console.log(event);

  res.status(200).json({ ok: true });
});

// הפעלת השרת
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});


