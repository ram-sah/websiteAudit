// const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const Handlebars = require("handlebars");
const { renderReportToString } = require("./generate-report");

const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// ✅ Slugify helper to clean up file names
const slugify = (str) =>
  (str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-");

app.use(bodyParser.json());

// ✅ Serve static assets
app.use("/reports", express.static(path.join(__dirname, "reports")));
app.use(
  "/shared-assets",
  express.static(path.join(__dirname, "shared-assets"))
);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Audit server is running");
});

// 🔁 Zapier trigger: Generate static HTML
app.post("/generate-audit", (req, res) => {
  const inputJSON = JSON.stringify(req.body);
  const generate = spawn("node", ["generate-report.js"]);

  generate.stdin.write(inputJSON);
  generate.stdin.end();

  generate.on("close", (code) => {
    if (code === 0) {
      try {
        const slug = slugify(req.body.company_name || "client");
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `${slug}-${date}.html`;
        const fullUrl = `https://${req.headers.host}/reports/${fileName}`;

        console.log("✅ Report ready at:", fullUrl);
        res.status(200).json({
          message: "✅ Audit report generated",
          reportUrl: fullUrl,
        });
      } catch (err) {
        res.status(500).send("✅ Generated but URL build failed");
      }
    } else {
      res.status(500).send("❌ Report generation failed");
    }
  });

  generate.on("error", (err) => {
    console.error("❌ spawn error:", err);
    res.status(500).send("❌ Internal error");
  });
});

// 📄 Dynamic HTML view via Airtable (live rendering)
app.get("/reports/:slug", async (req, res) => {
  const slug = decodeURIComponent(req.params.slug);

  try {
    const encodedFormula = encodeURIComponent(`{report_slug}="${slug}"`);
    const airtableURL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodedFormula}`;

    const response = await axios.get(airtableURL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    const records = response.data.records;
    if (records.length === 0) {
      return res.status(404).send("Report not found in Airtable");
    }

    const data = records[0].fields;
    const html = await renderReportToString(data);
    res.send(html);
  } catch (error) {
    console.error("Error rendering dynamic report:", error.message);
    res.status(500).send("Error generating dynamic report");
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

//working code trying to update, and slug =================

// const express = require("express");
// const bodyParser = require("body-parser");
// const { spawn } = require("child_process");
// const path = require("path");

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(bodyParser.json());

// // ✅ Static file hosting
// app.use("/reports", express.static(path.join(__dirname, "reports")));
// app.use(
//   "/shared-assets",
//   express.static(path.join(__dirname, "shared-assets"))
// );

// // 🧪 Health check
// app.get("/", (req, res) => {
//   res.send("✅ Audit server is running");
// });

// // 🔁 Main endpoint
// app.post("/generate-audit", (req, res) => {
//   const inputJSON = JSON.stringify(req.body);
//   const generate = spawn("node", ["generate-report.js"]);

//   generate.stdin.write(inputJSON);
//   generate.stdin.end();

//   generate.on("close", (code) => {
//     if (code === 0) {
//       try {
//         const slug = (req.body.company_name || "client")
//           .replace(/\s+/g, "-")
//           .toLowerCase();
//         const date = new Date().toISOString().slice(0, 10);
//         const fileName = `${slug}-${date}.html`;
//         const fullUrl = `https://${req.headers.host}/reports/${fileName}`;

//         console.log("✅ Report ready at:", fullUrl);
//         res.status(200).json({
//           message: "✅ Audit report generated",
//           reportUrl: fullUrl,
//         });
//       } catch (err) {
//         res.status(500).send("✅ Generated but URL build failed");
//       }
//     } else {
//       res.status(500).send("❌ Report generation failed");
//     }
//   });

//   generate.on("error", (err) => {
//     console.error("❌ spawn error:", err);
//     res.status(500).send("❌ Internal error");
//   });
// });

// // 🚀 Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

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
