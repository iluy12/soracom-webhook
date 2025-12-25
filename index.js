const express = require("express");
const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.send("OK"));

app.post("/soracom", (req, res) => {
  const { imsi, iccid, event, timestamp } = req.body || {};

  if (!imsi) {
    console.log("❌ No IMSI received", req.body);
    return res.status(400).json({ ok: false });
  }

  console.log("🟢 BUTTON EVENT");
  console.log({
    imsi,
    iccid,
    event,
    time: timestamp || new Date().toISOString()
  });

  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on " + port));
