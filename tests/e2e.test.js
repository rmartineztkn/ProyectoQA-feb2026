const puppeteer = require('puppeteer');

describe('Wild Rift App E2E', () => {
    let browser;
    let page;

    jest.setTimeout(60000);

    const isHeadless = process.env.HEADLESS !== 'false';

    beforeAll(async () => {
        try {
            browser = await puppeteer.launch({
                headless: isHeadless, // Dinámico para CI
                slowMo: isHeadless ? 0 : 100,
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
            });
            page = await browser.newPage();
        } catch (error) {
            console.error("Error lanzando Puppeteer:", error);
            throw error;
        }
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('CP1: Debe cargar la página principal y mostrar el título correcto', async () => {
        await page.goto('http://127.0.0.1:3000/champions');
        const title = await page.title();
        expect(title).toBe('Proyecto Campeones de Wild Rift');
    });

    test('CP2: Las columnas de la tabla deben estar completas (8 columnas)', async () => {
        await page.goto('http://127.0.0.1:3000/champions');
        const headerCount = await page.$$eval('table thead th', ths => ths.length);
        console.log(`Columnas detectadas: ${headerCount}`);
        expect(headerCount).toBe(8); // ID, Icon, Nombre, Daño, Tipo, Posición, Descripción, Acciones
    });

    test('CP3: Debe funcionar la búsqueda parcial (LIKE)', async () => {
        await page.goto('http://127.0.0.1:3000/champions');
        await page.type('input[name="searchNombre"]', 'Deme');
        await page.click('.btn-search');

        await page.waitForSelector('table tbody tr');
        const names = await page.$$eval('table tbody tr td:nth-child(3)', tds => tds.map(td => td.textContent.trim()));

        // Verificamos que al menos uno contenga "Deme" (como Shyvana o Garen de Demecia si existiera)
        // O simplemente verificamos que los resultados sean coherentes
        names.forEach(name => {
            expect(name.toLowerCase()).toContain('deme');
        });
    });

    test('CP4: Debe mostrar el modal de éxito al editar un campeón', async () => {
        await page.goto('http://127.0.0.1:3000/champions');

        // 1. Abrir el modal de edición del primer campeón
        await page.waitForSelector('.btn-edit');
        await page.click('.btn-edit');

        // 2. Esperar a que el modal sea visible y cambiar un valor (ej. daño)
        await page.waitForSelector('#editModal', { visible: true });
        const damageInput = await page.$('#editDamage');
        await damageInput.click({ clickCount: 3 }); // Seleccionar todo
        await damageInput.type('99');

        // 3. Guardar cambios
        await new Promise(r => setTimeout(r, 1000));
        await page.click('.btn-save-edit');

        // 4. Verificar que aparezca el modal de éxito
        await page.waitForSelector('#successModal', { visible: true });
        const successText = await page.$eval('#successModal p', el => el.textContent);
        expect(successText).toContain('El cambio fue ejecutado correctamente');

        // Pausa para que el usuario vea el modal
        await new Promise(r => setTimeout(r, 3000));

        // 5. Cerrar el modal
        await page.click('.btn-close-success');
        await new Promise(r => setTimeout(r, 1000));

        const isVisible = await page.$eval('#successModal', el => el.style.display !== 'none');
        expect(isVisible).toBe(false);
    });
});
