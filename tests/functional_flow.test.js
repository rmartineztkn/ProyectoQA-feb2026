const puppeteer = require('puppeteer');

describe('Suite de Pruebas Funcionales Completas - Wild Rift QA', () => {
    let browser;
    let page;
    let startTime;
    const APP_URL = 'http://127.0.0.1:3000/champions';

    // Detectar modo de velocidad
    const isFast = process.env.TEST_SPEED === 'fast';
    const SLOW_MO = isFast ? 0 : 100;
    const HEADLESS = isFast; // 'true' para rápido, 'false' para visual

    jest.setTimeout(120000);

    beforeAll(async () => {
        startTime = Date.now();
        console.log(`\n🚀 INICIANDO PRUEBA EN MODO: ${isFast ? '⚡ RÁPIDO (Headless)' : '🐢 LENTO (Visual)'}`);

        browser = await puppeteer.launch({
            headless: HEADLESS,
            slowMo: SLOW_MO,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
        });
        page = await browser.newPage();
    });

    afterAll(async () => {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(40));
        console.log(`📊 REPORTE DE TIEMPO - MODO ${isFast ? 'RÁPIDO' : 'LENTO'}`);
        console.log(`⏱️ Duración Total: ${duration} segundos`);
        console.log('='.repeat(40) + '\n');

        if (browser) {
            await browser.close();
        }
    });

    const clearFilters = async () => {
        await page.goto(APP_URL, { waitUntil: 'load' });
        await page.waitForSelector('table', { visible: true });
        if (!isFast) await new Promise(r => setTimeout(r, 1000));
    };

    const runSearch = async () => {
        if (!isFast) await new Promise(r => setTimeout(r, 500));
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => { }),
            page.click('.btn-search')
        ]);
        await page.waitForSelector('table tbody', { visible: true });
        if (!isFast) await new Promise(r => setTimeout(r, 1000));
    };

    describe('1. Pruebas de Búsqueda Individuales', () => {

        test('Búsqueda por ID (Dinámica)', async () => {
            await clearFilters();

            // 1. Obtener un ID real de la tabla para probar
            const firstIdInTable = await page.$eval('table tbody tr td:first-child', el => el.textContent.trim().replace('#', ''));
            console.log(`ID detectado para prueba: [${firstIdInTable}]`);

            const idSelector = 'input[name="searchId"]';
            await page.waitForSelector(idSelector);

            // Limpiar campo antes de escribir
            await page.click(idSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');

            await page.type(idSelector, firstIdInTable);
            if (!isFast) await new Promise(r => setTimeout(r, 800));

            await runSearch();

            const idResult = await page.$eval('table tbody tr td:first-child', el => el.textContent.trim());
            console.log(`Resultado Búsqueda ID: [${idResult}]`);
            expect(idResult).toBe(`#${firstIdInTable}`);
        });

        test('Búsqueda por NOMBRE (Parcial/LIKE)', async () => {
            await clearFilters();
            await page.type('input[name="searchNombre"]', 'Shyvana');
            await runSearch();

            const nameResult = await page.$eval('table tbody tr td:nth-child(3)', el => el.textContent.trim());
            console.log(`Resultado Búsqueda Nombre: ${nameResult}`);
            expect(nameResult.toLowerCase()).toContain('shyvana');
        });

        test('Búsqueda por TIPO (Selector)', async () => {
            await clearFilters();
            await page.select('select[name="searchTipo"]', 'Mixto');
            await runSearch();

            const types = await page.$$eval('.badge', badges => badges.map(b => b.textContent.trim()));
            console.log(`Tipos encontrados: ${types.length} registros`);
            types.forEach(t => expect(t).toBe('Mixto'));
        });

        test('Búsqueda por POSICIÓN (Selector)', async () => {
            await clearFilters();
            await page.select('select[name="searchPosicion"]', 'Asesino');
            await runSearch();

            const positions = await page.$$eval('table tbody tr td:nth-child(6)', tds => tds.map(td => td.textContent.trim()));
            console.log(`Posiciones encontradas: ${positions.length} registros`);
            positions.forEach(p => expect(p).toBe('Asesino'));
        });
    });

    describe('2. Ciclo de Vida del Campeón (CRUD)', () => {
        const testChamp = {
            nombre: 'Robot-QA-' + Math.floor(Math.random() * 10000),
            damage: '85',
            tipo: 'AD',
            posicion: 'Luchador',
            descripcion: 'Unidad de prueba automatizada para validación funcional.'
        };

        const updatedChamp = {
            nombre: 'Robot-QA-Actualizado',
            damage: '99',
            descripcion: 'Descripción modificada para verificar persistencia.'
        };

        test('Paso A: Agregar nuevo campeón', async () => {
            await clearFilters();

            await page.type('input[name="nombre"]', testChamp.nombre);
            await page.type('input[name="damage"]', testChamp.damage);
            await page.select('select[name="tipo"]', testChamp.tipo);
            await page.select('select[name="posicion"]', testChamp.posicion);
            await page.type('input[name="descripcion"]', testChamp.descripcion);

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => { }),
                page.click('.btn-add')
            ]);

            // Validar Modal de Éxito
            await page.waitForSelector('#successModal', { visible: true });
            if (!isFast) await new Promise(r => setTimeout(r, 2000));
            await page.click('.btn-close-success');
            if (!isFast) await new Promise(r => setTimeout(r, 500));

            // Verificar que aparece en la lista
            await page.type('input[name="searchNombre"]', testChamp.nombre);
            await runSearch();
            const createdName = await page.$eval('table tbody tr td:nth-child(3)', el => el.textContent.trim());
            expect(createdName).toBe(testChamp.nombre);
        });

        test('Paso B: Editar el campeón creado', async () => {
            await page.click('.btn-edit');
            await page.waitForSelector('#editModal', { visible: true });

            const nameInput = await page.$('#editNombre');
            await nameInput.click({ clickCount: 3 });
            await nameInput.type(updatedChamp.nombre);

            const damageInput = await page.$('#editDamage');
            await damageInput.click({ clickCount: 3 });
            await damageInput.type(updatedChamp.damage);

            const descInput = await page.$('#editDescripcion');
            await descInput.click({ clickCount: 3 });
            await descInput.type(updatedChamp.descripcion);

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => { }),
                page.click('.btn-save-edit')
            ]);

            await page.waitForSelector('#successModal', { visible: true });
            if (!isFast) await new Promise(r => setTimeout(r, 2000));
            await page.click('.btn-close-success');
            if (!isFast) await new Promise(r => setTimeout(r, 500));

            // Verificar cambio visual
            const searchBox = await page.$('input[name="searchNombre"]');
            await searchBox.click({ clickCount: 3 });
            await searchBox.press('Backspace');
            await page.type('input[name="searchNombre"]', updatedChamp.nombre);
            await runSearch();

            const newName = await page.$eval('table tbody tr td:nth-child(3)', el => el.textContent.trim());
            const newDamage = await page.$eval('table tbody tr td:nth-child(4)', el => el.textContent.trim());
            expect(newName).toBe(updatedChamp.nombre);
            expect(newDamage).toBe(updatedChamp.damage);
        });

        test('Paso C: Eliminar el campeón editado', async () => {
            await page.click('.btn-delete');
            await page.waitForSelector('#deleteModal', { visible: true });

            if (!isFast) await new Promise(r => setTimeout(r, 1000));

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => { }),
                page.click('.btn-confirm-del')
            ]);

            await page.waitForSelector('#successModal', { visible: true });
            if (!isFast) await new Promise(r => setTimeout(r, 2000));
            await page.click('.btn-close-success');
            if (!isFast) await new Promise(r => setTimeout(r, 500));

            // Verificar que ya no existe
            const searchBox = await page.$('input[name="searchNombre"]');
            await searchBox.click({ clickCount: 3 });
            await searchBox.press('Backspace');
            await page.type('input[name="searchNombre"]', updatedChamp.nombre);
            await runSearch();

            const emptyMsg = await page.$eval('table tbody tr td', el => el.textContent.trim());
            expect(emptyMsg).toContain('No se encontraron campeones');
        });
    });
});
