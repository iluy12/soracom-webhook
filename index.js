const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Env vars
const MAKE_TOKEN = process.env.MAKE_TOKEN;         // חייב להיות קיים ב-Render
const ZADARMA_KEY = process.env.ZADARMA_KEY;
const ZADARMA_SECRET = process.env.ZADARMA_SECRET;

// ---------- Helpers ----------
function buildQuery(params) {
  const keys = Object.keys(params).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
    .join("&");
}

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function zadarmaSignature(data, secret) {
  const hmacHex = crypto.createHmac("sha1", secret).update(data).digest("hex");
  return Buffer.from(hmacHex, "utf8").toString("base64");
}


// ---------- Debug endpoints (חשוב) ----------
app.get("/health", (req, res) => {
  res.status(200).send("OK - new code is running");
});

app.get("/debug", (req, res) => {
  // לא חושפים ערכים, רק האם הם קיימים
  res.json({
    ok: true,
    hasMAKE_TOKEN: Boolean(MAKE_TOKEN),
    hasZADARMA_KEY: Boolean(ZADARMA_KEY),
    hasZADARMA_SECRET: Boolean(ZADARMA_SECRET),
    makeTokenLength: MAKE_TOKEN ? MAKE_TOKEN.length : 0,
  });
});

// ---------- Main endpoint ----------
app.post("/zadarma/callback", async (req, res) => {
  try {
    // 1) בדיקת טוקן
    const incomingToken = req.header("x-make-token") || "";

    if (!MAKE_TOKEN) {
      return res.status(500).json({
        ok: false,
        error: "MAKE_TOKEN env missing on server",
      });
    }

    if (incomingToken !== MAKE_TOKEN) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized (token mismatch)",
        gotLength: incomingToken.length,
        expectedLength: MAKE_TOKEN.length,
      });
    }

    // 2) בדיקת פרמטרים
  const from = req.body?.from;
const to = req.body?.to;


    if (!from || !to) {
      return res.status(400).json({ ok: false, error: "Missing from/to" });
    }

    if (!ZADARMA_KEY || !ZADARMA_SECRET) {
      return res.status(500).json({
        ok: false,
        error: "Missing ZADARMA_KEY or ZADARMA_SECRET env vars",
      });
    }

    // 3) קריאה ל-Zadarma עם חתימה
    const methodPath = "/v1/request/callback/";
const paramsStr = buildQuery({ from, to, pbx: 1 });

    const dataToSign = methodPath + paramsStr + md5(paramsStr);
const signature = zadarmaSignature(dataToSign, ZADARMA_SECRET);

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

    // מחזירים ללקוח את מה שזדרמה החזירה (כדי לראות אם זה הצליח)
    return res.status(r.status).send(text);
  } catch (e) {
    console.error("zadarma/callback error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// Render port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on", port));
