const fs = require("fs");
const { execSync } = require("child_process");

const logFile = "test_results_utf8.txt";
const timestamp = new Date().toLocaleString();

console.log(`\n--- Running Linter at ${timestamp} ---`);

let output;
let passed = true;

try {
    // Run eslint and capture output
    output = execSync("npx eslint .", { encoding: "utf8" });
} catch (error) {
    // If eslint fails, it throws an error. The output is in error.stdout
    output = error.stdout || error.message;
    passed = false;
}

// Prepare the log entry
const logEntry = `
========================================
LINT RUN: ${timestamp}
STATUS: ${passed ? "PASSED ✅" : "FAILED ❌"}
----------------------------------------
${output}
========================================
`;

// Append to the file
try {
    fs.appendFileSync(logFile, logEntry, "utf8");
    console.log(output);
    console.log(`\nResults archived in ${logFile}`);
} catch (err) {
    console.error("Failed to write to log file:", err.message);
}

// Exit with correct code for CI/CD
process.exit(passed ? 0 : 1);
