// const fs = require("fs");
// const path = require("path");

// process.stdin.setEncoding("utf8");

// let data = "";

// process.stdin.on("data", (chunk) => {
//   data += chunk;
// });

// process.stdin.on("end", () => {
//   try {
//     console.log("📥 Raw input received.");
//     const parsed = JSON.parse(data);
//     console.log("✅ Parsed JSON:", parsed);

//     // Load template
//     const templatePath = path.join(__dirname, "templates", "audit-report.html");
//     console.log("📄 Reading template from:", templatePath);

//     if (!fs.existsSync(templatePath)) {
//       console.error("❌ Template file does not exist!");
//       process.exit(1);
//     }

//     let htmlTemplate = fs.readFileSync(templatePath, "utf8");
//     console.log("📑 Template loaded.");

//     // Replace placeholders
//     htmlTemplate = htmlTemplate
//       .replace("{{company_name}}", parsed.company_name || "")
//       .replace("{{overall_score}}", parsed.overall_score || "")
//       .replace("{{audit_date}}", parsed.audit_date || "");

//     // Ensure report folder
//     const reportDir = path.join(__dirname, "reports");
//     if (!fs.existsSync(reportDir)) {
//       console.log("📁 Creating reports directory...");
//       fs.mkdirSync(reportDir);
//     }

//     // Write report
//     const outputPath = path.join(reportDir, "report.html");
//     console.log("💾 Writing report to:", outputPath);
//     fs.writeFileSync(outputPath, htmlTemplate, "utf8");

//     console.log("✅ Report written successfully.");
//   } catch (err) {
//     console.error("❌ Failed to generate report:", err.message);
//     process.exit(1);
//   }
// });

// const fs = require("fs");
// const path = require("path");
// const Handlebars = require("handlebars");

// // Register custom helpers
// Handlebars.registerHelper("eq", function (a, b) {
//   return a === b;
// });

// // Register all partials from /templates
// const templateDir = path.join(__dirname, "templates");
// const partialFiles = fs.readdirSync(templateDir);

// partialFiles.forEach((file) => {
//   if (file.endsWith(".html") && file !== "audit-report.html") {
//     const partialName = path.basename(file, ".html");
//     const partialContent = fs.readFileSync(
//       path.join(templateDir, file),
//       "utf8"
//     );
//     Handlebars.registerPartial(partialName, partialContent);
//   }
// });

// // Read incoming JSON via stdin
// let raw = "";

// process.stdin.setEncoding("utf8");
// process.stdin.on("data", (chunk) => (raw += chunk));
// process.stdin.on("end", () => {
//   const data = JSON.parse(raw);

//   const templatePath = path.join(templateDir, "audit-report.html");
//   const templateContent = fs.readFileSync(templatePath, "utf8");
//   const compiledTemplate = Handlebars.compile(templateContent);
//   const output = compiledTemplate(data);

//   const outputPath = path.join(__dirname, "output", "audit-report.html");
//   fs.writeFileSync(outputPath, output);

//   console.log("Report generated at /output/audit-report.html");
// });
const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");

const templatesDir = path.join(__dirname, "templates");
const outputPath = path.join(__dirname, "reports", "audit-report.html");

// Register `eq` helper
Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

// Template sections
const sections = [
  "audit-header.html",
  "audit-scorecard.html",
  "audit-recommendations.html",
  "audit-opportunity-metrics.html",
  "audit-pillar.html",
  "audit-competitors.html",
  "audit-funnel-overview.html",
  "audit-content-snapshot.html",
  "audit-footer.html",
];

// ✅ Helper to render full report
async function renderReport(inputData) {
  console.log("📦 Input keys:", Object.keys(inputData));

  let fullHTML = "";

  for (const file of sections) {
    const templatePath = path.join(templatesDir, file);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);

    if (file === "audit-pillar.html" && Array.isArray(inputData.pillars)) {
      for (const pillar of inputData.pillars) {
        fullHTML += template(pillar);
      }
    } else {
      fullHTML += template(inputData);
    }
  }

  await fs.outputFile(outputPath, fullHTML);
  console.log("✅ Report written to:", outputPath);
}

// ✅ Read JSON from stdin (Zapier) or fallback to local file (dev)
function readInput() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      // Manual dev mode
      const dataPath = path.join(__dirname, "data.json");
      console.log("📁 Reading from local file:", dataPath);
      fs.readJson(dataPath)
        .then(resolve)
        .catch((err) => reject(new Error("Failed to read data.json")));
    } else {
      // Zapier / webhook input
      let raw = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => (raw += chunk));
      process.stdin.on("end", () => {
        try {
          const parsed = JSON.parse(raw);
          resolve(parsed);
        } catch (err) {
          reject(new Error("Invalid JSON from stdin"));
        }
      });
    }
  });
}

// Run
readInput()
  .then(renderReport)
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
