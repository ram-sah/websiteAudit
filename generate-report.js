const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");

const templatesDir = path.join(__dirname, "templates");
const reportsDir = path.join(__dirname, "reports");
const company = slugify(inputData.company_name || "client");

Handlebars.registerHelper("eq", function (a, b) {
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return a === b;
});

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

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .replace(/\\s+/g, "-")
    .replace(/[^\\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}

async function renderReportToDisk(inputData) {
  inputData.current_year = new Date().getFullYear();
  console.log("📦 Input keys:", Object.keys(inputData));

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
        console.warn(`⚠️ Failed to parse field ${key}`);
        inputData[key] = [];
      }
    }
  });

  const company = slugify(inputData.company_name || "client");
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${company}-${date}.html`;
  const outputPath = path.join(reportsDir, filename);

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
  console.log("Report written to:", outputPath);
  console.log(`Report available at: /reports/${filename}`);
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
        console.warn(`⚠️ Failed to parse field ${key}`);
        inputData[key] = [];
      }
    }
  });

  let html = "";

  for (const file of sections) {
    const templatePath = path.join(templatesDir, file);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);

    if (file === "audit-pillar.html" && Array.isArray(inputData.pillars)) {
      for (const pillar of inputData.pillars) {
        html += template(pillar);
      }
    } else {
      html += template(inputData);
    }
  }

  return html;
}

function readInput() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      const dataPath = path.join(__dirname, "data.json");
      console.log(" Reading from local file:", dataPath);
      fs.readJson(dataPath)
        .then(resolve)
        .catch((err) => reject(new Error("Failed to read data.json")));
    } else {
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

// Run only if called directly (e.g. via CLI, Zapier)
if (require.main === module) {
  readInput()
    .then(renderReportToDisk)
    .catch((err) => {
      console.error("❌ Error:", err.message);
      process.exit(1);
    });
}

module.exports = { renderReportToDisk, renderReportToString };
