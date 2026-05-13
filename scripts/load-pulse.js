const http = require("http");
const fs = require("fs");

const logFile = "test_results_utf8.txt";
const timestamp = new Date().toLocaleString();
const TARGET_URL = "http://localhost:3000/champions";
const REQUEST_COUNT = 20; // Bajamos a 20 peticiones para ver la velocidad real sin saturación

console.log(`\n--- Running API & Load Pulse Check at ${timestamp} ---`);
console.log(`Simulating ${REQUEST_COUNT} concurrent requests to ${TARGET_URL}...\n`);

async function runPulseCheck() {
    const startTime = Date.now();
    const results = [];

    // Función para realizar una sola petición
    const makeRequest = (id) => {
        return new Promise((resolve) => {
            const reqStart = Date.now();
            http.get(TARGET_URL, (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    const duration = Date.now() - reqStart;
                    resolve({ id, status: res.statusCode, duration, success: res.statusCode === 200 });
                });
            }).on("error", (err) => {
                resolve({ id, status: "Error", duration: Date.now() - reqStart, success: false, error: err.message });
            });
        });
    };

    // Lanzamos todas las peticiones en paralelo
    const promises = Array.from({ length: REQUEST_COUNT }, (_, i) => makeRequest(i + 1));
    const rawResults = await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const successes = rawResults.filter(r => r.success).length;
    const failures = REQUEST_COUNT - successes;
    const avgDuration = rawResults.reduce((acc, r) => acc + r.duration, 0) / REQUEST_COUNT;
    const maxDuration = Math.max(...rawResults.map(r => r.duration));
    const minDuration = Math.min(...rawResults.map(r => r.duration));

    const passed = successes === REQUEST_COUNT && avgDuration < 400; // Criterio estricto: <400ms para 20 peticiones

    const summary = `
========================================
API & LOAD PULSE CHECK: ${timestamp}
STATUS: ${passed ? "PASSED ✅" : "WARNING/FAILED ⚠️"}
----------------------------------------
Total Requests: ${REQUEST_COUNT}
Success Rate:   ${((successes / REQUEST_COUNT) * 100).toFixed(1)}% (${successes}/${REQUEST_COUNT})
Total Burst Time: ${totalTime} ms
Avg Latency:    ${avgDuration.toFixed(2)} ms
Max Latency:    ${maxDuration} ms
Min Latency:    ${minDuration} ms
----------------------------------------
${passed ? "Server is stable under light load." : "Potential performance bottleneck detected."}
========================================
`;

    console.log(summary);

    try {
        fs.appendFileSync(logFile, summary, "utf8");
        console.log(`Results archived in ${logFile}`);
    } catch (err) {
        console.error("Failed to write to log file:", err.message);
    }

    process.exit(passed ? 0 : 1);
}

runPulseCheck();
