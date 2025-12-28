const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

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
