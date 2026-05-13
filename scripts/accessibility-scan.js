const puppeteer = require("puppeteer");
const fs = require("fs");

const logFile = "test_results_utf8.txt";
const timestamp = new Date().toLocaleString();
const APP_URL = "http://localhost:3000/champions";

async function runA11yScan() {
    console.log(`\n--- Running A11y Accessibility Scan at ${timestamp} ---`);
    console.log(`Target: ${APP_URL}`);

    let browser;
    try {
        browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        await page.goto(APP_URL, { waitUntil: "networkidle0" });

        // Inject axe-core from CDN
        console.log("Injecting axe-core...");
        await page.addScriptTag({
            url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js"
        });

        // Run accessibility tests
        const results = await page.evaluate(async () => {
            return await axe.run();
        });

        const violations = results.violations;
        const passed = violations.length === 0;

        console.log(`Scan completed. Found ${violations.length} violations.`);

        // Format results for the log
        let violationSummary = "";
        if (!passed) {
            violationSummary = violations.map(v => 
                `[${v.impact.toUpperCase()}] ${v.help}\n   - ID: ${v.id}\n   - Elementos afectados: ${v.nodes.length}\n   - Guía: ${v.helpUrl}`
            ).join("\n\n");
        } else {
            violationSummary = "No accessibility violations found! Excellent job. ✅";
        }

        const logEntry = `
========================================
ACCESSIBILITY SCAN (A11y): ${timestamp}
STATUS: ${passed ? "PASSED ✅" : "WARNING/FAILED ⚠️"}
----------------------------------------
${violationSummary}
========================================
`;

        fs.appendFileSync(logFile, logEntry, "utf8");
        console.log(`Results archived in ${logFile}`);

        await browser.close();
        process.exit(passed ? 0 : 1);

    } catch (error) {
        console.error("Error during A11y scan:", error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}

runA11yScan();
