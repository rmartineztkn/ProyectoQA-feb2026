const fs = require("fs");
const path = require("path");

const logFile = "test_results_utf8.txt";
const timestamp = new Date().toLocaleString();

console.log(`\n--- Running Project Schema Validation at ${timestamp} ---`);

let errors = [];

// 1. Validar package.json
console.log("Validating package.json...");
try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    
    // Campos obligatorios
    const requiredFields = ["name", "version", "main", "scripts", "author", "description"];
    requiredFields.forEach(field => {
        if (!pkg[field]) errors.push(`[package.json] Falta el campo obligatorio: "${field}"`);
    });

    // Validar formato de versión (SemVer básico)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (pkg.version && !semverRegex.test(pkg.version)) {
        errors.push(`[package.json] La versión "${pkg.version}" no sigue el formato SemVer (X.Y.Z)`);
    }

    // Validar Scripts de QA obligatorios
    const requiredScripts = ["lint", "test:smoke", "test:security", "test:accessibility"];
    requiredScripts.forEach(script => {
        if (!pkg.scripts || !pkg.scripts[script]) {
            errors.push(`[package.json] Falta el script de QA: "${script}"`);
        }
    });

} catch (err) {
    errors.push(`Error al leer package.json: ${err.message}`);
}

// 2. Validar docker-compose.yml (si existe)
console.log("Validating docker-compose.yml...");
const dockerPath = path.join(process.cwd(), "docker-compose.yml");
if (fs.existsSync(dockerPath)) {
    const dockerContent = fs.readFileSync(dockerPath, "utf8");
    if (!dockerContent.includes("services:")) errors.push("[docker-compose.yml] No se detectó la sección 'services'");
    if (!dockerContent.includes("version:")) errors.push("[docker-compose.yml] Falta la versión del manifiesto");
}

const passed = errors.length === 0;

// Preparar el log
const logEntry = `
========================================
SCHEMA VALIDATION: ${timestamp}
STATUS: ${passed ? "PASSED ✅" : "FAILED ❌"}
----------------------------------------
${passed ? "All project manifests and configurations follow the required schema." : errors.join("\n")}
========================================
`;

fs.appendFileSync(logFile, logEntry, "utf8");
console.log(`Results archived in ${logFile}`);

if (!passed) {
    console.error(`Validation failed with ${errors.length} errors.`);
}

process.exit(passed ? 0 : 1);
