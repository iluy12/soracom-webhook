const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

// בדיקת חיים
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// נקודת הקליטה של Soracom
app.post("/soracom", (req, res) => {
  const data = req.body || {};

  console.log("===== SORACOM EVENT =====");
  console.log("Time:", new Date().toISOString());
  console.log("Data:", data);

  res.status(200).json({ ok: true });
});

// הפעלה
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
