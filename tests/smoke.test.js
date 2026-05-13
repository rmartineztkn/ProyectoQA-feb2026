const puppeteer = require("puppeteer");

// Configuramos reintentos automáticos para manejar flakiness por latencia
jest.retryTimes(2, { logErrorsBeforeRetry: true });

describe("Smoke Test - Production Readiness", () => {
    let browser;
    let page;
    const APP_URL = "http://localhost:3000";

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        page = await browser.newPage();
        // Aumentamos el timeout por defecto para navegación lenta
        page.setDefaultNavigationTimeout(15000); 
    });

    afterAll(async () => {
        await browser.close();
    });

    test("Critical Flow 1: Home Page Accessibility", async () => {
        try {
            const response = await page.goto(`${APP_URL}/champions`);
            expect(response.status()).toBe(200);
            
            const title = await page.title();
            expect(title).toContain("Proyecto Campeones de Wild Rift");
        } catch (error) {
            throw new Error(`[ACCESSIBILITY_FAIL] El servidor no respondió a tiempo o la URL es incorrecta. Detalle: ${error.message}`);
        }
    });

    test("Critical Flow 2: Data Loading (BFF & DB Integration)", async () => {
        await page.goto(`${APP_URL}/champions`);
        
        try {
            // Esperamos explícitamente a que aparezca la tabla
            await page.waitForSelector("table tbody tr", { timeout: 5000 });
            
            const rowCount = await page.$$eval("table tbody tr", rows => rows.length);
            expect(rowCount).toBeGreaterThan(0);
        } catch (error) {
            // Si el selector falla por timeout, es muy probable que sea latencia de la DB
            throw new Error(`[LATENCY_SUSPECTED] La página cargó pero la tabla de campeones quedó vacía tras 5s. Verifica la conexión a MongoDB.`);
        }
    });

    test("Critical Flow 3: Items API Accessibility", async () => {
        try {
            const response = await page.goto(`${APP_URL}/items`);
            expect(response.status()).toBe(200);
            
            const content = await page.content();
            const isJson = content.includes("[") && content.includes("]");
            expect(isJson).toBe(true);
        } catch (error) {
            throw new Error(`[API_HEALTH_FAIL] El endpoint de ítems no está devolviendo JSON válido. Detalle: ${error.message}`);
        }
    });
});
