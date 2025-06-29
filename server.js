const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Serve /reports as public URLs
app.use("/reports", express.static(path.join(__dirname, "reports")));

// 🔍 Health check
app.get("/", (req, res) => {
  res.send("✅ Audit server is running");
});

// 🎯 Main endpoint for Zapier
app.post("/generate-audit", (req, res) => {
  const inputJSON = JSON.stringify(req.body);

  const generate = spawn("node", ["generate-report.js"]);
  generate.stdin.write(inputJSON);
  generate.stdin.end();

  generate.on("close", (code) => {
    if (code === 0) {
      const slug = (req.body.company_name || "client")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `${slug}-${date}.html`;
      const fullUrl = `https://${req.headers.host}/reports/${fileName}`;

      console.log("✅ Report ready at:", fullUrl);
      res.status(200).json({
        message: "✅ Audit report generated",
        reportUrl: fullUrl,
      });
    } else {
      res.status(500).send("❌ Report generation failed");
    }
  });

  generate.on("error", (err) => {
    console.error("❌ Failed to spawn report generator:", err);
    res.status(500).send("❌ Error generating report");
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// const express = require("express");
// const bodyParser = require("body-parser");
// const { spawn } = require("child_process");
// const path = require("path");

// const app = express();
// app.use(bodyParser.json());

// // ✅ Serve all files in root
// app.use("/reports", express.static(path.join(__dirname, "reports")));
// app.use(
//   "/shared-assets",
//   express.static(path.join(__dirname, "shared-assets"))
// );

// app.post("/generate-audit", (req, res) => {
//   console.log("✅ Received POST from Zapier:", req.body);

//   const inputJSON = JSON.stringify(req.body);
//   const generate = spawn("node", ["generate-report.js"]);

//   generate.stdin.write(inputJSON);
//   generate.stdin.end();

//   generate.on("close", (code) => {
//     console.log(`Report generated. Exit code: ${code}`);
//     res.status(200).send("✅ Audit report generated");
//   });
// });

// app.get("/", (req, res) => {
//   res.send("✅ Audit Report Generator is running. POST to /generate-audit");
// });

// app.listen(3000, () => {
//   console.log("Server running at http://localhost:3000");
// });

// ==================
// const express = require("express");
// const bodyParser = require("body-parser");
// const { spawn } = require("child_process");
// const fs = require("fs");

// const app = express();
// app.use(bodyParser.json());
// app.use(express.static(__dirname));

// app.post("/generate-audit", (req, res) => {
//   const inputJSON = JSON.stringify(req.body);

//   const generate = spawn("node", ["generate-report.js"]);

//   generate.stdin.write(inputJSON);
//   generate.stdin.end();

//   generate.on("close", (code) => {
//     console.log(`Report generated. Exit code: ${code}`);
//     res.status(200).send("✅ Audit report generated");
//   });
// });

// app.listen(3000, () => {
//   console.log("Server running at http://localhost:3000");
// });
