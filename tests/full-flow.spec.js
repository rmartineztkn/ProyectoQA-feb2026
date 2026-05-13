const { test, expect } = require('@playwright/test');

test.describe('Wild Rift Champions E2E Flow', () => {
  const champName = `E2E_Resilience_${Math.floor(Math.random() * 1000)}`;

  test('should create, verify, and delete a champion', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/champions');

    // 1. CREAR
    console.log(`Adding: ${champName}`);
    await page.locator('#nombre').fill(champName);
    await page.locator('#damage').fill('80');
    await page.locator('#tipo').selectOption('AD');
    await page.locator('#posicion').selectOption('Asesino');
    await page.locator('#descripcion').fill('Handling success modal interception');
    
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }),
        page.click('button.btn-add')
    ]);

    // --- CORRECCIÓN CRÍTICA ---
    // Después de crear, el modal de éxito aparece y bloquea la pantalla.
    // Debemos cerrarlo para poder interactuar con la tabla.
    const successModalCloseBtn = page.locator('#successModal button:has-text("Cerrar")');
    if (await successModalCloseBtn.isVisible()) {
        await successModalCloseBtn.click();
        await expect(page.locator('#successModal')).toBeHidden();
    }
    // ---------------------------
    
    // 2. VERIFICAR EN TABLA
    const row = page.locator('tr').filter({ hasText: champName });
    await expect(row).toBeVisible();

    // 3. BORRAR
    console.log(`Deleting: ${champName}`);
    await row.locator('button.btn-delete').click();

    // Esperar al modal de eliminación
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    
    // Confirmar eliminación
    const confirmBtn = modal.locator('button.btn-confirm-del');
    await Promise.all([
        page.waitForURL('**/champions?success=true**'),
        confirmBtn.click({ force: true })
    ]);

    console.log('--- E2E FLOW PASSED! ✅ ---');
  });
});
