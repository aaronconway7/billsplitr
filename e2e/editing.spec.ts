import { expect, test } from '@playwright/test';
import { addItem, addPeople, clipboard, item, open, payerChips, result, sampleBill, toast } from './helpers.ts';

test.beforeEach(({ page }) => open(page));

test('starts empty', async ({ page }) => {
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await expect(page.getByText('No items yet.')).toBeVisible();
	await expect(page.getByText('Add people and items to see the split.')).toBeVisible();
	await expect(page.getByLabel('Currency')).toHaveText(/GBP \(£\)/);
});

test('splits a bill', async ({ page }) => {
	await sampleBill(page);
	await expect(result(page, 'Ann')).toContainText('£16.25');
	await expect(result(page, 'Ann')).toContainText('£18.28');
	await expect(result(page, 'Bob')).toContainText('£16.25 · paid');
	await expect(result(page, 'Bob')).toContainText('£18.28');
	await expect(result(page, 'Cat')).toContainText('£10.00');
	await expect(result(page, 'Cat')).toContainText('£11.25');
	await expect(page.getByText('Items£47.49')).toBeVisible();
	await expect(page.getByText('Service / tip (12.5%)£5.31')).toBeVisible();
	await expect(page.getByText('Total£52.80')).toBeVisible();
	await expect(page.getByText("£4.99 of items aren't assigned to anyone yet.")).toBeVisible();
	await expect(page.getByText('Ann pays Bob £18.28')).toBeVisible();
	await expect(page.getByText('Cat pays Bob £11.25')).toBeVisible();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Ann' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Cat' })).toHaveAttribute('aria-pressed', 'false');
});

test('toggles sharers, service and payer', async ({ page }) => {
	await sampleBill(page);
	await item(page, 'Pizza').getByRole('button', { name: 'Ann' }).click();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Ann' })).toHaveAttribute('aria-pressed', 'false');
	await expect(result(page, 'Bob')).toContainText('£22.50');
	await payerChips(page).getByRole('button', { name: 'Bob' }).click();
	await expect(page.getByText(/pays Bob/)).toHaveCount(0);
	await expect(result(page, 'Bob')).not.toContainText('paid');
	await page.getByRole('button', { name: 'None' }).click();
	await expect(page.getByText(/Service \/ tip/)).toHaveCount(0);
	await expect(page.getByText('Total£47.49')).toBeVisible();
});

test('custom service, clamped to 0–100', async ({ page }) => {
	await sampleBill(page);
	const custom = page.getByPlaceholder('Custom %');
	await custom.fill('20');
	await custom.blur();
	await expect(page.getByText('Service / tip (20%)£8.50')).toBeVisible();
	await expect(custom).toHaveValue('20');
	await expect(page.getByRole('button', { name: '12.5%' })).toHaveAttribute('aria-pressed', 'false');
	await custom.fill('150');
	await custom.blur();
	await expect(page.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true');
	await expect(custom).toHaveValue('');
});

test('removing a person keeps everyone else’s shares and the payer', async ({ page }) => {
	await sampleBill(page);
	await page.getByRole('button', { name: 'Remove Ann' }).click();
	await expect(item(page, 'Pizza').getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Wine').getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(item(page, 'Wine').getByRole('button', { name: 'Cat' })).toHaveAttribute('aria-pressed', 'true');
	await expect(payerChips(page).getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(result(page, 'Bob')).toContainText('£27.50 · paid');
	// Removing the payer clears it
	await page.getByRole('button', { name: 'Remove Bob' }).click();
	await expect(page.getByText(/· paid/)).toHaveCount(0);
});

test('removes items', async ({ page }) => {
	await sampleBill(page);
	await item(page, 'Bread').getByRole('button', { name: 'Remove item' }).click();
	await expect(item(page, 'Bread')).toHaveCount(0);
	await expect(page.getByText(/aren't assigned/)).toHaveCount(0);
});

test('validates new items and people', async ({ page }) => {
	await page.getByPlaceholder('Add a name').fill('   ');
	await page.getByRole('button', { name: 'Add' }).first().click();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await page.getByPlaceholder('Item (e.g. Margherita)').fill('Chips');
	await page.getByRole('button', { name: 'Add' }).nth(1).click();
	await toast(page, 'Enter a name and price');
	await expect(page.getByText('No items yet.')).toBeVisible();
	// Inputs clear and keep focus after adding
	await addPeople(page, 'Ann');
	await expect(page.getByPlaceholder('Add a name')).toHaveValue('');
	await expect(page.getByPlaceholder('Add a name')).toBeFocused();
	await addItem(page, 'Chips', '3');
	await expect(page.getByPlaceholder('Item (e.g. Margherita)')).toHaveValue('');
	await expect(page.getByPlaceholder('Item (e.g. Margherita)')).toBeFocused();
	// "Everyone" only appears once there are two people
	await expect(item(page, 'Chips').getByRole('button', { name: 'Everyone' })).toHaveCount(0);
});

test('currencies use their own decimals', async ({ page }) => {
	await addPeople(page, 'Ann', 'Bob');
	await addItem(page, 'Sushi', '20');
	const pick = async (code: string) => {
		await page.getByLabel('Currency').click();
		await page.getByRole('option', { name: new RegExp(code) }).click();
	};
	await pick('JPY');
	await expect(item(page, 'Sushi')).toContainText('¥20');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('step', '1');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('placeholder', '¥');
	await pick('KWD');
	await expect(item(page, 'Sushi')).toContainText('KD20.000');
	await expect(page.locator('input[type=number]').first()).toHaveAttribute('step', '0.001');
});

test('keeps the bill in this browser', async ({ page }) => {
	await sampleBill(page);
	await page.reload();
	await expect(result(page, 'Ann')).toContainText('£18.28');
	await expect(payerChips(page).getByRole('button', { name: 'Bob' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page).toHaveURL('/');
});

test('WhatsApp summary', async ({ page }) => {
	await page.route('**/api/bills', (r) => r.abort());
	await sampleBill(page);
	await page.getByRole('button', { name: 'Copy for WhatsApp' }).click();
	await toast(page, 'Summary copied');
	const text = await clipboard(page);
	expect(text).toMatch(
		/^🧾 \*Bill split\*\nTotal: \*£52\.80\* \(incl\. 12\.5% service\)\n\n💸 \*Pay Bob:\*\n• Ann – £18\.28\n• Cat – £11\.25\n\n⚠️ £4\.99 not yet assigned\n\nSee the full split: http:\/\/localhost:\d+\/#z\S+$/
	);
});

test('new bill clears everything but the currency', async ({ page }) => {
	await sampleBill(page);
	await page.getByLabel('Currency').click();
	await page.getByRole('option', { name: /EUR/ }).click();
	await page.getByRole('main').getByRole('button', { name: 'New bill' }).click();
	await expect(page.getByRole('alertdialog')).toContainText('This clears everything on this bill.');
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(result(page, 'Ann')).toBeVisible();
	await page.getByRole('main').getByRole('button', { name: 'New bill' }).click();
	await page.getByRole('alertdialog').getByRole('button', { name: 'New bill' }).click();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
	await expect(page.getByLabel('Currency')).toHaveText(/EUR/);
	await page.reload();
	await expect(page.getByText('Add at least two people.')).toBeVisible();
});
