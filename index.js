const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.status(200).send("OK"));

app.post("/soracom", (req, res) => {
  console.log("---- SORACOM EVENT ----");
  console.log("headers:", req.headers);
  console.log("body:", req.body);
  res.status(200).json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on " + port));
