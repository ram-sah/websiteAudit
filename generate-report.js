const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");

const templatesDir = path.join(__dirname, "templates");
const reportsDir = path.join(__dirname, "reports");

// Slugify helper for consistency
function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

// Register custom helpers
Handlebars.registerHelper("eq", (a, b) =>
  typeof a === "string" && typeof b === "string"
    ? a.trim().toLowerCase() === b.trim().toLowerCase()
    : a === b
);

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

// ⬇ Render to file
async function renderReportToDisk(inputData) {
  inputData.current_year = new Date().getFullYear();

  // Parse JSON fields from Zapier safely
  [
    "quickWins",
    "keywordOpportunities",
    "localSEOGaps",
    "competitorScores",
    "funnelInsights",
  ].forEach((key) => {
    if (typeof inputData[key] === "string") {
      try {
        inputData[key] = JSON.parse(inputData[key]);
      } catch {
        inputData[key] = [];
      }
    }
  });

  const slug =
    inputData.report_slug ||
    `${slugify(inputData.company_name)}-${new Date()
      .toISOString()
      .slice(0, 10)}`;
  const filename = `${slug}.html`;
  const outputPath = path.join(reportsDir, filename);

  let html = "";
  for (const section of sections) {
    const templatePath = path.join(templatesDir, section);
    const content = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(content);
    html += template(inputData);
  }

  await fs.outputFile(outputPath, html);
  console.log("✅ Report written to:", outputPath);
}

async function renderReportToString(inputData) {
  inputData.current_year = new Date().getFullYear();

  [
    "quickWins",
    "keywordOpportunities",
    "localSEOGaps",
    "competitorScores",
    "funnelInsights",
  ].forEach((key) => {
    if (typeof inputData[key] === "string") {
      try {
        inputData[key] = JSON.parse(inputData[key]);
      } catch {
        inputData[key] = [];
      }
    }
  });

  let html = "";
  for (const section of sections) {
    const templatePath = path.join(templatesDir, section);
    const content = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(content);
    html += template(inputData);
  }

  return html;
}

function readInput() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      fs.readJson(path.join(__dirname, "data.json"))
        .then(resolve)
        .catch(reject);
    } else {
      let raw = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => (raw += chunk));
      process.stdin.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(new Error("Invalid JSON from stdin"));
        }
      });
    }
  });
}

if (require.main === module) {
  readInput()
    .then(renderReportToDisk)
    .catch((err) => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}

module.exports = { renderReportToDisk, renderReportToString };
