const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// ✅ Serve all files in root
// app.use(express.static(__dirname));
app.use("/reports", express.static(path.join(__dirname, "reports")));
app.use(
  "/shared-assets",
  express.static(path.join(__dirname, "shared-assets"))
);

// OR — best practice:
// app.use("/reports", express.static(path.join(__dirname, "reports")));

app.post("/generate-audit", (req, res) => {
  const inputJSON = JSON.stringify(req.body);

  const generate = spawn("node", ["generate-report.js"]);

  generate.stdin.write(inputJSON);
  generate.stdin.end();

  generate.on("close", (code) => {
    console.log(`Report generated. Exit code: ${code}`);
    res.status(200).send("✅ Audit report generated");
  });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

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
