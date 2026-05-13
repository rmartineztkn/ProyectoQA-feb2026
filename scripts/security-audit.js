const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const logFile = "test_results_utf8.txt";
const timestamp = new Date().toLocaleString();

console.log(`\n--- Running Security & Secrets Scan at ${timestamp} ---`);

let findings = [];
let passed = true;

// 1. Dependency Scan (pnpm audit)
console.log("Checking for vulnerable dependencies...");
try {
    execSync("pnpm audit --audit-level=high", { stdio: "inherit" });
} catch (error) {
    findings.push("Vulnerable dependencies found (High/Critical). Run 'pnpm audit' for details.");
    passed = false;
}

// 2. Secrets Scan (Pattern Matching)
console.log("\nScanning files for hardcoded secrets...");
const sensitivePatterns = [
    { name: "MongoDB Credentials", regex: /mongodb\+srv?:\/\/[^:]+:[^@]+@/gi },
    { name: "Generic Password/Secret", regex: /(password|secret|api_key|token|private_key)\s*[:=]\s*["'][^"']+["']/gi },
    { name: "Potentially exposed .env variables", regex: /process\.env\.[A-Z0-9_]+/g } // This is fine, but we check if they are defined in code
];

const filesToScan = ["index.js", "docker-compose.yml", "package.json", "add_costs.js"];

filesToScan.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        sensitivePatterns.forEach(pattern => {
            const matches = content.match(pattern.regex);
            if (matches) {
                matches.forEach(match => {
                    findings.push(`[${pattern.name}] found in ${file}: ${match.substring(0, 20)}...`);
                    passed = false;
                });
            }
        });
    }
});

// Prepare the log entry
const logEntry = `
========================================
SECURITY SCAN: ${timestamp}
STATUS: ${passed ? "PASSED ✅" : "WARNING/FAILED ⚠️"}
----------------------------------------
${findings.length > 0 ? findings.join("\n") : "No critical secrets or high vulnerabilities found."}
========================================
`;

// Append to the file
try {
    fs.appendFileSync(logFile, logEntry, "utf8");
    console.log(`\nResults archived in ${logFile}`);
} catch (err) {
    console.error("Failed to write to log file:", err.message);
}

process.exit(passed ? 0 : 1);
